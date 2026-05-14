import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabase';
import { mapStudent } from '../lib/mappers';
import { getGradeLabel } from '../utils/dateUtils';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toast from '../components/ui/Toast';
import type { Student } from '../types';

export default function ManageStudentsPage() {
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const { createStudent, updateStudent, deleteStudent } = useAdmin();

  const [students, setStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(4);
  const [parentPhone, setParentPhone] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isOwner) {
      navigate('/');
      return;
    }
    loadStudents();
  }, [isOwner]);

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('grade')
      .order('name');
    if (error) {
      console.error('학생 불러오기 실패:', error);
      return;
    }
    setStudents((data || []).map(mapStudent));
  };

  if (!isOwner) return null;

  const filtered = students.filter(s => !search || s.name.includes(search));

  const startNew = () => {
    setEditing(null);
    setName('');
    setGrade(4);
    setParentPhone('');
    setShowForm(true);
  };

  const startEdit = (s: Student) => {
    setEditing(s);
    setName(s.name);
    setGrade(s.grade);
    setParentPhone(s.parentPhone);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const { error } = await updateStudent(editing.id, { name, grade, parentPhone });
      if (error) setToast({ message: error, type: 'error' });
      else {
        setToast({ message: '수정됨', type: 'success' });
        setShowForm(false);
        await loadStudents();
      }
    } else {
      const { error } = await createStudent({ name, grade, parentPhone });
      if (error) setToast({ message: error, type: 'error' });
      else {
        setToast({ message: '학생 추가됨', type: 'success' });
        setShowForm(false);
        await loadStudents();
      }
    }
  };

  const handleDelete = async (s: Student) => {
    if (!confirm(`${s.name} 학생을 삭제할까요? 관련된 모든 출결/숙제/피드백 기록이 함께 삭제됩니다.`)) return;
    const { error } = await deleteStudent(s.id);
    if (error) setToast({ message: error, type: 'error' });
    else {
      setToast({ message: '삭제됨', type: 'success' });
      await loadStudents();
    }
  };

  return (
    <div className="pb-4">
      <Header title="학생 관리" showBack />

      <div className="px-4 py-4 space-y-4">
        <Button onClick={startNew} className="w-full flex items-center justify-center gap-2">
          <Plus size={18} />
          학생 추가
        </Button>

        {showForm && (
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">{editing ? '학생 수정' : '학생 추가'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input placeholder="이름" value={name} onChange={e => setName(e.target.value)} required />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">학년</label>
                <select
                  value={grade}
                  onChange={e => setGrade(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                    <option key={g} value={g}>{getGradeLabel(g)}</option>
                  ))}
                </select>
              </div>
              <Input placeholder="학부모 연락처 (선택)" value={parentPhone} onChange={e => setParentPhone(e.target.value)} />
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">취소</Button>
                <Button type="submit" className="flex-1">{editing ? '저장' : '추가'}</Button>
              </div>
            </form>
          </Card>
        )}

        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="학생 검색..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>

        <div className="space-y-2">
          {filtered.map(s => (
            <Card key={s.id} padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-full bg-gray-100" />
                  <div>
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{getGradeLabel(s.grade)}{s.parentPhone && ` · ${s.parentPhone}`}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(s)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(s)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}