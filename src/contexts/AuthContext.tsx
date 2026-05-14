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

 useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        if (data.session) {
          await loadTeacherAndAcademy(data.session.user.id);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        try {
          await loadTeacherAndAcademy(newSession.user.id);
        } catch (err) {
          console.error('Auth state change error:', err);
        }
      } else {
        setTeacher(null);
        setAcademy(null);
      }
    });

    return () => {
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

    // signUp 직후 세션이 즉시 활성화되지 않을 수 있어 명시적으로 로그인
    if (!authData.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        return { error: `로그인 실패: ${signInErr.message}. Supabase에서 "Confirm email"을 OFF로 변경하세요.` };
      }
    }

    // 2. SECURITY DEFINER 함수로 학원 + 원장 생성 (RLS 안전 우회)
    const inviteCode = generateInviteCode();
    const { error: rpcError } = await supabase.rpc('signup_academy_with_owner', {
      p_academy_name: academyName,
      p_owner_name: ownerName,
      p_email: email,
      p_invite_code: inviteCode,
    });

    if (rpcError) {
      return { error: `학원 생성 실패: ${rpcError.message}` };
    }

    // 3. 다시 로드
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
