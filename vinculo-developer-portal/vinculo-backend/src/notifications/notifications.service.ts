import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

/**
 * NotificationsService — Manages in-app and email notifications.
 *
 * Provides:
 * - `create(notification)`: Create notification in DB
 * - `findByUser(userId)`: List user's notifications
 * - `markAsRead(id)`: Mark notification as read
 * - `markAllAsRead(userId)`: Mark all user's notifications as read
 * - `sendEmail(userId, notification)`: Send notification email via Nodemailer
 *
 * Notification types: API_DEPRECATED, API_SUNSET, QUOTA_WARNING,
 * SYSTEM_ANNOUNCEMENT, WELCOME
 *
 * Requirements: 8.2, 10.3, 13.5
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Create a notification in the database.
   *
   * Requirement 13.5: Create notifications for lifecycle events.
   * Requirement 8.2: Notify consumers on API deprecation.
   * Requirement 10.3: Notify on quota warnings.
   */
  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type as any,
        title: dto.title,
        message: dto.message,
        metadata: (dto.metadata as any) ?? Prisma.DbNull,
      },
    });

    this.logger.log(
      `[NOTIFICATION] Created: type=${dto.type}, user=${dto.userId}, title="${dto.title}"`,
    );

    return notification;
  }

  /**
   * List all notifications for a user, ordered by creation date (newest first).
   *
   * Requirement 13.5: Users can view their notifications.
   */
  async findByUser(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
      total: notifications.length,
    };
  }

  /**
   * Mark a single notification as read.
   *
   * Requirement 13.5: Users can mark notifications as read.
   */
  async markAsRead(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notificación con ID "${id}" no encontrada`,
      );
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    this.logger.log(`[NOTIFICATION] Marked as read: id=${id}`);

    return updated;
  }

  /**
   * Mark all notifications for a user as read.
   *
   * Requirement 13.5: Users can mark all notifications as read.
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    this.logger.log(
      `[NOTIFICATION] Marked all as read: user=${userId}, count=${result.count}`,
    );

    return {
      updatedCount: result.count,
    };
  }

  /**
   * Send a notification email to a user via Nodemailer/MailerService.
   *
   * Requirement 8.2: Send email notification to consumers.
   * Requirement 10.3: Send quota warning emails.
   */
  async sendEmail(userId: string, notification: CreateNotificationDto) {
    // Look up the user's email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuario con ID "${userId}" no encontrado para envío de email`,
      );
    }

    const subject = `VÍNCULO — ${notification.title}`;
    const html = this.buildNotificationEmailHtml(
      notification.type,
      notification.title,
      notification.message,
      user.name,
    );

    await this.mailerService.sendNotificationEmail(user.email, subject, html);

    this.logger.log(
      `[NOTIFICATION] Email sent: type=${notification.type}, user=${userId}, email=${user.email}`,
    );
  }

  /**
   * Build branded HTML email for notification.
   */
  private buildNotificationEmailHtml(
    type: string,
    title: string,
    message: string,
    userName?: string | null,
  ): string {
    const greeting = userName ? `Hola ${userName},` : 'Hola,';

    const typeColors: Record<string, string> = {
      API_DEPRECATED: '#F9A825',
      API_SUNSET: '#D32F2F',
      QUOTA_WARNING: '#FF9800',
      SYSTEM_ANNOUNCEMENT: '#2E7D32',
      WELCOME: '#76C442',
    };

    const accentColor = typeColors[type] ?? '#2E7D32';

    return `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
        <div style="background: #1A3C0E; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800; font-family: 'Sora', Arial, sans-serif;">VÍNCULO</h1>
          <p style="color: #76C442; margin: 4px 0 0; font-size: 14px;">Developer Portal</p>
        </div>
        <div style="background: #F5F7F2; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="color: #333; font-size: 16px; margin: 0 0 16px;">${greeting}</p>
          <div style="border-left: 4px solid ${accentColor}; padding: 12px 16px; background: #FFFFFF; border-radius: 4px; margin: 0 0 16px;">
            <h2 style="color: #1A3C0E; font-size: 18px; margin: 0 0 8px;">${title}</h2>
            <p style="color: #555; font-size: 14px; margin: 0; line-height: 1.5;">${message}</p>
          </div>
          <p style="color: #666; font-size: 14px; margin: 0;">
            Ingresa al portal para más detalles: <a href="https://vinculo.segurosbolivar.com" style="color: #2E7D32;">vinculo.segurosbolivar.com</a>
          </p>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin: 16px 0 0;">
          © Seguros Bolívar — vinculo.segurosbolivar.com
        </p>
      </div>
    `;
  }
}
