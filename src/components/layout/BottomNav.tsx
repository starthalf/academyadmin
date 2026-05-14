import { NavLink } from 'react-router-dom';
import { Home, History, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: '홈' },
  { to: '/history', icon: History, label: '기록' },
  { to: '/settings', icon: Settings, label: '설정' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 z-50">
      <div className="flex justify-around items-center h-16 px-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Icon className="w-5 h-5" strokeWidth={2} />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
