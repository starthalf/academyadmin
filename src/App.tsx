import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChildDataProvider } from './contexts/ChildDataContext';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import InvitePage from './pages/InvitePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-[480px] h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">불러오는 중...</p>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/home' : '/login'} replace />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/home" replace /> : <LoginPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />

      <Route path="/home" element={
        <ProtectedRoute>
          <ChildDataProvider>
            <AppLayout><HomePage /></AppLayout>
          </ChildDataProvider>
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <ChildDataProvider>
            <AppLayout><HistoryPage /></AppLayout>
          </ChildDataProvider>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <ChildDataProvider>
            <AppLayout><SettingsPage /></AppLayout>
          </ChildDataProvider>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
