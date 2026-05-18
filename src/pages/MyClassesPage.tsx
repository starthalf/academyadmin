import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { formatKoreanDate, formatScheduleSlots, earliestSlotTime } from '../utils/dateUtils';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import ClassCard from '../components/class/ClassCard';
import DateNavigator from '../components/ui/DateNavigator';

export default function MyClassesPage() {
  const { teacher, academy, isOwner } = useAuth();
  const { selectedDate, getClassesByDate, getMyClasses } = useData();

  // selectedDate를 Date 객체로
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');

  const todaysClasses = getClassesByDate(selectedDate);
  const allMyClasses = getMyClasses();

  // 선택된 날에 수업이 없는 반들 (참고용)
  const otherClasses = allMyClasses.filter(
    c => !todaysClasses.some(tc => tc.id === c.id)
  );

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

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">
            수업 {todaysClasses.length > 0 && <span className="text-blue-500">({todaysClasses.length})</span>}
          </h2>
          {todaysClasses.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-4">이 날엔 수업이 없어요</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {todaysClasses
                .sort((a, b) => earliestSlotTime(a.scheduleSlots).localeCompare(earliestSlotTime(b.scheduleSlots)))
                .map(c => (
                  <ClassCard key={c.id} classData={c} />
                ))}
            </div>
          )}
        </section>

        {otherClasses.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3 mt-6">
              다른 반 ({otherClasses.length})
            </h2>
            <div className="space-y-2">
              {otherClasses.map(c => (
                <div
                  key={c.id}
                  className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatScheduleSlots(c.scheduleSlots)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}