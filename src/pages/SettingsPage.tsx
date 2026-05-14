import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, HelpCircle, ChevronRight, LogOut, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const menuItems = [
  { icon: Bell, label: '알림 설정', description: '푸시 알림 및 리마인더' },
  { icon: Shield, label: '개인정보 보호', description: '데이터 관리 및 보안' },
  { icon: HelpCircle, label: '도움말', description: 'FAQ 및 문의하기' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { parent, myAcademies, selectedAcademyId, selectAcademy, signOut } = useAuth();

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <header className="py-3">
        <h1 className="text-xl font-bold text-gray-800">설정</h1>
        <p className="text-sm text-gray-500 mt-1">앱 설정 및 프로필 관리</p>
      </header>

      {/* 학원 / 자녀 선택 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-medium text-gray-500 mb-3">
          연결된 학원 ({myAcademies.length})
        </h2>
        {myAcademies.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">연결된 학원이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {myAcademies.map((a) => (
              <button
                key={a.parentStudentId}
                onClick={() => selectAcademy(a.academyId)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  a.academyId === selectedAcademyId
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <img
                  src={a.studentAvatar || `https://api.dicebear.com/7.x/thumbs/svg?seed=${a.studentId}`}
                  alt={a.studentName}
                  className="w-12 h-12 rounded-full bg-gray-100 ring-2 ring-offset-2 ring-primary-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{a.studentName}</p>
                  <p className="text-xs text-gray-500 truncate">{a.academyName}</p>
                </div>
                {a.academyId === selectedAcademyId && (
                  <Check className="w-5 h-5 text-primary-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 계정 + 메뉴 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 truncate">{parent?.name || '학부모'}</p>
            <p className="text-sm text-gray-500 truncate">{parent?.email}</p>
          </div>
        </div>

        {menuItems.map((item, index) => (
          <button
            key={item.label}
            className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
              index < menuItems.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <item.icon className="w-4 h-4 text-gray-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">로그아웃</span>
      </button>

      <p className="text-center text-xs text-gray-400 mt-4">
        학부모 앱 v1.0.0
      </p>
    </div>
  );
}
