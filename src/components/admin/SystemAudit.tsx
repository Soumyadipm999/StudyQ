import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Calendar, Clock } from 'lucide-react';
import { AuditLog } from '../../types';
import { getAuditLogs, getAuditLogsByUser, getAuditLogsByDateRange } from '../../utils/audit';
import { getStoredUsers } from '../../utils/auth';

const SystemAudit: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    userId: 'all',
    action: 'all',
    startDate: '',
    endDate: ''
  });
  const [users, setUsers] = useState<any[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  useEffect(() => {
    loadAuditLogs();
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [auditLogs, filters]);

  const loadAuditLogs = () => {
    const logs = getAuditLogs();
    setAuditLogs(logs);
    
    // Extract unique actions
    const uniqueActions = Array.from(new Set(logs.map(log => log.action)));
    setActions(uniqueActions);
  };

  const loadUsers = () => {
    const allUsers = getStoredUsers();
    setUsers(allUsers);
  };

  const applyFilters = () => {
    let filtered = auditLogs;

    // Search filter
    if (filters.searchTerm) {
      filtered = filtered.filter(log =>
        log.userName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // User filter
    if (filters.userId !== 'all') {
      filtered = filtered.filter(log => log.userId === filters.userId);
    }

    // Action filter
    if (filters.action !== 'all') {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    // Date range filter
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= start && logDate <= end;
      });
    }

    setFilteredLogs(filtered);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      userId: 'all',
      action: 'all',
      startDate: '',
      endDate: ''
    });
  };

  const exportLogs = () => {
    const csv = [
      'Timestamp,User,Action,Details,IP Address,User Agent',
      ...filteredLogs.map(log =>
        `${log.timestamp},"${log.userName}","${log.action}","${log.details}","${log.ipAddress || ''}","${log.userAgent || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-green-100 text-green-800';
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800';
      case 'LOGIN_FAILED':
        return 'bg-red-100 text-red-800';
      case 'PASSWORD_CHANGE':
        return 'bg-blue-100 text-blue-800';
      case 'USER_CREATE':
        return 'bg-purple-100 text-purple-800';
      case 'USER_DELETE':
        return 'bg-red-100 text-red-800';
      case 'MATERIAL_UPLOAD':
        return 'bg-indigo-100 text-indigo-800';
      case 'MATERIAL_DOWNLOAD':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">System Audit Log</h2>
        <button
          onClick={exportLogs}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Search logs..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User
            </label>
            <select
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Actions</option>
              {actions.map(action => (
                <option key={action} value={action}>
                  {action.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredLogs.length} of {auditLogs.length} log entries
          </p>
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                    <div className="text-sm text-gray-500">ID: {log.userId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                    <div className="truncate" title={log.details}>
                      {log.details}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ipAddress || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No audit logs found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemAudit;