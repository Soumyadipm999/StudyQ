import { AuditLog } from '../types';

const AUDIT_STORAGE_KEY = 'study_platform_audit_logs';

export const logAuditEvent = (
  userId: string,
  userName: string,
  action: string,
  details: string,
  ipAddress?: string,
  userAgent?: string
): void => {
  const auditLog: AuditLog = {
    id: Date.now().toString(),
    userId,
    userName,
    action,
    details,
    timestamp: new Date().toISOString(),
    ipAddress,
    userAgent
  };

  const logs = getAuditLogs();
  logs.unshift(auditLog); // Add to beginning for reverse chronological order
  
  // Keep only last 1000 logs to prevent storage overflow
  if (logs.length > 1000) {
    logs.splice(1000);
  }

  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
};

export const getAuditLogs = (): AuditLog[] => {
  const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getAuditLogsByUser = (userId: string): AuditLog[] => {
  return getAuditLogs().filter(log => log.userId === userId);
};

export const getAuditLogsByDateRange = (startDate: string, endDate: string): AuditLog[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return getAuditLogs().filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= start && logDate <= end;
  });
};