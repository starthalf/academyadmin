import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function SignupPage() {
  const { signUpAcademy } = useAuth();
  const navigate = useNavigate();

  const [academyName, setAcademyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    const { error: e2 } = await signUpAcademy({
      academyName,
      ownerName,
      email,
      password,
    });
    setIsLoading(false);

    if (e2) {
      setError(e2);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-12">
      <div className="max-w-[400px] w-full mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">학원 등록</h1>
          <p className="text-gray-500 mt-2 text-sm">학원 정보와 원장님 계정을 만들어주세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">학원 정보</label>
            <div className="mt-2 space-y-3">
              <Input
                placeholder="학원 이름 (예: 스마트학원)"
                value={academyName}
                onChange={e => setAcademyName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">원장님 계정</label>
            <div className="mt-2 space-y-3">
              <Input
                placeholder="이름"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                required
              />
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? '등록 중...' : '학원 등록하기'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-blue-500 font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
