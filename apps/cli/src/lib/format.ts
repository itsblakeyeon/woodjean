export function formatKstWindow(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const endD = new Date(d.getTime() + 60 * 60_000);
  const eh = String(endD.getHours()).padStart(2, "0");
  const em = String(endD.getMinutes()).padStart(2, "0");
  const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${month}/${day}(${dayOfWeek}) ${hh}:${mm}~${eh}:${em}`;
}

export function formatPrice(won: number): string {
  return `${won.toLocaleString()}원`;
}

export function formatPhone(p: string): string {
  // 010-1234-5678
  if (p.length === 11) return `${p.slice(0, 3)}-${p.slice(3, 7)}-${p.slice(7)}`;
  if (p.length === 10) return `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`;
  return p;
}
