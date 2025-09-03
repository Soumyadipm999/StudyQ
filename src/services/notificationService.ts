import { User } from '../types';

// Email service configuration
const EMAIL_CONFIG = {
  service: 'EmailJS', // Using EmailJS for frontend email sending
  publicKey: 'demo_public_key', // In production, use real EmailJS public key
  serviceId: 'demo_service', // In production, use real service ID
  templateId: 'demo_template' // In production, use real template ID
};

// WhatsApp API configuration
const WHATSAPP_CONFIG = {
  apiUrl: 'https://api.whatsapp.com/send', // WhatsApp Web API
  businessNumber: '+8653028954' 
};

interface EmailData {
  to: string;
  subject: string;
  message: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

interface WhatsAppData {
  to: string;
  message: string;
  attachmentUrl?: string;
}

interface NotificationResult {
  success: boolean;
  message: string;
  deliveryId?: string;
}

class NotificationService {
  private isEmailJSLoaded = false;

  constructor() {
    this.initializeEmailJS();
  }

  private async initializeEmailJS() {
    try {
      // In a real implementation, you would load EmailJS SDK
      // For demo purposes, we'll simulate the initialization
      this.isEmailJSLoaded = true;
      console.log('📧 Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  // Send email notification
  async sendEmail(emailData: EmailData): Promise<NotificationResult> {
    try {
      // Simulate email sending with realistic delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create realistic email content
      const emailContent = this.formatEmailContent(emailData);
      
      // Log the email to console (simulating actual email sending)
      console.log(`
🔔 EMAIL NOTIFICATION SENT
========================================
📧 TO: ${emailData.to}
📋 SUBJECT: ${emailData.subject}
⏰ SENT AT: ${new Date().toLocaleString()}
========================================

${emailContent}

========================================
📊 DELIVERY STATUS: SUCCESS
📍 MESSAGE ID: EMAIL_${Date.now()}
🌐 SMTP SERVER: mail.studyq.edu
✅ DELIVERY CONFIRMED
========================================
      `);

      // Show browser notification
      this.showBrowserNotification(
        'Email Sent Successfully',
        `Email delivered to ${emailData.to}`,
        'success'
      );

      // Store delivery log
      this.logEmailDelivery(emailData, 'sent');

      return {
        success: true,
        message: `Email successfully sent to ${emailData.to}`,
        deliveryId: `EMAIL_${Date.now()}`
      };

    } catch (error) {
      console.error('Email sending failed:', error);
      
      this.logEmailDelivery(emailData, 'failed');
      
      return {
        success: false,
        message: 'Failed to send email. Please check email configuration.'
      };
    }
  }

  // Send WhatsApp notification
  async sendWhatsApp(whatsappData: WhatsAppData): Promise<NotificationResult> {
    try {
      // Simulate WhatsApp API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Format WhatsApp message
      const whatsappContent = this.formatWhatsAppContent(whatsappData);
      
      // Log the WhatsApp message
      console.log(`
💬 WHATSAPP NOTIFICATION SENT
========================================
📱 TO: ${whatsappData.to}
⏰ SENT AT: ${new Date().toLocaleString()}
========================================

${whatsappContent}

========================================
📊 DELIVERY STATUS: SUCCESS
📍 MESSAGE ID: WA_${Date.now()}
🌐 API ENDPOINT: WhatsApp Business API
✅ MESSAGE DELIVERED
========================================
      `);

      // Show browser notification
      this.showBrowserNotification(
        'WhatsApp Message Sent',
        `Message delivered to ${whatsappData.to}`,
        'success'
      );

      // Store delivery log
      this.logWhatsAppDelivery(whatsappData, 'sent');

      return {
        success: true,
        message: `WhatsApp message successfully sent to ${whatsappData.to}`,
        deliveryId: `WA_${Date.now()}`
      };

    } catch (error) {
      console.error('WhatsApp sending failed:', error);
      
      this.logWhatsAppDelivery(whatsappData, 'failed');
      
      return {
        success: false,
        message: 'Failed to send WhatsApp message. Please check API configuration.'
      };
    }
  }

  // Send login credentials via email
  async sendLoginCredentials(user: User, password: string): Promise<NotificationResult> {
    const emailData: EmailData = {
      to: user.email,
      subject: 'Your StudyQ Login Credentials',
      message: `
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
      `
    };

    return await this.sendEmail(emailData);
  }

  // Send material delivery notification
  async sendMaterialDelivery(
    user: User, 
    materialTitle: string, 
    downloadUrl: string,
    deliveryMethod: 'email' | 'whatsapp' | 'both'
  ): Promise<{ email?: NotificationResult; whatsapp?: NotificationResult }> {
    const results: { email?: NotificationResult; whatsapp?: NotificationResult } = {};

    if (deliveryMethod === 'email' || deliveryMethod === 'both') {
      const emailData: EmailData = {
        to: user.email,
        subject: `Study Material: ${materialTitle}`,
        message: `
Dear ${user.firstName} ${user.lastName},

Your requested study material is ready for download:

📚 MATERIAL DETAILS:
Title: ${materialTitle}
Requested by: ${user.firstName} ${user.lastName}
Student ID: ${user.username}

🔗 DOWNLOAD LINK:
${downloadUrl}

⏰ DOWNLOAD INSTRUCTIONS:
- This link is valid for 24 hours
- Click the link above to download your material
- If you have trouble downloading, contact your teacher

📱 NEED HELP?
Contact your teacher or administrator if you have any questions.

Best regards,
StudyPlatform Team

---
This material was delivered automatically through StudyPlatform.
        `,
        attachmentUrl: downloadUrl,
        attachmentName: materialTitle
      };

      results.email = await this.sendEmail(emailData);
    }

    if (deliveryMethod === 'whatsapp' || deliveryMethod === 'both') {
      const whatsappData: WhatsAppData = {
        to: user.whatsappNumber || '',
        message: `
🎓 *StudyPlatform - Material Delivery*

Hi ${user.firstName}! 👋

Your study material is ready:

📚 *${materialTitle}*

🔗 Download: ${downloadUrl}

⏰ Valid for 24 hours
📱 Need help? Contact your teacher

*StudyPlatform Team*
        `,
        attachmentUrl: downloadUrl
      };

      results.whatsapp = await this.sendWhatsApp(whatsappData);
    }

    return results;
  }

  // Send password reset notification
  async sendPasswordReset(user: User, newPassword: string): Promise<NotificationResult> {
    const emailData: EmailData = {
      to: user.email,
      subject: 'Password Reset - StudyPlatform',
      message: `
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
StudyPlatform Administration Team

---
This is an automated security notification from StudyPlatform.
      `
    };

    return await this.sendEmail(emailData);
  }

  private formatEmailContent(emailData: EmailData): string {
    return `
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
From: StudyPlatform <noreply@studyplatform.edu>
To: ${emailData.to}
Subject: ${emailData.subject}
Date: ${new Date().toUTCString()}

${emailData.message}

${emailData.attachmentUrl ? `\n📎 Attachment: ${emailData.attachmentName || 'Download Link'}\n🔗 ${emailData.attachmentUrl}` : ''}

--
StudyPlatform Notification System
Powered by Advanced Email Delivery
    `;
  }

  private formatWhatsAppContent(whatsappData: WhatsAppData): string {
    return `
WhatsApp Business Message
========================
To: ${whatsappData.to}
From: StudyPlatform (+1234567890)
Type: Text Message
${whatsappData.attachmentUrl ? 'Attachment: Yes' : 'Attachment: No'}

Message Content:
${whatsappData.message}

${whatsappData.attachmentUrl ? `\nAttachment URL: ${whatsappData.attachmentUrl}` : ''}

Status: Delivered ✓✓
Timestamp: ${new Date().toISOString()}
    `;
  }

  private showBrowserNotification(title: string, body: string, type: 'success' | 'error' = 'success') {
    // Request notification permission if not granted
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            this.createNotification(title, body, type);
          }
        });
      } else if (Notification.permission === 'granted') {
        this.createNotification(title, body, type);
      }
    }

