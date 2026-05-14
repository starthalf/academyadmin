import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useChildData } from '../contexts/ChildDataContext';
import { formatDateRange, formatWeekLabel } from '../utils/dateUtils';
import { calculateAverageStats } from '../utils/statUtils';

export default function HistoryPage() {
  const { allReports, setCurrentWeekIndex } = useChildData();

  const getTrendIcon = (current: number, previous: number | null) => {
    if (previous === null) return <Minus className="w-4 h-4 text-gray-400" />;
    if (current > previous)
      return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (current < previous)
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="py-3">
        <h1 className="text-xl font-bold text-gray-800">학습 기록</h1>
        <p className="text-sm text-gray-500 mt-1">주간 리포트 히스토리</p>
      </header>

      <div className="flex flex-col gap-3">
        {allReports.map((report, index) => {
          const avgScore = calculateAverageStats(report.stats);
          const prevReport = allReports[index + 1];
          const prevAvg = prevReport ? calculateAverageStats(prevReport.stats) : null;

          return (
            <button
              key={report.weekId}
              onClick={() => setCurrentWeekIndex(index)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:border-primary-200 hover:shadow-md transition-all duration-200 animate-slideUp"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {formatWeekLabel(report.weekId)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateRange(report.startDate, report.endDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(avgScore, prevAvg)}
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">{avgScore}점</p>
                    <p className="text-xs text-gray-500">평균</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {report.insights.hashtags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {allReports.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">아직 기록된 리포트가 없습니다</p>
        </div>
      )}
    </div>
  );
}
