import type { WeeklyStats, TrendDirection } from '../data/types';

export function getStatLabel(key: keyof WeeklyStats): string {
  const labels: Record<keyof WeeklyStats, string> = {
    focus: '집중력',
    growthMind: '성장마인드',
    comprehension: '이해력',
    logic: '논리력',
    energy: '에너지',
  };
  return labels[key];
}

export function getStatColor(value: number): string {
  if (value >= 85) return 'text-emerald-600';
  if (value >= 70) return 'text-primary-600';
  if (value >= 50) return 'text-amber-600';
  return 'text-red-500';
}

export function getTrendColor(trend: TrendDirection): string {
  switch (trend) {
    case 'up':
      return 'text-emerald-600 bg-emerald-50';
    case 'down':
      return 'text-red-500 bg-red-50';
    case 'stable':
      return 'text-gray-500 bg-gray-100';
  }
}

export function getTrendArrow(trend: TrendDirection): string {
  switch (trend) {
    case 'up':
      return '↗';
    case 'down':
      return '↘';
    case 'stable':
      return '→';
  }
}

export function calculateAverageStats(stats: WeeklyStats): number {
  const values = Object.values(stats);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function getStatsForRadarChart(stats: WeeklyStats) {
  return [
    { subject: '집중력', value: stats.focus, fullMark: 100 },
    { subject: '성장마인드', value: stats.growthMind, fullMark: 100 },
    { subject: '이해력', value: stats.comprehension, fullMark: 100 },
    { subject: '논리력', value: stats.logic, fullMark: 100 },
    { subject: '에너지', value: stats.energy, fullMark: 100 },
  ];
}
