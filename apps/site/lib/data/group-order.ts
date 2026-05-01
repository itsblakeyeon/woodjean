export type LeadTimeRule = {
  range: string;
  hours: string;
};

export const GROUP_ORDER = {
  minQty: 5,
  maxQty: 30,
  slotMinutes: 60,
  slotCapacity: 1,
  hourlyCapacity: 1,
  leadTime: [
    { range: "5~30잔", hours: "1시간 전 예약" },
  ] as LeadTimeRule[],
};
