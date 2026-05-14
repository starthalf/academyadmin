export interface Child {
  id: string;
  name: string;
  grade: string;
  age: number;
  avatar: string;
}

export interface WeeklyStats {
  focus: number;
  growthMind: number;
  comprehension: number;
  logic: number;
  energy: number;
}

export type TrendDirection = 'up' | 'down' | 'stable';

export interface GrowthTrend {
  subject: string;
  trend: TrendDirection;
  changePercent: number;
}

export interface ParentAction {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface Insights {
  hashtags: string[];
  parentActions: string[];
  seasonInsight: string;
}

export interface WeeklyReport {
  weekId: string;
  startDate: string;
  endDate: string;
  stats: WeeklyStats;
  trends: GrowthTrend[];
  insights: Insights;
}
