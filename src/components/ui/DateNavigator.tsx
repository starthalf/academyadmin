import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { addDays, formatKoreanDateString, getToday } from '../../utils/dateUtils';

export default function DateNavigator() {
  const { selectedDate, setSelectedDate } = useData();
  const today = getToday();
  const isToday = selectedDate === today;

  return (
    <div className="flex items-center justify-between bg-white rounded-xl px-2 py-2 shadow-sm">
      <button
        onClick={() => setSelectedDate(addDays(selectedDate, -1))}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        aria-label="이전 날짜"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex flex-col items-center flex-1">
        <span className="text-sm font-semibold text-gray-900">
          {formatKoreanDateString(selectedDate)}
        </span>
        {!isToday && (
          <button
            onClick={() => setSelectedDate(today)}
            className="text-xs text-blue-500 font-medium flex items-center gap-1 mt-0.5"
          >
            <Calendar size={11} />
            오늘로
          </button>
        )}
      </div>

      <button
        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        aria-label="다음 날짜"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}