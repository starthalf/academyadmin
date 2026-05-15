import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  formatScheduleSlots,
  earliestSlotTime,
  getToday,
  dateStringToDayOfWeek,
} from '../utils/dateUtils';
import type { ScheduleSlot, ScheduleDay } from '../types';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import DateNavigator from '../components/ui/DateNavigator';
import ClassCard from '../components/class/ClassCard';

const DAY_ORDER: ScheduleDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// 반의 정렬 키: (가장 이른 요일 index, 그 요일의 시간)
function classSortKey(slots: ScheduleSlot[]): string {
  if (!slots || slots.length === 0) return '9_99:99';
  const sorted = [...slots].sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return a.time.localeCompare(b.time);
  });
  const first = sorted[0];
  return `${DAY_ORDER.indexOf(first.day)}_${first.time}`;
}

export default function MyClassesPage() {
  const { teacher, academy, isOwner } = useAuth();
  const { getTodaysClasses, getMyClasses, selectedDate } = useData();

  const isToday = selectedDate === getToday();
  const dateClasses = getTodaysClasses();
  const allMyClasses = getMyClasses();
  const selectedDayOfWeek = dateStringToDayOfWeek(selectedDate);

  // 위쪽: 그 날짜의 수업 (시간순)
  const sortedDateClasses = [...dateClasses].sort((a, b) =>
    earliestSlotTime(a.scheduleSlots).localeCompare(earliestSlotTime(b.scheduleSlots))
  );

  // 아래쪽: 내 수업 전체 (요일/시간순)
  const sortedAllClasses = [...allMyClasses].sort((a, b) =>
    classSortKey(a.scheduleSlots).localeCompare(classSortKey(b.scheduleSlots))
  );

  // 상단 라벨: "오늘의 수업" / "내일의 수업" / "{날짜}의 수업"
  const sectionLabel = (() => {
    const d = new Date(selectedDate + 'T00:00:00');
    const month = d.getMonth() + 1;
    const day = d.getDate();
    if (isToday) return '오늘의 수업';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 1) return '내일의 수업';
    if (diff === -1) return '어제의 수업';
    return `${month}월 ${day}일의 수업`;
  })();

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
        <DateNavigator />

        {/* 그 날짜의 수업 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">
            {sectionLabel}
            {sortedDateClasses.length > 0 && (
              <span className="text-blue-500"> ({sortedDateClasses.length})</span>
            )}
          </h2>

          {sortedDateClasses.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-4">
                이날은 수업이 없어요
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedDateClasses.map(c => (
                <ClassCard key={c.id} classData={c} />
              ))}
            </div>
          )}
        </section>

        {/* 내 수업 전체 — 항상 모든 내 반 (오늘 수업 포함) */}
        {sortedAllClasses.length > 0 && (
          <section className="pt-2">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">
              내 수업 전체 ({sortedAllClasses.length})
            </h2>
            <div className="space-y-2">
              {sortedAllClasses.map(c => {
                const isOnSelectedDate = c.scheduleSlots.some(s => s.day === selectedDayOfWeek);
                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 truncate">{c.name}</p>
                        {isOnSelectedDate && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium shrink-0">
                            {isToday ? '오늘' : '이날'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatScheduleSlots(c.scheduleSlots)}
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