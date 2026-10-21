const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** (연, 월, 일) 날짜. 월이 범위를 벗어나도 보정하고, 그 달에 없는 날(예: 2월 31일)은 말일로 맞춘다. */
function clampedDate(year: number, month: number, day: number) {
  const base = new Date(year, month, 1);
  const last = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  return new Date(base.getFullYear(), base.getMonth(), Math.min(day, last));
}

/**
 * 카드값 정산 기간.
 * startDay = 10 이면 10일 ~ 다음 달 9일, startDay = 1 이면 1일 ~ 말일.
 */
export function getCycleRange(startDay: number, now: Date = new Date()) {
  const today = startOfDay(now);
  const thisMonthStart = clampedDate(today.getFullYear(), today.getMonth(), startDay);

  const start =
    today >= thisMonthStart
      ? thisMonthStart
      : clampedDate(today.getFullYear(), today.getMonth() - 1, startDay);

  const nextStart = clampedDate(start.getFullYear(), start.getMonth() + 1, startDay);
  const end = new Date(nextStart.getFullYear(), nextStart.getMonth(), nextStart.getDate() - 1);
  const daysUntilNext = Math.round((nextStart.getTime() - today.getTime()) / DAY_MS);

  return { start, end, nextStart, daysUntilNext };
}

export const formatMonthDay = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`;
