import { useState } from 'react';
import { Check, Clock, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { getGradeLabel } from '../../utils/dateUtils';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Toast from '../ui/Toast';

type AttendanceStatus = 'present' | 'late' | 'absent';

interface Props {
  classId: string;
}

function makeKey(classId: string, studentId: string): string {
  return `${classId}__${studentId}`;
}

export default function AttendanceTab({ classId }: Props) {
  const { getStudentsInClass, attendance, updateAttendance, getClassAttendanceCount } = useData();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const students = getStudentsInClass(classId);
  const count = getClassAttendanceCount(classId);
  const completedCount = count.present + count.late + count.absent;

  const handleMarkAllPresent = () => {
    students.forEach(student => {
      const key = makeKey(classId, student.id);
      if (!attendance[key]) {
        updateAttendance(classId, student.id, 'present');
      }
    });
    setToast({ message: '전체 출석 처리되었습니다', type: 'success' });
  };

  const handleMarkAllAbsent = () => {
    students.forEach(student => {
      const key = makeKey(classId, student.id);
      if (!attendance[key]) {
        updateAttendance(classId, student.id, 'absent');
      }
    });
    setToast({ message: '전체 결석 처리되었습니다', type: 'success' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllPresent}>
            전체출석
          </Button>
          <Button variant="secondary" size="sm" onClick={handleMarkAllAbsent}>
            전체결석
          </Button>
        </div>
        <span className="text-sm text-gray-500">
          {completedCount}/{count.total} 완료
        </span>
      </div>

      <div className="space-y-3">
        {students.map(student => {
          const currentStatus = attendance[makeKey(classId, student.id)]?.status;
          return (
            <Card key={student.id} padding="md">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-10 h-10 rounded-full bg-gray-100"
                />
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-500">{getGradeLabel(student.grade)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <StatusButton
                  status="present"
                  selected={currentStatus === 'present'}
                  onClick={() => updateAttendance(classId, student.id, 'present')}
                  icon={<Check size={16} />}
                  label="출석"
                />
                <StatusButton
                  status="late"
                  selected={currentStatus === 'late'}
                  onClick={() => updateAttendance(classId, student.id, 'late')}
                  icon={<Clock size={16} />}
                  label="지각"
                />
                <StatusButton
                  status="absent"
                  selected={currentStatus === 'absent'}
                  onClick={() => updateAttendance(classId, student.id, 'absent')}
                  icon={<X size={16} />}
                  label="결석"
                />
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

function StatusButton({
  status,
  selected,
  onClick,
  icon,
  label,
}: {
  status: AttendanceStatus;
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  const colors = {
    present: selected
      ? 'bg-green-500 text-white border-green-500'
      : 'bg-white text-green-600 border-green-200 hover:bg-green-50',
    late: selected
      ? 'bg-amber-500 text-white border-amber-500'
      : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50',
    absent: selected
      ? 'bg-red-500 text-white border-red-500'
      : 'bg-white text-red-500 border-red-200 hover:bg-red-50',
  };

  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 font-medium text-sm transition-all ${colors[status]}`}
    >
      {icon}
      {label}
    </button>
  );
}
