import React, { useState } from 'react';
import { Eye, EyeOff, BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types';

const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    const result = await login(credentials);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user starts typing
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-full">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">StudyPlatform</h2>
          <p className="mt-2 text-sm text-gray-600">StudyQ - Smart Study Material Platform</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={credentials.username}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                placeholder="Enter your username"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3">Demo credentials:</p>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="font-medium">Admin:</span>
                <span>admin / admin123</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Teacher:</span>
                <span>prof.smith / teacher123</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Student:</span>
                <span>john.doe / student123 (Sem 3)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Student 2:</span>
                <span>jane.smith / student123 (Sem 5)</span>
              </div>
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-medium text-yellow-800">For newly created users:</p>
                <p className="text-yellow-700">Use the temporary password provided when the user was created.</p>
              </div>
            </div>
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              <p className="font-medium mb-1">📧 Email Notifications:</p>
              <p>When credentials are sent, check the browser console to see the simulated email content.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;