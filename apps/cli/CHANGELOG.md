# woodjean CLI changelog

## 1.3.1 (2026-05-15)

QA 2차 라운드 — 슬롯/배달 문구 정리. (Linear KAI-242/243)

- **KAI-242** 날짜 선택 화면에서 날짜별 슬롯 갯수 hint·`N개 슬롯` 미리보기 제거. 조회 스피너도 갯수 대신 "조회 완료". 날짜 단계는 날짜만, 시간은 다음 단계에서.
- **KAI-243** 배달 범위 안내를 "도보 30분 내 권장. 범위 밖이면 사장님이 확인 후 연락드릴 수 있어요."로 (도보 20분→30분, '카톡'→'연락').

## 1.3.0 (2026-05-15)

사장님 QA 배치 반영 — 흐름 간소화 + 카피 정리. (Linear KAI-231/232/234/236/238/240/241)

- **KAI-238 이름/닉네임 통합** — "닉네임" + "수령자 이름" 따로 묻던 것을 "주문자 이름" 하나로. 배달지도 건물/층/수령자/위치 4단계를 "배달지 (건물·층/호·수령 위치)" 한 줄로 합침. SMS·Telegram 표시도 같은 값 사용.
- **KAI-241 주문 실패 메시지** — 서버 internal 에러 시 `[internal] undefined` 대신 매장 연락처 안내 + draft 저장 위치 안내. (근본 원인 조사는 별도 트랙)
- **KAI-232 슬롯 노출** — 슬롯 조회 윈도우 최소 7일로 clamp (주말·휴무 끼어도 평일이 보이도록). 안내 문구도 "향후 7일"로.
- **KAI-234 시간 선택** — 날짜를 이미 골랐으므로 시간 옵션에는 `09:00~10:00`처럼 시간만 표시 (날짜 중복 제거).
- **KAI-236 가격 표시** — 메뉴 리스트를 `3,800~4,300원` 레인지 대신 `3,800원~` 최소가 중심으로. 사이즈 선택 단계에선 정확 가격 계속 표시.
- **KAI-231 브랜드명** — "판교 우드진 — 회의용 음료" → "우드진 판교테크노밸리점 — 음료 단체주문".
- **KAI-240 보유기간** — 동의 문구 보유기간을 "주문일로부터 1년"으로 단순화.
- **미제출 주문 복원 거절 인사 수정** — 복원을 "아니오" 한 재방문자에게 "처음 방문해주셔서 감사해요"가 뜨던 문제. 이제 "지난 미제출 주문은 복원하지 않을게요. 새로 주문을 시작할게요."로 분기.
- 옵션 선택을 별도 select 1단계 없이 바로 multiselect로 단축.
- 안내·예시 카피 `npx woodjean` → `npx woodjean@latest`.

## 1.2.5 (2026-05-15)

woodjean CLI를 다시 monorepo로 통합. 2 repo 운영 부담(CHANGELOG/release/dashboard 둘) 회수가 목적. npm 패키지로서 동작은 v1.2.4와 동일 (영업 흐름·옵션·뒤로가기 등 다 그대로), 메타데이터만 정리.

- `repository` / `homepage` / `bugs` 필드 제거 — 옛 `itsblakeyeon/woodjean-cli` 공개 repo는 삭제됐고 monorepo는 private이라 외부에서 따라갈 link가 없어졌어요. issues/PR이 필요하면 매장 010-8484-2120 또는 메일로.
- `@woodjean/shared` workspace dep로 redirect — esbuild가 inline bundle해서 사용자 install 시 추가 의존성 0 (published tarball은 fully self-contained).

## 1.2.4 (2026-05-15)

메뉴 선택 흐름에 명시적 `← 뒤로` 추가. 그동안 메뉴/가격/옵션을 확인해보려면 일단 카트까지 추가하고 다시 삭제해야 했는데, 이제 카테고리/메뉴/사이즈/온도/옵션/잔수 각 단계마다 `← 뒤로 (XXX로)` 옵션이 보여서 어디로 돌아가는지도 명확. 메뉴마다 단계가 다르게 skip되는 것도 똑같이 따라가요. Ctrl+C 단번에 빠지는 동작은 그대로 유지.

## 1.2.3 (2026-05-15)

옵션 선택 화면 안내 문구 정정. multiselect는 Space로 토글하고 Enter로 확정하는데 기존 카피("옵션 — 없으면 Enter")가 multiselect 컨벤션을 모르는 사용자에게 "Enter로 선택"이라 오해를 주고 있었어요. 결과: 옵션을 *고르려고* Enter를 눌러도 빈 선택으로 넘어가던 문제. "Space로 선택, Enter로 확정 (없으면 바로 Enter)"로 명시 변경.

## 1.2.2 (2026-05-10)

슬롯 조회 윈도우 3일 → 7일. 일요일·휴무일이 끼면 평일 1~2일만 노출돼서 다음 주 예약을 잡지 못하던 문제. backend는 14일까지 지원하지만 CLI에서 3으로 hardcode 돼 있었어요.

