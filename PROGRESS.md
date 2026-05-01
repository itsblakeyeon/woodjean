# Progress

## 현재 상태

**v1.0 골격 코드 전부 작성 완료 (2026-05-01).** 외부 의존성(Supabase / Telegram / Solapi / Vercel) 셋업만 남음. 빌드 3개(site/bot/cli) 모두 통과, CLI 콜드 스타트 58ms. 다음 단계는 외부 셋업 + QA.

## 완료된 작업 (2026-05-01 — 골격)

### 코어 모듈 (`packages/shared/`)
- [x] 메뉴 데이터 27종 (가격표 기준 R/L, ICE/HOT, variants, options)
- [x] 가격 계산 (zod 검증, 사이즈/온도/variant/옵션별 가격, 5~30잔 강제)
- [x] Bun sanity 10/10 검증

### Supabase (`supabase/`)
- [x] 0001_init.sql — 7 테이블 (menu, menu_extras, orders, order_events, settings, blacklist, webhook_events)
- [x] 슬롯 cap unique index (시간당 1건 atomic 거부)
- [x] RLS deny-all (service_role only)
- [x] menu.sql seed (27 메뉴 + 4 옵션 + 7 settings)

### 백엔드 (`apps/bot/`) — Next.js 16
- [x] `/api/orders` POST — 가격 재계산 + 블랙리스트 + 슬롯 cap + Telegram + SMS
- [x] `/api/orders/[id]` GET — 영수증/상태
- [x] `/api/slots` GET — 영업시간 + paused_until + 차있는 시간 제외
- [x] `/api/telegram/webhook` — 인라인 버튼 [완료][노쇼][취소] + /중지 명령 + idempotency
- [x] `/api/cron/confirm-sms` — 배달 30분 전 자동 SMS (Vercel Cron 5분 주기)
- [x] `/api/cron/no-show-check` — 노쇼 의심 사장님 알림 (10분 주기)
- [x] `lib/`: env (zod), supabase, telegram, solapi, slots, orders, ids
- [x] vercel.json crons 설정

### CLI (`apps/cli/`) — clack 기반
- [x] 흐름: 슬롯 → 메뉴+옵션+잔수 → 배달지 → 닉/폰 → 동의 → 접수
- [x] figlet/gradient 스플래시
- [x] 디바이스 ID 영구 저장 (~/.woodjean/device-id)
- [x] QR 코드 영수증 링크
- [x] esbuild 단일 파일 216.7 KB, 콜드 스타트 58ms

### 사이트 갱신 (`apps/site/`)
- [x] menu.ts → @woodjean/shared 재export, MenuCard displayPrice/displayTemp
- [x] 홈 비즈룰: 5~30잔, 1시간 단위, 현장 후불
- [x] /order 페이지: CLI 안내 (`npx woodjean order`)
- [x] /terms, /privacy v1.0 갱신 (Ultra-Lean 결제 방식 반영)

### 운영 문서
- [x] apps/bot/.env.example, apps/cli/.env.example
- [x] README.md (모노레포 + 배포 흐름)
- [x] apps/cli/README.md (npm publish용)

## 완료된 작업 (2026-04-29 ~ 05-01) — 사장님 회신 + 비즈 로직

## 완료된 작업 (2026-04-29 ~ 05-01)

### 비즈니스 로직 정리 + 사장님 회신
- [x] 비즈 로직 사장님 검토용 닥스 작성 (Ultra-Lean 4차 수정, Codex 리뷰 1회)
- [x] Linear 티켓 7개 등록 — PER-26~PER-32
- [x] 사장님 4가지 결정 회신 수신 (영업시간 / 피크타임 / 배달범위 / 대표번호)
- [x] Lead time 의문 댓글 reply (수령시간 자유선택)
- [x] 임시기간(~5/17) 텔레그램 `/중지` 직접 운영 방식 컨펌 받음 (구두) — 시스템에는 5/18~ 정상 영업시간만 박음
- [x] CLAUDE.md 비즈룰 + 운영 설정 갱신
- **닥스 URL**: https://docs.google.com/document/d/1zGcFEeDrvROp6ccldV8lnIf7x_LU8wx8Wel2w6Q9hgk/edit
- **사장님 결정 요약**: 평일 09:00~11:00 + 13:30~16:30 (5/18~) / 5월 점심피크 X / 도보20분 반경1km / 010-8484-2120

### Ultra-Lean 핵심 결정 (4/29)
- **결제**: 후불 (사장님 현장 수령). 토스SDK + `apps/pay` v1.0 통째로 X
- **운영**: 텔레그램 봇 양방향 인라인버튼. `apps/admin` v1.0 통째로 X
- **임시기간 처리**: 5/17까지는 시스템 분기 만들지 않고 텔레그램 `/중지`로 사장님 직접 토글
- **노쇼 hedge 3중** (사장님 콜 / SMS 컨펌 / 자동 블랙리스트)
- **메뉴**: R/L 분리, ICE/HOT 가격 동일·메뉴별 제약, 옵션 `샷+500 / 우유+500 / 디카페인 R+500·L+1000`. 가격표 원본: `reference/menu/pricing-card.png`

## 완료된 작업 (2026-04-27)

