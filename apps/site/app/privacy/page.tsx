import type { Metadata } from "next";
import { Section, SectionLabel } from "@/components/Section";
import { STORE } from "@/lib/data/store";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "우드진 판교점 개인정보처리방침.",
};

export default function PrivacyPage() {
  return (
    <Section className="max-w-3xl pb-24 pt-20">
      <SectionLabel>Privacy</SectionLabel>
      <h1 className="mt-3 serif text-3xl md:text-4xl">개인정보처리방침</h1>
      <p className="mt-4 text-sm text-[var(--color-ink-mute)]">시행일: 2026년 5월 1일 (v1.0)</p>

      <div className="mt-12 text-[var(--color-ink-soft)]">
        <p className="text-sm leading-loose">
          {STORE.legalName}(이하 &ldquo;매장&rdquo;)은 「개인정보 보호법」에 따라
          이용자의 개인정보를 보호하고 이와 관련된 고충을 신속하고 원활하게 처리할 수
          있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
        </p>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">1. 수집 항목 및 수집 방법</h2>
        <p className="mt-3 text-sm leading-loose">매장은 단체주문 서비스 제공을 위해 아래의 개인정보를 수집합니다.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-loose">
          <li>필수: 닉네임, 휴대전화번호</li>
          <li>배달 정보: 배달지 건물·층·수령자·수령위치, 추가 메모</li>
          <li>자동 수집: 접속 일시, 접속 IP, 서비스 이용 기록</li>
          <li>v1.5(예정): 토스페이먼츠 선결제 옵션 도입 시 결제 정보 추가 수집</li>
        </ul>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">2. 수집 및 이용 목적</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-loose">
          <li>단체주문 접수 및 배달 처리</li>
          <li>주문 컨펌 SMS 발송 (배달 30분 전 자동 알림)</li>
          <li>매장 운영자(텔레그램) 알림 및 운영 처리</li>
          <li>노쇼 이력 관리 (블랙리스트 자동 등록)</li>
          <li>부정 이용 방지, 분쟁 처리, 법령상 의무 이행</li>
        </ul>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">3. 보유 및 이용 기간</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-loose">
          <li>회원 정보: 서비스 이용 종료 또는 회원 탈퇴 시까지</li>
          <li>주문·결제 기록: 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 5년</li>
          <li>소비자의 불만 또는 분쟁 처리 기록: 3년</li>
          <li>접속 로그: 「통신비밀보호법」에 따라 3개월</li>
        </ul>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">4. 제3자 제공</h2>
        <p className="mt-3 text-sm leading-loose">
          매장은 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
          다만, 다음의 경우에는 예외로 합니다.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-loose">
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령에 의거하거나, 수사기관이 적법한 절차에 따라 요청한 경우</li>
        </ul>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">5. 처리 위탁</h2>
        <p className="mt-3 text-sm leading-loose">
          매장은 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있습니다.
        </p>
        <div className="mt-4 overflow-hidden rounded-md border border-[var(--color-line)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-paper)] text-xs uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">
              <tr>
                <th className="px-4 py-3 font-medium">수탁자</th>
                <th className="px-4 py-3 font-medium">위탁 업무</th>
              </tr>
            </thead>
            <tbody className="text-[var(--color-ink-soft)]">
              <tr className="border-b border-[var(--color-line)]">
                <td className="px-4 py-3">Solapi (쿠팡플레이)</td>
                <td className="px-4 py-3">고객 컨펌 SMS 발송</td>
              </tr>
              <tr className="border-b border-[var(--color-line)]">
                <td className="px-4 py-3">Telegram (Telegram FZ-LLC)</td>
                <td className="px-4 py-3">매장 운영자 주문 알림</td>
              </tr>
              <tr className="border-b border-[var(--color-line)]">
                <td className="px-4 py-3">Supabase</td>
                <td className="px-4 py-3">데이터베이스 호스팅 (서울 리전)</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Vercel</td>
                <td className="px-4 py-3">웹·API 호스팅</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">6. 이용자의 권리</h2>
        <p className="mt-3 text-sm leading-loose">
          이용자는 언제든지 자신의 개인정보 열람·정정·삭제·처리정지를 요구할 수 있으며,
          매장은 「개인정보 보호법」에 따라 지체 없이 조치합니다.
        </p>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">7. 안전성 확보 조치</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-loose">
          <li>관리적 조치: 개인정보 취급자의 최소화 및 정기 교육</li>
          <li>기술적 조치: 데이터 암호화, 접근 통제, 보안 프로그램 설치</li>
          <li>물리적 조치: 자료 보관 장소의 출입 통제</li>
        </ul>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">8. 개인정보 보호 책임자</h2>
        <ul className="mt-3 space-y-1 text-sm leading-loose">
          <li>책임자: {STORE.ceoName}</li>
          <li>전화: {STORE.phone}</li>
          <li>이메일: {STORE.email}</li>
        </ul>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">9. 변경에 관한 사항</h2>
        <p className="mt-3 text-sm leading-loose">
          본 방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는
          변경사항의 시행 7일 전부터 매장 웹사이트를 통하여 고지합니다.
        </p>
      </div>
    </Section>
  );
}
