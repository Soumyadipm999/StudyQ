import { User, StudyMaterial } from '../types';

// Configuration for real email and WhatsApp delivery
const DELIVERY_CONFIG = {
  defaultEmail: 'studyq.library@gmail.com',
  defaultWhatsApp: '+918653028954',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY
};

interface DeliveryResult {
  success: boolean;
  message: string;
  deliveryId?: string;
  error?: string;
}

interface DeliveryLog {
  id: string;
  type: 'email' | 'whatsapp';
  recipient: string;
  materialTitle?: string;
  status: 'sent' | 'failed';
  timestamp: string;
  error?: string;
  deliveryId?: string;
}

class RealNotificationService {
  private deliveryLogs: DeliveryLog[] = [];

  constructor() {
    this.loadDeliveryLogs();
  }

  // Send email using Supabase Edge Function
  async sendEmail(
    to: string,
    subject: string,
    content: string,
    materialTitle?: string,
    materialUrl?: string
  ): Promise<DeliveryResult> {
    try {
      if (!DELIVERY_CONFIG.supabaseUrl || !DELIVERY_CONFIG.supabaseKey) {
        throw new Error('Supabase configuration missing. Please connect to Supabase first.');
      }

      const emailHtml = this.formatEmailHTML(content, materialTitle, materialUrl);

      const response = await fetch(`${DELIVERY_CONFIG.supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DELIVERY_CONFIG.supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to,
          subject,
          html: emailHtml,
          materialTitle,
          materialUrl
        })
      });

      const result = await response.json();

      if (result.success) {
        this.logDelivery('email', to, 'sent', materialTitle, result.deliveryId);
        this.showNotification('Email Sent Successfully', `Email delivered to ${to}`, 'success');
        
        return {
          success: true,
          message: result.message,
          deliveryId: result.deliveryId
        };
      } else {
        this.logDelivery('email', to, 'failed', materialTitle, undefined, result.error);
        
        return {
          success: false,
          message: result.error || 'Failed to send email',
          error: result.error
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      this.logDelivery('email', to, 'failed', materialTitle, undefined, errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
    }
  }

  // Send WhatsApp using Supabase Edge Function
  async sendWhatsApp(
    to: string,
    message: string,
    materialTitle?: string,
    materialUrl?: string
  ): Promise<DeliveryResult> {
    try {
      if (!DELIVERY_CONFIG.supabaseUrl || !DELIVERY_CONFIG.supabaseKey) {
        throw new Error('Supabase configuration missing. Please connect to Supabase first.');
      }

      const response = await fetch(`${DELIVERY_CONFIG.supabaseUrl}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DELIVERY_CONFIG.supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to,
          message,
          materialTitle,
          materialUrl
        })
      });

      const result = await response.json();

      if (result.success) {
        this.logDelivery('whatsapp', to, 'sent', materialTitle, result.deliveryId);
        this.showNotification('WhatsApp Sent Successfully', `Message delivered to ${to}`, 'success');
        
        return {
          success: true,
          message: result.message,
          deliveryId: result.deliveryId
        };
      } else {
        this.logDelivery('whatsapp', to, 'failed', materialTitle, undefined, result.error);
        
        return {
          success: false,
          message: result.error || 'Failed to send WhatsApp message',
          error: result.error
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      this.logDelivery('whatsapp', to, 'failed', materialTitle, undefined, errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
    }
  }

  // Send login credentials via email
  async sendLoginCredentials(user: User, password: string): Promise<DeliveryResult> {
    const subject = 'Your StudyQ Login Credentials';
    const content = `
Dear ${user.firstName} ${user.lastName},

Your account has been created on StudyQ. Please use the following credentials to log in:

🔐 LOGIN DETAILS:
Username: ${user.username}
Password: ${password}
Login URL: ${window.location.origin}

📋 ACCOUNT INFORMATION:
Role: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
${user.role === 'student' ? `Academic Year: ${user.academicYear}\nCurrent Semester: ${user.currentSemester}` : ''}

⚠️ IMPORTANT SECURITY NOTICE:
- You will be required to change your password on first login
- Please keep your credentials secure and do not share them
- Contact your administrator if you have any issues

Best regards,
StudyQ Administration Team

---
This is an automated message from StudyQ.
If you did not expect this email, please contact support immediately.
    `;

    return await this.sendEmail(user.email, subject, content);
  }

  // Send password reset email
  async sendPasswordReset(user: User, newPassword: string): Promise<DeliveryResult> {
    const subject = 'Password Reset - StudyQ';
    const content = `
Dear ${user.firstName} ${user.lastName},

Your password has been reset by the system administrator.

🔐 NEW LOGIN CREDENTIALS:
Username: ${user.username}
New Password: ${newPassword}
Login URL: ${window.location.origin}

⚠️ SECURITY NOTICE:
- You will be required to change this password on your next login
- Please log in as soon as possible to secure your account
- Do not share these credentials with anyone

If you did not request this password reset, please contact your administrator immediately.

Best regards,
StudyQ Administration Team

---
This is an automated security notification from StudyQ.
    `;

    return await this.sendEmail(user.email, subject, content);
  }

  // Send material delivery via email and/or WhatsApp
  async sendMaterialDelivery(
    user: User,
    material: StudyMaterial,
    downloadUrl: string,
    deliveryMethod: 'email' | 'whatsapp' | 'both',
    customEmail?: string,
    customWhatsApp?: string
  ): Promise<{ email?: DeliveryResult; whatsapp?: DeliveryResult }> {
    const results: { email?: DeliveryResult; whatsapp?: DeliveryResult } = {};

    // Use custom contacts or defaults
    const emailRecipient = customEmail || DELIVERY_CONFIG.defaultEmail;
    const whatsappRecipient = customWhatsApp || DELIVERY_CONFIG.defaultWhatsApp;

    if (deliveryMethod === 'email' || deliveryMethod === 'both') {
      const subject = `StudyQ Material: ${material.title}`;
      const content = `
Dear Student,

Your requested study material is ready for download:

📚 MATERIAL DETAILS:
Title: ${material.title}
Subject: ${material.subject}
Semester: ${material.semester}
Academic Year: ${material.academicYear}
Description: ${material.description || 'No description provided'}

👤 REQUESTED BY:
Name: ${user.firstName} ${user.lastName}
Student ID: ${user.username}
Email: ${user.email}

🔗 DOWNLOAD LINK:
${downloadUrl}

⏰ DOWNLOAD INSTRUCTIONS:
- This link is valid for 24 hours
- Click the link above to download your material
- File size: ${this.formatFileSize(material.fileSize)}
- File type: ${material.fileType}

📱 NEED HELP?
Contact your teacher or administrator if you have any questions.

Best regards,
StudyQ Team

---
This material was delivered automatically through StudyQ Platform.
Material uploaded by: ${material.uploadedByName}
Delivery timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
      `;

      results.email = await this.sendEmail(emailRecipient, subject, content, material.title, downloadUrl);
    }

    if (deliveryMethod === 'whatsapp' || deliveryMethod === 'both') {
      const whatsappMessage = `
🎓 *StudyQ - Material Delivery*

Hi! Your study material is ready 📚

📖 *${material.title}*
📋 Subject: ${material.subject}
🎯 Semester: ${material.semester}
📅 Year: ${material.academicYear}

👤 *Requested by:*
${user.firstName} ${user.lastName} (${user.username})

🔗 *Download Link:*
${downloadUrl}

⏰ Valid for 24 hours
📱 Need help? Contact your teacher

*StudyQ Team*
Delivered: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
      `;

      results.whatsapp = await this.sendWhatsApp(whatsappRecipient, whatsappMessage, material.title, downloadUrl);
    }

    return results;
  }

  // Test email service
  async testEmailService(): Promise<DeliveryResult> {
    const subject = 'StudyQ Email Service Test';
    const content = `
🧪 StudyQ Email Service Test

This is a test email to verify that the StudyQ email delivery system is working correctly.

🔧 Test Details:
- Service: SendGrid API Integration
- Timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
- Test Email: ${DELIVERY_CONFIG.defaultEmail}
- Status: Email service is operational

✅ If you receive this email, the notification system is working properly.

Best regards,
StudyQ System Administration

---
This is an automated test message from StudyQ Platform.
    `;

    return await this.sendEmail(DELIVERY_CONFIG.defaultEmail, subject, content);
  }

  // Test WhatsApp service
  async testWhatsAppService(): Promise<DeliveryResult> {
    const message = `
🧪 *StudyQ WhatsApp Test*

This is a test message to verify WhatsApp notifications are working correctly.

🔧 *Test Details:*
- Service: Twilio WhatsApp Business API
- Timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
- Test Number: ${DELIVERY_CONFIG.defaultWhatsApp}

✅ WhatsApp service is operational

*StudyQ Team*
    `;

    return await this.sendWhatsApp(DELIVERY_CONFIG.defaultWhatsApp, message);
  }

  // Validate email format
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate Indian phone number format
  private validateIndianPhoneNumber(phone: string): boolean {
    // Remove spaces and special characters
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check for Indian mobile number patterns
    const indianMobileRegex = /^(\+91|91)?[6-9]\d{9}$/;
    return indianMobileRegex.test(cleanPhone);
  }

  // Format phone number for Indian numbers
  private formatIndianPhoneNumber(phone: string): string {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    if (cleanPhone.startsWith('+91')) {
      return cleanPhone;
    } else if (cleanPhone.startsWith('91')) {
      return '+' + cleanPhone;
    } else if (cleanPhone.length === 10) {
      return '+91' + cleanPhone;
    }
    
    return phone; // Return as-is if format is unclear
  }

  // Validate delivery contacts
  validateContacts(email?: string, whatsapp?: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (email && !this.validateEmail(email)) {
      errors.push('Invalid email format');
    }

    if (whatsapp && !this.validateIndianPhoneNumber(whatsapp)) {
      errors.push('Invalid Indian mobile number format. Use +91XXXXXXXXXX or 10-digit number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Format email content as HTML
  private formatEmailHTML(content: string, materialTitle?: string, materialUrl?: string): string {
    const htmlContent = content.replace(/\n/g, '<br>');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StudyQ Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563EB, #1D4ED8); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        .material-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2563EB; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 StudyQ</h1>
        <p>Smart Study Material Platform</p>
    </div>
    <div class="content">
        ${materialTitle ? `
        <div class="material-info">
            <h3>📖 ${materialTitle}</h3>
            ${materialUrl ? `<a href="${materialUrl}" class="button">📥 Download Material</a>` : ''}
        </div>
        ` : ''}
        <div style="white-space: pre-line;">${htmlContent}</div>
    </div>
    <div class="footer">
        <p>This is an automated message from StudyQ Platform.</p>
        <p>© ${new Date().getFullYear()} StudyQ. All rights reserved.</p>
    </div>
</body>
</html>
    `;
  }

  // Format file size
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Show browser notification
  private showNotification(title: string, body: string, type: 'success' | 'error' = 'success') {
    // Request notification permission if needed
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const icon = type === 'success' ? '✅' : '❌';
      new Notification(`${icon} ${title}`, {
        body,
        icon: '/favicon.ico'
      });
    }

    // Show toast notification
    this.showToast(title, body, type);
  }

  // Show toast notification
  private showToast(title: string, body: string, type: 'success' | 'error') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 transform transition-all duration-300 ${
      type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
    }`;
    
    toast.innerHTML = `
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="w-5 h-5 ${type === 'success' ? 'text-green-500' : 'text-red-500'}">
              ${type === 'success' ? '✅' : '❌'}
            </div>
          </div>
          <div class="ml-3 w-0 flex-1">
            <p class="text-sm font-medium text-gray-900">${title}</p>
            <p class="mt-1 text-sm text-gray-500">${body}</p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
              <span class="sr-only">Close</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);
  }

  // Log delivery attempts
  private logDelivery(
    type: 'email' | 'whatsapp',
    recipient: string,
    status: 'sent' | 'failed',
    materialTitle?: string,
    deliveryId?: string,
    error?: string
  ) {
    const log: DeliveryLog = {
      id: `${type.toUpperCase()}_${Date.now()}`,
      type,
      recipient,
      materialTitle,
      status,
      timestamp: new Date().toISOString(),
      deliveryId,
      error
    };

    this.deliveryLogs.unshift(log);
    
    // Keep only last 1000 logs
    if (this.deliveryLogs.length > 1000) {
      this.deliveryLogs = this.deliveryLogs.slice(0, 1000);
    }

    this.saveDeliveryLogs();
  }

  // Load delivery logs from localStorage
  private loadDeliveryLogs() {
    const stored = localStorage.getItem('studyq_delivery_logs');
    this.deliveryLogs = stored ? JSON.parse(stored) : [];
  }

  // Save delivery logs to localStorage
  private saveDeliveryLogs() {
    localStorage.setItem('studyq_delivery_logs', JSON.stringify(this.deliveryLogs));
  }

  // Get delivery logs
  getDeliveryLogs(): DeliveryLog[] {
    return this.deliveryLogs;
  }

  // Get default contacts
  getDefaultContacts() {
    return {
      email: DELIVERY_CONFIG.defaultEmail,
      whatsapp: DELIVERY_CONFIG.defaultWhatsApp
    };
  }

  // Clear old logs
  clearOldLogs(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filteredLogs = this.deliveryLogs.filter(log => 
      new Date(log.timestamp) > cutoffDate
    );

    const removed = this.deliveryLogs.length - filteredLogs.length;
    this.deliveryLogs = filteredLogs;
    this.saveDeliveryLogs();
    
    return {
      removed,
      remaining: filteredLogs.length
    };
  }
}

// Create singleton instance
export const realNotificationService = new RealNotificationService();
export default realNotificationService;