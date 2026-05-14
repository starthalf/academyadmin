import { supabase } from '../lib/supabase';
import type { WeekInputs } from '../utils/statsCalculator';

// ISO 주차 → 시작/끝 날짜
export function getWeekRange(weekOffset: number = 0): { start: string; end: string; label: string } {
  const today = new Date();
  // 이번 주 월요일 찾기
  const dayOfWeek = today.getDay();  // 0(일) ~ 6(토)
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  // 라벨
  let label = '';
  if (weekOffset === 0) label = '이번 주';
  else if (weekOffset === -1) label = '지난 주';
  else if (weekOffset === 1) label = '다음 주';
  else if (weekOffset < 0) label = `${-weekOffset}주 전`;
  else label = `${weekOffset}주 후`;

  return { start: fmt(monday), end: fmt(sunday), label };
}

// 주차 표시용 (1월 26일 - 2월 1일)
export function formatWeekRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.getMonth() + 1}월 ${s.getDate()}일 - ${e.getMonth() + 1}월 ${e.getDate()}일`;
}

// 특정 학생의 한 주 데이터 가져오기
export async function fetchWeekInputs(
  studentId: string,
  weekStart: string,
  weekEnd: string
): Promise<WeekInputs> {
  const [attRes, hwRes, fbRes, moodRes, scoreRes] = await Promise.all([
    supabase
      .from('attendance')
      .select('date, status')
      .eq('student_id', studentId)
      .gte('date', weekStart)
      .lte('date', weekEnd),
    supabase
      .from('homework')
      .select('date, completed, quality')
      .eq('student_id', studentId)
      .gte('date', weekStart)
      .lte('date', weekEnd),
    supabase
      .from('teacher_feedback')
      .select('date, mood, focus, social')
      .eq('student_id', studentId)
      .gte('date', weekStart)
      .lte('date', weekEnd),
    supabase
      .from('class_mood_feedback')
      .select('date, mood')
      .gte('date', weekStart)
      .lte('date', weekEnd),
    supabase
      .from('scores')
      .select('date, subject_name, score, max_score')
      .eq('student_id', studentId)
      .gte('date', weekStart)
      .lte('date', weekEnd),
  ]);

  return {
    attendance: (attRes.data || []).map((a: any) => ({ date: a.date, status: a.status })),
    homework: (hwRes.data || []).map((h: any) => ({
      date: h.date,
      completed: h.completed,
      quality: h.quality,
    })),
    feedback: (fbRes.data || []).map((f: any) => ({
      date: f.date,
      mood: f.mood,
      focus: f.focus,
      social: f.social,
    })),
    classMood: (moodRes.data || []).map((m: any) => ({ date: m.date, mood: m.mood })),
    scores: (scoreRes.data || []).map((s: any) => ({
      date: s.date,
      subject: s.subject_name,
      score: s.score,
      maxScore: s.max_score,
    })),
  };
}
