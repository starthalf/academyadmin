import { Sparkles } from 'lucide-react';

interface SeasonInsightCardProps {
  insight: string;
}

export default function SeasonInsightCard({ insight }: SeasonInsightCardProps) {
  return (
    <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl p-5 shadow-sm border border-primary-100 animate-slideUp">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-600" />
        </div>
        <h3 className="font-semibold text-gray-800">이번 주 인사이트</h3>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed">{insight}</p>
    </div>
  );
}
