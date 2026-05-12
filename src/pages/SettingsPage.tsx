import { LogOut, ChevronRight, Users, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function SettingsPage() {
  const { teacher, academy, isOwner, allTeachers, logout, switchTeacher } = useAuth();
  const { getMyClasses } = useData();
  const navigate = useNavigate();

  const myClasses = getMyClasses();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="pb-4">
      <Header title="설정" />

      <div className="px-4 py-4 space-y-4">
        <Card>
          <h3 className="font-semibold text-gray-800 mb-3">선생님 정보</h3>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">이름</span>
              <span className="font-medium text-gray-900">{teacher?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">역할</span>
              <span className="font-medium text-gray-900">
                {isOwner ? '원장' : '선생님'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">학원</span>
              <span className="font-medium text-gray-900">{academy?.name}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">이메일</span>
              <span className="font-medium text-gray-900 text-sm">{teacher?.email}</span>
            </div>
          </div>
        </Card>

        <Card>
          <button
            onClick={() => navigate('/classes/manage')}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <BookOpen size={18} className="text-blue-500" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">반 관리</p>
                <p className="text-xs text-gray-500">{myClasses.length}개 반</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        </Card>

        {/* 테스트용: 선생님 전환 */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            테스트: 선생님 전환
          </h3>
          <div className="space-y-2">
            {allTeachers.map(t => (
              <button
                key={t.id}
                onClick={() => switchTeacher(t.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                  teacher?.id === t.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="text-left">
                  <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">
                    {t.role === 'owner' ? '원장' : '선생님'} · {t.email}
                  </p>
                </div>
                {teacher?.id === t.id && (
                  <span className="text-xs text-blue-500 font-medium">현재</span>
                )}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-3">앱 정보</h3>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">버전</span>
              <span className="font-medium text-gray-900">2.1.0 (Supabase)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">데이터 저장</span>
              <span className="font-medium text-gray-900">Supabase</span>
            </div>
          </div>
        </Card>

        <Button
          variant="secondary"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          로그아웃
        </Button>
      </div>
    </div>
  );
}
