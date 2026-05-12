import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import MyClassesPage from './pages/MyClassesPage';
import ClassDetailPage from './pages/ClassDetailPage';
import ClassManagePage from './pages/ClassManagePage';
import ScorePage from './pages/ScorePage';
import StudentsPage from './pages/StudentsPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <MyClassesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/class/:classId"
        element={
          <ProtectedRoute>
            <Layout>
              <ClassDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/manage"
        element={
          <ProtectedRoute>
            <Layout>
              <ClassManagePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/score"
        element={
          <ProtectedRoute>
            <Layout>
              <ScorePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute>
            <Layout>
              <StudentsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
