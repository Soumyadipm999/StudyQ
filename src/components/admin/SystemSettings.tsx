import React, { useState } from 'react';
import { Save, Shield, Mail, Database, AlertTriangle } from 'lucide-react';

import { notificationService } from '../../services/notificationService';

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    passwordMinLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    requireLowercase: true,
    sessionTimeout: 120,
    emailNotifications: true,
    auditRetentionDays: 90
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseInt(value) : value
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    // In production, this would save to a backend API
    localStorage.setItem('study_platform_settings', JSON.stringify(settings));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestEmail = async () => {
    const result = await notificationService.testEmailService();
    if (result.success) {
      alert('✅ Email test successful! Check the browser console for details.');
    } else {
      alert(`❌ Email test failed: ${result.message}`);
    }
  };

  const handleTestWhatsApp = async () => {
    const result = await notificationService.testWhatsAppService();
    if (result.success) {
      alert('✅ WhatsApp test successful! Check the browser console for details.');
    } else {
      alert(`❌ WhatsApp test failed: ${result.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        <button
          onClick={handleSave}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
            isSaved
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Shield className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Login Attempts
            </label>
            <input
              type="number"
              name="maxLoginAttempts"
              value={settings.maxLoginAttempts}
              onChange={handleInputChange}
              min="1"
              max="10"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Number of failed attempts before account lockout</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lockout Duration (minutes)
            </label>
            <input
              type="number"
              name="lockoutDuration"
              value={settings.lockoutDuration}
              onChange={handleInputChange}
              min="5"
              max="60"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">How long accounts remain locked</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              name="sessionTimeout"
              value={settings.sessionTimeout}
              onChange={handleInputChange}
              min="30"
              max="480"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Automatic logout after inactivity</p>
          </div>
        </div>
      </div>

      {/* Password Policy */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Shield className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-medium text-gray-900">Password Policy</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Password Length
            </label>
            <input
              type="number"
              name="passwordMinLength"
              value={settings.passwordMinLength}
              onChange={handleInputChange}
              min="6"
              max="20"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="requireUppercase"
                checked={settings.requireUppercase}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Require uppercase letters
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="requireLowercase"
                checked={settings.requireLowercase}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Require lowercase letters
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="requireNumbers"
                checked={settings.requireNumbers}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Require numbers
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="requireSpecialChars"
                checked={settings.requireSpecialChars}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Require special characters
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Email & Notifications */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Mail className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-medium text-gray-900">Email & Notifications</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="emailNotifications"
              checked={settings.emailNotifications}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Send email notifications for system events
            </label>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Database className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-medium text-gray-900">Data Management</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audit Log Retention (days)
            </label>
            <input
              type="number"
              name="auditRetentionDays"
              value={settings.auditRetentionDays}
              onChange={handleInputChange}
              min="30"
              max="365"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">How long to keep audit logs</p>
          </div>
        </div>
      </div>

      {/* System Maintenance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-6">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-medium text-gray-900">System Maintenance</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={handleTestEmail}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Mail className="w-4 h-4 mr-2" />
            Test Email Service
          </button>

          <button 
            onClick={handleTestWhatsApp}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Test WhatsApp Service
          </button>

          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
            <Database className="w-4 h-4 mr-2" />
            Backup Database
          </button>

          <button 
            onClick={() => {
              const result = notificationService.clearOldLogs(30);
              alert(`Cleanup completed!\nRemoved: ${result.removed} old logs\nRemaining: ${result.remaining} logs`);
            }}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Clear Old Notification Logs
          </button>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Maintenance Notice
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  System maintenance operations should be performed during off-peak hours. 
                  Always ensure you have a recent backup before making changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;