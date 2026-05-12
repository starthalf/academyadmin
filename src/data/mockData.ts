import type { Student, Subject, Teacher, Class, ClassEnrollment, Academy } from '../types';

// ============================================================
// 학원
// ============================================================

export const mockAcademy: Academy = {
  id: 'academy-1',
  name: '스마트학원',
  email: 'admin@smart.academy',
};

// ============================================================
// 선생님 (원장 1명 + 과목별 선생님)
// ============================================================

export const mockTeachers: Teacher[] = [
  { id: 'teacher-1', academyId: 'academy-1', name: '원장 김선생', email: 'owner@smart.academy', role: 'owner' },
  { id: 'teacher-2', academyId: 'academy-1', name: '수학 박선생', email: 'math@smart.academy', role: 'teacher' },
  { id: 'teacher-3', academyId: 'academy-1', name: '영어 이선생', email: 'eng@smart.academy', role: 'teacher' },
  { id: 'teacher-4', academyId: 'academy-1', name: '국어 최선생', email: 'kor@smart.academy', role: 'teacher' },
];

// ============================================================
// 과목
// ============================================================

export const mockSubjects: Subject[] = [
  { id: 'subj-kor', name: '국어' },
  { id: 'subj-math', name: '수학' },
  { id: 'subj-eng', name: '영어' },
  { id: 'subj-sci', name: '과학' },
];

// ============================================================
// 학생 (10명)
// ============================================================

export const mockStudents: Student[] = [
  { id: 'std-1', academyId: 'academy-1', name: '김민지', grade: 4, birthDate: '2015-03-15', parentPhone: '010-1234-5678', avatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=minji' },
  { id: 'std-2', academyId: 'academy-1', name: '이준호', grade: 4, birthDate: '2015-07-22', parentPhone: '010-2345-6789', avatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=junho' },
  { id: 'std-3', academyId: 'academy-1', name: '박서연', grade: 3, birthDate: '2016-01-10', parentPhone: '010-3456-7890', avatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=seoyeon' },
  { id: 'std-4', academyId: 'academy-1', name: '최유진', grade: 5, birthDate: '2014-11-30', parentPhone: '010-4567-8901', avatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=yujin' },
  { id: 'std-5', academyId: 'academy-1', name: '정태윤', grade: 4, birthDate: '2015-05-05', parentPhone: '010-5678-9012', avatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=taeyun' },
  { id: 'std-6', academyId: 'academy-1', name: '강하은', grade: 3, birthDate: '2016-08-18', parentPhone: '010-6789-0123', avatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=haeun' },
  { id: 'std-7', academyId: 'academy-1', name: '윤시우', grade: 5, birthDate: '2014-04-25', parentPhone: '010-7890-1234', avatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=siwoo' },
  { id: 'std-8', academyId: 'academy-1', name: '임지아', grade: 4, birthDate: '2015-12-03', parentPhone: '010-8901-2345', avatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=jia' },
  { id: 'std-9', academyId: 'academy-1', name: '한도현', grade: 6, birthDate: '2013-09-14', parentPhone: '010-9012-3456', avatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=dohyun' },
  { id: 'std-10', academyId: 'academy-1', name: '송예린', grade: 3, birthDate: '2016-06-28', parentPhone: '010-0123-4567', avatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=yerin' },
];

// ============================================================
// 반 (Class) - 과목별, 학년별로 구성
// ============================================================

export const mockClasses: Class[] = [
  // 수학 박선생님 반들
  {
    id: 'class-math-4a',
    academyId: 'academy-1',
    teacherId: 'teacher-2',
    subjectId: 'subj-math',
    name: '초4 수학A',
    scheduleDays: ['mon', 'wed', 'fri'],
    scheduleTime: '14:00',
  },
  {
    id: 'class-math-3a',
    academyId: 'academy-1',
    teacherId: 'teacher-2',
    subjectId: 'subj-math',
    name: '초3 수학A',
    scheduleDays: ['tue', 'thu'],
    scheduleTime: '15:00',
  },
  {
    id: 'class-math-5a',
    academyId: 'academy-1',
    teacherId: 'teacher-2',
    subjectId: 'subj-math',
    name: '초5 수학A',
    scheduleDays: ['mon', 'wed', 'fri'],
    scheduleTime: '16:00',
  },
  // 영어 이선생님 반들
  {
    id: 'class-eng-4a',
    academyId: 'academy-1',
    teacherId: 'teacher-3',
    subjectId: 'subj-eng',
    name: '초4 영어A',
    scheduleDays: ['mon', 'wed', 'fri'],
    scheduleTime: '17:00',
  },
  {
    id: 'class-eng-3a',
    academyId: 'academy-1',
    teacherId: 'teacher-3',
    subjectId: 'subj-eng',
    name: '초3 영어A',
    scheduleDays: ['tue', 'thu'],
    scheduleTime: '14:00',
  },
  // 국어 최선생님 반들
  {
    id: 'class-kor-4a',
    academyId: 'academy-1',
    teacherId: 'teacher-4',
    subjectId: 'subj-kor',
    name: '초4 국어A',
    scheduleDays: ['tue', 'thu'],
    scheduleTime: '16:00',
  },
];

// ============================================================
// 반-학생 등록 (한 학생이 여러 반에 등록 가능)
// ============================================================

export const mockEnrollments: ClassEnrollment[] = [
  // 초4 수학A: 김민지, 이준호, 정태윤, 임지아
  { classId: 'class-math-4a', studentId: 'std-1', enrolledAt: '2025-03-01' },
  { classId: 'class-math-4a', studentId: 'std-2', enrolledAt: '2025-03-01' },
  { classId: 'class-math-4a', studentId: 'std-5', enrolledAt: '2025-03-01' },
  { classId: 'class-math-4a', studentId: 'std-8', enrolledAt: '2025-03-01' },

  // 초3 수학A: 박서연, 강하은, 송예린
  { classId: 'class-math-3a', studentId: 'std-3', enrolledAt: '2025-03-01' },
  { classId: 'class-math-3a', studentId: 'std-6', enrolledAt: '2025-03-01' },
  { classId: 'class-math-3a', studentId: 'std-10', enrolledAt: '2025-03-01' },

  // 초5 수학A: 최유진, 윤시우
  { classId: 'class-math-5a', studentId: 'std-4', enrolledAt: '2025-03-01' },
  { classId: 'class-math-5a', studentId: 'std-7', enrolledAt: '2025-03-01' },

  // 초4 영어A: 김민지, 이준호, 정태윤
  { classId: 'class-eng-4a', studentId: 'std-1', enrolledAt: '2025-03-01' },
  { classId: 'class-eng-4a', studentId: 'std-2', enrolledAt: '2025-03-01' },
  { classId: 'class-eng-4a', studentId: 'std-5', enrolledAt: '2025-03-01' },

  // 초3 영어A: 박서연, 강하은
  { classId: 'class-eng-3a', studentId: 'std-3', enrolledAt: '2025-03-01' },
  { classId: 'class-eng-3a', studentId: 'std-6', enrolledAt: '2025-03-01' },

  // 초4 국어A: 김민지, 임지아
  { classId: 'class-kor-4a', studentId: 'std-1', enrolledAt: '2025-03-01' },
  { classId: 'class-kor-4a', studentId: 'std-8', enrolledAt: '2025-03-01' },
];
