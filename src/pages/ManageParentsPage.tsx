import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, UserX, MessageCircle, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabase';
import { mapStudent } from '../lib/mappers';
import { getGradeLabel } from '../utils/dateUtils';
import type { ParentRelationship, Student } from '../types';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';

const PARENT_APP_URL = 'https://parents-insight-dash-a1lo.bolt.host';

const RELATIONSHIPS: { value: ParentRelationship; label: string }[] = [
  { value: 'mother', label: '엄마' },
  { value: 'father', label: '아빠' },
  { value: 'guardian', label: '보호자' },
];

export default function ManageParentsPage() {
  const navigate = useNavigate();
  const { isOwner, academy } = useAuth();
  const { createParentInvite, listParentInvites, revokeParentInvite, listAcademyParents, removeParentStudent } = useAdmin();

  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<'parents' | 'invites'>('parents');
  const [parentLinks, setParentLinks] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [relationship, setRelationship] = useState<ParentRelationship>('guardian');
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
    const [sRes, ps, iv] = await Promise.all([
      supabase.from('students').select('*').eq('academy_id', academy.id).order('grade').order('name'),
      listAcademyParents(),
      listParentInvites(),
    ]);
    setStudents((sRes.data || []).map(mapStudent));
    setParentLinks(ps);
    setInvites(iv.filter((i: any) => i.status === 'pending'));
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    const { error, token } = await createParentInvite({ studentId, relationship });
    if (error) {
      setToast({ message: error, type: 'error' });
      return;
    }
    const link = `${PARENT_APP_URL}/invite/${token}`;
    setGeneratedLink(link);
    await load();
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('이 초대를 취소할까요?')) return;
    await revokeParentInvite(id);
    setToast({ message: '초대 취소됨', type: 'success' });
    await load();
  };

  const handleRemoveParent = async (parentStudentId: string, parentName: string, studentName: string) => {
    if (!confirm(`${parentName} 부모님의 ${studentName} 자녀 연결을 해제할까요? 부모는 더 이상 이 자녀 정보를 볼 수 없습니다.`)) return;
    const { error } = await removeParentStudent(parentStudentId);
    if (error) setToast({ message: error, type: 'error' });
    else {
      setToast({ message: '연결 해제됨', type: 'success' });
      await load();
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setToast({ message: '링크 복사됨 - 카톡/문자로 부모님께 전달하세요', type: 'success' });
  };

  const shareLink = (link: string, studentName: string) => {
    const text = `${studentName} 학부모님께,\n\n학원 부모용 앱에 가입해주세요:\n${link}\n\n링크를 클릭하면 간편하게 가입됩니다.`;
    if (navigator.share) {
      navigator.share({ title: '학원 부모용 앱 초대', text }).catch(() => copyLink(link));
    } else {
      copyLink(link);
    }
  };

  if (!isOwner) return null;

  return (
    <div className="pb-4">
      <Header title="부모 관리" showBack />

      <div className="px-4 py-4 space-y-4">
        <Button onClick={() => setShowInviteForm(!showInviteForm)} className="w-full">
          + 부모 초대 링크 만들기
        </Button>

        {showInviteForm && (
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">부모 초대</h3>
            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">자녀 선택</label>
                <select value={studentId} onChange={e => setStudentId(e.target.value)} required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 outline-none">
                  <option value="">학생 선택...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({getGradeLabel(s.grade)})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">관계</label>
                <div className="flex gap-2">
                  {RELATIONSHIPS.map(r => (
                    <button key={r.value} type="button" onClick={() => setRelationship(r.value)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium ${relationship === r.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" size="sm" className="w-full">초대 링크 생성</Button>
            </form>

            {generatedLink && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-700 mb-2 font-medium">초대 링크</p>
                <div className="flex items-center gap-2 mb-2">
                  <input readOnly value={generatedLink}
                    className="flex-1 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyLink(generatedLink)}
                    className="flex-1 py-2 bg-white border border-blue-300 text-blue-600 rounded text-xs font-medium flex items-center justify-center gap-1">
                    <Copy size={12} />
                    복사
                  </button>
                  <button onClick={() => shareLink(generatedLink, students.find(s => s.id === studentId)?.name || '')}
                    className="flex-1 py-2 bg-blue-500 text-white rounded text-xs font-medium flex items-center justify-center gap-1">
                    <Share2 size={12} />
                    공유
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">14일 동안 유효합니다</p>
              </div>
            )}
          </Card>
        )}

        <div className="flex gap-2 bg-white p-1 rounded-lg">
          <button onClick={() => setActiveTab('parents')}
            className={`flex-1 py-2 rounded-md text-sm font-medium ${activeTab === 'parents' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}>
            연결된 부모 ({parentLinks.length})
          </button>
          <button onClick={() => setActiveTab('invites')}
            className={`flex-1 py-2 rounded-md text-sm font-medium ${activeTab === 'invites' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}>
            대기 중 ({invites.length})
          </button>
        </div>

        {activeTab === 'parents' && (
          <div className="space-y-2">
            {parentLinks.length === 0 ? (
              <Card><p className="text-center text-gray-500 py-4 text-sm">아직 연결된 부모가 없어요</p></Card>
            ) : (
              parentLinks.map((ps: any) => (
                <Card key={ps.id} padding="sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{ps.parents?.name || '부모'}</p>
                      <p className="text-xs text-gray-500">
                        {ps.students?.name} ({getGradeLabel(ps.students?.grade || 0)}) ·{' '}
                        {RELATIONSHIPS.find(r => r.value === ps.relationship)?.label}
                      </p>
                      {ps.parents?.email && <p className="text-xs text-gray-400 mt-0.5">{ps.parents.email}</p>}
                    </div>
                    <button onClick={() => handleRemoveParent(ps.id, ps.parents?.name || '부모', ps.students?.name || '')}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                      <UserX size={14} />
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'invites' && (
          <div className="space-y-2">
            {invites.length === 0 ? (
              <Card><p className="text-center text-gray-500 py-4 text-sm">대기 중인 초대가 없어요</p></Card>
            ) : (
              invites.map((inv: any) => {
                const link = `${PARENT_APP_URL}/invite/${inv.token}`;
                const studentName = inv.students?.name || '';
                return (
                  <Card key={inv.id} padding="sm">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{studentName}</p>
                        <p className="text-xs text-gray-500">
                          {RELATIONSHIPS.find(r => r.value === inv.relationship)?.label} ·{' '}
                          {new Date(inv.expires_at).toLocaleDateString('ko-KR')}까지 유효
                        </p>
                      </div>
                      <button onClick={() => handleRevoke(inv.id)}
                        className="text-xs text-red-500 hover:text-red-700">
                        취소
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => copyLink(link)}
                        className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium flex items-center justify-center gap-1">
                        <Copy size={11} /> 복사
                      </button>
                      <button onClick={() => shareLink(link, studentName)}
                        className="flex-1 py-1.5 bg-blue-500 text-white rounded text-xs font-medium flex items-center justify-center gap-1">
                        <MessageCircle size={11} /> 카톡/문자 공유
                      </button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}