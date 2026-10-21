export const won = (n: number) =>
  `${n < 0 ? '-' : ''}${Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원`;

/** 오늘 포함 이번 달 남은 일수 */
export function daysLeftInMonth(now = new Date()) {
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return last - now.getDate() + 1;
}

/** 설계서 기준: 남은 돈 = 월 예산 − 이번 달 지출 − 아직 나가지 않은 고정비 */
export function remainingMoney(totalBudget: number, totalSpent: number, unpaidFixed: number) {
  return totalBudget - totalSpent - unpaidFixed;
}

/** 오늘 쓸 수 있는 돈 = 남은 돈 ÷ 남은 일수 (음수면 0) */
export function todayAvailable(remaining: number, daysLeft: number) {
  return Math.max(0, Math.floor(remaining / Math.max(1, daysLeft)));
}