### 토스 심사용 마케팅 사이트 (`apps/site`)
- [x] monorepo 골격 — `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, 루트 `package.json`
- [x] `apps/site` 셋업 — Next.js 16 App Router + Tailwind 4 + Noto Sans KR (고딕 단일 폰트)
- [x] 페이지 6개 — `/`, `/menu`, `/order`, `/about`, `/terms`, `/privacy`
- [x] 메뉴 데이터 30종 (네이버 플레이스에서 가격까지 수집)
- [x] 사업자 정보 푸터 — 카페우드진 판교테크노밸리점 / 전준현 / 730-56-01086
- [x] 에셋 — 본사 메뉴 이미지 30장 + 매장 인테리어 12장
- [x] 데스크톱(`max-w-7xl`) + 모바일 헤더 컴팩트로 시각 점검
- [x] Vercel 배포 (`blakes-projects-74b330f4/woodjean`) + `vercel --prod`
- [x] 가비아 도메인 → Vercel NS(`ns1/ns2.vercel-dns.com`) 위임
- [x] SSL 발급 + 6페이지 200 검증 (https://woodjean-pangyo.com, https://www.woodjean-pangyo.com)
- TODO: 라떼 4종(latte/vanilla/hazelnut/caramel) 본사 이미지 동일 파일 — 토스 지적 시 교체

## 완료된 작업 (2026-04-26)

### 기획
- [x] 제품 컨셉 확정 — 판교 우드진 카페 단체주문 배달 CLI (마케팅 후크)
- [x] 비즈니스 룰 확정 — 최소 10잔, 예약 전용, lead time 차등, 슬롯 cap 시간당 30잔
- [x] 기술 스택 확정 — TypeScript + ink + Next.js + Supabase + 토스페이먼츠 + Solapi + Telegram + NextAuth/TOTP
- [x] 외부 리서치 (토스 결제 API + 마케팅 CLI 사례)
- [x] 두 관점 plan 리뷰 (비즈니스/운영 + 기술/아키텍처)
- [x] Production-Lite v1.0 plan 확정 (5개 마일스톤, ~2.5주)

### 작업 추적 셋업
- [x] Linear "Woodjean v1.0" 프로젝트에 v1.0 마일스톤 5개 + v1.1 백로그 2개 등록
- [x] Things "Woodjean" 프로젝트에 사장님/사용자 작업 8개 등록
- [x] 사장님 카톡 전달용 메시지 정리

## 다음 단계

### 외부 의존성 셋업 (사용자 작업)
- [ ] **Supabase 프로젝트** (서울 ap-northeast-2): URL + service_role key, `supabase db push` + `psql ... < seed/menu.sql`
- [ ] **Telegram 봇**: @BotFather에서 봇 생성, owner chat_id 확인, webhook secret 생성
- [ ] **Solapi SMS**: API key + 발신번호 등록 (사장님 통신증명서 + 사업자등록증 필요)
- [ ] **Vercel `woodjean-bot` 프로젝트** 신규 생성 + env 등록 + 배포
- [ ] **Telegram setWebhook** API 호출 (배포 후)
- [ ] CLI npm publish (외부 셋업 완료 후)

### QA / 검증 (외부 셋업 후)
- [ ] CLI end-to-end 흐름 (5잔 / 20잔 / 30잔 / 우디슈페너 variant / 페퍼민트 L only / 피콜로 HOT only)
- [ ] 슬롯 cap 동시성 (같은 시간에 2개 주문 → 1개 거부)
- [ ] Telegram 인라인 버튼 [완료/취소/노쇼] 동작
- [ ] /중지 오늘 / /재개 명령
- [ ] 30분 전 SMS 발송 (Cron)
- [ ] 노쇼 자동 블랙리스트
- [ ] 첫주문/20잔↑ 콜 권장 표시
- [ ] 사이트 시각 점검 (모바일 + 데스크탑)
- [ ] CLI 시각 점검 (스플래시 + 흐름)

### Linear PER-32 정리
- M2 (결제+어드민) 아카이브
- 기존 PER-17~24 → 신규 흐름으로 재맵핑

### 사장님 작업 (Things)
- 즉시: Telegram 봇 / 메뉴 알레르기 / 통신판매업 신고
- 추후 (v1.5): 토스페이먼츠 가맹 심사 (선결제 옵션 — v1.0 무관)
- M4: SMS 자료 전달 (통신증명원 + 사업자등록증)

### 사용자(blake) 작업 (Things)
- M4: Solapi 발신번호 등록 (사장님 자료 받은 후)
- M5: 약관 + 개인정보처리방침 작성

## 마일스톤 (Linear — PER-32 갱신 예정)

기존 M1~M5에서 M2 (결제 + 어드민) 아카이브, Telegram 봇 + `/중지` + 노쇼 hedge 등 신규 티켓(PER-26~31) 통합으로 재정렬. 자세한 건 PER-32 참조.

## 참고

- **상세 plan**: `~/.claude/plans/crispy-moseying-horizon.md`
- **Linear 프로젝트**: https://linear.app/internal-org/project/woodjean-v10-bf152503a3c5
- **Things 프로젝트**: "Woodjean"
