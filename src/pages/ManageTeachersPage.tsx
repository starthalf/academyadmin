import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Copy, Trash2, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabase';
import { mapTeacher } from '../lib/mappers';
import type { Teacher } from '../types';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toast from '../components/ui/Toast';

export default function ManageTeachersPage() {
  const navigate = useNavigate();
  const { isOwner, teacher: me, academy } = useAuth();
  const { inviteTeacher, deleteTeacher } = useAdmin();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isOwner) {
      navigate('/');
      return;
    }
    load();
  }, [isOwner]);

  const load = async () => {
    if (!academy) return;
    const { data: tData } = await supabase
      .from('teachers')
      .select('*')
      .eq('academy_id', academy.id);
    setTeachers((tData || []).map(mapTeacher));

    const { data: iData } = await supabase
      .from('teacher_invites')
      .select('*')
      .eq('academy_id', academy.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setPendingInvites(iData || []);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error, token } = await inviteTeacher({ email: inviteEmail, name: inviteName });
    if (error) {
      setToast({ message: error, type: 'error' });
      return;
    }
    const link = `${window.location.origin}/teacher-invite/${token}`;
    setGeneratedLink(link);
    setInviteEmail('');
    setInviteName('');
    load();
  };

  const handleDelete = async (teacherId: string, name: string) => {
    if (!confirm(`${name} 선생님을 삭제할까요? 담당 반이 있으면 먼저 다른 선생님으로 변경해야 합니다.`)) return;
    const { error } = await deleteTeacher(teacherId);
    if (error) setToast({ message: error, type: 'error' });
    else {
      setToast({ message: '선생님 삭제됨', type: 'success' });
      load();
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setToast({ message: '링크 복사됨', type: 'success' });
  };

  return (
    <div className="pb-4">
      <Header title="선생님 관리" showBack />

      <div className="px-4 py-4 space-y-4">
        <Button onClick={() => setShowInviteForm(!showInviteForm)} className="w-full flex items-center justify-center gap-2">
          <Plus size={18} />
          선생님 초대
        </Button>

        {showInviteForm && (
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">새 선생님 초대</h3>
            <form onSubmit={handleInvite} className="space-y-3">
              <Input
                type="email"
                placeholder="이메일"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                required
              />
              <Input
                placeholder="이름 (선택)"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
              />
              <Button type="submit" size="sm" className="w-full">초대 링크 생성</Button>
            </form>

            {generatedLink && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-700 mb-2 font-medium">초대 링크 (선생님에게 전달)</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={generatedLink}
                    className="flex-1 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded"
                  />
                  <button
                    onClick={() => copyLink(generatedLink)}
                    className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

        {pendingInvites.length > 0 && (
          <Card>
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
              <Mail size={14} className="text-amber-500" />
              대기 중인 초대 ({pendingInvites.length})
            </h3>
            <div className="space-y-2">
              {pendingInvites.map(inv => {
                const link = `${window.location.origin}/teacher-invite/${inv.token}`;
                return (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.email}</p>
                      <p className="text-xs text-gray-500">{inv.name || '이름 미지정'} · {inv.role === 'owner' ? '원장' : '선생님'}</p>
                    </div>
                    <button
                      onClick={() => copyLink(link)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">선생님 ({teachers.length})</h3>
          <div className="space-y-2">
            {teachers.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">
                    {t.role === 'owner' ? '원장' : '선생님'} · {t.email}
                  </p>
                </div>
                {t.id !== me?.id && t.role !== 'owner' && (
                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
