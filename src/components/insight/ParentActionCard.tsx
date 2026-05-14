import { useState } from 'react';
import {
  Star,
  Heart,
  Cookie,
  Moon,
  ThumbsUp,
  Gamepad2,
  Ear,
  HeartHandshake,
} from 'lucide-react';
import { parentActions } from '../../data/mockData';

const iconMap: Record<string, React.ElementType> = {
  star: Star,
  heart: Heart,
  cookie: Cookie,
  moon: Moon,
  'thumbs-up': ThumbsUp,
  'gamepad-2': Gamepad2,
  ear: Ear,
  'hand-heart': HeartHandshake,
};

interface ParentActionCardProps {
  recommendedActions: string[];
}

export default function ParentActionCard({ recommendedActions }: ParentActionCardProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const handleActionClick = (actionId: string) => {
    setSelectedAction(selectedAction === actionId ? null : actionId);
  };

  const selectedActionData = selectedAction
    ? parentActions.find((a) => a.id === selectedAction)
    : null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-slideUp">
      <h3 className="font-semibold text-gray-800 mb-4">오늘의 부모 액션</h3>

      <div className="relative">
        {selectedActionData && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-10 animate-slideDown">
            <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-[200px] text-center">
              {selectedActionData.description}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-800" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          {parentActions.map((action) => {
            const Icon = iconMap[action.icon] || Star;
            const isRecommended = recommendedActions.includes(action.id);
            const isSelected = selectedAction === action.id;

            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 bg-white shadow-sm border ${
                  isSelected
                    ? 'ring-2 ring-primary-500 border-primary-200 scale-105'
                    : isRecommended
                    ? 'border-primary-200 hover:border-primary-300'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-primary-100 text-primary-600'
                      : isRecommended
                      ? 'bg-primary-50 text-primary-500'
                      : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs font-medium ${
                    isSelected || isRecommended ? 'text-primary-700' : 'text-gray-600'
                  }`}
                >
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        추천 액션을 눌러 상세 설명을 확인하세요
      </p>
    </div>
  );
}
