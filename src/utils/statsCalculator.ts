// ============================================================
// 5축 점수 계산 (Step 2 - Layer 1: Data Signal만)
// Step 3에서 Layer 2 (발달 베이스라인) + Layer 3 (시즌 보정) 추가 예정
// ============================================================

// 학원에서 누적되는 raw 데이터 타입
export interface AttendanceRecord {
  date: string;
  status: 'present' | 'late' | 'absent';
}

export interface HomeworkRecord {
  date: string;
  completed: boolean;
  quality: 'low' | 'medium' | 'high' | null;
}

export interface FeedbackRecord {
  date: string;
  mood?: string;      // good/normal/tired/sensitive/hard
  focus?: string;     // focused/normal/distracted
  social?: string;    // active/normal/quiet
}

export interface ClassMoodRecord {
  date: string;
  mood: string;       // good/normal/tired/energetic/sensitive
}

export interface ScoreRecord {
  date: string;
  subject?: string;
  score: number;
  maxScore: number;
}

export interface WeekInputs {
  attendance: AttendanceRecord[];
  homework: HomeworkRecord[];
  feedback: FeedbackRecord[];
  classMood: ClassMoodRecord[];
  scores: ScoreRecord[];
  prevWeekScores?: ScoreRecord[];  // 트렌드 계산용
}

// 출력 5축
export interface FiveAxisStats {
  focus: number;
  growthMind: number;
  comprehension: number;
  logic: number;
  energy: number;
}

// ============================================================
// 헬퍼: 비율 0~100 변환
// ============================================================
function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.max(0, Math.min(100, (numerator / denominator) * 100));
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================
// 1. 집중력 (focus)
// 신호: 출석률, 지각율(반비례), "몰입" 이모지 비율
// ============================================================
export function calcFocus(inputs: WeekInputs): number {
  const { attendance, feedback } = inputs;
  const total = attendance.length;

  if (total === 0) return 60;  // 데이터 없으면 중간값

  const present = attendance.filter(a => a.status === 'present').length;
  const late = attendance.filter(a => a.status === 'late').length;

  const attendanceRate = ratio(present, total);     // 0~100
  const latePenalty = ratio(late, total);            // 0~100 (지각률, 클수록 마이너스)

  // 이모지: "focused" 비율
  const focusEmojis = feedback.filter(f => f.focus === 'focused').length;
  const totalFeedback = feedback.length;
  const focusEmojiRate = totalFeedback > 0 ? ratio(focusEmojis, totalFeedback) : 50;

  // 가중: 출석률 60% + 이모지 30% - 지각률 10%
  const score = attendanceRate * 0.6 + focusEmojiRate * 0.3 - latePenalty * 0.1;

  return clamp(score);
}

// ============================================================
// 2. 성장 마인드 (growthMind)
// 신호: 숙제 완료율 추세 + "성장" 이모지 (적극/적극시도)
// ============================================================
export function calcGrowthMind(inputs: WeekInputs): number {
  const { homework, feedback, scores, prevWeekScores } = inputs;
  const totalHw = homework.length;

  if (totalHw === 0 && feedback.length === 0) return 60;

  // 숙제 완료율
  const completed = homework.filter(h => h.completed).length;
  const completionRate = totalHw > 0 ? ratio(completed, totalHw) : 50;

  // 숙제 품질 가중
  const highQuality = homework.filter(h => h.completed && h.quality === 'high').length;
  const qualityBonus = totalHw > 0 ? ratio(highQuality, totalHw) * 0.5 : 0;

  // 적극성 이모지 (mood: good, focus: focused)
  const activeEmojis = feedback.filter(f =>
    f.mood === 'good' || f.focus === 'focused' || f.social === 'active'
  ).length;
  const activeRate = feedback.length > 0 ? ratio(activeEmojis, feedback.length) : 50;

  // 점수 상승 추세 (있으면 보너스)
  let scoreTrendBonus = 0;
  if (scores.length > 0 && prevWeekScores && prevWeekScores.length > 0) {
    const thisAvg = scores.reduce((s, r) => s + (r.score / r.maxScore) * 100, 0) / scores.length;
    const prevAvg = prevWeekScores.reduce((s, r) => s + (r.score / r.maxScore) * 100, 0) / prevWeekScores.length;
    if (thisAvg > prevAvg) scoreTrendBonus = 5;
  }

  // 가중: 숙제완료 50% + 적극성 40% + 품질보너스 10% + 점수상승 +5
  const score = completionRate * 0.5 + activeRate * 0.4 + qualityBonus * 0.1 + scoreTrendBonus;

  return clamp(score);
}

