/* eslint-disable @typescript-eslint/no-var-requires */
import { Test, TestingModule } from '@nestjs/testing';

// Set up the mock sendMail function BEFORE the jest.mock factory runs
const sendMailMock = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: sendMailMock,
  })),
}));

// Import MailerService AFTER the mock is in place
import { MailerService } from './mailer.service';

describe('MailerService', () => {
  let service: MailerService;

  beforeEach(async () => {
    sendMailMock.mockReset();
    sendMailMock.mockResolvedValue({ messageId: 'test-id' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailerService],
    }).compile();

    service = module.get<MailerService>(MailerService);
  });

  // ─── buildOtpEmailHtml ─────────────────────────────────

  describe('buildOtpEmailHtml', () => {
    it('should include the OTP code in the HTML output', () => {
      const html = service.buildOtpEmailHtml('123456');
      expect(html).toContain('123456');
    });

    it('should include VÍNCULO branding primary color #1A3C0E', () => {
      const html = service.buildOtpEmailHtml('000000');
      expect(html).toContain('#1A3C0E');
    });

    it('should include VÍNCULO branding secondary color #2E7D32', () => {
      const html = service.buildOtpEmailHtml('000000');
      expect(html).toContain('#2E7D32');
    });

    it('should include VÍNCULO branding accent color #76C442', () => {
      const html = service.buildOtpEmailHtml('000000');
      expect(html).toContain('#76C442');
    });

    it('should include VÍNCULO branding background color #F5F7F2', () => {
      const html = service.buildOtpEmailHtml('000000');
      expect(html).toContain('#F5F7F2');
    });

    it('should reference Sora font for display heading', () => {
      const html = service.buildOtpEmailHtml('000000');
      expect(html).toContain('Sora');
    });

    it('should reference Plus Jakarta Sans font for body text', () => {
      const html = service.buildOtpEmailHtml('000000');
      expect(html).toContain('Plus Jakarta Sans');
    });

    it('should reference JetBrains Mono font for the OTP code', () => {
      const html = service.buildOtpEmailHtml('000000');
      expect(html).toContain('JetBrains Mono');
    });

    it('should include the 5-minute expiration notice', () => {
      const html = service.buildOtpEmailHtml('000000');
      expect(html).toContain('5 minutos');
    });
  });

  // ─── sendOtpEmail ──────────────────────────────────────

  describe('sendOtpEmail', () => {
    it('should call transporter.sendMail with correct recipient and subject', async () => {
      await service.sendOtpEmail('test@example.com', '654321');

      expect(sendMailMock).toHaveBeenCalledTimes(1);
      const call = sendMailMock.mock.calls[0][0];
      expect(call.to).toBe('test@example.com');
      expect(call.subject).toBe('VÍNCULO — Tu código de acceso');
      expect(call.html).toContain('654321');
    });

    it('should not throw when transporter.sendMail fails', async () => {
      sendMailMock.mockRejectedValueOnce(new Error('SMTP down'));

      await expect(
        service.sendOtpEmail('test@example.com', '111111'),
      ).resolves.not.toThrow();
    });
  });

  // ─── sendNotificationEmail ─────────────────────────────

  describe('sendNotificationEmail', () => {
    it('should call transporter.sendMail with correct recipient, subject and html', async () => {
      await service.sendNotificationEmail(
        'user@example.com',
        'API Deprecated',
        '<p>Your API has been deprecated.</p>',
      );

      expect(sendMailMock).toHaveBeenCalledTimes(1);
      const call = sendMailMock.mock.calls[0][0];
      expect(call.to).toBe('user@example.com');
      expect(call.subject).toBe('API Deprecated');
      expect(call.html).toBe('<p>Your API has been deprecated.</p>');
    });

    it('should not throw when transporter.sendMail fails', async () => {
      sendMailMock.mockRejectedValueOnce(new Error('SMTP down'));

      await expect(
        service.sendNotificationEmail(
          'user@example.com',
          'Test',
          '<p>Test</p>',
        ),
      ).resolves.not.toThrow();
    });
  });
});
