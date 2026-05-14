import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, UserPlus, X, Check,
  Search, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabase';
import { mapTeacher, mapClass, mapEnrollment, mapStudent, mapSubject } from '../lib/mappers';
import { formatScheduleSlots, getGradeLabel } from '../utils/dateUtils';
import type { Class, ScheduleDay, ScheduleSlot, Teacher, Student, ClassEnrollment, Subject } from '../types';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toast from '../components/ui/Toast';

const ALL_DAYS: { key: ScheduleDay; label: string }[] = [
  { key: 'mon', label: '월' }, { key: 'tue', label: '화' }, { key: 'wed', label: '수' },
  { key: 'thu', label: '목' }, { key: 'fri', label: '금' }, { key: 'sat', label: '토' }, { key: 'sun', label: '일' },
];

const DAY_ORDER: ScheduleDay[] = ['mon','tue','wed','thu','fri','sat','sun'];

export default function ClassManagePage() {
  const navigate = useNavigate();
  const { isOwner, academy } = useAuth();
  const { createClass, updateClass, deleteClass, enrollStudent, unenrollStudent, createSubject } = useAdmin();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);

  // 폼 상태
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);

  // 인라인 과목 추가
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  // 학생 배정 모달 / 펼치기 상태
  const [enrollModalClassId, setEnrollModalClassId] = useState<string | null>(null);
  const [expandedClassIds, setExpandedClassIds] = useState<Set<string>>(new Set());

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isOwner) {
      navigate('/');
      return;
    }
    loadAll();
  }, [isOwner]);

  const loadAll = async () => {
    if (!academy) return;
    const [tRes, cRes, sRes, subRes, eRes] = await Promise.all([
      supabase.from('teachers').select('*').eq('academy_id', academy.id),
      supabase.from('classes').select('*').eq('academy_id', academy.id),
      supabase.from('students').select('*').eq('academy_id', academy.id).order('grade').order('name'),
      supabase.from('subjects').select('*').or(`academy_id.is.null,academy_id.eq.${academy.id}`).order('name'),
      supabase.from('class_enrollments').select('*'),
    ]);
    setTeachers((tRes.data || []).map(mapTeacher));
    setClasses((cRes.data || []).map(mapClass));
    setStudents((sRes.data || []).map(mapStudent));
    setSubjects((subRes.data || []).map(mapSubject));
    setEnrollments((eRes.data || []).map(mapEnrollment));
  };

  const getStudentsInClass = (classId: string): Student[] => {
    const studentIds = enrollments.filter(e => e.classId === classId).map(e => e.studentId);
    return students.filter(s => studentIds.includes(s.id));
  };

  const toggleExpand = (classId: string) => {
    setExpandedClassIds(prev => {
      const next = new Set(prev);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  };

  const startNew = () => {
    setEditing(null);
    setName('');
    setTeacherId(teachers[0]?.id || '');
    setSubjectId(subjects[0]?.id || '');
    setScheduleSlots([]);
    setShowAddSubject(false);
    setNewSubjectName('');
    setShowForm(true);
  };

  const startEdit = (c: Class) => {
    setEditing(c);
    setName(c.name);
    setTeacherId(c.teacherId);
    setSubjectId(c.subjectId);
    setScheduleSlots([...c.scheduleSlots]);
    setShowAddSubject(false);
    setNewSubjectName('');
    setShowForm(true);
  };

  const toggleDay = (d: ScheduleDay) => {
    setScheduleSlots(prev => {
      const exists = prev.find(s => s.day === d);
      if (exists) {
        return prev.filter(s => s.day !== d);
      } else {
        const newSlot: ScheduleSlot = { day: d, time: '14:00' };
        return [...prev, newSlot].sort(
          (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
        );
      }
    });
  };

  const updateSlotTime = (day: ScheduleDay, time: string) => {
    setScheduleSlots(prev => prev.map(s => s.day === day ? { ...s, time } : s));
  };

  const handleAddSubject = async () => {
    const trimmed = newSubjectName.trim();
    if (!trimmed) {
      setToast({ message: '과목명을 입력하세요', type: 'error' });
      return;
    }
    if (subjects.some(s => s.name === trimmed)) {
      setToast({ message: '이미 있는 과목이에요', type: 'error' });
      return;
    }
    const { error, subject } = await createSubject(trimmed);
    if (error || !subject) {
      setToast({ message: error || '추가 실패', type: 'error' });
      return;
    }
    setSubjects(prev => [...prev, subject].sort((a, b) => a.name.localeCompare(b.name)));
    setSubjectId(subject.id);
    setNewSubjectName('');
    setShowAddSubject(false);
    setToast({ message: `${subject.name} 추가됨`, type: 'success' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scheduleSlots.length === 0) {
      setToast({ message: '요일을 1개 이상 선택하세요', type: 'error' });
      return;
    }
    if (!subjectId) {
      setToast({ message: '과목을 선택하세요', type: 'error' });
      return;
    }

    if (editing) {
      const { error } = await updateClass(editing.id, { name, teacherId, subjectId, scheduleSlots });
      if (error) setToast({ message: error, type: 'error' });
      else {
        setToast({ message: '수정됨', type: 'success' });
        setShowForm(false);
        await loadAll();
      }
    } else {
      const { error } = await createClass({ name, teacherId, subjectId, scheduleSlots });
      if (error) setToast({ message: error, type: 'error' });
      else {
        setToast({ message: '반 생성됨', type: 'success' });
        setShowForm(false);
        await loadAll();
      }
    }
  };

  const handleDelete = async (c: Class) => {
    if (!confirm(`${c.name} 반을 삭제할까요? 관련 데이터도 모두 삭제됩니다.`)) return;
    const { error } = await deleteClass(c.id);
    if (error) setToast({ message: error, type: 'error' });
    else {
      setToast({ message: '삭제됨', type: 'success' });
      await loadAll();
    }
  };

  if (!isOwner) return null;

  return (
    <div className="pb-4">
      <Header title="반 관리" showBack />

      <div className="px-4 py-4 space-y-4">
        <Button onClick={startNew} className="w-full flex items-center justify-center gap-2">
          <Plus size={18} />
          반 생성
        </Button>

        {showForm && (
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">{editing ? '반 수정' : '반 생성'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input placeholder="반 이름 (예: 초4 수학A)" value={name} onChange={e => setName(e.target.value)} required />

              <div>
                <label className="text-xs text-gray-500 mb-1 block">담당 선생님</label>
                <select value={teacherId} onChange={e => setTeacherId(e.target.value)} required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 outline-none">
                  <option value="">선택...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.role === 'owner' ? '원장' : '선생님'})</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-500">과목</label>
                  {!showAddSubject && (
                    <button
                      type="button"
                      onClick={() => setShowAddSubject(true)}
                      className="text-xs text-blue-500 font-medium flex items-center gap-1"
                    >
                      <Plus size={12} />
                      새 과목
                    </button>
                  )}
                </div>

                {showAddSubject ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="과목명 (예: 한자, 코딩)"
                      value={newSubjectName}
                      onChange={e => setNewSubjectName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubject();
                        }
                      }}
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubject}
                      className="px-3 rounded-lg bg-blue-500 text-white"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddSubject(false); setNewSubjectName(''); }}
                      className="px-3 rounded-lg bg-gray-100 text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <select value={subjectId} onChange={e => setSubjectId(e.target.value)} required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 outline-none">
                    <option value="">선택...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">요일</label>
                <div className="flex gap-1">
                  {ALL_DAYS.map(d => {
                    const selected = scheduleSlots.some(s => s.day === d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => toggleDay(d.key)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium ${selected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {scheduleSlots.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">요일별 시간</label>
                  <div className="space-y-2">
                    {scheduleSlots.map(slot => (
                      <div key={slot.day} className="flex items-center gap-2">
                        <span className="w-10 text-center text-sm font-medium text-gray-700">
                          {ALL_DAYS.find(d => d.key === slot.day)?.label}
                        </span>
                        <input
                          type="time"
                          value={slot.time}
                          onChange={e => updateSlotTime(slot.day, e.target.value)}
                          required
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">취소</Button>
                <Button type="submit" className="flex-1">{editing ? '저장' : '생성'}</Button>
              </div>
            </form>
          </Card>
        )}

        <div className="space-y-3">
          {classes.map(c => {
            const enrolledStudents = getStudentsInClass(c.id);
            const teacher = teachers.find(t => t.id === c.teacherId);
            const subject = subjects.find(s => s.id === c.subjectId);
            const isExpanded = expandedClassIds.has(c.id);

            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{c.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {teacher?.name || '-'} · {subject?.name || '-'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatScheduleSlots(c.scheduleSlots)}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => startEdit(c)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(c)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleExpand(c.id)}
                      disabled={enrolledStudents.length === 0}
                      className="flex items-center gap-1 text-xs text-gray-600 font-medium disabled:text-gray-400"
                    >
                      <span>학생 {enrolledStudents.length}명</span>
                      {enrolledStudents.length > 0 && (
                        isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => setEnrollModalClassId(c.id)}
                      className="text-xs text-blue-500 font-medium flex items-center gap-1"
                    >
                      <UserPlus size={12} />
                      학생 배정
                    </button>
                  </div>

                  {isExpanded && enrolledStudents.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {enrolledStudents.map(s => (
                        <span key={s.id} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 학생 배정 풀스크린 모달 */}
      {enrollModalClassId && (
        <EnrollStudentsModal
          classId={enrollModalClassId}
          className={classes.find(c => c.id === enrollModalClassId)?.name || ''}
          allStudents={students}
          initiallyEnrolledIds={new Set(
            enrollments.filter(e => e.classId === enrollModalClassId).map(e => e.studentId)
          )}
          onClose={() => setEnrollModalClassId(null)}
          onSave={async (toAdd, toRemove) => {
            for (const sid of toAdd) await enrollStudent(enrollModalClassId, sid);
            for (const sid of toRemove) await unenrollStudent(enrollModalClassId, sid);
            await loadAll();
            setEnrollModalClassId(null);
            const changes = toAdd.length + toRemove.length;
            setToast({
              message: changes > 0 ? `${changes}건 반영됨` : '변경 없음',
              type: 'success',
            });
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 학생 배정 풀스크린 모달
// ─────────────────────────────────────────────────────────

interface EnrollStudentsModalProps {
  classId: string;
  className: string;
  allStudents: Student[];
  initiallyEnrolledIds: Set<string>;
  onClose: () => void;
  onSave: (toAdd: string[], toRemove: string[]) => Promise<void>;
}

function EnrollStudentsModal({
  className,
  allStudents,
  initiallyEnrolledIds,
  onClose,
  onSave,
}: EnrollStudentsModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initiallyEnrolledIds));
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return allStudents;
    const q = searchQuery.toLowerCase();
    return allStudents.filter(s => s.name.toLowerCase().includes(q));
  }, [allStudents, searchQuery]);

  // 학년별 그룹핑
  const groupedByGrade = useMemo(() => {
    return filteredStudents.reduce((acc, s) => {
      if (!acc[s.grade]) acc[s.grade] = [];
      acc[s.grade].push(s);
      return acc;
    }, {} as Record<number, Student[]>);
  }, [filteredStudents]);

  const sortedGrades = Object.keys(groupedByGrade).map(Number).sort((a, b) => a - b);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 변경분 계산
  const toAdd = useMemo(
    () => [...selectedIds].filter(id => !initiallyEnrolledIds.has(id)),
    [selectedIds, initiallyEnrolledIds]
  );
  const toRemove = useMemo(
    () => [...initiallyEnrolledIds].filter(id => !selectedIds.has(id)),
    [selectedIds, initiallyEnrolledIds]
  );
  const hasChanges = toAdd.length > 0 || toRemove.length > 0;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(toAdd, toRemove);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-gray-600">
          <X size={20} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-gray-900">학생 배정</span>
          <span className="text-xs text-gray-500">{className}</span>
        </div>
        <div className="w-9" />
      </div>

      {/* 검색창 */}
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="학생 검색..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none"
          />
        </div>
      </div>

      {/* 학생 리스트 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {sortedGrades.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-500">
            {searchQuery ? '검색 결과가 없습니다' : '등록된 학생이 없습니다'}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedGrades.map(grade => (
              <div key={grade}>
                <h4 className="text-xs font-semibold text-gray-500 mb-2 px-1">
                  {getGradeLabel(grade)} ({groupedByGrade[grade].length}명)
                </h4>
                <div className="space-y-1.5">
                  {groupedByGrade[grade].map(s => {
                    const selected = selectedIds.has(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleSelect(s.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${
                          selected
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {/* 체크박스 */}
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                            selected ? 'bg-blue-500' : 'bg-white border border-gray-300'
                          }`}
                        >
                          {selected && <Check size={14} className="text-white" />}
                        </div>
                        {/* 아바타 */}
                        {s.avatar ? (
                          <img
                            src={s.avatar}
                            alt={s.name}
                            className="w-9 h-9 rounded-full bg-gray-100 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
                        )}
                        {/* 이름 */}
                        <span className="text-sm font-medium text-gray-900 flex-1 text-left">
                          {s.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 sticky 저장 바 */}
      <div className="border-t border-gray-100 bg-white px-4 py-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">
            선택 {selectedIds.size}명
            {hasChanges && (
              <span className="ml-2 text-blue-600">
                (+{toAdd.length} / -{toRemove.length})
              </span>
            )}
          </span>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="w-full"
        >
          {saving ? '저장 중...' : hasChanges ? '저장' : '변경 없음'}
        </Button>
      </div>
    </div>
  );
}