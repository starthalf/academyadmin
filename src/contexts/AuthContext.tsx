import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Academy, Teacher } from '../types';
import { supabase } from '../lib/supabase';
import { mapAcademy, mapTeacher } from '../lib/mappers';

interface AuthContextType {
  session: Session | null;
  teacher: Teacher | null;
  academy: Academy | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  isLoading: boolean;

  signUpAcademy: (params: { academyName: string; ownerName: string; email: string; password: string }) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  acceptTeacherInvite: (token: string, password: string, name: string) => Promise<{ error?: string }>;

  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 세션 로드 + 변경 구독
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled) {
        setSession(data.session);
        if (data.session) {
          await loadTeacherAndAcademy(data.session.user.id);
        }
        setIsLoading(false);
      }
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await loadTeacherAndAcademy(newSession.user.id);
      } else {
        setTeacher(null);
        setAcademy(null);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const loadTeacherAndAcademy = async (authUserId: string) => {
    const { data: teacherRow, error: teacherErr } = await supabase
      .from('teachers')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (teacherErr || !teacherRow) {
      setTeacher(null);
      setAcademy(null);
      return;
    }
    const t = mapTeacher(teacherRow);
    setTeacher(t);

    const { data: academyRow } = await supabase
      .from('academies')
      .select('*')
      .eq('id', t.academyId)
      .maybeSingle();

    setAcademy(academyRow ? mapAcademy(academyRow) : null);
  };

  const refresh = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await loadTeacherAndAcademy(data.session.user.id);
    }
  };

  // 학원 회원가입 (학원 + 원장 동시 생성)
  const signUpAcademy = async (params: {
    academyName: string;
    ownerName: string;
    email: string;
    password: string;
  }) => {
    const { academyName, ownerName, email, password } = params;

    // 1. Auth 가입
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError || !authData.user) {
      return { error: authError?.message || '가입 실패' };
    }

    // 이메일 확인이 필요한 경우 session이 null일 수 있음 - 보통 dev에서는 자동 confirm
    // dev에서는 session이 있어야 다음 작업이 RLS 통과함

    // 2. 학원 row 생성
    const inviteCode = generateInviteCode();
    const { data: academyData, error: academyError } = await supabase
      .from('academies')
      .insert({
        name: academyName,
        email,
        invite_code: inviteCode,
        created_by: authData.user.id,
      })
      .select()
      .single();

    if (academyError || !academyData) {
      return { error: `학원 생성 실패: ${academyError?.message}` };
    }

    // 3. 원장 row 생성
    const { error: teacherError } = await supabase
      .from('teachers')
      .insert({
        academy_id: academyData.id,
        auth_user_id: authData.user.id,
        name: ownerName,
        email,
        role: 'owner',
      });

    if (teacherError) {
      return { error: `원장 생성 실패: ${teacherError.message}` };
    }

    // 4. 다시 로드
    await loadTeacherAndAcademy(authData.user.id);
    return {};
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // 선생님 초대 토큰 사용 → 가입
  const acceptTeacherInvite = async (token: string, password: string, name: string) => {
    // 1. 토큰 조회
    const { data: invite, error: inviteError } = await supabase
      .from('teacher_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (inviteError || !invite) return { error: '유효하지 않은 초대 링크입니다' };
    if (new Date(invite.expires_at) < new Date()) return { error: '만료된 초대 링크입니다' };

    // 2. Auth 가입
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invite.email,
      password,
    });
    if (authError || !authData.user) return { error: authError?.message || '가입 실패' };

    // 3. teachers 생성
    const { error: tErr } = await supabase.from('teachers').insert({
      academy_id: invite.academy_id,
      auth_user_id: authData.user.id,
      name,
      email: invite.email,
      role: invite.role,
    });
    if (tErr) return { error: tErr.message };

    // 4. 토큰 사용 처리
    await supabase
      .from('teacher_invites')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('id', invite.id);

    await loadTeacherAndAcademy(authData.user.id);
    return {};
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        teacher,
        academy,
        isAuthenticated: !!session && !!teacher,
        isOwner: teacher?.role === 'owner',
        isLoading,
        signUpAcademy,
        signIn,
        signOut,
        acceptTeacherInvite,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function generateInviteCode(): string {
  // 6자리 영숫자
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
