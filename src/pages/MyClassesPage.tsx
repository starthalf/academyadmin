import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { formatScheduleDays, getToday } from '../utils/dateUtils';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import ClassCard from '../components/class/ClassCard';

// 요일 숫자 → 문자열 (Date.getDay(): 0=일, 1=월, ..., 6=토)
const DOW_STRINGS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// 요일 정렬 순서: 월요일을 1번으로
const DOW_ORDER: Record<string, number> = {
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7,
};

// "YYYY-MM-DD" → Date (로컬)
function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Date → "YYYY-MM-DD"
function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatViewDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${month}월 ${day}일 (${dayOfWeek})`;
}

export default function MyClassesPage() {
  const { teacher, academy, isOwner } = useAuth();
  const { getMyClasses, selectedDate, setSelectedDate } = useData();

  const todayStr = getToday();
  const isToday = selectedDate === todayStr;
  const viewDate = useMemo(() => parseDate(selectedDate), [selectedDate]);

  const goToPreviousDay = () => {
    const d = parseDate(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDateStr(d));
  };

  const goToNextDay = () => {
    const d = parseDate(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDateStr(d));
  };

  const goToToday = () => setSelectedDate(todayStr);

  const allMyClasses = getMyClasses();
  const dowStr = DOW_STRINGS[viewDate.getDay()]; // 'tue', 'thu' 같은 문자열

  // 선택한 날짜의 수업 (문자열로 비교)
  const viewDateClasses = useMemo(() => {
    return allMyClasses
      .filter(c => (c.scheduleDays as unknown as string[]).includes(dowStr))
      .sort((a, b) => a.scheduleTime.localeCompare(b.scheduleTime));
  }, [allMyClasses, dowStr]);

  // 내 수업 전체 - 요일/시간순 정렬
  const sortedAllClasses = useMemo(() => {
    return [...allMyClasses].sort((a, b) => {
      const aDays = c_days(a);
      const bDays = c_days(b);
      const aFirstDay = Math.min(...aDays.map(d => DOW_ORDER[d] ?? 99));
      const bFirstDay = Math.min(...bDays.map(d => DOW_ORDER[d] ?? 99));
      if (aFirstDay !== bFirstDay) return aFirstDay - bFirstDay;
      return a.scheduleTime.localeCompare(b.scheduleTime);
    });
  }, [allMyClasses]);

  const viewDateLabel = formatViewDate(viewDate);
  const sectionLabel = isToday ? '오늘' : viewDateLabel.split(' (')[0];

  return (
    <div className="pb-4">
      <Header
        title={academy?.name || '학원'}
        rightContent={
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
            {isOwner ? '원장' : teacher?.name}
          </span>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* 날짜 네비게이션 */}
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm px-2 py-2">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="이전 날짜"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>

          <button
            onClick={goToToday}
            className="flex-1 text-center"
            disabled={isToday}
          >
            <p className="text-sm font-semibold text-gray-900">{viewDateLabel}</p>
            {!isToday && (
              <p className="text-xs text-blue-500 mt-0.5">오늘로 이동</p>
            )}
          </button>

          <button
            onClick={goToNextDay}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="다음 날짜"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* 선택한 날짜의 수업 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">
            {sectionLabel}의 수업{' '}
            {viewDateClasses.length > 0 && (
              <span className="text-blue-500">({viewDateClasses.length})</span>
            )}
          </h2>

          {viewDateClasses.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-4">
                {isToday ? '오늘은 수업이 없어요' : '이날은 수업이 없어요'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {viewDateClasses.map(c => (
                <ClassCard key={c.id} classData={c} />
              ))}
            </div>
          )}
        </section>

        {/* 내 수업 전체 */}
        {sortedAllClasses.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3 mt-6">
              내 수업 전체 ({sortedAllClasses.length})
            </h2>
            <div className="space-y-2">
              {sortedAllClasses.map(c => {
                const days = c_days(c);
                const isOnViewDate = days.includes(dowStr);
                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800">{c.name}</p>
                        {isOnViewDate && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium shrink-0">
                            {isToday ? '오늘' : '이날'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatScheduleDays(c.scheduleDays)} · {c.scheduleTime}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// scheduleDays를 string[]로 안전하게 캐스팅
// (타입 정의는 ScheduleDay지만 DB에서 'mon','tue' 문자열로 옴)
function c_days(c: { scheduleDays: unknown }): string[] {
  return c.scheduleDays as string[];
}