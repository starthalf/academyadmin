import type {
  Teacher, Student, Class, ScheduleDay, ScheduleSlot, Academy,
  Attendance, Homework, TeacherFeedback, ClassMoodFeedback, Score, ClassEnrollment,
  Parent, ParentStudent, ParentInvite, TeacherInvite, Subject
} from '../types';

export const mapAcademy = (r: any): Academy => ({
  id: r.id,
  name: r.name,
  email: r.email || '',
  inviteCode: r.invite_code || undefined,
  createdBy: r.created_by || undefined,
});

export const mapTeacher = (r: any): Teacher => ({
  id: r.id,
  authUserId: r.auth_user_id || undefined,
  academyId: r.academy_id,
  name: r.name,
  email: r.email,
  phone: r.phone || undefined,
  role: r.role,
});

export const mapStudent = (r: any): Student => ({
  id: r.id,
  academyId: r.academy_id,
  name: r.name,
  grade: r.grade,
  birthDate: r.birth_date || '',
  parentPhone: r.parent_phone || '',
  avatar: r.avatar || '',
});

export const mapSubject = (r: any): Subject => ({
  id: r.id,
  academyId: r.academy_id ?? null,
  name: r.name,
});

export const mapClass = (r: any): Class => {
  // 신규: schedule_slots (jsonb) 우선
  // 레거시: schedule_days + schedule_time fallback (마이그레이션 안 된 행 대비)
  let scheduleSlots: ScheduleSlot[] = [];

  if (Array.isArray(r.schedule_slots) && r.schedule_slots.length > 0) {
    scheduleSlots = r.schedule_slots
      .filter((s: any) => s && s.day && s.time)
      .map((s: any) => ({ day: s.day as ScheduleDay, time: s.time as string }));
  } else if (Array.isArray(r.schedule_days) && r.schedule_time) {
    scheduleSlots = (r.schedule_days as string[]).map((d) => ({
      day: d as ScheduleDay,
      time: r.schedule_time as string,
    }));
  }

  return {
    id: r.id,
    academyId: r.academy_id,
    teacherId: r.teacher_id,
    subjectId: r.subject_id,
    name: r.name,
    scheduleSlots,
  };
};

export const mapEnrollment = (r: any): ClassEnrollment => ({
  classId: r.class_id,
  studentId: r.student_id,
  enrolledAt: r.enrolled_at,
});

export const mapAttendance = (r: any): Attendance => ({
  classId: r.class_id,
  teacherId: r.teacher_id,
  studentId: r.student_id,
  date: r.date,
  status: r.status,
});

export const mapHomework = (r: any): Homework => ({
  classId: r.class_id,
  teacherId: r.teacher_id,
  studentId: r.student_id,
  date: r.date,
  completed: r.completed,
  quality: r.quality,
});

export const mapFeedback = (r: any): TeacherFeedback => ({
  classId: r.class_id,
  teacherId: r.teacher_id,
  studentId: r.student_id,
  date: r.date,
  mood: r.mood || '',
  focus: r.focus || '',
  social: r.social || '',
  note: r.note || '',
});

export const mapClassMood = (r: any): ClassMoodFeedback => ({
  classId: r.class_id,
  teacherId: r.teacher_id,
  date: r.date,
  mood: r.mood,
  note: r.note || '',
});

export const mapScore = (r: any): Score => ({
  classId: r.class_id,
  teacherId: r.teacher_id,
  studentId: r.student_id,
  date: r.date,
  score: r.score,
  testType: r.test_type,
});

export const mapParent = (r: any): Parent => ({
  id: r.id,
  authUserId: r.auth_user_id || undefined,
  name: r.name,
  email: r.email,
  phone: r.phone || undefined,
});

export const mapParentStudent = (r: any): ParentStudent => ({
  id: r.id,
  parentId: r.parent_id,
  studentId: r.student_id,
  academyId: r.academy_id,
  relationship: r.relationship,
  status: r.status,
  joinedAt: r.joined_at,
  removedAt: r.removed_at || undefined,
});

export const mapParentInvite = (r: any): ParentInvite => ({
  id: r.id,
  token: r.token,
  academyId: r.academy_id,
  studentId: r.student_id,
  relationship: r.relationship,
  invitedBy: r.invited_by || undefined,
  status: r.status,
  expiresAt: r.expires_at,
  usedByParentId: r.used_by_parent_id || undefined,
  usedAt: r.used_at || undefined,
  createdAt: r.created_at,
});

export const mapTeacherInvite = (r: any): TeacherInvite => ({
  id: r.id,
  token: r.token,
  academyId: r.academy_id,
  email: r.email,
  name: r.name || undefined,
  role: r.role,
  status: r.status,
  expiresAt: r.expires_at,
  usedAt: r.used_at || undefined,
  createdAt: r.created_at,
});