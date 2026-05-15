import type { Metadata } from "next";
import { Section, SectionLabel } from "@/components/Section";
import { STORE } from "@/lib/data/store";

export const metadata: Metadata = {
  title: "이용약관",
  description: "우드진 판교점 단체주문 서비스 이용약관.",
};

export default function TermsPage() {
  return (
    <Section className="max-w-3xl pb-24 pt-20">
      <SectionLabel>Terms</SectionLabel>
      <h1 className="mt-3 serif text-3xl md:text-4xl">이용약관</h1>
      <p className="mt-4 text-sm text-[var(--color-ink-mute)]">
        시행일: 2026년 5월 1일 (v1.0)
      </p>

      <div className="prose mt-12 max-w-none text-[var(--color-ink-soft)]">
        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">제1조 (목적)</h2>
        <p className="mt-3 text-sm leading-loose">
          본 약관은 {STORE.legalName}(이하 &ldquo;매장&rdquo;)이 운영하는{" "}
          {STORE.domain} 웹사이트 및 단체주문 서비스(이하 &ldquo;서비스&rdquo;)를
          이용함에 있어 매장과 이용자의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
        </p>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">제2조 (정의)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-loose">
          <li>&ldquo;단체주문&rdquo;이란 한 번의 주문에 음료 5잔 이상 30잔 이하를 사전 예약하여 배달 받는 서비스를 말합니다.</li>
          <li>&ldquo;이용자&rdquo;란 본 약관에 동의하고 서비스를 이용하는 개인 또는 법인을 말합니다.</li>
          <li>&ldquo;슬롯&rdquo;이란 1시간 단위로 운영되는 배달 시간대를 말합니다.</li>
          <li>&ldquo;CLI&rdquo;란 매장이 제공하는 명령줄 주문 인터페이스(<code>npx woodjean@latest order</code>)를 말합니다.</li>
        </ol>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">제3조 (서비스의 내용)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-loose">
          <li>매장은 CLI를 통한 사전 예약 단체주문 및 배달 서비스를 제공합니다.</li>
          <li>최소 주문 수량은 5잔, 최대 주문 수량은 1주문당 30잔입니다.</li>
          <li>슬롯은 1시간 단위로 운영되며, 1시간당 1건의 주문만 접수합니다.</li>
          <li>주문은 도착 시간 기준 1시간 전까지 가능합니다.</li>
          <li>배달 가능 범위는 매장 인근(도보 약 30분) 이내입니다. 범위 밖은 매장 확인 후 안내드립니다.</li>
        </ol>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">제4조 (결제)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-loose">
          <li>결제는 배달 시점에 매장에서 직접 카드·송금·계좌이체 등 합의된 방법으로 진행합니다.</li>
          <li>결제 금액은 메뉴별 표시 가격과 수량, 옵션 추가금을 합산하여 산정합니다 (부가가치세 포함).</li>
          <li>주문은 슬롯 가용 여부에 따라 자동 수락되며, 매장 사정으로 거절될 수 있습니다.</li>
          <li>온라인 선결제(토스페이먼츠 등) 옵션은 v1.5에서 별도 안내합니다.</li>
        </ol>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">제5조 (주문 취소·노쇼)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-loose">
          <li>이용자는 음료 제조 시작 전까지 매장({STORE.phone})으로 직접 연락하여 주문을 취소할 수 있습니다.</li>
          <li>음료 제조가 시작된 이후 취소 요청 시, 발생한 재료비 등 일부 비용이 청구될 수 있습니다.</li>
          <li>매장 휴무·라스트오더 이후 시간대의 예약은 매장이 사전 거절하며, 결제 부담은 발생하지 않습니다.</li>
          <li>예약 시간에 수령하지 않거나 배달지에 수령자가 부재한 경우(노쇼), 해당 휴대폰 번호는 자동 블랙리스트에 등록되어 향후 주문이 제한될 수 있습니다.</li>
        </ol>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">제6조 (알림 발송)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-loose">
          <li>주문 접수 및 배달 30분 전 자동 컨펌 SMS가 이용자 휴대폰으로 발송됩니다.</li>
          <li>발송된 SMS는 회신 불가하며, 변경/취소는 매장({STORE.phone})으로 직접 연락 주십시오.</li>
        </ol>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">제7조 (이용자의 의무)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-loose">
          <li>이용자는 주문 시 정확한 배달지, 연락처, 시간을 입력해야 합니다.</li>
          <li>잘못된 정보로 인한 배달 실패의 책임은 이용자에게 있습니다.</li>
        </ol>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">제8조 (책임 제한)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-loose">
          <li>천재지변, 전쟁, 정전, 통신 장애 등 매장의 책임 없는 사유로 서비스가 중단된 경우 매장은 책임을 지지 않습니다.</li>
          <li>이용자가 입력한 잘못된 정보로 인해 발생한 손해에 대해서는 매장이 책임을 지지 않습니다.</li>
        </ol>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">제9조 (분쟁 해결)</h2>
        <p className="mt-3 text-sm leading-loose">
          본 약관에 명시되지 않은 사항은 관계 법령 및 일반 상관례에 따릅니다.
          서비스 이용과 관련하여 분쟁이 발생할 경우, 분쟁 당사자는 우호적으로 해결하기 위해 노력하며,
          해결되지 않을 경우 민사소송법상의 관할 법원에 소를 제기할 수 있습니다.
        </p>

        <h2 className="serif mt-10 text-xl text-[var(--color-ink)]">제10조 (문의)</h2>
        <p className="mt-3 text-sm leading-loose">
          본 약관 및 서비스에 관한 문의는 아래로 연락 주시기 바랍니다.
        </p>
        <ul className="mt-3 space-y-1 text-sm leading-loose">
          <li>상호: {STORE.legalName}</li>
          <li>대표자: {STORE.ceoName}</li>
          <li>사업자등록번호: {STORE.bizNumber}</li>
          <li>주소: {STORE.address}</li>
          <li>전화: {STORE.phone}</li>
          <li>이메일: {STORE.email}</li>
        </ul>
      </div>
    </Section>
  );
}
