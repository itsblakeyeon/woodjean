-- Woodjean v1.0 — initial schema
-- 단체주문 배달 서비스. 후불 + 텔레그램 봇 운영.

-- ============================================================================
-- Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Slot bucket helper.
-- Postgres treats timestamptz epoch extraction as non-immutable because it can
-- depend on timezone context. We pin the conversion to UTC and expose a stable
-- immutable helper so the generated column can back the unique slot index.
CREATE OR REPLACE FUNCTION delivery_hour_bucket(ts TIMESTAMPTZ)
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT FLOOR(EXTRACT(EPOCH FROM (ts AT TIME ZONE 'UTC')) / 3600)::BIGINT;
$$;

-- ============================================================================
-- menu — 음료 마스터 (가격표 기반)
-- ============================================================================

CREATE TABLE menu (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('signature', 'coffee', 'non-coffee')),
  -- 가격 (원). R/L 둘 중 하나는 NOT NULL.
  price_r INT,
  price_l INT,
  -- 가능한 온도 ('ICE', 'HOT')
  temps TEXT[] NOT NULL DEFAULT ARRAY['ICE', 'HOT'],
  -- variants (예: 우디슈페너 ['오리지널', '피스타치오', '초코'], 분다버그 ['망고', '진저비어', '자몽', '레몬라임'])
  variants TEXT[],
  -- 옵션 가능 여부 (boolean)
  option_shot BOOLEAN NOT NULL DEFAULT false,
  option_milk_change BOOLEAN NOT NULL DEFAULT false,
  option_decaf BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT menu_at_least_one_price CHECK (price_r IS NOT NULL OR price_l IS NOT NULL),
  CONSTRAINT menu_temps_valid CHECK (temps <@ ARRAY['ICE', 'HOT']::TEXT[] AND array_length(temps, 1) > 0)
);

CREATE INDEX idx_menu_category_order ON menu(category, display_order) WHERE is_active = true;

-- ============================================================================
-- menu_extras — 옵션 가격 마스터
-- ============================================================================

CREATE TABLE menu_extras (
  key TEXT PRIMARY KEY,                     -- 'shot' | 'milk_change' | 'decaf_r' | 'decaf_l'
  label TEXT NOT NULL,
  price INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- orders — 주문
-- ============================================================================

CREATE TABLE orders (
  id TEXT PRIMARY KEY,                      -- 'ord_' + nanoid(16). IDOR 방지.
  -- 고객 식별
  nickname TEXT NOT NULL,
  phone TEXT NOT NULL,
  -- 주문 내용 (items + 가격 스냅샷)
  items JSONB NOT NULL,                     -- 아이템 배열 (구조 주석은 README 참조)
  total_amount INT NOT NULL,                -- 서버 재계산 총액
  cup_count INT NOT NULL CHECK (cup_count BETWEEN 5 AND 30),
  -- 배달 정보
  delivery_at TIMESTAMPTZ NOT NULL,         -- 도착 시간
  delivery_address JSONB NOT NULL,          -- {building, floor, recipient, location}
  memo TEXT CHECK (memo IS NULL OR length(memo) <= 200),
  -- 결제 (v1.0 후불. v1.5에 'toss' 추가 예정)
  payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery'
    CHECK (payment_method IN ('cash_on_delivery', 'toss')),
  -- 상태 머신
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  -- 동의
  pipa_consented_at TIMESTAMPTZ NOT NULL,
  terms_consented_at TIMESTAMPTZ NOT NULL,
  -- SMS 멱등 claim (Codex #7) — cron이 atomic update로 단 1회만 발송
  sms_reminder_sent_at TIMESTAMPTZ,
  -- 슬롯 cap을 위한 epoch-hour bucket (Codex #3 — date_trunc IMMUTABLE 회피)
  delivery_hour BIGINT GENERATED ALWAYS AS (delivery_hour_bucket(delivery_at)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_phone ON orders(phone);
CREATE INDEX idx_orders_status_delivery ON orders(status, delivery_at);
CREATE INDEX idx_orders_delivery_at ON orders(delivery_at);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- 슬롯 cap 강제: 시간당 confirmed 주문 1건만 (물리적 capacity).
-- delivery_hour generated column 사용 (immutable expression — Codex #3 fix).
CREATE UNIQUE INDEX idx_orders_slot_unique
  ON orders (delivery_hour)
  WHERE status = 'confirmed';

-- ============================================================================
-- order_events — 감사 로그
-- ============================================================================

CREATE TABLE order_events (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (event IN (
    'created', 'confirmed', 'cancelled', 'completed', 'no_show',
    'sms_sent', 'telegram_sent', 'note'
  )),
  actor TEXT NOT NULL CHECK (actor IN ('customer', 'owner', 'system')),
  payload JSONB,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_events_order ON order_events(order_id, created_at);

-- ============================================================================
-- settings — 사장님 설정 (영업 일시중지, 영업시간 등)
-- ============================================================================

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- blacklist — 노쇼 자동 블랙리스트
-- ============================================================================

CREATE TABLE blacklist (
  phone TEXT PRIMARY KEY,
  reason TEXT NOT NULL DEFAULT 'no_show',
  source_order_id TEXT REFERENCES orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- webhook_events — Idempotency (Telegram + 추후 토스)
-- ============================================================================

CREATE TABLE webhook_events (
  event_key TEXT PRIMARY KEY,               -- 'telegram:<update_id>' | 'toss:<eventId>'
  provider TEXT NOT NULL CHECK (provider IN ('telegram', 'toss')),
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_provider ON webhook_events(provider, processed_at DESC);

-- ============================================================================
-- updated_at 자동 갱신 트리거
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_menu_updated_at BEFORE UPDATE ON menu
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_menu_extras_updated_at BEFORE UPDATE ON menu_extras
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- RLS — deny-all 기본. 모든 접근은 백엔드 service_role 경유.
-- ============================================================================

ALTER TABLE menu          ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_extras   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist     ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- service_role은 RLS 우회 (Supabase 기본). 정책 없이 익명/authenticated는 deny-all.
