# Woodjean — 단체주문 CLI

판교 우드진(WOODJEAN) 카페의 단체주문 배달 서비스. CLI 인터페이스(`npx woodjean@latest order`)를 마케팅 후크로 활용하는 그린필드 프로젝트.

> 내부 운영 컨텍스트(작업 추적·배포 인프라 세부)는 비공개 `CLAUDE.local.md`에 있음 (이 repo에 미포함).

## 프로젝트 컨텍스트

- **타깃**: 판교 개발자 대상 단체주문 (회의용 음료 5~30잔)
- **콘셉트**: CLI 자체가 트위터/HN/디스코드에서 회자될 마케팅 자산
- **출시 전략**: Production-Lite v1.0

## 기술 스택

- **언어**: TypeScript 5.5, Node.js 20 LTS, ESM
- **모노레포**: pnpm workspaces + Turborepo
- **CLI**: ink 4.x + `@clack/prompts` + figlet/gradient-string + qrcode-terminal + commander + string-width
- **번들러**: esbuild (단일 파일, 콜드 스타트 < 250ms)
- **Web**: Next.js 16 App Router (`apps/site`만 v1.0), Vercel (Node runtime)
- **DB**: Supabase Postgres, **서울 리전 (ap-northeast-2)**
- **결제**: v1.0은 후불 (사장님 현장 수령 — 카드/송금/이체 자유). 토스페이먼츠 SDK는 v1.5 선결제 옵션에 도입
- **SMS**: Solapi (고객 컨펌만)
- **Telegram 봇**: 사장님 운영 인터페이스 — 양방향 인라인 버튼 `[수락] [취소] [노쇼] [완료]`, `/중지` 명령
- **Rate limit**: Upstash Redis
- **모니터링**: Sentry

> **v1.0에서 빠진 것 (Ultra-Lean 결정)**: 토스페이먼츠 SDK + `apps/pay` 결제 페이지 + `apps/admin` 어드민 대시보드 (운영은 텔레그램 봇으로 대체)

## 디렉토리 구조

```
apps/
  cli/      # ink 기반 CLI, npm publish 대상 (name: "woodjean")
  site/     # 마케팅 사이트 (라이브: woodjean-pangyo.com)
  bot/      # Telegram 봇 webhook + 주문 API (모든 백엔드)
packages/
  shared/   # @woodjean/shared — zod, 단가 계산, 약관, SMS 템플릿
supabase/
  migrations/
  seed/menu.sql  # 음료 시드
```

## 비즈니스 룰 핵심 (Ultra-Lean 확정)

- 단체주문 전용, **최소 5잔 / 최대 30잔**
- **예약 전용** (즉시배달 X), **1시간 단위 슬롯**
- **Lead time 1시간** (잔수 무관 단일)
- 슬롯 cap: **시간당 주문 1건만 접수** (물리적 capacity)
- 단체할인 / 배달비 = **없음** (추가금 0원)
- 결제: **후불**. 배달 시 사장님이 현장 수령 (카드/송금/이체 자유)
- 고객 식별: 닉네임 + 전화번호 + 디바이스ID
- 알림: SMS (Solapi) for 고객 컨펌, Telegram for 사장 운영
- **상태 머신**: `confirmed / cancelled / completed / no_show` (rejected/cancelled 분리 X)
- **노쇼 hedge 3중**: ① 첫주문/20잔↑ 사장님 콜 권장 ② 30분 전 자동 SMS 컨펌 ③ 노쇼 1회 = 휴대폰 자동 블랙리스트

## 운영 설정 (사장님 확정)

- **영업시간**:
  - 평일: 09:00~11:00, 13:30~16:30
  - 주말: 휴무
- **점심 피크타임** (11:30~13:30) 단체주문: 안 받음 → 정상 영업시간 정의에서 제외되어 시스템상 자동 차단
- **배달 범위**: 도보 30분 내 (우드진 인근). 범위 밖은 사장님 확인 후 연락

## 코딩 컨벤션

- TypeScript strict mode
- ESM only (`"type": "module"`)
- pnpm로만 패키지 관리 (npm/yarn 금지)
- 가격은 항상 `int` 원 단위 (부동소수점 회피)
- 주문 ID: `'ord_' + nanoid(16)` — IDOR 방지
- 모든 API input/output은 zod 스키마로 검증
- DB 직접 접근은 백엔드 API 경유 (RLS deny-all 기본)
- 환경변수는 `.env.example`에 모두 명시

## 보안 출시 블로커

- 가격 계산은 서버 `packages/shared/src/pricing/calculate.ts`로 재계산 (클라이언트 amount 신뢰 X)
- Webhook idempotency: `webhook_events.event_key` PK (Telegram + 추후 토스용)
- Rate limiting: Upstash Redis (deviceId/IP/phone)
- PIPA 동의 + 서울 리전 + 약관 텍스트

## v1.0에 없고 v1.5/v1.1로 미룬 것

- 토스페이먼츠 선결제 옵션 (v1.5 — 토스 가맹 심사 통과 시 별도 트랙)
- 어드민 웹 대시보드 (텔레그램 봇으로 대체)
- 카카오 알림톡 (v1.1)
- 고객 측 취소 API (v1.0은 사장님 텔레그램 `[취소]`)
- pg_cron PIPA 자동 파기 (v1.0은 약관/동의 기록만)
- k6 부하 테스트
- `woodjean menu` / `status` / `history` 명령어
- 빌링키 (별도 가맹 심사 필요)

## CLI 운영 룰

CLI는 이 monorepo `apps/cli/` 단일 소스로 운영 (npm: `woodjean`).

**source of truth (단일화됨)**:
- **CLI 코드 = monorepo `apps/cli/`만**
- **메뉴/가격 코드 = monorepo `packages/shared/`만**
- CLI는 `@woodjean/shared/menu`·`@woodjean/shared/pricing`을 **workspace dep로 직접 import**. esbuild(`build.mjs`)가 publish 시 inline 번들 → 배포 tarball은 self-contained (`dependencies: {}`).
- 마케팅 README는 루트 `README.md` 단일 소스. `build.mjs`가 publish 시 `apps/cli/README.md`로 자동 동기화.

**메뉴/가격 변경 절차** (drift 없음 — 단일 소스):
1. `packages/shared/src/menu/data.ts` 또는 `pricing/calculate.ts` 수정
2. backend(`apps/bot`/`apps/site`) + CLI 모두 workspace로 자동 반영 (수동 복사 불필요)
3. `apps/cli/package.json` version bump + CHANGELOG 추가 → `apps/cli`에서 `npm publish`

> 배포 경로·인프라 세부는 비공개 `CLAUDE.local.md` 참조.
