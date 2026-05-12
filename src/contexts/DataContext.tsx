import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type {
  Student, Subject, Class, ClassEnrollment, ScheduleDay,
  Attendance, TeacherFeedback, ClassMoodFeedback, Score, Homework
} from '../types';
import {
  mockStudents, mockSubjects, mockClasses, mockEnrollments
} from '../data/mockData';
import { getToday, getTodayDayOfWeek } from '../utils/dateUtils';
import { useAuth } from './AuthContext';

interface DataContextType {
  // 전체 마스터 데이터
  students: Student[];
  subjects: Subject[];
  classes: Class[];
  enrollments: ClassEnrollment[];

  // 날짜
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // 입력 데이터 (key: `${classId}-${studentId}` 형태)
  attendance: Record<string, Attendance>;
  feedback: Record<string, TeacherFeedback>;
  homework: Record<string, Homework>;
  scores: Score[];
  classMoodFeedbacks: Record<string, ClassMoodFeedback>; // key: classId

  // 반(Class) 관련 헬퍼
  getMyClasses: () => Class[];                          // 로그인한 선생님의 반들 (원장이면 전체)
  getTodaysClasses: () => Class[];                      // 오늘 요일에 해당하는 내 반들
  getClassById: (classId: string) => Class | undefined;
  getStudentsInClass: (classId: string) => Student[];   // 반에 속한 학생 리스트
  getSubjectByClass: (classId: string) => Subject | undefined;

  // 데이터 업데이트
  updateAttendance: (classId: string, studentId: string, status: 'present' | 'absent' | 'late') => void;
  updateHomework: (classId: string, studentId: string, completed: boolean, quality?: 'low' | 'medium' | 'high' | null) => void;
  updateFeedback: (classId: string, studentId: string, data: Partial<TeacherFeedback>) => void;
  updateClassMoodFeedback: (classId: string, data: Partial<ClassMoodFeedback>) => void;
  addScore: (score: Omit<Score, 'teacherId'>) => void;

  // 통계
  getClassAttendanceCount: (classId: string) => { present: number; absent: number; late: number; total: number };
  getClassHomeworkCount: (classId: string) => { completed: number; total: number };
  getClassFeedbackCount: (classId: string) => { completed: number; total: number };
  getClassMoodCompleted: (classId: string) => boolean;
}

const DataContext = createContext<DataContextType | null>(null);

// localStorage key 패턴
const ATTENDANCE_KEY = 'academy_attendance_v2';
const FEEDBACK_KEY = 'academy_feedback_v2';
const HOMEWORK_KEY = 'academy_homework_v2';
const SCORES_KEY = 'academy_scores_v2';
const CLASS_MOOD_KEY = 'academy_class_mood_v2';

