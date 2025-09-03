import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Activity, UserPlus, Download, Eye, Settings } from 'lucide-react';
import Layout from '../common/Layout';
import { getStoredUsers } from '../../utils/auth';
import { getStoredMaterials } from '../../utils/materials';
import { getAuditLogs } from '../../utils/audit';
import { getDeliveryLogs } from '../../utils/materials';
import { User, StudyMaterial, AuditLog, DeliveryLog } from '../../types';
import UserManagement from './UserManagement';
import SystemAudit from './SystemAudit';
import SystemSettings from './SystemSettings';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMaterials: 0,
    totalDeliveries: 0,
    recentActivity: [] as AuditLog[]
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const users = getStoredUsers();
    const materials = getStoredMaterials();
    const auditLogs = getAuditLogs();
    const deliveryLogs = getDeliveryLogs();

    setStats({
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      totalMaterials: materials.filter(m => m.isActive).length,
      totalDeliveries: deliveryLogs.length,
      recentActivity: auditLogs.slice(0, 5)
    });
  };

  const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; subtitle?: string }> = ({ icon, title, value, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="p-3 bg-blue-100 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );

  const ActivityItem: React.FC<{ log: AuditLog }> = ({ log }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <Activity className="w-4 h-4 text-gray-500" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{log.userName}</p>
        <p className="text-sm text-gray-500 truncate">{log.action}: {log.details}</p>
      </div>
      <div className="text-xs text-gray-400">
        {new Date(log.timestamp).toLocaleDateString()}
      </div>
    </div>
  );

  const TabButton: React.FC<{ id: string; label: string; icon: React.ReactNode }> = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        activeTab === id
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement onUserChange={loadStats} />;
      case 'audit':
        return <SystemAudit />;
      case 'settings':
        return <SystemSettings />;
      default:
        return (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={<Users className="w-6 h-6 text-blue-600" />}
                title="Total Users"
                value={stats.totalUsers}
                subtitle={`${stats.activeUsers} active`}
              />
              <StatCard
                icon={<BookOpen className="w-6 h-6 text-green-600" />}
                title="Study Materials"
                value={stats.totalMaterials}
              />
              <StatCard
                icon={<Download className="w-6 h-6 text-purple-600" />}
                title="Total Deliveries"
                value={stats.totalDeliveries}
              />
              <StatCard
                icon={<Activity className="w-6 h-6 text-orange-600" />}
                title="System Activity"
                value="Active"
                subtitle="All systems operational"
              />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map(log => (
                    <ActivityItem key={log.id} log={log} />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-wrap gap-2">
            <TabButton id="overview" label="Overview" icon={<Eye className="w-4 h-4" />} />
            <TabButton id="users" label="User Management" icon={<Users className="w-4 h-4" />} />
            <TabButton id="audit" label="System Audit" icon={<Activity className="w-4 h-4" />} />
            <TabButton id="settings" label="Settings" icon={<Settings className="w-4 h-4" />} />
          </div>
        </div>

        {/* Tab Content */}
        {renderContent()}
      </div>
    </Layout>
  );
};

export default AdminDashboard;