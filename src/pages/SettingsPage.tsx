import { LogOut, ChevronRight, Users, BookOpen, GraduationCap, Heart, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import { useState } from 'react';

export default function SettingsPage() {
  const { teacher, academy, isOwner, signOut } = useAuth();
  const { getMyClasses } = useData();
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const myClasses = getMyClasses();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const copyCode = () => {
    if (academy?.inviteCode) {
      navigator.clipboard.writeText(academy.inviteCode);
      setToast({ message: '학원 코드 복사됨', type: 'success' });
    }
  };

  return (
    <div className="pb-4">
      <Header title="설정" />

      <div className="px-4 py-4 space-y-4">
        <Card>
          <h3 className="font-semibold text-gray-800 mb-3">선생님 정보</h3>
          <div className="space-y-2">
            <Row label="이름" value={teacher?.name} />
            <Row label="역할" value={isOwner ? '원장' : '선생님'} />
            <Row label="학원" value={academy?.name} />
            <Row label="이메일" value={teacher?.email} last />
          </div>
        </Card>

        {isOwner && academy?.inviteCode && (
          <Card>
            <h3 className="font-semibold text-gray-800 mb-2">학원 코드</h3>
            <div className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg">
              <span className="font-mono text-lg font-bold text-blue-700">{academy.inviteCode}</span>
              <button onClick={copyCode} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded">
                <Copy size={16} />
              </button>
            </div>
          </Card>
        )}

        {isOwner && (
          <Card>
            <h3 className="font-semibold text-gray-800 mb-3">학원 관리</h3>
            <div className="space-y-1">
              <MenuRow
                icon={<GraduationCap size={18} className="text-blue-500" />}
                label="선생님 관리"
                onClick={() => navigate('/manage/teachers')}
              />
              <MenuRow
                icon={<Users size={18} className="text-green-500" />}
                label="학생 관리"
                onClick={() => navigate('/manage/students')}
              />
              <MenuRow
                icon={<BookOpen size={18} className="text-purple-500" />}
                label="반 관리"
                desc={`${myClasses.length}개 반`}
                onClick={() => navigate('/manage/classes')}
              />
              <MenuRow
                icon={<Heart size={18} className="text-pink-500" />}
                label="부모 관리"
                desc="초대 / 연결 관리"
                onClick={() => navigate('/manage/parents')}
              />
            </div>
          </Card>
        )}

        {!isOwner && (
          <Card>
            <h3 className="font-semibold text-gray-800 mb-3">내 반</h3>
            <MenuRow
              icon={<BookOpen size={18} className="text-purple-500" />}
              label="반 목록"
              desc={`${myClasses.length}개 반`}
              onClick={() => navigate('/manage/classes')}
            />
          </Card>
        )}

        <Card>
          <h3 className="font-semibold text-gray-800 mb-3">앱 정보</h3>
          <div className="space-y-2">
            <Row label="버전" value="3.0.0" />
            <Row label="데이터" value="Supabase + Auth" last />
          </div>
        </Card>

        <Button variant="secondary" onClick={handleLogout} className="w-full flex items-center justify-center gap-2">
          <LogOut size={18} />
          로그아웃
        </Button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function Row({ label, value, last }: { label: string; value?: string; last?: boolean }) {
  return (
    <div className={`flex justify-between py-2 ${last ? '' : 'border-b border-gray-100'}`}>
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-sm">{value || '-'}</span>
    </div>
  );
}

function MenuRow({ icon, label, desc, onClick }: { icon: React.ReactNode; label: string; desc?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center">{icon}</div>
        <div className="text-left">
          <p className="font-medium text-gray-900 text-sm">{label}</p>
          {desc && <p className="text-xs text-gray-500">{desc}</p>}
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-400" />
    </button>
  );
}
