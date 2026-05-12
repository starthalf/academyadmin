import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { formatScheduleDays } from '../utils/dateUtils';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import { Users, Clock, Calendar } from 'lucide-react';

export default function ClassManagePage() {
  const { isOwner, teacher } = useAuth();
  const { getMyClasses, getStudentsInClass, getSubjectByClass } = useData();

  const myClasses = getMyClasses();

  return (
    <div className="pb-4">
      <Header
        title="반 관리"
        showBack
        rightContent={
          <span className="text-xs text-gray-500">
            {isOwner ? '전체' : teacher?.name} · {myClasses.length}개
          </span>
        }
      />

      <div className="px-4 py-4 space-y-3">
        {myClasses.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-4">담당 반이 없습니다</p>
          </Card>
        ) : (
          myClasses.map(c => {
            const students = getStudentsInClass(c.id);
            const subject = getSubjectByClass(c.id);
            return (
              <Card key={c.id}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{c.name}</h3>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                        {subject?.name || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users size={14} />
                      {students.length}명
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatScheduleDays(c.scheduleDays)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {c.scheduleTime}
                    </div>
                  </div>

                  {students.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-500 mb-1.5">학생</p>
                      <div className="flex flex-wrap gap-1">
                        {students.map(s => (
                          <span
                            key={s.id}
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}

        <Card>
          <p className="text-xs text-center text-gray-400 py-2">
            반 생성/수정 기능은 Supabase 연동 후 추가될 예정입니다
          </p>
        </Card>
      </div>
    </div>
  );
}
