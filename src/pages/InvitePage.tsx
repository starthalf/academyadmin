import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Mail, Lock, User, Phone, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { signUpFromInvite, acceptInviteForExistingParent, isAuthenticated } = useAuth();

  const [invite, setInvite] = useState<any>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchInvite = async () => {
      const { data } = await supabase
        .from('parent_invites')
        .select('*, students(name, grade, avatar), academies(name)')
        .eq('token', token)
        .maybeSingle();
      if (data) setInvite(data);
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
    const { error: e2 } = await signUpFromInvite({ token, name, email, password, phone });
    setIsLoading(false);

    if (e2) setError(e2);
    else navigate('/home');
  };

  const handleAcceptExisting = async () => {
    if (!token) return;
    setError('');
    setIsLoading(true);
    const { error: e2 } = await acceptInviteForExistingParent(token);
    setIsLoading(false);
    if (e2) setError(e2);
    else navigate('/home');
  };

  if (tokenLoading) {
    return (
      <div className="h-screen w-screen flex justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-full max-w-[480px] h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">초대 확인 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="h-screen w-screen flex justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-full max-w-[480px] h-full flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">유효하지 않은 초대</h1>
          <p className="text-gray-500 text-sm">학원에 새 초대 링크를 요청하세요.</p>
          <Link to="/login" className="mt-6 text-primary-600 font-medium">
            로그인 페이지로
          </Link>
        </div>
      </div>
    );
  }

  if (invite.status !== 'pending' || new Date(invite.expires_at) < new Date()) {
    return (
      <div className="h-screen w-screen flex justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-full max-w-[480px] h-full flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">만료된 초대</h1>
          <p className="text-gray-500 text-sm">이 초대 링크는 이미 사용되었거나 만료되었습니다.</p>
          <Link to="/login" className="mt-6 text-primary-600 font-medium">
            로그인 페이지로
          </Link>
        </div>
      </div>
    );
  }

  // 이미 로그인된 부모 - 기존 계정에 추가
  if (isAuthenticated) {
    return (
      <div className="h-screen w-screen flex justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-full max-w-[480px] h-full bg-white/50 backdrop-blur-sm flex flex-col px-6">
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 text-primary-600">
              <Heart size={32} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">새 학원 초대</h1>
            <div className="mt-3 p-4 bg-primary-50 rounded-xl text-center">
              <p className="text-sm text-gray-700">
                <span className="font-bold text-primary-700">{invite.academies?.name}</span>의
              </p>
              <p className="text-base font-bold text-gray-900 mt-1">{invite.students?.name} 학부모</p>
              <p className="text-xs text-gray-500 mt-1">으로 초대됐어요</p>
            </div>
          </div>

          <div className="mb-12 space-y-3">
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              onClick={handleAcceptExisting}
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-200 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>{isLoading ? '추가 중...' : '내 계정에 추가'}</span>
              {!isLoading && <ChevronRight className="w-4 h-4 opacity-80" />}
            </button>
            <button
              onClick={() => navigate('/home')}
              className="w-full py-3 text-gray-600 text-sm hover:text-gray-900"
            >
              나중에 하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 신규 가입
  return (
    <div className="min-h-screen w-screen flex justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-[480px] bg-white/50 backdrop-blur-sm flex flex-col px-6 py-8">

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600">
            <Heart size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">학부모 가입</h1>
          <div className="mt-3 p-3 bg-primary-50 rounded-xl">
            <p className="text-xs text-gray-600">
              <span className="font-bold text-primary-700">{invite.academies?.name}</span>의
            </p>
            <p className="text-base font-bold text-gray-900 mt-0.5">{invite.students?.name} 학부모</p>
            <p className="text-xs text-gray-500 mt-0.5">으로 초대됐어요</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text" placeholder="이름"
              value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email" placeholder="이메일"
              value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel" placeholder="연락처 (선택)"
              value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password" placeholder="비밀번호 (6자 이상)"
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password" placeholder="비밀번호 확인"
              value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required minLength={6}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit" disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-200 flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
          >
            <span>{isLoading ? '가입 중...' : '간편 가입하기'}</span>
            {!isLoading && <ChevronRight className="w-4 h-4 opacity-80" />}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          이미 다른 학원에서 가입하셨나요?{' '}
          <Link to="/login" className="text-primary-600 font-medium">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
