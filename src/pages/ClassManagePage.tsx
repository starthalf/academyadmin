import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, UserPlus, X, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabase';
import { mapTeacher, mapClass, mapEnrollment, mapStudent, mapSubject } from '../lib/mappers';
import { formatScheduleSlots } from '../utils/dateUtils';
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

  const [enrollClassId, setEnrollClassId] = useState<string | null>(null);
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
      // 글로벌(academy_id IS NULL) + 본인 학원 과목
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

  // 요일 토글: 켜면 기본 시간(14:00) 추가, 끄면 제거
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

  // 인라인 과목 추가
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
    setSubjectId(subject.id); // 방금 만든 과목을 자동 선택
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

  const toggleEnroll = async (classId: string, studentId: string, currentlyEnrolled: boolean) => {
    if (currentlyEnrolled) {
      await unenrollStudent(classId, studentId);
    } else {
      await enrollStudent(classId, studentId);
    }
    await loadAll();
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

              {/* 과목: 드롭다운 + 인라인 추가 */}
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

              {/* 요일 선택 */}
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

              {/* 요일별 시간 입력 (선택된 요일에 한해서) */}
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
            const enrolledIds = new Set(enrolledStudents.map(s => s.id));
            const teacher = teachers.find(t => t.id === c.teacherId);
            const subject = subjects.find(s => s.id === c.subjectId);
            const isEnrolling = enrollClassId === c.id;

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
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-600 font-medium">학생 {enrolledStudents.length}명</p>
                    <button
                      onClick={() => setEnrollClassId(isEnrolling ? null : c.id)}
                      className="text-xs text-blue-500 font-medium flex items-center gap-1"
                    >
                      <UserPlus size={12} />
                      {isEnrolling ? '완료' : '학생 배정'}
                    </button>
                  </div>

                  {isEnrolling ? (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {students.map(s => {
                        const enrolled = enrolledIds.has(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleEnroll(c.id, s.id, enrolled)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg ${enrolled ? 'bg-blue-50' : 'bg-gray-50'}`}
                          >
                            <span className="text-sm text-gray-900">{s.name}</span>
                            <span className={`text-xs ${enrolled ? 'text-blue-600' : 'text-gray-400'}`}>
                              {enrolled ? '✓ 배정됨' : '+ 추가'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {enrolledStudents.map(s => (
                        <span key={s.id} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                          {s.name}
                        </span>
                      ))}
                      {enrolledStudents.length === 0 && (
                        <span className="text-xs text-gray-400">배정된 학생 없음</span>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}