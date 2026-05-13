import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function TeacherInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { acceptTeacherInvite } = useAuth();

  const [invite, setInvite] = useState<any>(null);
  const [academyName, setAcademyName] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchInvite = async () => {
      const { data } = await supabase
        .from('teacher_invites')
        .select('*, academies(name)')
        .eq('token', token)
        .maybeSingle();
      if (data) {
        setInvite(data);
        setName(data.name || '');
        setAcademyName(data.academies?.name || '');
      }
      setTokenLoading(false);
    };
    fetchInvite();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    setIsLoading(true);
    const { error: e2 } = await acceptTeacherInvite(token, password, name);
    setIsLoading(false);

    if (e2) setError(e2);
    else navigate('/');
  };

  if (tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">초대 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6">
        <div className="max-w-[400px] w-full mx-auto text-center">
          <h1 className="text-xl font-bold text-gray-900">유효하지 않은 초대 링크</h1>
          <p className="text-gray-500 mt-2">학원 관리자에게 새 링크를 요청하세요.</p>
          <Link to="/login" className="inline-block mt-6 text-blue-500 font-medium hover:underline">
            로그인 페이지로
          </Link>
        </div>
      </div>
    );
  }

  if (invite.status !== 'pending' || new Date(invite.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6">
        <div className="max-w-[400px] w-full mx-auto text-center">
          <h1 className="text-xl font-bold text-gray-900">만료된 초대 링크</h1>
          <p className="text-gray-500 mt-2">이 초대는 이미 사용되었거나 만료되었습니다.</p>
          <Link to="/login" className="inline-block mt-6 text-blue-500 font-medium hover:underline">
            로그인 페이지로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-12">
      <div className="max-w-[400px] w-full mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">선생님 가입</h1>
          <p className="text-gray-500 mt-2 text-sm">
            <span className="font-medium">{academyName}</span>에 선생님으로 초대됐어요
          </p>
          <p className="text-xs text-gray-400 mt-1">{invite.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="이름"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Input
            type="password"
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={e => setPasswordConfirm(e.target.value)}
            required
            minLength={6}
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? '가입 중...' : '가입하기'}
          </Button>
        </form>
      </div>
    </div>
  );
}
