export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

export const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** 10월 21일 수요일 */
export const formatFullDate = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일`;

const pad = (n: number) => String(n).padStart(2, '0');

/** DB의 date 컬럼용 'YYYY-MM-DD' (기기 시간대 기준 날짜, UTC로 밀리지 않는다) */
export const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 'YYYY-MM-DD' → 그날 0시(로컬) */
export const fromYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};