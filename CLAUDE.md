# Woodjean — 단체주문 CLI

판교 우드진(WOODJEAN) 카페의 단체주문 배달 서비스. CLI 인터페이스(`npx woodjean order`)를 마케팅 후크로 활용하는 그린필드 프로젝트.

## 프로젝트 컨텍스트

- **타깃**: 판교 개발자 대상 단체주문 (회의용 음료 5~30잔)
- **콘셉트**: CLI 자체가 트위터/HN/디스코드에서 회자될 마케팅 자산
- **출시 전략**: Production-Lite v1.0 (~2.5주)
- **상세 plan**: `~/.claude/plans/crispy-moseying-horizon.md`
- **현재 진행**: `PROGRESS.md`

## 기술 스택

- **언어**: TypeScript 5.5, Node.js 20 LTS, ESM
- **모노레포**: pnpm workspaces + Turborepo
- **CLI**: ink 4.x + `@clack/prompts` + figlet/gradient-string + qrcode-terminal + commander + string-width
- **번들러**: esbuild (단일 파일, 콜드 스타트 < 250ms)
- **Web**: Next.js 16 App Router, Vercel (Node runtime)
- **DB**: Supabase Postgres, **서울 리전 (ap-northeast-2)**
- **결제**: 토스페이먼츠 SDK + 서버 confirm 2단계
- **어드민 인증**: NextAuth v5 + TOTP 2FA (`otplib` + `argon2`)
- **어드민 UI**: shadcn/ui + Tailwind + recharts
- **SMS**: Solapi (한국)
- **Telegram 봇**: 사장님 알림 (outbound only)
- **Rate limit**: Upstash Redis
- **모니터링**: Sentry

## 디렉토리 구조 (예정)

```
apps/
  cli/      # ink 기반 CLI, npm publish 대상 (name: "woodjean")
  pay/      # Next.js 결제 페이지 (모바일 토스 SDK)
  admin/    # Next.js 어드민 대시보드 + 모든 API
packages/
  shared/   # @woodjean/shared — zod, 단가 계산, 약관, SMS 템플릿
supabase/
  migrations/
  seed/menu.sql  # 30종 음료
```

## 비즈니스 룰 핵심

- 단체주문 전용, 최소 10잔, 최대 30잔/주문
- **예약 전용** (즉시배달 X), 30분 슬롯
- Lead time 차등: 10잔=1시간 / 11~20잔=1.5시간 / 21~30잔=2시간
- 슬롯 cap: 시간당 30잔 (= 30분 슬롯당 15잔)
- 결제 흐름: **자동 수락 + 슬롯 cap**. 거절은 예외만
- 고객 식별: 닉네임 + 전화번호 + 디바이스ID
- 알림: SMS (Solapi) for 고객, Telegram for 사장
- 도메인: Vercel 무료로 시작 가능 (자체 도메인 선택)

## 작업 추적

- **개발 (코드)**: Linear "Woodjean v1.0" 프로젝트 — M1~M5 마일스톤
  - https://linear.app/internal-org/project/woodjean-v10-bf152503a3c5
- **개발 외 (사장님 + blake)**: Things 3 "Woodjean" 프로젝트
- **Plan**: `~/.claude/plans/crispy-moseying-horizon.md`

## 코딩 컨벤션

- TypeScript strict mode
- ESM only (`"type": "module"`)
- pnpm로만 패키지 관리 (npm/yarn 금지)
- 가격은 항상 `int` 원 단위 (부동소수점 회피)
- 주문 ID: `'ord_' + nanoid(16)` — IDOR 방지
- 모든 API input/output은 zod 스키마로 검증
- DB 직접 접근은 백엔드 API 경유 (RLS deny-all 기본)
- 환경변수는 `.env.example`에 모두 명시

## 보안 출시 블로커 (M5)

- 결제 금액은 서버 `packages/shared/src/pricing/calculate.ts`로 재계산 (클라이언트 amount 신뢰 X)
- Webhook idempotency: `webhook_events.event_key` PK
- Webhook 시그니처: 토스 콘솔 발급 시 알고리즘 확정 → `lib/toss/verify-webhook.ts`
- Rate limiting: Upstash Redis (deviceId/IP/phone)
- 어드민 2FA: TOTP + argon2 비밀번호 + libsodium TOTP 시크릿 암호화
- PIPA 동의 + 서울 리전 + 약관 텍스트

## v1.0에 없고 v1.1로 미룬 것

- 카카오 알림톡 (PER-22)
- 매출 차트 (PER-22) — v1.0은 Supabase 직접 쿼리 또는 CSV
- 고객 측 취소 API (PER-22) — v1.0은 사장님께 카톡 → 어드민 거절
- 휴무일 일괄 환불 batch (PER-22)
- pg_cron PIPA 자동 파기 (PER-23) — v1.0은 약관/동의 기록만
- k6 부하 테스트 (PER-23)
- `woodjean menu` / `status` / `history` 명령어 (PER-23)
- 빌링키 (PER-23) — 별도 가맹 심사 필요

## 작업 시작 시 참고

새 세션에서 이 프로젝트 코드 작업할 때:
1. `PROGRESS.md` 읽고 현재 상태 확인
2. `~/.claude/plans/crispy-moseying-horizon.md` 읽고 plan 확인
3. Linear에서 다음 마일스톤 티켓 확인 (M1: PER-17부터)
4. 외부 의존성 (Supabase, Vercel, 토스 테스트 키 등) 셋업 상태 확인
