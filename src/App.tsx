import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { AdminProvider } from './contexts/AdminContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TeacherInvitePage from './pages/TeacherInvitePage';
import MyClassesPage from './pages/MyClassesPage';
import ClassDetailPage from './pages/ClassDetailPage';
import ClassManagePage from './pages/ClassManagePage';
import ManageTeachersPage from './pages/ManageTeachersPage';
import ManageStudentsPage from './pages/ManageStudentsPage';
import ManageParentsPage from './pages/ManageParentsPage';
import ScorePage from './pages/ScorePage';
import StudentsPage from './pages/StudentsPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">불러오는 중...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />} />
      <Route path="/teacher-invite/:token" element={<TeacherInvitePage />} />

      <Route path="/" element={<ProtectedRoute><Layout><MyClassesPage /></Layout></ProtectedRoute>} />
      <Route path="/class/:classId" element={<ProtectedRoute><Layout><ClassDetailPage /></Layout></ProtectedRoute>} />
      <Route path="/score" element={<ProtectedRoute><Layout><ScorePage /></Layout></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><Layout><StudentsPage /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />

      <Route path="/manage/teachers" element={<ProtectedRoute><Layout><ManageTeachersPage /></Layout></ProtectedRoute>} />
      <Route path="/manage/students" element={<ProtectedRoute><Layout><ManageStudentsPage /></Layout></ProtectedRoute>} />
      <Route path="/manage/classes" element={<ProtectedRoute><Layout><ClassManagePage /></Layout></ProtectedRoute>} />
      <Route path="/manage/parents" element={<ProtectedRoute><Layout><ManageParentsPage /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <AdminProvider>
            <AppRoutes />
          </AdminProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
