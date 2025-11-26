
import { UserRole } from '../types';
import { authService } from './authService';

class EmailService {
  
  /**
   * Simulates sending an automated email based on system triggers.
   */
  public async sendAlertEmail(
    targetRole: UserRole | 'maintenance_team' | 'procurement_team', 
    subject: string, 
    htmlBody: string
  ) {
    // In a real app, this would call a backend API (SendGrid/AWS SES)
    console.log(`[EMAIL SENT] To: ${targetRole.toUpperCase()} | Subject: ${subject}`);
    
    // Log to security audit
    authService.logEvent(
      'SYSTEM_AUTOMATION', 
      'Nexus AI Mailer', 
      'EMAIL_SENT', 
      `Sent alert to ${targetRole}: ${subject}`, 
      'SUCCESS'
    );

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  }
}

export const emailService = new EmailService();
