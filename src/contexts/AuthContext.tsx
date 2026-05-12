import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Academy, Teacher } from '../types';
import { supabase } from '../lib/supabase';
import { mapTeacher } from '../lib/mappers';

interface AuthContextType {
  teacher: Teacher | null;
  academy: Academy | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  allTeachers: Teacher[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchTeacher: (teacherId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'academy_auth_v2';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [teachersRes, academiesRes] = await Promise.all([
          supabase.from('teachers').select('*'),
          supabase.from('academies').select('*').limit(1).single(),
        ]);

        if (teachersRes.error) throw teachersRes.error;
        if (academiesRes.error) throw academiesRes.error;

        const teachers = (teachersRes.data || []).map(mapTeacher);
        setAllTeachers(teachers);
        setAcademy({
          id: academiesRes.data.id,
          name: academiesRes.data.name,
          email: academiesRes.data.email || '',
        });

        // 저장된 로그인 복원
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const found = teachers.find(t => t.id === parsed.id);
            if (found) setTeacher(found);
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!email || password.length < 4) return false;
    const found = allTeachers.find(t => t.email === email) || allTeachers[0];
    if (!found) return false;
    setTeacher(found);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    return true;
  };

  const logout = () => {
    setTeacher(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const switchTeacher = (teacherId: string) => {
    const found = allTeachers.find(t => t.id === teacherId);
    if (found) {
      setTeacher(found);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        teacher,
        academy,
        isAuthenticated: !!teacher,
        isOwner: teacher?.role === 'owner',
        allTeachers,
        isLoading,
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
