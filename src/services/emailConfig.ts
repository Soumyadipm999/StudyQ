import emailjs from '@emailjs/browser';

// EmailJS Configuration
export const EMAILJS_CONFIG = {
  publicKey: 'YOUR_EMAILJS_PUBLIC_KEY', // Replace with your EmailJS public key
  serviceId: 'service_aafmmyo', // Your EmailJS service ID
  templateId: 'YOUR_TEMPLATE_ID', // Replace with your EmailJS template ID
};

// EmailJS service class
export class EmailJSService {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      if (EMAILJS_CONFIG.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY') {
        emailjs.init(EMAILJS_CONFIG.publicKey);
        this.isInitialized = true;
        console.log('✅ EmailJS initialized with service ID:', EMAILJS_CONFIG.serviceId);
      } else {
        console.warn('⚠️ EmailJS not configured. Please set your public key and template ID.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize EmailJS:', error);
    }
  }

  async sendEmail(templateParams: Record<string, any>): Promise<{
    success: boolean;
    message: string;
    response?: any;
  }> {
    if (!this.isInitialized) {
      return {
        success: false,
        message: 'EmailJS not initialized. Please check your configuration.'
      };
    }

    if (EMAILJS_CONFIG.templateId === 'YOUR_TEMPLATE_ID') {
      return {
        success: false,
        message: 'EmailJS template ID not configured. Please set your template ID.'
      };
    }

    try {
      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );

      return {
        success: true,
        message: 'Email sent successfully via EmailJS',
        response
      };
    } catch (error) {
      console.error('EmailJS send error:', error);
      return {
        success: false,
        message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Test EmailJS configuration
  async testConfiguration(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    if (!this.isInitialized) {
      return {
        success: false,
        message: 'EmailJS not initialized'
      };
    }

    const testParams = {
      to_email: 'test@example.com',
      subject: 'EmailJS Configuration Test',
      message: 'This is a test email to verify EmailJS configuration.',
      from_name: 'StudyQ Platform'
    };

    try {
      const result = await this.sendEmail(testParams);
      return {
        success: result.success,
        message: result.success ? 'EmailJS configuration test successful' : result.message,
        details: result.response
      };
    } catch (error) {
      return {
        success: false,
        message: `Configuration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get configuration status
  getConfigurationStatus(): {
    isConfigured: boolean;
    missingFields: string[];
    serviceId: string;
  } {
    const missingFields: string[] = [];
    
    if (EMAILJS_CONFIG.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
      missingFields.push('Public Key');
    }
    
    if (EMAILJS_CONFIG.templateId === 'YOUR_TEMPLATE_ID') {
      missingFields.push('Template ID');
    }

    return {
      isConfigured: missingFields.length === 0,
      missingFields,
      serviceId: EMAILJS_CONFIG.serviceId
    };
  }
}

// Create singleton instance
export const emailJSService = new EmailJSService();
export default emailJSService;