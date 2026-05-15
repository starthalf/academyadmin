import type { ScheduleSlot, ScheduleDay } from '../types';

const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
type DayKey = typeof dayKeys[number];

const DAY_ORDER: ScheduleDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// ============================================================
// 내부 헬퍼: 'YYYY-MM-DD' → Date (로컬 타임존, 자정)
// toISOString을 쓰지 않기 위해 직접 파싱
// ============================================================
function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Date → 'YYYY-MM-DD' (로컬 기준, toISOString 회피)
function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ============================================================
// 날짜 포맷
// ============================================================

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

// ============================================================
// 오늘 / 요일
// ============================================================

export function getToday(): string {
  return formatDateString(new Date());
}

export function getTodayDayOfWeek(): DayKey {
  return dayKeys[new Date().getDay()];
}

export function dayKeyToKorean(key: string): string {
  const idx = dayKeys.indexOf(key as DayKey);
  return idx >= 0 ? dayNames[idx] : '';
}

// ============================================================
// 스케줄
// ============================================================

// 레거시 호환
export function formatScheduleDays(days: string[]): string {
  return days.map(d => dayKeyToKorean(d)).join('·');
}

// 요일별 시간 표시 "월 14:00 · 수 16:00 · 금 14:00"
export function formatScheduleSlots(slots: ScheduleSlot[]): string {
  if (!slots || slots.length === 0) return '-';
  const sorted = [...slots].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
  );
  return sorted.map(s => `${dayKeyToKorean(s.day)} ${s.time}`).join(' · ');
}

// 슬롯에서 가장 이른 시간 (정렬용)
export function earliestSlotTime(slots: ScheduleSlot[]): string {
  if (!slots || slots.length === 0) return '99:99';
  return [...slots].map(s => s.time).sort()[0];
}

// 특정 요일의 시간 찾기 (오늘 시간 표시용)
export function findSlotTime(slots: ScheduleSlot[], day: string): string | null {
  if (!slots) return null;
  const slot = slots.find(s => s.day === day);
  return slot ? slot.time : null;
}

// ============================================================
// 학년 / 나이
// ============================================================

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
// 주차
// ============================================================

export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);

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
  const date = parseDateString(dateStr);
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

// ============================================================
// 날짜 네비게이션 (DateNavigator용)
// 모두 로컬 타임존 기준, toISOString 미사용
// ============================================================

// 'YYYY-MM-DD' 문자열에 일수 더하기
export function addDays(dateStr: string, days: number): string {
  const date = parseDateString(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateString(date);
}

// 'YYYY-MM-DD' → 'mon' | 'tue' | ...
export function dateStringToDayOfWeek(dateStr: string): DayKey {
  return dayKeys[parseDateString(dateStr).getDay()];
}

// 'YYYY-MM-DD' 문자열을 한국어 날짜로
export function formatKoreanDateString(dateStr: string): string {
  return formatKoreanDate(parseDateString(dateStr));
}