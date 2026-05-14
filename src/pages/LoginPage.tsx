import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const { error: signInError } = await signIn(email, password);
    setIsLoading(false);

    if (signInError) {
      setError(signInError);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="h-screen w-screen flex justify-center bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden">
      <div className="w-full max-w-[480px] h-full bg-white/50 backdrop-blur-sm flex flex-col relative shadow-xl px-6">

        {/* 상단 로고 영역 */}
        <div className="flex-1 flex flex-col justify-center items-center -mt-20">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 text-primary-600">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">학부모 앱</h1>
          <p className="text-gray-500 text-sm">자녀의 학원 생활을 한눈에</p>
        </div>

        {/* 로그인 폼 */}
        <div className="w-full mb-12">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                placeholder="이메일"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                placeholder="비밀번호"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
            >
              <span>{isLoading ? '로그인 중...' : '로그인하기'}</span>
              {!isLoading && <ChevronRight className="w-4 h-4 opacity-80" />}
            </button>
          </form>

          <div className="mt-8 p-4 bg-primary-50 rounded-xl text-sm text-gray-700">
            <p className="font-semibold text-primary-700 mb-1.5">처음 사용하시나요?</p>
            <p className="text-xs leading-relaxed">
              학원에서 보내드린 초대 링크(카톡/문자)를 클릭하시면<br/>
              간편하게 가입하실 수 있습니다.
            </p>
          </div>
        </div>

        <div className="pb-8 text-center">
          <p className="text-xs text-gray-400">
            © 2026 학원 부모용 앱
          </p>
        </div>
      </div>
    </div>
  );
}
