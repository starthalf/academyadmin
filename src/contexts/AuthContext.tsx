import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Academy, Teacher } from '../types';
import { mockAcademy, mockTeachers } from '../data/mockData';

interface AuthContextType {
  teacher: Teacher | null;
  academy: Academy | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchTeacher: (teacherId: string) => void; // 테스트용: 선생님 전환
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'academy_auth_v2';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // 저장된 ID로 mockTeachers에서 최신 데이터 가져오기
        const found = mockTeachers.find(t => t.id === parsed.id);
        if (found) {
          setTeacher(found);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!email || password.length < 4) return false;

    // 이메일로 선생님 찾기, 없으면 원장으로 기본 로그인
    const found = mockTeachers.find(t => t.email === email);
    const teacherData = found || mockTeachers[0]; // 기본: 원장

    setTeacher(teacherData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teacherData));
    return true;
  };

  const logout = () => {
    setTeacher(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const switchTeacher = (teacherId: string) => {
    const found = mockTeachers.find(t => t.id === teacherId);
    if (found) {
      setTeacher(found);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        teacher,
        academy: teacher ? mockAcademy : null,
        isAuthenticated: !!teacher,
        isOwner: teacher?.role === 'owner',
        login,
        logout,
        switchTeacher,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
