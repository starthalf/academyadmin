import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ClipboardCheck, BookOpen, MessageSquare } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { formatScheduleDays } from '../utils/dateUtils';
import Header from '../components/layout/Header';
import AttendanceTab from '../components/class/AttendanceTab';
import HomeworkTab from '../components/class/HomeworkTab';
import FeedbackTab from '../components/class/FeedbackTab';

type TabKey = 'attendance' | 'homework' | 'feedback';

const tabs: { key: TabKey; label: string; icon: typeof ClipboardCheck }[] = [
  { key: 'attendance', label: '출결', icon: ClipboardCheck },
  { key: 'homework', label: '숙제', icon: BookOpen },
  { key: 'feedback', label: '피드백', icon: MessageSquare },
];

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const { getClassById, getStudentsInClass } = useData();
  const [activeTab, setActiveTab] = useState<TabKey>('attendance');

  if (!classId) return <Navigate to="/" replace />;

  const classData = getClassById(classId);
  if (!classData) return <Navigate to="/" replace />;

  const students = getStudentsInClass(classId);

  return (
    <div className="pb-4">
      <Header
        title={classData.name}
        showBack
        rightContent={
          <span className="text-xs text-gray-500">{students.length}명</span>
        }
      />

      <div className="px-4 pt-3 pb-2">
        <p className="text-xs text-gray-500">
          {formatScheduleDays(classData.scheduleDays)} · {classData.scheduleTime}
        </p>
      </div>

      <div className="sticky top-14 z-30 bg-gray-50 px-4 py-2 border-b border-gray-100">
        <div className="flex gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4">
        {activeTab === 'attendance' && <AttendanceTab classId={classId} />}
        {activeTab === 'homework' && <HomeworkTab classId={classId} />}
        {activeTab === 'feedback' && <FeedbackTab classId={classId} />}
      </div>
    </div>
  );
}
