import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { getToday } from '../utils/dateUtils';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';

type TestType = 'daily' | 'weekly' | 'monthly';

const testTypes: { value: TestType; label: string }[] = [
  { value: 'daily', label: '일일' },
  { value: 'weekly', label: '주간' },
  { value: 'monthly', label: '월간' },
];

export default function ScorePage() {
  const { getMyClasses, getStudentsInClass, getSubjectByClass, addScore } = useData();

  const myClasses = getMyClasses();
  const [selectedClassId, setSelectedClassId] = useState(myClasses[0]?.id || '');
  const [selectedTestType, setSelectedTestType] = useState<TestType>('daily');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const students = useMemo(
    () => (selectedClassId ? getStudentsInClass(selectedClassId) : []),
    [selectedClassId, getStudentsInClass]
  );
  const subject = useMemo(
    () => (selectedClassId ? getSubjectByClass(selectedClassId) : undefined),
    [selectedClassId, getSubjectByClass]
  );

  const handleScoreChange = (studentId: string, value: string) => {
    const numValue = value.replace(/[^0-9]/g, '');
    if (numValue === '' || (parseInt(numValue) >= 0 && parseInt(numValue) <= 100)) {
      setScores(prev => ({ ...prev, [studentId]: numValue }));
    }
  };

  const handleSave = () => {
    if (!selectedClassId) return;
    const today = getToday();
    let savedCount = 0;

    Object.entries(scores).forEach(([studentId, scoreValue]) => {
      if (scoreValue && parseInt(scoreValue) >= 0) {
        addScore({
          classId: selectedClassId,
          studentId,
          date: today,
          score: parseInt(scoreValue),
          testType: selectedTestType,
        });
        savedCount++;
      }
    });

    if (savedCount > 0) {
      setToast({ message: `${savedCount}명의 성적이 저장되었습니다`, type: 'success' });
      setScores({});
    } else {
      setToast({ message: '저장할 성적을 입력해주세요', type: 'error' });
    }
  };

  if (myClasses.length === 0) {
    return (
      <div className="pb-4">
        <Header title="성적 입력" />
        <div className="px-4 py-20 text-center text-gray-500">
          담당 반이 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <Header title="성적 입력" />

      <div className="px-4 py-4 space-y-4">
        <Card>
          <h3 className="font-semibold text-gray-800 mb-3">반 선택</h3>
          <div className="flex gap-2 flex-wrap">
            {myClasses.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedClassId(c.id);
                  setScores({});
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedClassId === c.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-3">시험 유형</h3>
          <div className="flex gap-2">
            {testTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setSelectedTestType(type.value)}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  selectedTestType === type.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </Card>

        {subject && (
          <div className="text-sm text-gray-600 px-1">
            과목: <span className="font-semibold text-gray-900">{subject.name}</span>
          </div>
        )}

        <div className="space-y-3">
          {students.map(student => (
            <Card key={student.id} padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-10 h-10 rounded-full bg-gray-100"
                  />
                  <span className="font-medium text-gray-900">{student.name}</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={scores[student.id] || ''}
                  onChange={e => handleScoreChange(student.id, e.target.value)}
                  placeholder="점수"
                  className="w-20 px-3 py-2 text-center border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg font-medium"
                />
              </div>
            </Card>
          ))}
        </div>

        <Button onClick={handleSave} className="w-full" size="lg">
          저장하기
        </Button>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
