# Woodjean

판교 우드진(WOODJEAN) 카페 단체주문 CLI 서비스. `npx woodjean@latest order` 한 줄로 5~30잔 예약 배달.

## 모노레포 구조

```
apps/
  bot/      # Next.js 백엔드 (주문 API + Telegram webhook + Cron)
  site/     # 마케팅 사이트 (https://woodjean-pangyo.com)
packages/
  shared/   # @woodjean/shared — 메뉴 데이터 + 가격 계산 + zod 스키마
supabase/
  migrations/   # 0001_init.sql — 7 테이블
  seed/         # menu.sql — 27 음료 + 4 옵션 + 7 settings
```

> CLI는 별도 public repo: [itsblakeyeon/woodjean-cli](https://github.com/itsblakeyeon/woodjean-cli) (npm: `woodjean`).

## 외부 의존성 (사용자 셋업 필요)

- **Supabase 프로젝트** (서울 리전 ap-northeast-2): URL + service_role key
- **Telegram 봇** (@BotFather): bot token + owner chat_id + webhook secret
- **Solapi SMS**: API key + secret + 발신번호 등록 (통신증명원 + 사업자등록증)
- **Vercel 프로젝트** 2개:
  - `woodjean-site` — 이미 라이브 (woodjean-pangyo.com)
  - `woodjean-bot` — apps/bot 코드 호스팅 (`bot.woodjean-pangyo.com` + `cli.woodjean-pangyo.com` 둘 다 매핑)
- **도메인** (가비아 → Vercel NS 위임 완료)
- **Sentry** (선택): DSN
- **Upstash Redis** (선택, v1.1): rate limiting

## 배포 흐름

### 1. Supabase 셋업

```bash
cd /Users/blake/personal/woodjean
supabase init   # supabase/ 디렉토리는 이미 존재. config.toml 생성됨
supabase link --project-ref YOUR_PROJECT_REF
supabase db push   # 0001_init.sql 적용
psql "$DATABASE_URL" < supabase/seed/menu.sql   # 메뉴 + settings seed
```

### 2. Bot 배포 (Vercel)

```bash
cd apps/bot
vercel link
vercel env pull .env.local   # 또는 .env.example 보고 수동 추가
vercel --prod
```

배포 후 Telegram webhook 등록:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://cli.woodjean-pangyo.com/api/telegram/webhook&secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

봇과 1:1 대화에서 `/시작` 입력 → 안내 메시지가 오면 정상.

### 3. CLI 빌드 + npm publish

CLI는 별도 repo에서 작업: [itsblakeyeon/woodjean-cli](https://github.com/itsblakeyeon/woodjean-cli).

## 개발

```bash
pnpm install
# bot dev (port 3001)
cd apps/bot && pnpm dev

# site dev (port 3000)
cd apps/site && pnpm dev
```

CLI 개발은 `woodjean-cli` repo 참조.

## 비즈니스 룰 (4/29 Ultra-Lean 확정)

- 5~30잔, 1시간 단위 슬롯, 시간당 1건 (물리적 capacity)
- Lead time 1시간 (잔수 무관)
- 결제: 후불 (현장 카드/송금/이체)
- 운영: 텔레그램 봇 인라인 버튼 [수락][취소][노쇼][완료]
- 노쇼 hedge 3중: 첫주문/20잔↑ 콜 권장 + 30분 전 SMS + 자동 블랙리스트

상세는 `CLAUDE.md` 참조.

## 작업 추적

- **개발 (코드)**: Linear "Woodjean v1.0" — https://linear.app/internal-org/project/woodjean-v10-bf152503a3c5
- **사장님 + blake**: Things 3 "Woodjean"
- **세션 진행**: `PROGRESS.md`
