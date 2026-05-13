import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';
import { mapTeacher } from '../lib/mappers';
import { formatScheduleDays } from '../utils/dateUtils';
import type { Class, ScheduleDay, Teacher } from '../types';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toast from '../components/ui/Toast';

const ALL_DAYS: { key: ScheduleDay; label: string }[] = [
  { key: 'mon', label: '월' }, { key: 'tue', label: '화' }, { key: 'wed', label: '수' },
  { key: 'thu', label: '목' }, { key: 'fri', label: '금' }, { key: 'sat', label: '토' }, { key: 'sun', label: '일' },
];

export default function ClassManagePage() {
  const navigate = useNavigate();
  const { isOwner, academy } = useAuth();
  const { classes, subjects, students, getStudentsInClass } = useData();
  const { createClass, updateClass, deleteClass, enrollStudent, unenrollStudent } = useAdmin();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [scheduleDays, setScheduleDays] = useState<ScheduleDay[]>([]);
  const [scheduleTime, setScheduleTime] = useState('14:00');
  const [enrollClassId, setEnrollClassId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isOwner) {
      navigate('/');
      return;
    }
    loadTeachers();
  }, [isOwner]);

  const loadTeachers = async () => {
    if (!academy) return;
    const { data } = await supabase.from('teachers').select('*').eq('academy_id', academy.id);
    setTeachers((data || []).map(mapTeacher));
  };

  const startNew = () => {
    setEditing(null);
    setName('');
    setTeacherId(teachers[0]?.id || '');
    setSubjectId(subjects[0]?.id || '');
    setScheduleDays([]);
    setScheduleTime('14:00');
    setShowForm(true);
  };

  const startEdit = (c: Class) => {
    setEditing(c);
    setName(c.name);
    setTeacherId(c.teacherId);
    setSubjectId(c.subjectId);
    setScheduleDays(c.scheduleDays);
    setScheduleTime(c.scheduleTime);
    setShowForm(true);
  };

  const toggleDay = (d: ScheduleDay) => {
    setScheduleDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scheduleDays.length === 0) {
      setToast({ message: '요일을 1개 이상 선택하세요', type: 'error' });
      return;
    }
    if (editing) {
      const { error } = await updateClass(editing.id, { name, teacherId, subjectId, scheduleDays, scheduleTime });
      if (error) setToast({ message: error, type: 'error' });
      else {
        setToast({ message: '수정됨', type: 'success' });
        setShowForm(false);
        window.location.reload();
      }
    } else {
      const { error } = await createClass({ name, teacherId, subjectId, scheduleDays, scheduleTime });
      if (error) setToast({ message: error, type: 'error' });
      else {
        setToast({ message: '반 생성됨', type: 'success' });
        setShowForm(false);
        window.location.reload();
      }
    }
  };

  const handleDelete = async (c: Class) => {
    if (!confirm(`${c.name} 반을 삭제할까요? 관련 데이터도 모두 삭제됩니다.`)) return;
    const { error } = await deleteClass(c.id);
    if (error) setToast({ message: error, type: 'error' });
    else {
      setToast({ message: '삭제됨', type: 'success' });
      window.location.reload();
    }
  };

  const toggleEnroll = async (classId: string, studentId: string, currentlyEnrolled: boolean) => {
    if (currentlyEnrolled) {
      await unenrollStudent(classId, studentId);
    } else {
      await enrollStudent(classId, studentId);
    }
    window.location.reload();
  };

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
                <label className="text-xs text-gray-500 mb-1 block">과목</label>
                <select value={subjectId} onChange={e => setSubjectId(e.target.value)} required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 outline-none">
                  <option value="">선택...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">요일</label>
                <div className="flex gap-1">
                  {ALL_DAYS.map(d => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => toggleDay(d.key)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium ${scheduleDays.includes(d.key) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">시간</label>
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 outline-none" />
              </div>

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
                  <div>
                    <h3 className="font-bold text-gray-900">{c.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {teacher?.name || '-'} · {subject?.name || '-'} · {formatScheduleDays(c.scheduleDays)} · {c.scheduleTime}
                    </p>
                  </div>
                  <div className="flex gap-1">
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
