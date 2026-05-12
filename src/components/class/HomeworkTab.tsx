import { useState } from 'react';
import { Star } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { getGradeLabel } from '../../utils/dateUtils';
import Card from '../ui/Card';
import Toast from '../ui/Toast';

interface Props {
  classId: string;
}

function makeKey(classId: string, studentId: string): string {
  return `${classId}__${studentId}`;
}

export default function HomeworkTab({ classId }: Props) {
  const { getStudentsInClass, getSubjectByClass, homework, updateHomework, getClassHomeworkCount } = useData();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const students = getStudentsInClass(classId);
  const subject = getSubjectByClass(classId);
  const count = getClassHomeworkCount(classId);

  const completed = students.filter(s => homework[makeKey(classId, s.id)]?.completed).length;

  const handleSelect = (studentId: string, quality: 'low' | 'medium' | 'high' | null) => {
    if (quality === null) {
      updateHomework(classId, studentId, false, null);
    } else {
      updateHomework(classId, studentId, true, quality);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          과목: <span className="font-semibold text-gray-900">{subject?.name || '-'}</span>
        </div>
        <span className="text-sm text-gray-500">
          제출 {completed}/{count.total} · 입력 {count.completed}/{count.total}
        </span>
      </div>

      <div className="space-y-3">
        {students.map(student => {
          const key = makeKey(classId, student.id);
          const hw = homework[key];
          const currentQuality = hw?.completed ? hw.quality : null;
          const isInputted = hw !== undefined;

          return (
            <Card key={student.id} padding="sm">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-10 h-10 rounded-full bg-gray-100"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-500">{getGradeLabel(student.grade)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleSelect(student.id, null)}
                    className={`px-3 py-2.5 rounded-lg font-medium text-sm transition-all border-2 ${
                      isInputted && !hw?.completed
                        ? 'bg-gray-600 text-white border-gray-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    미완료
                  </button>

                  <button
                    onClick={() => handleSelect(student.id, 'low')}
                    className={`px-3 py-2.5 rounded-lg font-medium text-sm transition-all border-2 flex items-center justify-center gap-1 ${
                      currentQuality === 'low'
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-orange-500 border-orange-200 hover:bg-orange-50'
                    }`}
                  >
                    <Star size={14} fill="currentColor" />
                    하
                  </button>

                  <button
                    onClick={() => handleSelect(student.id, 'medium')}
                    className={`px-3 py-2.5 rounded-lg font-medium text-sm transition-all border-2 flex items-center justify-center gap-1 ${
                      currentQuality === 'medium'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-blue-500 border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    중
                  </button>

                  <button
                    onClick={() => handleSelect(student.id, 'high')}
                    className={`px-3 py-2.5 rounded-lg font-medium text-sm transition-all border-2 flex items-center justify-center gap-1 ${
                      currentQuality === 'high'
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-green-500 border-green-200 hover:bg-green-50'
                    }`}
                  >
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    상
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
