import { NavLink } from 'react-router-dom';
import { Home, Users, ClipboardList, Settings } from 'lucide-react';

const navItems = [
  { icon: Home, label: '홈', path: '/' },
  { icon: Users, label: '학생', path: '/students' },
  { icon: ClipboardList, label: '성적', path: '/score' },
  { icon: Settings, label: '설정', path: '/settings' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100">
      <div className="max-w-[480px] mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <item.icon size={22} />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
