# Progress

## 현재 상태

**토스 심사용 마케팅 사이트 라이브.** https://woodjean-pangyo.com (Vercel NS 위임, SSL 자동 발급). 정상 흐름 M1~M5는 별도 트랙. Production-Lite v1.0 (~2.5주) 전략 진행 중.

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

### 코드 작업
- 시작 신호 받으면 **M1 (모노레포 + Supabase + 메뉴 시드)** 부터 진행

### 사장님 작업 (Things)
- 즉시: 토스페이먼츠 가맹 심사 재제출 (사이트 URL: https://woodjean-pangyo.com)
- 즉시: Telegram 봇 / 메뉴 알레르기 / 통신판매업 신고
- M4: SMS 자료 전달 (통신증명원 + 사업자등록증)

### 사용자(blake) 작업 (Things)
- M4: Solapi 발신번호 등록 (사장님 자료 받은 후)
- M5: 약관 + 개인정보처리방침 작성

## 마일스톤 (Linear)

| M | 티켓 | 제목 | 기간 |
|---|---|---|---|
| M1 | PER-17 | 기반 셋업 — 모노레포 + Supabase + 메뉴 시드 | 2일 |
| M2 | PER-18 | 결제 페이지 + 어드민 대시보드 | 5일 |
| M3 | PER-19 | CLI 주문 흐름 | 4일 |
| M4 | PER-21 | 주문 상태 + SMS + Telegram + 거절환불 | 3일 |
| M5 | PER-24 | 출시 — 보안 + 약관 + 토스 라이브 + npm publish | 3일 |

## 참고

- **상세 plan**: `~/.claude/plans/crispy-moseying-horizon.md`
- **Linear 프로젝트**: https://linear.app/internal-org/project/woodjean-v10-bf152503a3c5
- **Things 프로젝트**: "Woodjean"
