// PIPA + 이용약관 v1.1 본문 — 동의는 1회 통합 [Y/N]
// 자세한 본문은 https://woodjean-pangyo.com/privacy + /terms 에 게시.

export const CONSENT_VERSION = "1.1";

export const CONSENT_SUMMARY = `
[개인정보 수집·이용 동의 + 이용약관 동의]

수집 항목: 닉네임, 휴대폰 번호, 디바이스 ID, 배달지 정보, 주문 내역
이용 목적: 단체주문 접수·배달·결제·CS, 노쇼 이력 관리
보유 기간: 주문일로부터 5년 (전자상거래법) 후 파기
처리 위탁: Solapi(SMS), Telegram(주문 알림), Anthropic(메뉴 자동 인식 - --paste 사용 시)
익명 측정: CLI 시작·카트 완료·주문 성공/실패 이벤트를 개인 식별 없이 기록

전체 약관: https://woodjean-pangyo.com/terms
개인정보 처리방침: https://woodjean-pangyo.com/privacy

동의를 거부할 수 있으나, 거부 시 단체주문 접수가 불가합니다.
`.trim();
