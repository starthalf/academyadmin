import type { GrowthTrend } from '../../data/types';
import TrendPill from './TrendPill';

interface TrendCardProps {
  trends: GrowthTrend[];
}

export default function TrendCard({ trends }: TrendCardProps) {
  const upTrends = trends.filter((t) => t.trend === 'up');
  const downTrends = trends.filter((t) => t.trend === 'down');

  return (
    <div className="flex flex-col gap-3 w-full">
      {upTrends.length > 0 && (
        // [수정] Grid 레이아웃으로 라벨과 태그 영역 분리 (줄바꿈 시에도 정렬 유지)
        <div className="grid grid-cols-[32px_1fr] gap-2 items-start">
          <span className="text-sm text-gray-600 py-1.5">상승</span>
          <div className="flex flex-wrap gap-2">
            {upTrends.map((trend) => (
              <div
                key={trend.subject}
                className="flex items-center gap-1.5 bg-emerald-50 rounded-lg px-2.5 py-1 border border-emerald-100/50"
              >
                <span className="text-sm font-medium text-emerald-700">
                  {trend.subject}
                </span>
                <TrendPill trend={trend.trend} changePercent={trend.changePercent} />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {downTrends.length > 0 && (
        // [수정] Grid 레이아웃 적용
        <div className="grid grid-cols-[32px_1fr] gap-2 items-start">
          <span className="text-sm text-gray-600 py-1.5">하락</span>
          <div className="flex flex-wrap gap-2">
            {downTrends.map((trend) => (
              <div
                key={trend.subject}
                className="flex items-center gap-1.5 bg-red-50 rounded-lg px-2.5 py-1 border border-red-100/50"
              >
                <span className="text-sm font-medium text-red-600">
                  {trend.subject}
                </span>
                <TrendPill trend={trend.trend} changePercent={trend.changePercent} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}