const DAY_NAMES_KR = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDateKR(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = DAY_NAMES_KR[date.getDay()];
  return `${month}월 ${day}일 (${dayName})`;
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** 주어진 날짜가 포함된 주의 일~토 범위를 반환 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const day = date.getDay(); // 0=일, 1=월, ...
  const start = addDays(date, -day); // 일요일로 이동
  const end = addDays(start, 6); // 토요일
  return { start, end };
}

export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function getDayOfWeekKR(date: Date): string {
  return DAY_NAMES_KR[date.getDay()];
}

export function formatWeekRangeKR(start: Date, end: Date): string {
  const sy = start.getFullYear();
  const sm = start.getMonth() + 1;
  const sd = start.getDate();
  const em = end.getMonth() + 1;
  const ed = end.getDate();
  return `${sy}.${sm}.${sd} ~ ${em}.${ed}`;
}

export function formatMonthKR(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

/** 월간 캘린더 그리드에 필요한 날짜 배열 (일요일 시작, 6주 고정) */
export function getMonthCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const dayOfWeek = firstDay.getDay(); // 0=일
  const start = addDays(firstDay, -dayOfWeek); // 일요일 시작

  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** 월의 첫날과 마지막날 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
}
