# woodjean CLI changelog

## 1.2.0 (2026-05-10)

후불 컨텍스트 정리 — 영수증 surface 제거 + 사용 안 되는 flag 제거.

### 제거

- 영수증 페이지 + QR 출력. 후불(현장 결제)에선 영수증이 결제 증빙이 아니고, `apps/site/order/[id]` 라우트가 미구현이라 모든 영수증 QR이 404로 backfire였어요. CLI는 주문 ID와 도착 시간만 success 메시지로 노출해요.
- `--json` flag. 영수증 출력 placeholder였고 호출 시 warn만 출력했어요. KAI-166 PIN 표면이라 시맨틱상 breaking이지만 사용자 노출 0이라 영향 거의 없음.
- `qrcode-terminal` 디펜던시. 번들 −15 KB (279.9 → 264.5 KB).

### 추가

- `pnpm -F woodjean qa-demo` dev 스크립트 — splash·박스·emoji·dim 한 화면 출력 (KAI-173 시각 sanity).
- README "터미널 호환성" 섹션 + Windows untested disclaimer.
- `docs/qa/kai-173-matrix.md` 매트릭스 템플릿.

## 1.1.0 (2026-05-09)

단골 retention 릴리스. v1.0.2 hotfix 위에 신규 명령, 단골 prefill, 슬롯/배달 UX 개선을 얹었어요.

### 신규 명령

- `woodjean menu` — 전체 메뉴와 가격 확인 (영업시간 무관, KAI-171)
- `woodjean history` — 이 디바이스에서 주문한 이력 확인 (KAI-178)

### 단골 retention (L1 prefill)

- `~/.woodjean/state.json`에 마지막 주문/디바이스 ID 저장 (mode 0600, KAI-162)
- 시작 화면 router: hot/warm/cold tier 감지해서 자동 프리필 (KAI-163)
  - **hot** (≤7일): "같은 걸로" 한 번에 재주문
  - **warm** (8~30일): 배달지·연락처 그대로, 메뉴는 새로
  - **cold** (31일+): 신규 사용자 흐름
- 3+회 방문 시 splash 자동 컴팩트 (KAI-169). `--brand`로 강제 풀 배너.

### 주문 흐름 폴리시

- 같은 음료 N잔 한 번에 추가 (KAI-168). 30프롬프트 → 6프롬프트.
- 액션 select 위에 카트 박스 inline 표시 (KAI-180)
- 슬롯 노출 7일로 확장 — 토/일에도 다음 평일 보임 (KAI-181)
- 슬롯 마감 시 SMS 알림 등록 옵션 (KAI-172)
- 휴대폰 사전 확인으로 블랙리스트는 입력 직후 차단 (KAI-164)
- 배달지 1km 카피 약화 (KAI-164)

### Lock & 폴리시

- CLI flag 표면 PIN: `--yes` / `--new` / `--no-splash` / `--brand` / `--json` / `--debug`. exit codes 0~7 매핑 (KAI-166)
- `--help` 강화: Examples / Environment / 영업시간 / Exit code 표
- 모든 에러 카피 problem/cause/fix triplet + 매장 010-8484-2120 안내 (KAI-167)
- 톤 해요체 lock (KAI-170)
- 영수증 box에서 휴대폰 마스킹 `010-XXXX-9412` (KAI-170 — 스크린샷 leak 방지)

### 내부

- OrderDraft composable steps 리팩토링 (KAI-161) — wizard state가 step 사이로 흐름
- Funnel 측정 이벤트 6종 (KAI-165) — `cli_events` 테이블에 익명 적재. `WOODJEAN_TELEMETRY_OFF=1`로 끄기 가능

### 제외

- L2 paste 자동 인식 (KAI-174/175/176/177): scope 검토 후 v1.1에서 drop. Anthropic API 의존 / PIPA 처리 위탁 동의 트랙 무거워 단골 retention 핵심 가치 대비 우선순위 낮음.
- D2Coding + iTerm + 다크 테마 5종 매트릭스 검증 (KAI-173): 후속 (수동 QA).

## 1.0.2 (2026-05-08)

CLI userflow 4축 회고에서 발견된 critical hotfix.

- `confirm.ts` 데이터 휘발 + retry + draft 영구 저장 (KAI-158): API 실패 시 카트/배달지 휘발하던 문제 해결. `~/.woodjean/draft.json` mode 0600에 payload 저장 후 다음 실행에서 복원 prompt. 네트워크 실패 시 최대 3회 재시도.
- 동적 박스 폭 (KAI-159): `string-width`로 한글/이모지 폭 정확히 측정. 60~120칸 모든 터미널에서 정렬 깔끔.
- 일자별 슬롯 그룹 (KAI-160): 일자 → 시간 2-step select.

## 1.0.1 (2026-05-05)

- `figlet` ANSI Shadow 폰트 인라인 (ENOENT 첫 실행 fix)
- README 정상 사용 흐름 + SMS 본문 예시 추가
