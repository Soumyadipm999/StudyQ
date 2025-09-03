import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import PasswordChangeModal from './components/auth/PasswordChangeModal';
import AdminDashboard from './components/admin/AdminDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import StudentDashboard from './components/student/StudentDashboard';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Show password change modal if required
  if (user?.mustChangePassword) {
    return (
      <>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to StudyQ</h2>
            <p className="text-gray-600">Please change your password to continue</p>
          </div>
        </div>
        <PasswordChangeModal
          isOpen={true}
          onClose={() => {}}
          isForced={true}
        />
      </>
    );
  }

  // Route to appropriate dashboard based on user role
  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">Invalid user role</p>
          </div>
        </div>
      );
  }
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
