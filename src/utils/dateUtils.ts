import type { ScheduleSlot, ScheduleDay } from '../types';

const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
type DayKey = typeof dayKeys[number];

const DAY_ORDER: ScheduleDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

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

// 레거시 호환 (혹시 다른 곳에서 쓸 때 대비)
export function formatScheduleDays(days: string[]): string {
  return days.map(d => dayKeyToKorean(d)).join('·');
}

// 신규: 요일별 시간 표시 "월 14:00 · 수 16:00 · 금 14:00"
export function formatScheduleSlots(slots: ScheduleSlot[]): string {
  if (!slots || slots.length === 0) return '-';
  const sorted = [...slots].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
  );
  return sorted.map(s => `${dayKeyToKorean(s.day)} ${s.time}`).join(' · ');
}

// 신규: 슬롯에서 가장 이른 시간 (정렬용)
export function earliestSlotTime(slots: ScheduleSlot[]): string {
  if (!slots || slots.length === 0) return '99:99';
  return [...slots].map(s => s.time).sort()[0];
}

// 신규: 특정 요일의 시간 찾기 (오늘 시간 표시용)
export function findSlotTime(slots: ScheduleSlot[], day: string): string | null {
  if (!slots) return null;
  const slot = slots.find(s => s.day === day);
  return slot ? slot.time : null;
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

// ============================================================
// 날짜 네비게이션용 (DateNavigator + DataContext에서 사용)
// ============================================================

// 'YYYY-MM-DD' + days → 'YYYY-MM-DD'
export function addDays(dateString: string, days: number): string {
  const d = new Date(dateString + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 'YYYY-MM-DD' → '2026년 5월 18일 (월)'
export function formatKoreanDateString(dateString: string): string {
  const d = new Date(dateString + 'T00:00:00');
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${dayNames[d.getDay()]})`;
}

// 'YYYY-MM-DD' → 'mon' | 'tue' | ...
export function getDayKeyFromDate(dateString: string): DayKey {
  return dayKeys[new Date(dateString + 'T00:00:00').getDay()];
}