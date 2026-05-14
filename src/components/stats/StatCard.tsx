import { getStatColor } from '../../utils/statUtils';

interface StatCardProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
      {icon && (
        <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
          {icon}
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">{label}</span>
        <span className={`text-xl font-bold ${getStatColor(value)}`}>{value}점</span>
      </div>
    </div>
  );
}
