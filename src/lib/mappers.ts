// DB(snake_case) ↔ 앱 타입(camelCase) 변환

import type {
  Teacher, Student, Class, ScheduleDay,
  Attendance, Homework, TeacherFeedback, ClassMoodFeedback, Score, ClassEnrollment
} from '../types';

export const mapTeacher = (r: any): Teacher => ({
  id: r.id,
  academyId: r.academy_id,
  name: r.name,
  email: r.email,
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

export const mapClass = (r: any): Class => ({
  id: r.id,
  academyId: r.academy_id,
  teacherId: r.teacher_id,
  subjectId: r.subject_id,
  name: r.name,
  scheduleDays: r.schedule_days as ScheduleDay[],
  scheduleTime: r.schedule_time,
});

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
