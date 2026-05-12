import { useState, useMemo } from 'react';
import { Plus, X, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { getGradeLabel } from '../../utils/dateUtils';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmojiSelector from '../ui/EmojiSelector';
import Toast from '../ui/Toast';

interface Props {
  classId: string;
}

function makeKey(classId: string, studentId: string): string {
  return `${classId}__${studentId}`;
}

const classMoodOptions = [
  { emoji: '😊', label: '좋음', value: 'good' },
  { emoji: '😐', label: '보통', value: 'normal' },
  { emoji: '😴', label: '늘어짐', value: 'tired' },
  { emoji: '🔥', label: '활발', value: 'energetic' },
  { emoji: '😤', label: '예민', value: 'sensitive' },
];

const moodOptions = [
  { emoji: '😊', label: '좋음', value: 'good' },
  { emoji: '😐', label: '보통', value: 'normal' },
  { emoji: '😴', label: '피곤', value: 'tired' },
  { emoji: '😤', label: '예민', value: 'sensitive' },
  { emoji: '😢', label: '힘듦', value: 'hard' },
];

const focusOptions = [
  { emoji: '🎯', label: '집중', value: 'focused' },
  { emoji: '😶', label: '보통', value: 'normal' },
  { emoji: '🌫️', label: '산만', value: 'distracted' },
];

const socialOptions = [
  { emoji: '👫', label: '활발', value: 'active' },
  { emoji: '😊', label: '보통', value: 'normal' },
  { emoji: '🙁', label: '조용', value: 'quiet' },
];

export default function FeedbackTab({ classId }: Props) {
  const {
    getStudentsInClass,
    attendance,
    feedback,
    classMoodFeedbacks,
    updateFeedback,
    updateClassMoodFeedback,
  } = useData();

  const [view, setView] = useState<'mood' | 'students'>('mood');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [taggingMode, setTaggingMode] = useState(false);
  const [note, setNote] = useState('');
  const [classMoodNote, setClassMoodNote] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const students = getStudentsInClass(classId);
  const classMood = classMoodFeedbacks[classId];

  // 출석한 학생들만 (결석자 제외)
  const presentStudents = useMemo(() => {
    return students.filter(s => {
      const att = attendance[makeKey(classId, s.id)];
      return !att || att.status !== 'absent';
    });
  }, [students, attendance, classId]);

  // 피드백이 이미 입력된 학생들
  const taggedStudents = useMemo(() => {
    return presentStudents.filter(s => {
      const fb = feedback[makeKey(classId, s.id)];
      return fb?.mood || fb?.focus || fb?.social;
    });
  }, [presentStudents, feedback, classId]);

  // 아직 태그 안 된 학생들 (태깅 모드용)
  const untaggedStudents = useMemo(() => {
    const taggedIds = new Set(taggedStudents.map(s => s.id));
    return presentStudents.filter(s => !taggedIds.has(s.id));
  }, [presentStudents, taggedStudents]);

  // ============================================================
  // 반 분위기 화면
  // ============================================================
  if (view === 'mood') {
    return (
      <div className="space-y-4">
        <Card>
          <div className="flex items-start gap-2 mb-1">
            <Sparkles size={16} className="text-blue-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">오늘 반 분위기</h3>
              <p className="text-xs text-gray-500 mt-0.5">전체 학생을 일일이 입력할 필요 없어요. 반 전체 분위기만 골라주세요.</p>
            </div>
          </div>
        </Card>

        <Card>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">분위기</h4>
          <EmojiSelector
            options={classMoodOptions}
            selected={classMood?.mood || null}
            onSelect={value => {
              updateClassMoodFeedback(classId, { mood: value });
              setToast({ message: '반 분위기 저장됨', type: 'success' });
            }}
          />
        </Card>

        <Card>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">한 줄 메모 (선택)</h4>
          <input
            type="text"
            value={classMoodNote || classMood?.note || ''}
            onChange={e => setClassMoodNote(e.target.value)}
            onBlur={() => {
              if (classMoodNote) {
                updateClassMoodFeedback(classId, { note: classMoodNote });
              }
            }}
            placeholder="예: 단원평가 직후라 다들 지쳐 있음"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
          />
        </Card>

        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3 mt-3">
            <div>
              <h3 className="font-semibold text-gray-900">인상적인 학생 (선택)</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                특별히 칭찬할 만하거나 걱정되는 학생만 추가하세요.
              </p>
            </div>
          </div>

          {taggedStudents.length === 0 ? (
            <button
              onClick={() => {
                setView('students');
                setTaggingMode(true);
              }}
              className="w-full py-4 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              학생 추가하기
            </button>
          ) : (
            <div className="space-y-2">
              {taggedStudents.map(s => {
                const fb = feedback[makeKey(classId, s.id)];
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedStudentId(s.id);
                      setView('students');
                      setTaggingMode(false);
                    }}
                    className="w-full bg-white rounded-xl shadow-sm p-3 flex items-center justify-between text-left hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-full bg-gray-100" />
                      <div>
                        <p className="font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">
                          {fb?.mood && moodOptions.find(o => o.value === fb.mood)?.emoji}{' '}
                          {fb?.focus && focusOptions.find(o => o.value === fb.focus)?.emoji}{' '}
                          {fb?.social && socialOptions.find(o => o.value === fb.social)?.emoji}
                          {fb?.note && ` · ${fb.note}`}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setView('students');
                  setTaggingMode(true);
                }}
                className="w-full py-3 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                추가
              </button>
            </div>
          )}
        </div>

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    );
  }

  // ============================================================
  // 학생별 화면
  // ============================================================

  // 학생 선택 화면 (태그 모드)
  if (taggingMode && !selectedStudentId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setView('mood')}>
            <ChevronLeft size={16} />
            돌아가기
          </Button>
          <span className="text-sm text-gray-500">학생 선택</span>
        </div>

        <Card>
          <p className="text-sm text-gray-600 mb-3">
            어떤 학생에 대해 입력할까요?
          </p>
          <div className="space-y-2">
            {untaggedStudents.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedStudentId(s.id);
                  setNote('');
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-full bg-gray-100" />
                <div>
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{getGradeLabel(s.grade)}</p>
                </div>
              </button>
            ))}
            {untaggedStudents.length === 0 && (
              <p className="text-center text-gray-500 py-4 text-sm">
                모든 학생이 이미 태그되었어요
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // 학생 입력 화면
  const currentStudent = students.find(s => s.id === selectedStudentId);
  if (!currentStudent) return null;

  const currentFeedback = feedback[makeKey(classId, currentStudent.id)];

  const handleSelect = (field: 'mood' | 'focus' | 'social', value: string) => {
    updateFeedback(classId, currentStudent.id, { [field]: value });
  };

  const handleSave = () => {
    if (note) {
      updateFeedback(classId, currentStudent.id, { note });
    }
    setToast({ message: `${currentStudent.name} 피드백 저장됨`, type: 'success' });
    setNote('');
    setSelectedStudentId(null);
    if (taggingMode) {
      setView('mood'); // 태그 모드면 분위기 화면으로 복귀
    }
  };

  const handleRemove = () => {
    updateFeedback(classId, currentStudent.id, { mood: '', focus: '', social: '', note: '' });
    setToast({ message: `${currentStudent.name} 피드백 삭제됨`, type: 'success' });
    setSelectedStudentId(null);
    setView('mood');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedStudentId(null);
            if (taggingMode) {
              // 학생 선택 화면으로
            } else {
              setView('mood');
            }
          }}
        >
          <ChevronLeft size={16} />
          돌아가기
        </Button>
        {currentFeedback && (currentFeedback.mood || currentFeedback.focus || currentFeedback.social) && (
          <button
            onClick={handleRemove}
            className="text-xs text-red-500 flex items-center gap-1 hover:opacity-80"
          >
            <X size={14} />
            삭제
          </button>
        )}
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <img
            src={currentStudent.avatar}
            alt={currentStudent.name}
            className="w-12 h-12 rounded-full bg-gray-100"
          />
          <div>
            <h2 className="text-base font-bold text-gray-900">{currentStudent.name}</h2>
            <p className="text-xs text-gray-500">{getGradeLabel(currentStudent.grade)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">기분</h3>
        <EmojiSelector
          options={moodOptions}
          selected={currentFeedback?.mood || null}
          onSelect={v => handleSelect('mood', v)}
        />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">집중</h3>
        <EmojiSelector
          options={focusOptions}
          selected={currentFeedback?.focus || null}
          onSelect={v => handleSelect('focus', v)}
        />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">교우</h3>
        <EmojiSelector
          options={socialOptions}
          selected={currentFeedback?.social || null}
          onSelect={v => handleSelect('social', v)}
        />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-2 text-center">메모 (선택)</h3>
        <input
          type="text"
          value={note || currentFeedback?.note || ''}
          onChange={e => setNote(e.target.value)}
          placeholder="오늘 특별한 점이 있었나요?"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm text-center"
        />
      </Card>

      <Button onClick={handleSave} className="w-full" size="lg">
        저장
      </Button>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
