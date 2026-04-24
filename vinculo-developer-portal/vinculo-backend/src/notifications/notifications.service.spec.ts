import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { NotificationTypeDto } from './dto/create-notification.dto';

/**
 * Unit tests for NotificationsService.
 *
 * Tests: notification creation by type, mark as read, mark all as read,
 * email sending, error cases.
 *
 * Requirements: 8.2, 10.3, 13.5
 */
describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockPrisma: {
    notification: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
  };
  let mockMailerService: {
    sendNotificationEmail: jest.Mock;
  };

  const baseMockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    type: 'API_DEPRECATED',
    title: 'API Cotización Auto deprecada',
    message: 'La API ha sido marcada como DEPRECATED.',
    metadata: { apiId: 'api-1' },
    isRead: false,
    createdAt: new Date('2024-06-15T10:00:00Z'),
  };

  beforeEach(() => {
    mockPrisma = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    mockMailerService = {
      sendNotificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    service = new NotificationsService(
      mockPrisma as unknown as PrismaService,
      mockMailerService as unknown as MailerService,
    );
  });

  // ─── Notification creation by type ───────────────────────

  describe('create', () => {
    it('should create an API_DEPRECATED notification', async () => {
      const dto = {
        userId: 'user-1',
        type: NotificationTypeDto.API_DEPRECATED,
        title: 'API Cotización Auto deprecada',
        message: 'La API ha sido marcada como DEPRECATED.',
        metadata: { apiId: 'api-1' },
      };

      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        ...dto,
        isRead: false,
        createdAt: new Date(),
      });

      const result = await service.create(dto);

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'API_DEPRECATED',
          title: dto.title,
          message: dto.message,
        }),
      });
      expect(result.id).toBe('notif-1');
    });

    it('should create an API_SUNSET notification', async () => {
      const dto = {
        userId: 'user-1',
        type: NotificationTypeDto.API_SUNSET,
        title: 'API alcanzó sunset',
        message: 'La API ha sido desactivada.',
      };

      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-2',
        ...dto,
        metadata: null,
        isRead: false,
        createdAt: new Date(),
      });

      const result = await service.create(dto);

      expect(result.id).toBe('notif-2');
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'API_SUNSET',
        }),
      });
    });

    it('should create a QUOTA_WARNING notification', async () => {
      const dto = {
        userId: 'user-1',
        type: NotificationTypeDto.QUOTA_WARNING,
        title: 'Alerta de cuota',
        message: 'Has alcanzado el 80% de tu cuota.',
        metadata: { currentUsage: 800, quota: 1000 },
      };

      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-3',
        ...dto,
        isRead: false,
        createdAt: new Date(),
      });

      const result = await service.create(dto);

      expect(result.id).toBe('notif-3');
    });

    it('should create a SYSTEM_ANNOUNCEMENT notification', async () => {
      const dto = {
        userId: 'user-1',
        type: NotificationTypeDto.SYSTEM_ANNOUNCEMENT,
        title: 'Mantenimiento programado',
        message: 'El sistema estará en mantenimiento el sábado.',
      };

      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-4',
        ...dto,
        metadata: null,
        isRead: false,
        createdAt: new Date(),
      });

      const result = await service.create(dto);

      expect(result.id).toBe('notif-4');
    });

    it('should create a WELCOME notification', async () => {
      const dto = {
        userId: 'user-1',
        type: NotificationTypeDto.WELCOME,
        title: 'Bienvenido a VÍNCULO',
        message: 'Tu cuenta ha sido creada exitosamente.',
      };

      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-5',
        ...dto,
        metadata: null,
        isRead: false,
        createdAt: new Date(),
      });

      const result = await service.create(dto);

      expect(result.id).toBe('notif-5');
    });
  });

  // ─── Find by user ────────────────────────────────────────

  describe('findByUser', () => {
    it('should return user notifications with unread count', async () => {
      const notifications = [
        { ...baseMockNotification, id: 'notif-1', isRead: false },
        { ...baseMockNotification, id: 'notif-2', isRead: true },
        { ...baseMockNotification, id: 'notif-3', isRead: false },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(notifications);

      const result = await service.findByUser('user-1');

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result.data).toHaveLength(3);
      expect(result.unreadCount).toBe(2);
      expect(result.total).toBe(3);
    });

    it('should return empty list when user has no notifications', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);

      const result = await service.findByUser('user-1');

      expect(result.data).toHaveLength(0);
      expect(result.unreadCount).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  // ─── Mark as read ────────────────────────────────────────

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(baseMockNotification);
      mockPrisma.notification.update.mockResolvedValue({
        ...baseMockNotification,
        isRead: true,
      });

      const result = await service.markAsRead('notif-1');

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException when notification does not exist', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── Mark all as read ────────────────────────────────────

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true },
      });
      expect(result.updatedCount).toBe(5);
    });

    it('should return 0 when no unread notifications exist', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.markAllAsRead('user-1');

      expect(result.updatedCount).toBe(0);
    });
  });

  // ─── Email sending ───────────────────────────────────────

  describe('sendEmail', () => {
    it('should send notification email to user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: 'aliado@example.com',
        name: 'Juan Pérez',
      });

      const notification = {
        userId: 'user-1',
        type: NotificationTypeDto.API_DEPRECATED,
        title: 'API Cotización Auto deprecada',
        message: 'La API ha sido marcada como DEPRECATED.',
      };

      await service.sendEmail('user-1', notification);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { email: true, name: true },
      });
      expect(mockMailerService.sendNotificationEmail).toHaveBeenCalledWith(
        'aliado@example.com',
        'VÍNCULO — API Cotización Auto deprecada',
        expect.stringContaining('API Cotización Auto deprecada'),
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const notification = {
        userId: 'nonexistent',
        type: NotificationTypeDto.WELCOME,
        title: 'Bienvenido',
        message: 'Bienvenido a VÍNCULO.',
      };

      await expect(
        service.sendEmail('nonexistent', notification),
      ).rejects.toThrow(NotFoundException);
    });

    it('should include VÍNCULO branding in email subject', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: 'test@example.com',
        name: 'Test User',
      });

      const notification = {
        userId: 'user-1',
        type: NotificationTypeDto.QUOTA_WARNING,
        title: 'Alerta de cuota',
        message: 'Has alcanzado el 80% de tu cuota.',
      };

      await service.sendEmail('user-1', notification);

      const subject = mockMailerService.sendNotificationEmail.mock.calls[0][1];
      expect(subject).toContain('VÍNCULO');
      expect(subject).toContain('Alerta de cuota');
    });

    it('should include notification message in email HTML body', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: 'test@example.com',
        name: null,
      });

      const notification = {
        userId: 'user-1',
        type: NotificationTypeDto.SYSTEM_ANNOUNCEMENT,
        title: 'Mantenimiento',
        message: 'El sistema estará en mantenimiento.',
      };

      await service.sendEmail('user-1', notification);

      const html = mockMailerService.sendNotificationEmail.mock.calls[0][2];
      expect(html).toContain('Mantenimiento');
      expect(html).toContain('El sistema estará en mantenimiento.');
    });
  });
});