// ============================================================
// 3. 이해력 (comprehension)
// 신호: 점수 평균 (있을 때) + "헷갈림" 이모지 (반비례) + 숙제 품질
// ============================================================
export function calcComprehension(inputs: WeekInputs): number {
  const { homework, feedback, scores } = inputs;

  // 점수 있을 때 우선 사용
  if (scores.length > 0) {
    const avgScore = scores.reduce((s, r) => s + (r.score / r.maxScore) * 100, 0) / scores.length;
    // 점수 70% + 숙제 품질 30% (보조)
    const goodHw = homework.filter(h => h.completed && (h.quality === 'high' || h.quality === 'medium')).length;
    const hwRate = homework.length > 0 ? ratio(goodHw, homework.length) : 60;
    return clamp(avgScore * 0.7 + hwRate * 0.3);
  }

  // 점수 없을 때 - 숙제 품질 + 이모지로
  const goodHw = homework.filter(h => h.completed && (h.quality === 'high' || h.quality === 'medium')).length;
  const hwRate = homework.length > 0 ? ratio(goodHw, homework.length) : 60;

  // "hard" mood = 어려워함 → 이해력 감점
  const hardCount = feedback.filter(f => f.mood === 'hard').length;
  const hardPenalty = feedback.length > 0 ? ratio(hardCount, feedback.length) : 0;

  const score = hwRate - hardPenalty * 0.3;

  return clamp(score);
}

// ============================================================
// 4. 논리력 (logic)
// 신호: 수학/과학 점수 (있을 때) + 어려운 문제 정답률
// 데이터 부족 시 학년 베이스라인으로 보간 (Layer 2 작업이지만 미니멈 포함)
// ============================================================
export function calcLogic(inputs: WeekInputs, grade?: number): number {
  const { scores } = inputs;

  // 수학/과학 점수가 있으면 강한 신호
  const logicSubjects = scores.filter(s =>
    s.subject?.includes('수학') || s.subject?.includes('과학')
  );

  if (logicSubjects.length > 0) {
    const avg = logicSubjects.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / logicSubjects.length;
    return clamp(avg);
  }

  // 일반 점수라도 있으면
  if (scores.length > 0) {
    const avg = scores.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / scores.length;
    return clamp(avg * 0.8);  // 일반 점수는 80%만 반영
  }

  // 학년별 발달 기대치 (Layer 2 mini)
  if (grade) {
    if (grade <= 2) return 45;
    if (grade <= 4) return 55;
    if (grade <= 6) return 65;
    if (grade <= 9) return 75;
    return 70;
  }

  return 55;
}

// ============================================================
// 5. 에너지 (energy)
// 신호: 출결 패턴 + 반 분위기 + "처짐/피곤" 이모지 (반비례)
// ============================================================
export function calcEnergy(inputs: WeekInputs): number {
  const { attendance, feedback, classMood } = inputs;

  if (attendance.length === 0 && classMood.length === 0) return 60;

  // 출석 안정성 (결석 많으면 에너지 ↓)
  const total = attendance.length;
  const absent = attendance.filter(a => a.status === 'absent').length;
  const attendanceStability = total > 0 ? ratio(total - absent, total) : 70;

  // 반 분위기 평균
  const moodScores: Record<string, number> = {
    energetic: 90,
    good: 80,
    normal: 60,
    sensitive: 40,
    tired: 30,
  };
  const moodAvg = classMood.length > 0
    ? classMood.reduce((s, m) => s + (moodScores[m.mood] || 60), 0) / classMood.length
    : 60;

  // 개별 피드백: tired/hard 비율
  const tiredCount = feedback.filter(f => f.mood === 'tired' || f.mood === 'hard').length;
  const tiredPenalty = feedback.length > 0 ? ratio(tiredCount, feedback.length) : 0;

  // 가중: 출석안정 40% + 반분위기 40% - 처짐 20%
  const score = attendanceStability * 0.4 + moodAvg * 0.4 - tiredPenalty * 0.2;

  return clamp(score);
}

// ============================================================
// 통합 계산
// ============================================================
export function calculateFiveAxis(inputs: WeekInputs, grade?: number): FiveAxisStats {
  return {
    focus: Math.round(calcFocus(inputs)),
    growthMind: Math.round(calcGrowthMind(inputs)),
    comprehension: Math.round(calcComprehension(inputs)),
    logic: Math.round(calcLogic(inputs, grade)),
    energy: Math.round(calcEnergy(inputs)),
  };
}

