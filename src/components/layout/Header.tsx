import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightContent?: React.ReactNode;
}

export default function Header({ title, showBack = false, rightContent }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>
        {rightContent && <div>{rightContent}</div>}
      </div>
    </header>
  );
}
