import type { TrendDirection } from '../../data/types';
import { getTrendColor, getTrendArrow } from '../../utils/statUtils';

interface TrendPillProps {
  trend: TrendDirection;
  changePercent: number;
}

export default function TrendPill({ trend, changePercent }: TrendPillProps) {
  const colorClass = getTrendColor(trend);
  const arrow = getTrendArrow(trend);
  const displayPercent = trend === 'stable' ? '0' : Math.abs(changePercent);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      <span>{arrow}</span>
      <span>{displayPercent}%</span>
    </span>
  );
}
