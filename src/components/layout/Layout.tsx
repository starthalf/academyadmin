import { ReactNode } from 'react';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[480px] mx-auto pb-20 min-h-screen bg-gray-50 shadow-sm">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
