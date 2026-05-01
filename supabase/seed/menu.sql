-- Woodjean v1.0 menu seed
-- 가격표(reference/menu/pricing-card.png) 기준 27종 + 옵션 4종
-- apps/site/lib/data/menu.ts와 동기화 (수동)

-- ============================================================================
-- menu_extras — 옵션 가격
-- ============================================================================

INSERT INTO menu_extras (key, label, price) VALUES
  ('shot',          '샷 추가',          500),
  ('milk_change',   '우유 변경',        500),
  ('decaf_r',       '디카페인 (R)',     500),
  ('decaf_l',       '디카페인 (L)',    1000)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  price = EXCLUDED.price,
  updated_at = NOW();

-- ============================================================================
-- menu — 음료 27종
-- ============================================================================

INSERT INTO menu (slug, name, category, price_r, price_l, temps, variants, option_shot, option_milk_change, option_decaf, description, display_order) VALUES
  -- 시그니처 (WOODJEAN-MADE)
  ('woody-spaner',         '우디슈페너',          'signature',  4000, NULL, ARRAY['ICE'],         ARRAY['오리지널','피스타치오','초코']::TEXT[], true,  true,  true,  '에스프레소 위에 부드러운 크림을 얹은 시그니처 (오리지널 / 피스타치오 / 초코)', 10),
  ('earl-grey-milk-tea',   '얼그레이 밀크티',     'signature',  4500, 5000, ARRAY['ICE','HOT'],   NULL,                                            false, true,  false, '베르가못 향이 깊은 얼그레이 밀크티',                                              20),
  ('dark-choco-latte',     '다크초코라떼',        'signature',  4500, 5000, ARRAY['ICE','HOT'],   NULL,                                            true,  true,  true,  '묵직한 다크 초콜릿 베이스',                                                       30),

  -- 커피 — A.U STYLE
  ('piccolo',              '피콜로',              'coffee',     3000, NULL, ARRAY['HOT'],         NULL,                                            true,  true,  true,  '에스프레소 위에 우유 한 스푼',                                                    100),
  ('flat-white',           '플랫화이트',          'coffee',     3800, NULL, ARRAY['ICE','HOT'],   NULL,                                            true,  true,  true,  '우유 거품 없이 진하게 즐기는 호주식 라떼',                                        110),
  ('aussie-cappuccino',    'AUSSIE 카푸치노',     'coffee',     3800, 4300, ARRAY['HOT'],         NULL,                                            true,  true,  true,  '초코파우더가 올라가는 호주식 카푸치노',                                           120),
  ('dirty-chai-latte',     '더티차이라떼',        'coffee',     4500, 5000, ARRAY['ICE','HOT'],   NULL,                                            true,  true,  true,  '차이 라떼에 에스프레소 한 샷',                                                    130),

  -- 커피 — BLACK
  ('espresso',             '에스프레소',          'coffee',     2800, NULL, ARRAY['HOT'],         NULL,                                            true,  false, true,  NULL, 200),
  ('americano',            '아메리카노',          'coffee',     3000, 3500, ARRAY['ICE','HOT'],   NULL,                                            true,  false, true,  NULL, 210),

  -- 커피 — WHITE
  ('latte',                '라떼',                'coffee',     3800, 4300, ARRAY['ICE','HOT'],   NULL,                                            true,  true,  true,  NULL, 300),
  ('soy-latte',            '소이라떼',            'coffee',     4000, 4500, ARRAY['ICE','HOT'],   NULL,                                            true,  true,  true,  NULL, 310),
  ('almond-latte',         '아몬드라떼',          'coffee',     4000, 4500, ARRAY['ICE','HOT'],   NULL,                                            true,  true,  true,  NULL, 320),

  -- 커피 — SWEET
  ('vanilla-latte',        '바닐라라떼',          'coffee',     4300, 4800, ARRAY['ICE','HOT'],   NULL,                                            true,  true,  true,  NULL, 400),
  ('hazelnut-latte',       '헤이즐넛라떼',        'coffee',     4300, 4800, ARRAY['ICE','HOT'],   NULL,                                            true,  true,  true,  NULL, 410),
  ('caramel-latte',        '카라멜라떼',          'coffee',     4300, 4800, ARRAY['ICE','HOT'],   NULL,                                            true,  true,  true,  NULL, 420),
  ('cafe-mocha',           '카페모카',            'coffee',     4300, 4800, ARRAY['ICE','HOT'],   NULL,                                            true,  true,  true,  NULL, 430),

  -- 논커피 — NON-COFFEE LATTE
  ('toffee-nut-latte',     '토피넛라떼',          'non-coffee', 4300, 4800, ARRAY['ICE','HOT'],   NULL,                                            true,  true,  false, NULL, 500),
  ('matcha-latte',         '말차라떼',            'non-coffee', 4300, 4800, ARRAY['ICE','HOT'],   NULL,                                            true,  true,  false, NULL, 510),
  ('five-grain-latte',     '오곡라떼',            'non-coffee', 4300, 4800, ARRAY['ICE','HOT'],   NULL,                                            true,  true,  false, NULL, 520),

  -- 논커피 — TEA (모두 L only)
  ('french-earl-grey',     '프렌치얼그레이',      'non-coffee', NULL, 4500, ARRAY['ICE','HOT'],   NULL,                                            false, false, false, '라벤더와 베르가못 향의 프리미엄 얼그레이', 600),
  ('melbourne-breakfast',  '맬번브랙퍼스트',      'non-coffee', NULL, 4500, ARRAY['ICE','HOT'],   NULL,                                            false, false, false, '묵직한 멜번 스타일 블랙퍼스트 티',          610),
  ('peppermint',           '페퍼민트',            'non-coffee', NULL, 4500, ARRAY['ICE','HOT'],   NULL,                                            false, false, false, NULL, 620),
  ('lemongrass-ginger',    '레몬그라스 & 진저',   'non-coffee', NULL, 4500, ARRAY['ICE','HOT'],   NULL,                                            false, false, false, NULL, 630),
  ('chamomile',            '카모마일',            'non-coffee', NULL, 4500, ARRAY['ICE','HOT'],   NULL,                                            false, false, false, NULL, 640),

  -- 논커피 — ADE (모두 L only, ICE only)
  ('triple-berry-ade',     '트리플베리 에이드',   'non-coffee', NULL, 4800, ARRAY['ICE'],         NULL,                                            false, false, false, NULL, 700),
  ('pina-colada-ade',      '피나콜라다 에이드',   'non-coffee', NULL, 4800, ARRAY['ICE'],         NULL,                                            false, false, false, NULL, 710),
  ('bundaberg-ade',        '분다버그 에이드',     'non-coffee', NULL, 4300, ARRAY['ICE'],         ARRAY['망고','진저비어','자몽','레몬라임']::TEXT[], false, false, false, NULL, 720)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price_r = EXCLUDED.price_r,
  price_l = EXCLUDED.price_l,
  temps = EXCLUDED.temps,
  variants = EXCLUDED.variants,
  option_shot = EXCLUDED.option_shot,
  option_milk_change = EXCLUDED.option_milk_change,
  option_decaf = EXCLUDED.option_decaf,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================================================
-- settings — 운영 설정 기본값 (사장님 확정 — 2026-04-29)
-- ============================================================================

INSERT INTO settings (key, value) VALUES
  ('paused_until',       'null'::JSONB),
  ('store_phone',        '"010-8484-2120"'::JSONB),
  ('delivery_radius_m',  '1000'::JSONB),
  -- 5/18~ 정상 영업시간. 5/17까지 임시기간은 사장님이 텔레그램 /중지로 직접 운영.
  ('business_hours',     '{"weekday":[{"start":"09:00","end":"11:00"},{"start":"13:30","end":"16:30"}],"weekend":[]}'::JSONB),
  ('lead_time_minutes',  '60'::JSONB),
  ('min_cups',           '5'::JSONB),
  ('max_cups',           '30'::JSONB)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
