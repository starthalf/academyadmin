// ============================================================
// 핵심 엔티티
// ============================================================

export interface Academy {
  id: string;
  name: string;
  email: string;
  inviteCode?: string;
  createdBy?: string;
}

export interface Teacher {
  id: string;
  authUserId?: string;
  academyId: string;
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'teacher';
}

export interface Student {
  id: string;
  academyId: string;
  name: string;
  grade: number;
  birthDate: string;
  parentPhone: string;
  avatar: string;
}

export interface Subject {
  id: string;
  academyId: string | null; // null이면 글로벌(공용) 시드 과목
  name: string;
}

// ============================================================
// 반(Class)
// ============================================================

export type ScheduleDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

// 요일별로 다른 시간을 가질 수 있는 스케줄 슬롯
export interface ScheduleSlot {
  day: ScheduleDay;
  time: string; // 'HH:MM'
}

export interface Class {
  id: string;
  academyId: string;
  teacherId: string;
  subjectId: string;
  name: string;
  scheduleSlots: ScheduleSlot[];
}

export interface ClassEnrollment {
  classId: string;
  studentId: string;
  enrolledAt: string;
}

// ============================================================
// 부모 / 부모-자녀 / 초대
// ============================================================

export interface Parent {
  id: string;
  authUserId?: string;
  name: string;
  email: string;
  phone?: string;
}

export type ParentRelationship = 'mother' | 'father' | 'guardian';
export type ParentStudentStatus = 'active' | 'removed';

export interface ParentStudent {
  id: string;
  parentId: string;
  studentId: string;
  academyId: string;
  relationship: ParentRelationship;
  status: ParentStudentStatus;
  joinedAt: string;
  removedAt?: string;
}

export type InviteStatus = 'pending' | 'used' | 'expired';

export interface ParentInvite {
  id: string;
  token: string;
  academyId: string;
  studentId: string;
  relationship: ParentRelationship;
  invitedBy?: string;
  status: InviteStatus;
  expiresAt: string;
  usedByParentId?: string;
  usedAt?: string;
  createdAt: string;
}

export interface TeacherInvite {
  id: string;
  token: string;
  academyId: string;
  email: string;
  name?: string;
  role: 'owner' | 'teacher';
  status: InviteStatus;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

// ============================================================
// 입력 데이터
// ============================================================

export interface Attendance {
  classId: string;
  teacherId: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface Homework {
  classId: string;
  teacherId: string;
  studentId: string;
  date: string;
  completed: boolean;
  quality?: 'low' | 'medium' | 'high' | null;
}

export interface TeacherFeedback {
  classId: string;
  teacherId: string;
  studentId: string;
  date: string;
  mood: string;
  focus: string;
  social: string;
  note?: string;
}

export interface ClassMoodFeedback {
  classId: string;
  teacherId: string;
  date: string;
  mood: string;
  note?: string;
}

export interface Score {
  classId: string;
  teacherId: string;
  studentId: string;
  date: string;
  score: number;
  testType: 'daily' | 'weekly' | 'monthly';
}