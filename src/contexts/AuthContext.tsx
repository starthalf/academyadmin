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
      console.log('[AUTH] init start');
      try {
        console.log('[AUTH] getSession start');
        const { data } = await supabase.auth.getSession();
        console.log('[AUTH] getSession done, user:', data.session?.user?.id);
        setSession(data.session);
        if (data.session) {
          console.log('[AUTH] loadTeacherAndAcademy start');
          await loadTeacherAndAcademy(data.session.user.id);
          console.log('[AUTH] loadTeacherAndAcademy done');
        }
      } catch (err) {
        console.error('[AUTH] init error:', err);
      } finally {
        console.log('[AUTH] init finally - setIsLoading(false)');
        setIsLoading(false);
      }
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[AUTH] state change:', event);
      setSession(newSession);
      if (newSession) {
        try {
          await loadTeacherAndAcademy(newSession.user.id);
        } catch (err) {
          console.error('[AUTH] state change error:', err);
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
    console.log('[LOAD] teachers query, authUserId:', authUserId);
    
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('query timeout 10s')), 10000)
    );
    
    try {
      const teachersPromise = supabase
        .from('teachers')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();
      
      const result: any = await Promise.race([teachersPromise, timeout]);
      const { data: teacherRow, error: teacherErr } = result;
      console.log('[LOAD] teachers done', { teacherRow, teacherErr });

      if (teacherErr || !teacherRow) {
        setTeacher(null);
        setAcademy(null);
        return;
      }
      const t = mapTeacher(teacherRow);
      setTeacher(t);

      console.log('[LOAD] academies query, academyId:', t.academyId);
      const academiesPromise = supabase
        .from('academies')
        .select('*')
        .eq('id', t.academyId)
        .maybeSingle();
      
      const academyResult: any = await Promise.race([academiesPromise, timeout]);
      const { data: academyRow } = academyResult;
      console.log('[LOAD] academies done', academyRow);

      setAcademy(academyRow ? mapAcademy(academyRow) : null);
    } catch (err) {
      console.error('[LOAD] error:', err);
      // timeout이면 기존 teacher/academy 유지 (로그아웃 막기)
      if (err instanceof Error && err.message.includes('timeout')) {
        console.warn('[LOAD] timeout - keeping existing state');
        return;
      }
      setTeacher(null);
      setAcademy(null);
    }
  };

  const refresh = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await loadTeacherAndAcademy(data.session.user.id);
    }
  };

  const signUpAcademy = async (params: {
    academyName: string;
    ownerName: string;
    email: string;
    password: string;
  }) => {
    const { academyName, ownerName, email, password } = params;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError || !authData.user) {
      return { error: authError?.message || '가입 실패' };
    }

    if (!authData.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        return { error: `로그인 실패: ${signInErr.message}. Supabase "Confirm email" OFF 필요` };
      }
    }

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

  const acceptTeacherInvite = async (token: string, password: string, name: string) => {
    const { data: invite, error: inviteError } = await supabase
      .from('teacher_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (inviteError || !invite) return { error: '유효하지 않은 초대 링크입니다' };
    if (new Date(invite.expires_at) < new Date()) return { error: '만료된 초대 링크입니다' };

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invite.email,
      password,
    });
    if (authError || !authData.user) return { error: authError?.message || '가입 실패' };

    const { error: tErr } = await supabase.from('teachers').insert({
      academy_id: invite.academy_id,
      auth_user_id: authData.user.id,
      name,
      email: invite.email,
      role: invite.role,
    });
    if (tErr) return { error: tErr.message };

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
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}