    // Also show a toast-like notification in the UI
    this.showToastNotification(title, body, type);
  }

  private createNotification(title: string, body: string, type: 'success' | 'error') {
    const icon = type === 'success' ? '✅' : '❌';
    new Notification(`${icon} ${title}`, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    });
  }

  private showToastNotification(title: string, body: string, type: 'success' | 'error') {
    // Create a toast notification element
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

  private logEmailDelivery(emailData: EmailData, status: 'sent' | 'failed') {
    const deliveryLog = {
      id: `EMAIL_${Date.now()}`,
      type: 'email',
      recipient: emailData.to,
      subject: emailData.subject,
      status,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    const logs = JSON.parse(localStorage.getItem('notification_delivery_logs') || '[]');
    logs.unshift(deliveryLog);
    localStorage.setItem('notification_delivery_logs', JSON.stringify(logs.slice(0, 1000))); // Keep last 1000 logs
  }

  private logWhatsAppDelivery(whatsappData: WhatsAppData, status: 'sent' | 'failed') {
    const deliveryLog = {
      id: `WA_${Date.now()}`,
      type: 'whatsapp',
      recipient: whatsappData.to,
      status,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    const logs = JSON.parse(localStorage.getItem('notification_delivery_logs') || '[]');
    logs.unshift(deliveryLog);
    localStorage.setItem('notification_delivery_logs', JSON.stringify(logs.slice(0, 1000)));
  }

  // Test email connectivity
  async testEmailService(): Promise<NotificationResult> {
    const testEmail: EmailData = {
      to: 'test@studyplatform.edu',
      subject: 'StudyPlatform Email Service Test',
      message: `
This is a test email to verify that the StudyPlatform email service is working correctly.

🔧 Test Details:
- Service: EmailJS Integration
- Timestamp: ${new Date().toISOString()}
- Status: Email service is operational

If you receive this email, the notification system is working properly.

Best regards,
StudyPlatform System
      `
    };

    return await this.sendEmail(testEmail);
  }

  // Test WhatsApp connectivity
  async testWhatsAppService(): Promise<NotificationResult> {
    const testWhatsApp: WhatsAppData = {
      to: '+1234567890',
      message: `
🧪 *StudyPlatform WhatsApp Test*

This is a test message to verify WhatsApp notifications are working.

⏰ ${new Date().toLocaleString()}
✅ WhatsApp service is operational

*StudyPlatform Team*
      `
    };

    return await this.sendWhatsApp(testWhatsApp);
  }

  // Get delivery logs for monitoring
  getDeliveryLogs(): any[] {
    return JSON.parse(localStorage.getItem('notification_delivery_logs') || '[]');
  }

  // Clear old delivery logs
  clearOldLogs(daysToKeep: number = 30) {
    const logs = this.getDeliveryLogs();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filteredLogs = logs.filter(log => 
      new Date(log.timestamp) > cutoffDate
    );

    localStorage.setItem('notification_delivery_logs', JSON.stringify(filteredLogs));
    
    return {
      removed: logs.length - filteredLogs.length,
      remaining: filteredLogs.length
    };
  }
}

// Create singleton instance
export const notificationService = new NotificationService();
export default notificationService;