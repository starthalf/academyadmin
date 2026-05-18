import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type {
  Student, Subject, Class, ClassEnrollment, ScheduleDay,
  Attendance, TeacherFeedback, ClassMoodFeedback, Score, Homework
} from '../types';
import { supabase } from '../lib/supabase';
import {
  mapStudent, mapSubject, mapClass, mapEnrollment,
  mapAttendance, mapHomework, mapFeedback, mapClassMood, mapScore
} from '../lib/mappers';
import { getToday, getDayKeyFromDate } from '../utils/dateUtils';
import { useAuth } from './AuthContext';

interface DataContextType {
  // 마스터 데이터
  students: Student[];
  subjects: Subject[];
  classes: Class[];
  enrollments: ClassEnrollment[];
  isLoading: boolean;

  // 날짜
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // 입력 데이터 (key: classId__studentId 형태)
  attendance: Record<string, Attendance>;
  feedback: Record<string, TeacherFeedback>;
  homework: Record<string, Homework>;
  scores: Score[];
  classMoodFeedbacks: Record<string, ClassMoodFeedback>;

  // 반(Class) 헬퍼
  getMyClasses: () => Class[];
  getClassesByDate: (date: string) => Class[];
  getClassById: (classId: string) => Class | undefined;
  getStudentsInClass: (classId: string) => Student[];
  getSubjectByClass: (classId: string) => Subject | undefined;

  // 업데이트
  updateAttendance: (classId: string, studentId: string, status: 'present' | 'late' | 'absent') => Promise<void>;
  updateHomework: (classId: string, studentId: string, completed: boolean, quality?: 'low' | 'medium' | 'high' | null) => Promise<void>;
  updateFeedback: (classId: string, studentId: string, data: Partial<TeacherFeedback>) => Promise<void>;
  updateClassMoodFeedback: (classId: string, data: Partial<ClassMoodFeedback>) => Promise<void>;
  addScore: (score: Omit<Score, 'teacherId'>) => Promise<void>;

  // 통계
  getClassAttendanceCount: (classId: string) => { present: number; absent: number; late: number; total: number };
  getClassHomeworkCount: (classId: string) => { completed: number; total: number };
  getClassFeedbackCount: (classId: string) => { completed: number; total: number };
  getClassMoodCompleted: (classId: string) => boolean;
}

const DataContext = createContext<DataContextType | null>(null);

