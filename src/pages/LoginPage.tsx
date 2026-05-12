import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('이메일 또는 비밀번호를 확인해주세요.');
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6">
      <div className="max-w-[400px] w-full mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">학원 관리 시스템</h1>
          <p className="text-gray-500 mt-2">선생님 계정으로 로그인하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={4}
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm text-gray-600 space-y-1">
          <p className="font-semibold text-blue-700 mb-2">테스트 계정</p>
          <p>• owner@smart.academy — 원장</p>
          <p>• math@smart.academy — 수학 선생님</p>
          <p>• eng@smart.academy — 영어 선생님</p>
          <p>• kor@smart.academy — 국어 선생님</p>
          <p className="mt-2 text-xs">비밀번호: 아무 4자 이상</p>
        </div>
      </div>
    </div>
  );
}
