-- KAI-172 — slot 알림 등록 (notify_targets)
-- 향후 N일 슬롯이 모두 마감일 때 사용자가 SMS 알림을 등록.
-- cron이 새 슬롯 발견 시 unfired non-expired row를 모두 fire.

CREATE TABLE notify_targets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  phone TEXT NOT NULL,
  device_id_hash TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fired_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_notify_targets_pending
  ON notify_targets (registered_at)
  WHERE fired_at IS NULL;

-- RLS deny-all (service role bypasses).
ALTER TABLE notify_targets ENABLE ROW LEVEL SECURITY;
