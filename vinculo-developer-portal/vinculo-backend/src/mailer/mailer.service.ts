import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService implements OnModuleInit {
  private readonly logger = new Logger(MailerService.name);
  private transporter!: nodemailer.Transporter;
  private from: string = '';
  private ready = false;

  async onModuleInit(): Promise<void> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // If explicit SMTP credentials are provided, use them
    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: smtpUser, pass: smtpPass },
      });
      this.from = process.env.SMTP_FROM || `"Vínculo Portal" <${smtpUser}>`;
      this.ready = true;
      this.logger.log(`SMTP configured: ${smtpHost} (user: ${smtpUser})`);
      return;
    }

    // Otherwise, auto-create an Ethereal test account (free, real SMTP)
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      this.from = `"Vínculo Portal" <${testAccount.user}>`;
      this.ready = true;
      this.logger.log('──────────────────────────────────────────');
      this.logger.log('📧 SMTP Ethereal (test) account created');
      this.logger.log(`   User: ${testAccount.user}`);
      this.logger.log(`   Pass: ${testAccount.pass}`);
      this.logger.log('   Inbox: https://ethereal.email/login');
      this.logger.log('   Los correos OTP se pueden ver en el inbox de Ethereal');
      this.logger.log('──────────────────────────────────────────');
    } catch (err) {
      this.logger.warn('Could not create Ethereal account. Email sending disabled.');
      this.logger.warn('OTP codes will only be available in the API response (dev mode).');
      this.ready = false;
    }
  }

  /**
   * Sends an OTP email with Vínculo branding.
   * Returns the Ethereal preview URL if available.
   */
  async sendOtpEmail(email: string, code: string): Promise<string | null> {
    if (!this.ready) {
      this.logger.warn(`Email not configured — OTP for ${email}: ${code}`);
      return null;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: 'Vínculo — Tu código de acceso',
        html: this.buildOtpEmailHtml(code),
      });
      this.logger.log(`✅ OTP email sent to ${email}`);

      // Show Ethereal preview URL if available
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`📬 Preview: ${previewUrl}`);
      }
      return previewUrl || null;
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
      throw error;
    }
  }

  /**
   * Sends a generic notification email.
   */
  async sendNotificationEmail(
    email: string,
    subject: string,
    html: string,
  ): Promise<void> {
    if (!this.ready) {
      this.logger.warn(`Email not configured — skipping notification to ${email}`);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject,
        html,
      });
      this.logger.log(`Notification email sent to ${email}`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`📬 Preview: ${previewUrl}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send notification to ${email}`, error);
    }
  }

  /**
   * Builds the branded HTML email body for OTP messages.
   */
  buildOtpEmailHtml(code: string): string {
    return `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1A3C0E 0%, #2E7D32 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 800; font-family: 'Sora', Arial, sans-serif;">Vínculo</h1>
          <p style="color: #76C442; margin: 4px 0 0; font-size: 13px; font-family: Arial, sans-serif;">Developer Portal — Seguros Bolívar</p>
        </div>
        <div style="background: #F5F7F2; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e8ece4; border-top: none;">
          <p style="color: #1A3C0E; font-size: 16px; margin: 0 0 8px; font-weight: 600;">¡Hola!</p>
          <p style="color: #555; font-size: 14px; margin: 0 0 20px; line-height: 1.5;">Tu código de acceso al portal Vínculo es:</p>
          <div style="background: #FFFFFF; border: 2px solid #2E7D32; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 20px;">
            <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #1A3C0E;">${code}</span>
          </div>
          <p style="color: #888; font-size: 13px; margin: 0 0 8px;">⏱️ Este código expira en <strong style="color: #1A3C0E;">5 minutos</strong>.</p>
          <p style="color: #888; font-size: 13px; margin: 0 0 20px;">Si no solicitaste este código, puedes ignorar este mensaje.</p>
          <div style="border-top: 1px solid #ddd; padding-top: 16px;">
            <p style="color: #aaa; font-size: 11px; margin: 0; text-align: center;">
              © ${new Date().getFullYear()} Seguros Bolívar S.A. — vinculo.segurosbolivar.com
            </p>
          </div>
        </div>
      </div>
    `;
  }
}