// composite key 생성: classId-studentId
function makeKey(classId: string, studentId: string): string {
  return `${classId}__${studentId}`;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { teacher, isOwner } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getToday());

  const [attendance, setAttendance] = useState<Record<string, Attendance>>({});
  const [feedback, setFeedback] = useState<Record<string, TeacherFeedback>>({});
  const [homework, setHomework] = useState<Record<string, Homework>>({});
  const [scores, setScores] = useState<Score[]>([]);
  const [classMoodFeedbacks, setClassMoodFeedbacks] = useState<Record<string, ClassMoodFeedback>>({});

  // 날짜 변경 시 데이터 로드
  useEffect(() => {
    const loadDay = (key: string) => {
      const stored = localStorage.getItem(`${key}_${selectedDate}`);
      return stored ? JSON.parse(stored) : {};
    };

    setAttendance(loadDay(ATTENDANCE_KEY));
    setFeedback(loadDay(FEEDBACK_KEY));
    setHomework(loadDay(HOMEWORK_KEY));
    setClassMoodFeedbacks(loadDay(CLASS_MOOD_KEY));

    // 성적은 날짜와 무관하게 누적
    const storedScores = localStorage.getItem(SCORES_KEY);
    if (storedScores) {
      try {
        setScores(JSON.parse(storedScores));
      } catch {
        setScores([]);
      }
    }
  }, [selectedDate]);

  // ============================================================
  // 반(Class) 헬퍼
  // ============================================================

  const getMyClasses = useCallback((): Class[] => {
    if (!teacher) return [];
    if (isOwner) return mockClasses; // 원장은 전체
    return mockClasses.filter(c => c.teacherId === teacher.id);
  }, [teacher, isOwner]);

  const getTodaysClasses = useCallback((): Class[] => {
    const today = getTodayDayOfWeek();
    return getMyClasses().filter(c => c.scheduleDays.includes(today as ScheduleDay));
  }, [getMyClasses]);

  const getClassById = useCallback((classId: string) => {
    return mockClasses.find(c => c.id === classId);
  }, []);

  const getStudentsInClass = useCallback((classId: string): Student[] => {
    const studentIds = mockEnrollments
      .filter(e => e.classId === classId)
      .map(e => e.studentId);
    return mockStudents.filter(s => studentIds.includes(s.id));
  }, []);

  const getSubjectByClass = useCallback((classId: string): Subject | undefined => {
    const cls = mockClasses.find(c => c.id === classId);
    if (!cls) return undefined;
    return mockSubjects.find(s => s.id === cls.subjectId);
  }, []);

  // ============================================================
  // 데이터 업데이트
  // ============================================================

  const updateAttendance = useCallback(
    (classId: string, studentId: string, status: 'present' | 'absent' | 'late') => {
      if (!teacher) return;
      setAttendance(prev => {
        const key = makeKey(classId, studentId);
        const updated = {
          ...prev,
          [key]: {
            classId,
            teacherId: teacher.id,
            studentId,
            date: selectedDate,
            status,
          },
        };
        localStorage.setItem(`${ATTENDANCE_KEY}_${selectedDate}`, JSON.stringify(updated));
        return updated;
      });
    },
    [selectedDate, teacher]
  );

  const updateHomework = useCallback(
    (
      classId: string,
      studentId: string,
      completed: boolean,
      quality?: 'low' | 'medium' | 'high' | null
    ) => {
      if (!teacher) return;
      setHomework(prev => {
        const key = makeKey(classId, studentId);
        const updated = {
          ...prev,
          [key]: {
            classId,
            teacherId: teacher.id,
            studentId,
            date: selectedDate,
            completed,
            quality: quality || null,
          },
        };
        localStorage.setItem(`${HOMEWORK_KEY}_${selectedDate}`, JSON.stringify(updated));
        return updated;
      });
    },
    [selectedDate, teacher]
  );

  const updateFeedback = useCallback(
    (classId: string, studentId: string, data: Partial<TeacherFeedback>) => {
      if (!teacher) return;
      setFeedback(prev => {
        const key = makeKey(classId, studentId);
        const existing = prev[key] || {
          classId,
          teacherId: teacher.id,
          studentId,
          date: selectedDate,
          mood: '',
          focus: '',
          social: '',
          note: '',
        };
        const updated = { ...prev, [key]: { ...existing, ...data } };
        localStorage.setItem(`${FEEDBACK_KEY}_${selectedDate}`, JSON.stringify(updated));
        return updated;
      });
    },
    [selectedDate, teacher]
  );

  const updateClassMoodFeedback = useCallback(
    (classId: string, data: Partial<ClassMoodFeedback>) => {
      if (!teacher) return;
      setClassMoodFeedbacks(prev => {
        const existing = prev[classId] || {
          classId,
          teacherId: teacher.id,
          date: selectedDate,
          mood: '',
          note: '',
        };
        const updated = { ...prev, [classId]: { ...existing, ...data } };
        localStorage.setItem(`${CLASS_MOOD_KEY}_${selectedDate}`, JSON.stringify(updated));
        return updated;
      });
    },
    [selectedDate, teacher]
  );

  const addScore = useCallback(
    (score: Omit<Score, 'teacherId'>) => {
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
        const updated = [...filtered, fullScore];
        localStorage.setItem(SCORES_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [teacher]
  );

  // ============================================================
  // 통계 (반 단위)
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
      const completed = studentsInClass.filter(s => {
        const hw = homework[makeKey(classId, s.id)];
        return hw !== undefined; // 미완료 선택도 입력으로 침
      }).length;
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
      const mood = classMoodFeedbacks[classId];
      return !!mood?.mood;
    },
    [classMoodFeedbacks]
  );

  const value = useMemo<DataContextType>(
    () => ({
      students: mockStudents,
      subjects: mockSubjects,
      classes: mockClasses,
      enrollments: mockEnrollments,
      selectedDate,
      setSelectedDate,
      attendance,
      feedback,
      homework,
      scores,
      classMoodFeedbacks,
      getMyClasses,
      getTodaysClasses,
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
      selectedDate,
      attendance,
      feedback,
      homework,
      scores,
      classMoodFeedbacks,
      getMyClasses,
      getTodaysClasses,
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