function makeKey(classId: string, studentId: string): string {
  return `${classId}__${studentId}`;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { teacher, isOwner, isLoading: authLoading, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getToday());

  // 마스터 데이터
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [isMasterLoading, setIsMasterLoading] = useState(true);

  // 일별 입력 데이터
  const [attendance, setAttendance] = useState<Record<string, Attendance>>({});
  const [feedback, setFeedback] = useState<Record<string, TeacherFeedback>>({});
  const [homework, setHomework] = useState<Record<string, Homework>>({});
  const [scores, setScores] = useState<Score[]>([]);
  const [classMoodFeedbacks, setClassMoodFeedbacks] = useState<Record<string, ClassMoodFeedback>>({});

  // ============================================================
  // 마스터 데이터 로드
  // ============================================================
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setStudents([]);
      setSubjects([]);
      setClasses([]);
      setEnrollments([]);
      setIsMasterLoading(false);
      return;
    }

    const loadMaster = async () => {
      setIsMasterLoading(true);
      try {
        const [studentsRes, subjectsRes, classesRes, enrollmentsRes] = await Promise.all([
          supabase.from('students').select('*').order('grade').order('name'),
          supabase.from('subjects').select('*').order('name'),
          supabase.from('classes').select('*'),
          supabase.from('class_enrollments').select('*'),
        ]);

        if (studentsRes.error) throw studentsRes.error;
        if (subjectsRes.error) throw subjectsRes.error;
        if (classesRes.error) throw classesRes.error;
        if (enrollmentsRes.error) throw enrollmentsRes.error;

        setStudents((studentsRes.data || []).map(mapStudent));
        setSubjects((subjectsRes.data || []).map(mapSubject));
        setClasses((classesRes.data || []).map(mapClass));
        setEnrollments((enrollmentsRes.data || []).map(mapEnrollment));
      } catch (err) {
        console.error('Master data load error:', err);
      } finally {
        setIsMasterLoading(false);
      }
    };

    loadMaster();
  }, [authLoading, isAuthenticated]);

  // ============================================================
  // 일별 데이터 로드
  // ============================================================
  useEffect(() => {
    if (isMasterLoading || !isAuthenticated) return;

    const loadDaily = async () => {
      try {
        const [attRes, hwRes, fbRes, moodRes, scoresRes] = await Promise.all([
          supabase.from('attendance').select('*').eq('date', selectedDate),
          supabase.from('homework').select('*').eq('date', selectedDate),
          supabase.from('teacher_feedback').select('*').eq('date', selectedDate),
          supabase.from('class_mood_feedback').select('*').eq('date', selectedDate),
          supabase.from('scores').select('*'),
        ]);

        if (attRes.data) {
          const map: Record<string, Attendance> = {};
          attRes.data.forEach(r => {
            const a = mapAttendance(r);
            map[makeKey(a.classId, a.studentId)] = a;
          });
          setAttendance(map);
        }

        if (hwRes.data) {
          const map: Record<string, Homework> = {};
          hwRes.data.forEach(r => {
            const h = mapHomework(r);
            map[makeKey(h.classId, h.studentId)] = h;
          });
          setHomework(map);
        }

        if (fbRes.data) {
          const map: Record<string, TeacherFeedback> = {};
          fbRes.data.forEach(r => {
            const f = mapFeedback(r);
            map[makeKey(f.classId, f.studentId)] = f;
          });
          setFeedback(map);
        }

        if (moodRes.data) {
          const map: Record<string, ClassMoodFeedback> = {};
          moodRes.data.forEach(r => {
            const m = mapClassMood(r);
            map[m.classId] = m;
          });
          setClassMoodFeedbacks(map);
        }

        if (scoresRes.data) {
          setScores(scoresRes.data.map(mapScore));
        }
      } catch (err) {
        console.error('Daily data load error:', err);
      }
    };

    loadDaily();
  }, [selectedDate, isMasterLoading, isAuthenticated]);

  // ============================================================
  // 반(Class) 헬퍼
  // ============================================================

  const getMyClasses = useCallback((): Class[] => {
    if (!teacher) return [];
    if (isOwner) return classes;
    return classes.filter(c => c.teacherId === teacher.id);
  }, [teacher, isOwner, classes]);

  const getClassesByDate = useCallback((date: string): Class[] => {
    const dayKey = getDayKeyFromDate(date);
    return getMyClasses().filter(c => c.scheduleSlots.some(s => s.day === dayKey));
  }, [getMyClasses]);

  const getClassById = useCallback(
    (classId: string) => classes.find(c => c.id === classId),
    [classes]
  );

  const getStudentsInClass = useCallback(
    (classId: string): Student[] => {
      const studentIds = enrollments
        .filter(e => e.classId === classId)
        .map(e => e.studentId);
      return students.filter(s => studentIds.includes(s.id));
    },
    [enrollments, students]
  );

  const getSubjectByClass = useCallback(
    (classId: string): Subject | undefined => {
      const cls = classes.find(c => c.id === classId);
      if (!cls) return undefined;
      return subjects.find(s => s.id === cls.subjectId);
    },
    [classes, subjects]
  );

  // ============================================================
  // 데이터 업데이트
  // ============================================================

  const updateAttendance = useCallback(
    async (classId: string, studentId: string, status: 'present' | 'late' | 'absent') => {
      if (!teacher) return;
      const newRecord: Attendance = {
        classId,
        teacherId: teacher.id,
        studentId,
        date: selectedDate,
        status,
      };

      setAttendance(prev => ({ ...prev, [makeKey(classId, studentId)]: newRecord }));

      const { error } = await supabase
        .from('attendance')
        .upsert(
          {
            class_id: classId,
            teacher_id: teacher.id,
            student_id: studentId,
            date: selectedDate,
            status,
          },
          { onConflict: 'class_id,student_id,date' }
        );
      if (error) console.error('updateAttendance error:', error);
    },
    [selectedDate, teacher]
  );

  const updateHomework = useCallback(
    async (
      classId: string,
      studentId: string,
      completed: boolean,
      quality?: 'low' | 'medium' | 'high' | null
    ) => {
      if (!teacher) return;
      const newRecord: Homework = {
        classId,
        teacherId: teacher.id,
        studentId,
        date: selectedDate,
        completed,
        quality: quality || null,
      };

      setHomework(prev => ({ ...prev, [makeKey(classId, studentId)]: newRecord }));

      const { error } = await supabase
        .from('homework')
        .upsert(
          {
            class_id: classId,
            teacher_id: teacher.id,
            student_id: studentId,
            date: selectedDate,
            completed,
            quality: quality || null,
          },
          { onConflict: 'class_id,student_id,date' }
        );
      if (error) console.error('updateHomework error:', error);
    },
    [selectedDate, teacher]
  );

  const updateFeedback = useCallback(
    async (classId: string, studentId: string, data: Partial<TeacherFeedback>) => {
      if (!teacher) return;

      const key = makeKey(classId, studentId);
      const existing = feedback[key] || {
        classId,
        teacherId: teacher.id,
        studentId,
        date: selectedDate,
        mood: '',
        focus: '',
        social: '',
        note: '',
      };
      const updated: TeacherFeedback = { ...existing, ...data };

      setFeedback(prev => ({ ...prev, [key]: updated }));

      const { error } = await supabase
        .from('teacher_feedback')
        .upsert(
          {
            class_id: classId,
            teacher_id: teacher.id,
            student_id: studentId,
            date: selectedDate,
            mood: updated.mood || null,
            focus: updated.focus || null,
            social: updated.social || null,
            note: updated.note || null,
          },
          { onConflict: 'class_id,student_id,date' }
        );
      if (error) console.error('updateFeedback error:', error);
    },
    [selectedDate, teacher, feedback]
  );

  const updateClassMoodFeedback = useCallback(
    async (classId: string, data: Partial<ClassMoodFeedback>) => {
      if (!teacher) return;

      const existing = classMoodFeedbacks[classId] || {
        classId,
        teacherId: teacher.id,
        date: selectedDate,
        mood: '',
        note: '',
      };
      const updated: ClassMoodFeedback = { ...existing, ...data };

      if (!updated.mood) {
        setClassMoodFeedbacks(prev => ({ ...prev, [classId]: updated }));
        return;
      }

      setClassMoodFeedbacks(prev => ({ ...prev, [classId]: updated }));

      const { error } = await supabase
        .from('class_mood_feedback')
        .upsert(
          {
            class_id: classId,
            teacher_id: teacher.id,
            date: selectedDate,
            mood: updated.mood,
            note: updated.note || null,
          },
          { onConflict: 'class_id,date' }
        );
      if (error) console.error('updateClassMoodFeedback error:', error);
    },
    [selectedDate, teacher, classMoodFeedbacks]
  );

  const addScore = useCallback(
    async (score: Omit<Score, 'teacherId'>) => {
      if (!teacher) return;
      const fullScore: Score = { ...score, teacherId: teacher.id };

      setScores(prev => {
        const filtered = prev.filter(
          s =>
            !(
              s.classId === score.classId &&
              s.studentId === score.studentId &&
              s.date === score.date &&
              s.testType === score.testType
            )
        );
        return [...filtered, fullScore];
      });

      const { error } = await supabase
        .from('scores')
        .upsert(
          {
            class_id: score.classId,
            teacher_id: teacher.id,
            student_id: score.studentId,
            date: score.date,
            score: score.score,
            test_type: score.testType,
          },
          { onConflict: 'class_id,student_id,date,test_type' }
        );
      if (error) console.error('addScore error:', error);
    },
    [teacher]
  );

  // ============================================================
  // 통계
  // ============================================================

  const getClassAttendanceCount = useCallback(
    (classId: string) => {
      const studentsInClass = getStudentsInClass(classId);
      const total = studentsInClass.length;
      const records = studentsInClass
        .map(s => attendance[makeKey(classId, s.id)])
        .filter(Boolean);
      return {
        present: records.filter(a => a.status === 'present').length,
        late: records.filter(a => a.status === 'late').length,
        absent: records.filter(a => a.status === 'absent').length,
        total,
      };
    },
    [attendance, getStudentsInClass]
  );

  const getClassHomeworkCount = useCallback(
    (classId: string) => {
      const studentsInClass = getStudentsInClass(classId);
      const total = studentsInClass.length;
      const completed = studentsInClass.filter(
        s => homework[makeKey(classId, s.id)] !== undefined
      ).length;
      return { completed, total };
    },
    [homework, getStudentsInClass]
  );

  const getClassFeedbackCount = useCallback(
    (classId: string) => {
      const studentsInClass = getStudentsInClass(classId);
      const total = studentsInClass.length;
      const completed = studentsInClass.filter(s => {
        const fb = feedback[makeKey(classId, s.id)];
        return fb?.mood && fb?.focus && fb?.social;
      }).length;
      return { completed, total };
    },
    [feedback, getStudentsInClass]
  );

  const getClassMoodCompleted = useCallback(
    (classId: string) => {
      return !!classMoodFeedbacks[classId]?.mood;
    },
    [classMoodFeedbacks]
  );

  const value = useMemo<DataContextType>(
    () => ({
      students,
      subjects,
      classes,
      enrollments,
      isLoading: isMasterLoading,
      selectedDate,
      setSelectedDate,
      attendance,
      feedback,
      homework,
      scores,
      classMoodFeedbacks,
      getMyClasses,
      getClassesByDate,
      getClassById,
      getStudentsInClass,
      getSubjectByClass,
      updateAttendance,
      updateHomework,
      updateFeedback,
      updateClassMoodFeedback,
      addScore,
      getClassAttendanceCount,
      getClassHomeworkCount,
      getClassFeedbackCount,
      getClassMoodCompleted,
    }),
    [
      students, subjects, classes, enrollments, isMasterLoading,
      selectedDate, attendance, feedback, homework, scores, classMoodFeedbacks,
      getMyClasses, getClassesByDate, getClassById, getStudentsInClass, getSubjectByClass,
      updateAttendance, updateHomework, updateFeedback, updateClassMoodFeedback, addScore,
      getClassAttendanceCount, getClassHomeworkCount, getClassFeedbackCount, getClassMoodCompleted,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}