// ============================================================
// 트렌드 계산 (과목별, 점수가 있을 때만)
// ============================================================
export interface SubjectTrend {
  subject: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export function calculateTrends(
  thisWeek: ScoreRecord[],
  prevWeek: ScoreRecord[]
): SubjectTrend[] {
  if (thisWeek.length === 0) return [];

  // 과목별 그룹
  const subjects = new Set<string>();
  thisWeek.forEach(s => s.subject && subjects.add(s.subject));

  const trends: SubjectTrend[] = [];

  subjects.forEach(subject => {
    const thisAvg = avgForSubject(thisWeek, subject);
    const prevAvg = avgForSubject(prevWeek, subject);

    if (thisAvg === null) return;

    if (prevAvg === null) {
      trends.push({ subject, trend: 'stable', changePercent: 0 });
      return;
    }

    const change = Math.round(((thisAvg - prevAvg) / prevAvg) * 100);
    let trend: 'up' | 'down' | 'stable';
    if (change >= 3) trend = 'up';
    else if (change <= -3) trend = 'down';
    else trend = 'stable';

    trends.push({ subject, trend, changePercent: change });
  });

  return trends;
}

function avgForSubject(records: ScoreRecord[], subject: string): number | null {
  const filtered = records.filter(r => r.subject === subject);
  if (filtered.length === 0) return null;
  const sum = filtered.reduce((s, r) => s + (r.score / r.maxScore) * 100, 0);
  return sum / filtered.length;
}

// ============================================================
// 해시태그 - 일단 단순한 규칙 (Step 3에서 AI화)
// ============================================================
export function generateHashtags(stats: FiveAxisStats, inputs: WeekInputs): string[] {
  const tags: string[] = [];

  if (stats.focus >= 80) tags.push('#집중력최상');
  else if (stats.focus >= 65) tags.push('#꾸준한집중');
  else if (stats.focus < 50) tags.push('#집중필요');

  if (stats.growthMind >= 75) tags.push('#성장중');
  else if (stats.growthMind >= 60) tags.push('#끈기있는태도');

  if (stats.comprehension >= 80) tags.push('#이해력좋음');
  else if (stats.comprehension < 50) tags.push('#복습필요');

  if (stats.logic >= 75) tags.push('#논리력성장중');

  if (stats.energy >= 75) tags.push('#활기충만');
  else if (stats.energy < 45) tags.push('#휴식필요');
  else if (stats.energy < 55) tags.push('#피로누적');

  // 출결 기반
  if (inputs.attendance.length > 0) {
    const absentRate = inputs.attendance.filter(a => a.status === 'absent').length / inputs.attendance.length;
    if (absentRate > 0.3) tags.push('#출석불안정');
  }

  // 숙제 기반
  if (inputs.homework.length > 0) {
    const completedRate = inputs.homework.filter(h => h.completed).length / inputs.homework.length;
    if (completedRate >= 0.9) tags.push('#숙제마스터');
  }

  // 4-5개로 제한
  return tags.slice(0, 5);
}

// ============================================================
// 부모 액션 카드 - 단순 규칙 (Step 3에서 AI화)
// ============================================================
export function suggestParentActions(stats: FiveAxisStats): string[] {
  const actions: string[] = [];

  if (stats.energy < 50) actions.push('rest', 'food', 'touch');
  else if (stats.energy < 65) actions.push('rest', 'talk');

  if (stats.growthMind >= 70) actions.push('praise', 'recognize');
  else actions.push('cheer', 'trust');

  if (stats.focus < 55) actions.push('listen', 'wait');

  if (stats.comprehension < 55) actions.push('talk', 'play');

  // 중복 제거 + 4개로 제한
  return [...new Set(actions)].slice(0, 4);
}

// ============================================================
// 시즌 인사이트 - 일단 단순 (Step 3에서 점집 효과 본격 적용)
// ============================================================
export function generateSeasonInsight(stats: FiveAxisStats, childName: string): string {
  const avg = (stats.focus + stats.growthMind + stats.comprehension + stats.logic + stats.energy) / 5;

  if (avg >= 75) {
    return `${childName}는 이번 주 전반적으로 좋은 흐름을 보이고 있어요. 특히 집중력과 성장 의지가 인상적이에요 ✨`;
  }
  if (avg >= 60) {
    if (stats.energy < 55) return `${childName}는 평소처럼 꾸준히 노력하고 있어요. 에너지가 살짝 부족해 보이는데, 충분한 휴식이 도움이 될 거예요 🌱`;
    return `${childName}는 이번 주 안정적으로 학습하고 있어요. 작은 발전들이 쌓여가는 시기예요 🌿`;
  }
  if (stats.energy < 50) {
    return `${childName}가 이번 주 조금 지쳐 보여요. 푹 쉬고 따뜻한 시간을 보내주세요. 다시 일어설 힘이 충분해요 💛`;
  }
  return `${childName}는 지금 자신의 페이스를 찾아가는 중이에요. 천천히 기다려주시면 분명 좋은 모습 보여줄 거예요 🌱`;
}
