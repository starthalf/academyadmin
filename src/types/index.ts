// ============================================================
// 핵심 엔티티
// ============================================================

export interface Academy {
  id: string;
  name: string;
  email: string;
}

export interface Teacher {
  id: string;
  academyId: string;
  name: string;
  email: string;
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
  name: string;
}

// ============================================================
// 반(Class) - 선생님이 가르치는 수업 단위
// ============================================================

export type ScheduleDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Class {
  id: string;
  academyId: string;
  teacherId: string;
  subjectId: string;       // 과목 ID (mockSubjects 참조)
  name: string;            // 예: "초4 수학A"
  scheduleDays: ScheduleDay[];  // 수업 요일 (여러 개 가능)
  scheduleTime: string;    // "14:00" 형식
}

export interface ClassEnrollment {
  classId: string;
  studentId: string;
  enrolledAt: string;
}

// ============================================================
// 입력 데이터 (모두 classId + teacherId 포함)
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

// 반 단위 분위기 피드백 (NEW)
export interface ClassMoodFeedback {
  classId: string;
  teacherId: string;
  date: string;
  mood: string;           // 반 전체 분위기
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
