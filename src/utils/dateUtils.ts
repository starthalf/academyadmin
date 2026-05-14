export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startMonth = start.getMonth() + 1;
  const startDay = start.getDate();
  const endMonth = end.getMonth() + 1;
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth}월 ${startDay}일 - ${endDay}일`;
  }
  return `${startMonth}월 ${startDay}일 - ${endMonth}월 ${endDay}일`;
}

export function getWeekNumber(dateStr: string): number {
  const date = new Date(dateStr);
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export function formatWeekLabel(weekId: string): string {
  const match = weekId.match(/(\d{4})-w(\d{2})/);
  if (!match) return weekId;

  const [, year, week] = match;
  return `${year}년 ${parseInt(week)}주차`;
}

export function getRelativeWeekLabel(weekIndex: number): string {
  if (weekIndex === 0) return '이번 주';
  if (weekIndex === 1) return '지난 주';
  return `${weekIndex}주 전`;
}
