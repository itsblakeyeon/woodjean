# Contributing

감사합니다! 우드진 CLI에 기여하려는 분께.

## 어떤 기여 환영

- Bug report (Issues)
- Typo / 깨진 링크 / 문서 수정 PR
- 작은 fix PR (CLI 출력 깨짐, 에러 메시지 개선 등)

## 어떤 기여 사전 합의 필요

- **기능 추가**는 먼저 Issue로 의도 공유 부탁드려요. backend(API/site)는 비공개라 외부 기여자가 full system을 실행해서 검증하기 어렵습니다. 변경 영향을 미리 함께 검토해야 해요.
- 비즈니스 룰 변경(가격, 영업시간, 배달 범위 등)은 매장 운영 정책이라 PR로 받기 어렵습니다.

## 다른 카페에서 fork하시는 경우

MIT 라이선스라 자유롭게 fork·수정·사용 가능합니다.

- 영업 운영 정보(매장명, 전화번호, 영업시간, 배달 범위 등)는 본인 매장 정보로 갈아끼우세요.
- backend는 두 가지 옵션:
  1. `@woodjean/shared` (npm publish됨)를 그대로 쓰고 본인의 backend 서버만 만들기
  2. shared logic까지 fork해서 본인 npm scope로 publish

backend 구조 참고:
- 주문 API: Next.js (Vercel) + Supabase Postgres
- 사장님 운영 채널: Telegram bot (인라인 버튼 `[수락] [취소] [노쇼] [완료]`)
- 고객 SMS: Solapi
- 결제: 후불 (현장)

## 개발 환경

```bash
git clone https://github.com/itsblakeyeon/woodjean-cli.git
cd woodjean-cli
pnpm install   # @woodjean/shared 설치 포함
pnpm dev       # tsx로 직접 실행
pnpm build     # esbuild로 dist/cli.mjs 번들
pnpm qa-demo   # splash/박스/emoji/dim 시각 sanity
pnpm typecheck
```

기본 backend는 `https://cli.woodjean-pangyo.com` 라이브 서버입니다. 본인 backend로 향하려면 `WOODJEAN_API_URL=http://localhost:3001 pnpm dev`처럼 override.

## PR 가이드

- 한 PR 한 변경 (typo + bug fix 섞지 말기)
- 변경 의도 한 줄 설명
- 시각 출력 변경 시 before/after 스크린샷 첨부

질문은 Issue 또는 매장 메일로 부담 없이 보내주세요.
