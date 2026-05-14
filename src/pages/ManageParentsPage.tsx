import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Copy, Share2, X, UserPlus, ChevronDown } from 'lucide-react';
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

const RELATIONSHIPS: { value: ParentRelationship; label: string; emoji: string }[] = [
  { value: 'mother', label: '엄마', emoji: '👩' },
  { value: 'father', label: '아빠', emoji: '👨' },
  { value: 'guardian', label: '보호자', emoji: '🧑' },
];

const relLabel = (v: ParentRelationship) => RELATIONSHIPS.find(r => r.value === v)?.label || v;

type Sheet =
  | { kind: 'invite'; student: Student }
  | { kind: 'parent'; parentStudentId: string; parentName: string; studentName: string; relationship: ParentRelationship }
  | { kind: 'pending'; inviteId: string; token: string; studentName: string; relationship: ParentRelationship; expiresAt: string }
  | null;

export default function ManageParentsPage() {
  const navigate = useNavigate();
  const { isOwner, academy } = useAuth();
  const { createParentInvite, listParentInvites, revokeParentInvite, listAcademyParents, removeParentStudent } = useAdmin();

  const [students, setStudents] = useState<Student[]>([]);
  const [parentLinks, setParentLinks] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState<Sheet>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [pickRelationship, setPickRelationship] = useState<ParentRelationship>('mother');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

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
    setParentLinks(ps || []);
    setInvites((iv || []).filter((i: any) => i.status === 'pending'));
  };

  // 학생별 연결 상태 집계
  const statusByStudent = useMemo(() => {
    const map: Record<string, {
      connected: { id: string; parentName: string; relationship: ParentRelationship }[];
      pending: { id: string; token: string; relationship: ParentRelationship; expiresAt: string }[];
    }> = {};
    parentLinks.forEach((ps: any) => {
      const sid = ps.students?.id;
      if (!sid) return;
      if (!map[sid]) map[sid] = { connected: [], pending: [] };
      map[sid].connected.push({
        id: ps.id,
        parentName: ps.parents?.name || '부모',
        relationship: ps.relationship,
      });
    });
    invites.forEach((inv: any) => {
      const sid = inv.students?.id;
      if (!sid) return;
      if (!map[sid]) map[sid] = { connected: [], pending: [] };
      map[sid].pending.push({
        id: inv.id,
        token: inv.token,
        relationship: inv.relationship,
        expiresAt: inv.expires_at,
      });
    });
    return map;
  }, [parentLinks, invites]);

  const totalConnected = parentLinks.length;
  const totalPending = invites.length;

  const filtered = useMemo(() => {
    if (!search) return students;
    return students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [students, search]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, s) => {
      if (!acc[s.grade]) acc[s.grade] = [];
      acc[s.grade].push(s);
      return acc;
    }, {} as Record<number, Student[]>);
  }, [filtered]);

  const sortedGrades = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  const closeSheet = () => {
    setSheet(null);
    setGeneratedLink(null);
    setPickRelationship('mother');
  };

  const handleCreateInvite = async () => {
    if (sheet?.kind !== 'invite') return;
    const { error, token } = await createParentInvite({
      studentId: sheet.student.id,
      relationship: pickRelationship,
    });
    if (error) {
      setToast({ message: error, type: 'error' });
      return;
    }
    setGeneratedLink(`${PARENT_APP_URL}/invite/${token}`);
    await load();
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setToast({ message: '링크 복사됨', type: 'success' });
  };

  const shareLink = (link: string, studentName: string) => {
    const text = `${studentName} 학부모님께,\n\n학원 부모용 앱에 가입해주세요:\n${link}\n\n링크를 클릭하면 간편하게 가입됩니다.`;
    if (navigator.share) {
      navigator.share({ title: '학원 부모용 앱 초대', text }).catch(() => copyLink(link));
    } else {
      copyLink(link);
    }
  };

  const handleRemoveParent = async () => {
    if (sheet?.kind !== 'parent') return;
    if (!confirm(`${sheet.parentName} 부모님의 ${sheet.studentName} 자녀 연결을 해제할까요?`)) return;
    const { error } = await removeParentStudent(sheet.parentStudentId);
    if (error) setToast({ message: error, type: 'error' });
    else {
      setToast({ message: '연결 해제됨', type: 'success' });
      closeSheet();
      await load();
    }
  };

  const handleRevoke = async () => {
    if (sheet?.kind !== 'pending') return;
    if (!confirm('이 초대를 취소할까요?')) return;
    await revokeParentInvite(sheet.inviteId);
    setToast({ message: '초대 취소됨', type: 'success' });
    closeSheet();
    await load();
  };

  if (!isOwner) return null;

  return (
    <div className="pb-4">
      <Header title="부모 관리" showBack />

      <div className="px-4 py-4 space-y-4">
        {/* 요약 */}
        <div className="flex gap-2">
          <div className="flex-1 bg-blue-50 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-600">연결된 부모</p>
            <p className="text-lg font-bold text-blue-700">{totalConnected}</p>
          </div>
          <div className="flex-1 bg-amber-50 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-600">대기 중 초대</p>
            <p className="text-lg font-bold text-amber-700">{totalPending}</p>
          </div>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="학생 검색..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>

        {/* 학년별 학생 리스트 */}
        {sortedGrades.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">
            {search ? '검색 결과가 없습니다' : '등록된 학생이 없습니다'}
          </div>
        ) : (
          sortedGrades.map(grade => {
            const isCollapsed = collapsed[grade];
            return (
              <div key={grade}>
                <button
                  onClick={() => setCollapsed(c => ({ ...c, [grade]: !c[grade] }))}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-500 mb-2 px-1"
                >
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                  />
                  {getGradeLabel(grade)} ({grouped[grade].length}명)
                </button>
                {!isCollapsed && (
                  <div className="space-y-2">
                    {grouped[grade].map(student => {
                      const status = statusByStudent[student.id] || { connected: [], pending: [] };
                      const hasAny = status.connected.length > 0 || status.pending.length > 0;
                      return (
                        <Card key={student.id} padding="sm">
                          <div className="flex items-start gap-3">
                            <img
                              src={student.avatar}
                              alt={student.name}
                              className="w-10 h-10 rounded-full bg-gray-100 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <p className="font-medium text-gray-900 truncate">{student.name}</p>
                                <button
                                  onClick={() => setSheet({ kind: 'invite', student })}
                                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 active:scale-95 transition"
                                >
                                  <UserPlus size={11} />
                                  초대
                                </button>
                              </div>
                              {hasAny ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {status.connected.map(c => (
                                    <button
                                      key={c.id}
                                      onClick={() => setSheet({
                                        kind: 'parent',
                                        parentStudentId: c.id,
                                        parentName: c.parentName,
                                        studentName: student.name,
                                        relationship: c.relationship,
                                      })}
                                      className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full hover:bg-green-200 transition"
                                    >
                                      {relLabel(c.relationship)} ✓
                                    </button>
                                  ))}
                                  {status.pending.map(p => (
                                    <button
                                      key={p.id}
                                      onClick={() => setSheet({
                                        kind: 'pending',
                                        inviteId: p.id,
                                        token: p.token,
                                        studentName: student.name,
                                        relationship: p.relationship,
                                        expiresAt: p.expiresAt,
                                      })}
                                      className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full hover:bg-amber-200 transition"
                                    >
                                      {relLabel(p.relationship)} ⏳
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400">아직 부모 초대 안 함</p>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 액션 시트 */}
      {sheet && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end"
          onClick={closeSheet}
        >
          <div
            className="w-full bg-white rounded-t-2xl p-4 space-y-3 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {sheet.kind === 'invite' && `${sheet.student.name} 부모 초대`}
                {sheet.kind === 'parent' && `${sheet.parentName} (${relLabel(sheet.relationship)})`}
                {sheet.kind === 'pending' && `${sheet.studentName} - ${relLabel(sheet.relationship)} 초대`}
              </h3>
              <button onClick={closeSheet} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* 초대 생성 */}
            {sheet.kind === 'invite' && !generatedLink && (
              <>
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">관계</label>
                  <div className="flex gap-2">
                    {RELATIONSHIPS.map(r => (
                      <button
                        key={r.value}
                        onClick={() => setPickRelationship(r.value)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                          pickRelationship === r.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {r.emoji} {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreateInvite} className="w-full">
                  초대 링크 생성
                </Button>
              </>
            )}

            {/* 초대 생성 완료 */}
            {sheet.kind === 'invite' && generatedLink && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-700 mb-2 font-medium">초대 링크 (14일 유효)</p>
                  <input
                    readOnly
                    value={generatedLink}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyLink(generatedLink)}
                      className="flex-1 py-2 bg-white border border-blue-300 text-blue-600 rounded text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Copy size={12} /> 복사
                    </button>
                    <button
                      onClick={() => shareLink(generatedLink, sheet.student.name)}
                      className="flex-1 py-2 bg-blue-500 text-white rounded text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Share2 size={12} /> 공유
                    </button>
                  </div>
                </div>
                <Button variant="secondary" onClick={closeSheet} className="w-full">
                  닫기
                </Button>
              </div>
            )}

            {/* 연결된 부모 액션 */}
            {sheet.kind === 'parent' && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {sheet.studentName} 학생의 {relLabel(sheet.relationship)}로 연결되어 있습니다.
                </p>
                <button
                  onClick={handleRemoveParent}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                >
                  연결 해제
                </button>
                <Button variant="secondary" onClick={closeSheet} className="w-full">
                  취소
                </Button>
              </div>
            )}

            {/* 대기 중 초대 액션 */}
            {sheet.kind === 'pending' && (() => {
              const link = `${PARENT_APP_URL}/invite/${sheet.token}`;
              return (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    {new Date(sheet.expiresAt).toLocaleDateString('ko-KR')}까지 유효
                  </p>
                  <input
                    readOnly
                    value={link}
                    className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyLink(link)}
                      className="flex-1 py-2.5 bg-white border border-blue-300 text-blue-600 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <Copy size={14} /> 복사
                    </button>
                    <button
                      onClick={() => shareLink(link, sheet.studentName)}
                      className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <Share2 size={14} /> 공유
                    </button>
                  </div>
                  <button
                    onClick={handleRevoke}
                    className="w-full py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                  >
                    초대 취소
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}