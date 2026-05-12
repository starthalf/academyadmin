import { ChevronRight, Check, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Class } from '../../types';
import { useData } from '../../contexts/DataContext';

interface ClassCardProps {
  classData: Class;
}

export default function ClassCard({ classData }: ClassCardProps) {
  const navigate = useNavigate();
  const { getStudentsInClass, getClassAttendanceCount, getClassHomeworkCount, getClassMoodCompleted, getClassFeedbackCount } = useData();

  const students = getStudentsInClass(classData.id);
  const attendance = getClassAttendanceCount(classData.id);
  const homework = getClassHomeworkCount(classData.id);
  const moodDone = getClassMoodCompleted(classData.id);
  const feedback = getClassFeedbackCount(classData.id);

  const attendanceDone = attendance.present + attendance.late + attendance.absent === attendance.total && attendance.total > 0;
  const homeworkDone = homework.completed === homework.total && homework.total > 0;
  // 피드백은 반 분위기만 필수 (개별 학생은 선택적)
  const feedbackDone = moodDone;

  return (
    <button
      onClick={() => navigate(`/class/${classData.id}`)}
      className="w-full bg-white rounded-xl shadow-sm p-4 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-gray-400" />
            <span className="text-sm text-gray-500">{classData.scheduleTime}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{classData.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{students.length}명</p>
        </div>
        <ChevronRight size={20} className="text-gray-400 mt-1" />
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <TaskBadge label="출결" done={attendanceDone} count={`${attendance.present + attendance.late + attendance.absent}/${attendance.total}`} />
        <TaskBadge label="숙제" done={homeworkDone} count={`${homework.completed}/${homework.total}`} />
        <TaskBadge label="분위기" done={feedbackDone} compact />
        {feedback.completed > 0 && (
          <span className="ml-auto text-xs text-blue-500 font-medium">
            학생 피드백 {feedback.completed}건
          </span>
        )}
      </div>
    </button>
  );
}

function TaskBadge({ label, done, count, compact }: { label: string; done: boolean; count?: string; compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        done ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
      }`}
    >
      {done ? <Check size={11} /> : <X size={11} />}
      {label}
      {!compact && count && <span className="opacity-70">{count}</span>}
    </span>
  );
}
