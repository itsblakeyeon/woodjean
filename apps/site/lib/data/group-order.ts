export type LeadTimeRule = {
  range: string;
  hours: string;
};

export const GROUP_ORDER = {
  minQty: 10,
  maxQty: 30,
  slotMinutes: 30,
  slotCapacity: 15,
  hourlyCapacity: 30,
  leadTime: [
    { range: "10잔", hours: "1시간 전 예약" },
    { range: "11~20잔", hours: "1시간 30분 전 예약" },
    { range: "21~30잔", hours: "2시간 전 예약" },
  ] as LeadTimeRule[],
};
