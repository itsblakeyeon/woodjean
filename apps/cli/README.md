# woodjean

[![npm](https://img.shields.io/npm/v/woodjean)](https://www.npmjs.com/package/woodjean)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

> 판교 우드진 카페에서 회의용 음료 5~30잔을, 터미널에서 바로 주문해요.

```bash
npx woodjean order
```

> **Requirements**: Node.js 18+ (macOS · Linux 검증, Windows untested) · 판교테크노밸리 반경 1km · **평일 09:00–11:00 / 13:30–16:30** (주말 휴무)

## 이용 방법

1. **CLI 실행** — 터미널에서 `npx woodjean order` 한 줄. Node.js만 있으면 install 불필요.
2. **메뉴 + 시간** — 27종 음료 자유 조합, 1시간 단위 도착 슬롯, 시간당 1건.
3. **사장님 알림** — 텔레그램으로 사장님께 즉시 전달, 자동 수락. SMS 컨펌.
4. **현장 후불** — 예약 시간에 도착, 사장님께 카드·송금·이체로 결제. 1분이면 끝나요.

## 왜 CLI인가

판교 개발자들이 이미 쓰는 터미널에서 팀 음료 주문을 끝내기 위해 만들었어요. Slack이나 회의 메모를 보다가 바로 주문하고, 다음 주문부터는 같은 배달지와 연락처를 재사용하는 흐름을 목표로 합니다.

## 구조

```text
CLI (npx woodjean)
   │
   ▼ HTTPS (cli.woodjean-pangyo.com)
Bot API (Next.js, Vercel)
   ├─▶ Supabase Postgres (서울 리전)
   ├─▶ Telegram (사장님 운영)
   └─▶ Solapi SMS (고객 컨펌)
```

CLI는 오픈소스, backend는 운영용 private repo. 메뉴 데이터와 가격 계산은 `src/shared/`에 같이 있어요 — 외부 dep 없이 self-contained.

## 명령어

```bash
npx woodjean order
npx woodjean order --new
npx woodjean menu
npx woodjean history
```

| Flag | 설명 |
| --- | --- |
| `--yes`, `-y` | 같은 주문 재제출용 non-interactive 모드 |
| `--new` | 저장된 단골 정보를 건너뛰고 새 주문 시작 |
| `--no-splash` | 시작 배너 생략 |
| `--brand` | 방문 횟수와 무관하게 풀 브랜드 배너 출력 |
| `--debug` | API 호출 디버그 로그 출력. 휴대폰은 마스킹 |

## 첫 주문 예시

```text
$ npx woodjean order

WOODJEAN
우드진 단체주문

◇  도착 날짜를 선택해 주세요
◇  도착 시간을 선택해 주세요 (lead time 1시간)
◇  다음 작업을 선택해 주세요
◇  건물명 (예: 유스페이스2 A동)
◇  닉네임 (사장님이 메시지/SMS에 사용)
◇  위 내용에 모두 동의하시나요?

✅  주문이 접수됐어요.
   주문 ID: ord_xxxxxxxxxxxxxxxx
   5잔 · 23,000원 (현장 후불)
```

## 흐름

```text
단골 (L1)        ~/.woodjean/state.json — 같은 메뉴/배달지 1-step 재주문
     │
     ▼
신규/재구성 (L3)  slot -> cart -> delivery -> customer -> consent -> confirm
```

1. 도착 시간 선택: 평일 영업시간과 1시간 lead time 적용. 시간당 1건만 접수해요.
2. 메뉴 선택: 시그니처 / 커피 / 논커피 메뉴에서 사이즈, 온도, 옵션, 잔수를 고릅니다.
3. 배달지 입력: 건물, 층/호, 수령자, 수령 위치를 입력해요.
4. 고객 정보: 닉네임과 휴대폰 번호를 입력해요.
5. 약관과 개인정보 수집·이용 동의 후 주문을 제출해요.

## 운영 정보

- 매장: 우드진 (WOODJEAN), 판교테크노밸리 유스페이스1
- 영업시간: 평일 09:00~11:00, 13:30~16:30. 주말 휴무
- 배달 범위: 매장 반경 1km, 도보 20분
- 매장 전화: 010-8484-2120
- 사이트: https://woodjean-pangyo.com
- 결제: 후불. 배달 시 카드, 송금, 이체 가능
- 약관·개인정보 처리방침: https://woodjean-pangyo.com/legal

## 터미널 호환성

ANSI 256색 + UTF-8 emoji를 지원하는 macOS 터미널(Apple Terminal, iTerm2, Warp, Alacritty, Ghostty 등)에서 동작해요. blake 환경에서 splash·박스·emoji·dim 출력을 sanity 검증했어요.

**Windows Terminal**: untested. Node.js + cross-platform 디펜던시로 동작 가능성은 높지만 시각 출력은 검증되지 않았어요. 깨짐 발견 시 [GitHub issues](https://github.com/itsblakeyeon/woodjean-cli/issues)에 제보 부탁드려요.

내 터미널에서 시각 출력만 미리 보고 싶으면 repo 클론 후 `pnpm qa-demo`(혹은 `npm run qa-demo`)로 splash·박스·emoji 한 화면을 띄울 수 있어요.

## Troubleshooting

**가능한 시간이 없어요**

향후 3일 슬롯이 모두 찼거나 매장이 일시 중지 상태일 수 있어요. 급하면 매장(010-8484-2120)으로 문의해 주세요.

**배달지가 범위 밖이라고 나와요**

우드진 반경 1km 밖이면 접수가 어려워요. 다른 건물로 변경하거나 매장에 직접 문의해 주세요.

**SMS가 안 와요**

휴대폰 번호를 다시 확인해 주세요. SMS는 회신이 안 되므로 변경이나 취소는 매장으로 연락해 주세요.

**주문을 변경하거나 취소하고 싶어요**

v1.2에서는 고객용 취소 API가 없어요. 매장(010-8484-2120)으로 직접 연락해 주세요.

## Environment

| Env | 설명 |
| --- | --- |
| `WOODJEAN_API_URL` | 주문 API URL override (개발/스테이징용) |
| `NO_COLOR` | ANSI 색상 비활성화 |
| `WOODJEAN_DEBUG=1` | 디버그 로그 출력. 휴대폰은 마스킹 |
| `WOODJEAN_FAST=1` | 빠른 실행 모드 |

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | success |
| 1 | user cancellation |
| 2 | input validation failure |
| 3 | slot unavailable / out of business hours |
| 4 | blacklisted phone |
| 5 | API/network failure (retryable) |
| 6 | server-side rejection (not retryable) |
| 7 | config/env error |

## ⭐ 도와주세요

- ★ Star — 우드진에 와봤거나, 이 CLI에 미소 한 번 지었다면
- 🍴 Fork for your cafe — MIT 라이센스라 본인 카페용으로 자유롭게 변형 가능 (CONTRIBUTING.md 참고)
- 🐛 Bug? Typo? — Issues 환영

## Links

- GitHub: https://github.com/itsblakeyeon/woodjean-cli
- npm: https://www.npmjs.com/package/woodjean
- Changelog: [CHANGELOG.md](./CHANGELOG.md)
- 매장 사이트: https://woodjean-pangyo.com

## 라이선스

MIT — 자세한 내용은 [LICENSE](./LICENSE) 참조.