## 1.2.1 (2026-05-10)

Repository를 전용 public repo로 분리 — 코드는 동일, 메타만 갱신.

- Repository link: `itsblakeyeon/woodjean` → `itsblakeyeon/woodjean-cli`
- 라이센스 명시 (LICENSE 파일 동봉, MIT)
- README 마케팅 톤 정리 (구조 다이어그램, Star/Fork CTA)
- shared 모듈은 npm 의존이 아닌 inline (`src/shared/`) — self-contained

## 1.2.0 (2026-05-10)

후불 컨텍스트 정리 — 영수증 surface 제거 + 사용 안 되는 flag 제거.

### 제거

- 영수증 페이지 + QR 출력. 후불(현장 결제)에선 영수증이 결제 증빙이 아니고, `apps/site/order/[id]` 라우트가 미구현이라 모든 영수증 QR이 404로 backfire였어요. CLI는 주문 ID와 도착 시간만 success 메시지로 노출해요.
- `--json` flag. 영수증 출력 placeholder였고 호출 시 warn만 출력했어요. PIN 표면이라 시맨틱상 breaking이지만 사용자 노출 0이라 영향 거의 없음.
- `qrcode-terminal` 디펜던시. 번들 −15 KB (279.9 → 264.5 KB).

### 추가

- `pnpm qa-demo` dev 스크립트 — splash·박스·emoji·dim 한 화면 출력 (시각 sanity).
- README "터미널 호환성" 섹션 + Windows untested disclaimer.

## 1.1.0 (2026-05-09)

단골 retention 릴리스. v1.0.2 hotfix 위에 신규 명령, 단골 prefill, 슬롯/배달 UX 개선을 얹었어요.

### 신규 명령

- `woodjean menu` — 전체 메뉴와 가격 확인 (영업시간 무관)
- `woodjean history` — 이 디바이스에서 주문한 이력 확인

### 단골 retention (L1 prefill)

- `~/.woodjean/state.json`에 마지막 주문/디바이스 ID 저장 (mode 0600)
- 시작 화면 router: hot/warm/cold tier 감지해서 자동 프리필
  - **hot** (≤7일): "같은 걸로" 한 번에 재주문
  - **warm** (8~30일): 배달지·연락처 그대로, 메뉴는 새로
  - **cold** (31일+): 신규 사용자 흐름
- 3+회 방문 시 splash 자동 컴팩트. `--brand`로 강제 풀 배너.

### 주문 흐름 폴리시

- 같은 음료 N잔 한 번에 추가. 30프롬프트 → 6프롬프트.
- 액션 select 위에 카트 박스 inline 표시
- 슬롯 노출 7일로 확장 — 토/일에도 다음 평일 보임
- 슬롯 마감 시 SMS 알림 등록 옵션
- 휴대폰 사전 확인으로 블랙리스트는 입력 직후 차단
- 배달지 1km 카피 약화

### Lock & 폴리시

- CLI flag 표면 PIN: `--yes` / `--new` / `--no-splash` / `--brand` / `--json` / `--debug`. exit codes 0~7 매핑
- `--help` 강화: Examples / Environment / 영업시간 / Exit code 표
- 모든 에러 카피 problem/cause/fix triplet + 매장 010-8484-2120 안내
- 톤 해요체 lock
- 영수증 box에서 휴대폰 마스킹 `010-XXXX-9412` — 스크린샷 leak 방지

### 내부

- OrderDraft composable steps 리팩토링 — wizard state가 step 사이로 흐름
- Funnel 측정 이벤트 6종 — `cli_events` 테이블에 익명 적재. `WOODJEAN_TELEMETRY_OFF=1`로 끄기 가능

### 제외

- L2 paste 자동 인식: scope 검토 후 v1.1에서 drop. Anthropic API 의존 / PIPA 처리 위탁 동의 트랙 무거워 단골 retention 핵심 가치 대비 우선순위 낮음.
- D2Coding + iTerm + 다크 테마 5종 매트릭스 검증: 후속 (수동 QA).

## 1.0.2 (2026-05-08)

CLI userflow 4축 회고에서 발견된 critical hotfix.

- `confirm.ts` 데이터 휘발 + retry + draft 영구 저장: API 실패 시 카트/배달지 휘발하던 문제 해결. `~/.woodjean/draft.json` mode 0600에 payload 저장 후 다음 실행에서 복원 prompt. 네트워크 실패 시 최대 3회 재시도.
- 동적 박스 폭: `string-width`로 한글/이모지 폭 정확히 측정. 60~120칸 모든 터미널에서 정렬 깔끔.
- 일자별 슬롯 그룹: 일자 → 시간 2-step select.

## 1.0.1 (2026-05-05)

- `figlet` ANSI Shadow 폰트 인라인 (ENOENT 첫 실행 fix)
- README 정상 사용 흐름 + SMS 본문 예시 추가
