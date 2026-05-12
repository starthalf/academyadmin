const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
type DayKey = typeof dayKeys[number];

export function formatKoreanDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = dayNames[date.getDay()];
  return `${year}년 ${month}월 ${day}일 (${dayName})`;
}

export function formatShortDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = dayNames[date.getDay()];
  return `${month}/${day}(${dayName})`;
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function getTodayDayOfWeek(): DayKey {
  return dayKeys[new Date().getDay()];
}

export function dayKeyToKorean(key: string): string {
  const idx = dayKeys.indexOf(key as DayKey);
  return idx >= 0 ? dayNames[idx] : '';
}

export function formatScheduleDays(days: string[]): string {
  return days.map(d => dayKeyToKorean(d)).join('·');
}

export function getGradeLabel(grade: number): string {
  if (grade <= 6) return `초${grade}`;
  return `중${grade - 6}`;
}

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
