import { createContext, useContext, ReactNode, useCallback } from 'react';
import type { ParentRelationship, ScheduleSlot, Subject } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface AdminContextType {
  // 학생
  createStudent: (input: { name: string; grade: number; birthDate?: string; parentPhone?: string }) => Promise<{ error?: string; id?: string }>;
  updateStudent: (id: string, patch: { name?: string; grade?: number; birthDate?: string; parentPhone?: string }) => Promise<{ error?: string }>;
  deleteStudent: (id: string) => Promise<{ error?: string }>;

  // 반
  createClass: (input: { teacherId: string; subjectId: string; name: string; scheduleSlots: ScheduleSlot[] }) => Promise<{ error?: string; id?: string }>;
  updateClass: (id: string, patch: { teacherId?: string; subjectId?: string; name?: string; scheduleSlots?: ScheduleSlot[] }) => Promise<{ error?: string }>;
  deleteClass: (id: string) => Promise<{ error?: string }>;
  enrollStudent: (classId: string, studentId: string) => Promise<{ error?: string }>;
  unenrollStudent: (classId: string, studentId: string) => Promise<{ error?: string }>;

  // 과목
  createSubject: (name: string) => Promise<{ error?: string; subject?: Subject }>;

  // 선생님
  inviteTeacher: (input: { email: string; name?: string; role?: 'owner' | 'teacher' }) => Promise<{ error?: string; token?: string }>;
  deleteTeacher: (id: string) => Promise<{ error?: string }>;

  // 부모 초대
  createParentInvite: (input: { studentId: string; relationship: ParentRelationship }) => Promise<{ error?: string; token?: string }>;
  listParentInvites: () => Promise<any[]>;
  revokeParentInvite: (id: string) => Promise<{ error?: string }>;

  // 부모 연결 관리
  listAcademyParents: () => Promise<any[]>;
  removeParentStudent: (parentStudentId: string) => Promise<{ error?: string }>;
}

const AdminContext = createContext<AdminContextType | null>(null);

function genToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 20; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const { academy, teacher } = useAuth();

  // ============================================================
  // 학생
  // ============================================================

  const createStudent = useCallback(async (input: { name: string; grade: number; birthDate?: string; parentPhone?: string }) => {
    if (!academy) return { error: '학원 정보 없음' };
    const { data, error } = await supabase
      .from('students')
      .insert({
        academy_id: academy.id,
        name: input.name,
        grade: input.grade,
        birth_date: input.birthDate || null,
        parent_phone: input.parentPhone || null,
        avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(input.name + Date.now())}`,
      })
      .select()
      .single();
    if (error) return { error: error.message };
    return { id: data.id };
  }, [academy]);

  const updateStudent = useCallback(async (id: string, patch: any) => {
    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.grade !== undefined) dbPatch.grade = patch.grade;
    if (patch.birthDate !== undefined) dbPatch.birth_date = patch.birthDate || null;
    if (patch.parentPhone !== undefined) dbPatch.parent_phone = patch.parentPhone || null;
    const { error } = await supabase.from('students').update(dbPatch).eq('id', id);
    if (error) return { error: error.message };
    return {};
  }, []);

  const deleteStudent = useCallback(async (id: string) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) return { error: error.message };
    return {};
  }, []);

  // ============================================================
  // 반
  // ============================================================

  const createClass = useCallback(async (input: { teacherId: string; subjectId: string; name: string; scheduleSlots: ScheduleSlot[] }) => {
    if (!academy) return { error: '학원 정보 없음' };
    const { data, error } = await supabase
      .from('classes')
      .insert({
        academy_id: academy.id,
        teacher_id: input.teacherId,
        subject_id: input.subjectId,
        name: input.name,
        schedule_slots: input.scheduleSlots,
      })
      .select()
      .single();
    if (error) return { error: error.message };
    return { id: data.id };
  }, [academy]);

  const updateClass = useCallback(async (id: string, patch: any) => {
    const dbPatch: any = {};
    if (patch.teacherId !== undefined) dbPatch.teacher_id = patch.teacherId;
    if (patch.subjectId !== undefined) dbPatch.subject_id = patch.subjectId;
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.scheduleSlots !== undefined) dbPatch.schedule_slots = patch.scheduleSlots;
    const { error } = await supabase.from('classes').update(dbPatch).eq('id', id);
    if (error) return { error: error.message };
    return {};
  }, []);

  const deleteClass = useCallback(async (id: string) => {
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) return { error: error.message };
    return {};
  }, []);

  const enrollStudent = useCallback(async (classId: string, studentId: string) => {
    const { error } = await supabase
      .from('class_enrollments')
      .insert({ class_id: classId, student_id: studentId });
    if (error && !error.message.includes('duplicate')) return { error: error.message };
    return {};
  }, []);

  const unenrollStudent = useCallback(async (classId: string, studentId: string) => {
    const { error } = await supabase
      .from('class_enrollments')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId);
    if (error) return { error: error.message };
    return {};
  }, []);

  // ============================================================
  // 과목
  // ============================================================

  const createSubject = useCallback(async (name: string) => {
    if (!academy) return { error: '학원 정보 없음' };
    const trimmed = name.trim();
    if (!trimmed) return { error: '과목명을 입력하세요' };

    const { data, error } = await supabase
      .from('subjects')
      .insert({ academy_id: academy.id, name: trimmed })
      .select()
      .single();
    if (error) return { error: error.message };
    return {
      subject: {
        id: data.id,
        academyId: data.academy_id ?? null,
        name: data.name,
      } as Subject,
    };
  }, [academy]);

  // ============================================================
  // 선생님 (초대 방식)
  // ============================================================

  const inviteTeacher = useCallback(async (input: { email: string; name?: string; role?: 'owner' | 'teacher' }) => {
    if (!academy) return { error: '학원 정보 없음' };
    const token = genToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase
      .from('teacher_invites')
      .insert({
        token,
        academy_id: academy.id,
        email: input.email,
        name: input.name || null,
        role: input.role || 'teacher',
        expires_at: expiresAt.toISOString(),
      });
    if (error) return { error: error.message };
    return { token };
  }, [academy]);

  const deleteTeacher = useCallback(async (id: string) => {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) return { error: error.message };
    return {};
  }, []);

  // ============================================================
  // 부모 초대
  // ============================================================

  const createParentInvite = useCallback(async (input: { studentId: string; relationship: ParentRelationship }) => {
    if (!academy || !teacher) return { error: '학원/선생님 정보 없음' };
    const token = genToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const { error } = await supabase
      .from('parent_invites')
      .insert({
        token,
        academy_id: academy.id,
        student_id: input.studentId,
        relationship: input.relationship,
        invited_by: teacher.id,
        expires_at: expiresAt.toISOString(),
      });
    if (error) return { error: error.message };
    return { token };
  }, [academy, teacher]);

  const listAcademyParents = useCallback(async () => {
  if (!academy) return [];
  const { data } = await supabase
    .from('parent_students')
    .select('*, parents(name, email, phone), students(id, name, grade)')  // ← id 추가
    .eq('academy_id', academy.id)
    .eq('status', 'active');
  return data || [];
}, [academy]);

  const revokeParentInvite = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('parent_invites')
      .update({ status: 'expired' })
      .eq('id', id);
    if (error) return { error: error.message };
    return {};
  }, []);

  // ============================================================
  // 부모 연결
  // ============================================================

  const listAcademyParents = useCallback(async () => {
    if (!academy) return [];
    const { data } = await supabase
      .from('parent_students')
      .select('*, parents(name, email, phone), students(name, grade)')
      .eq('academy_id', academy.id)
      .eq('status', 'active');
    return data || [];
  }, [academy]);

  const removeParentStudent = useCallback(async (parentStudentId: string) => {
    const { error } = await supabase
      .from('parent_students')
      .update({ status: 'removed', removed_at: new Date().toISOString() })
      .eq('id', parentStudentId);
    if (error) return { error: error.message };
    return {};
  }, []);

  return (
    <AdminContext.Provider
      value={{
        createStudent, updateStudent, deleteStudent,
        createClass, updateClass, deleteClass, enrollStudent, unenrollStudent,
        createSubject,
        inviteTeacher, deleteTeacher,
        createParentInvite, listParentInvites, revokeParentInvite,
        listAcademyParents, removeParentStudent,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}