import type { ReactNode } from 'react';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-[480px] min-h-screen bg-white/50 backdrop-blur-sm flex flex-col relative">
        <main className="flex-1 pb-20 overflow-y-auto">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
