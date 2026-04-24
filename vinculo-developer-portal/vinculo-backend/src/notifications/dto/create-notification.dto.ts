import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * Notification types matching the Prisma NotificationType enum.
 */
export enum NotificationTypeDto {
  API_DEPRECATED = 'API_DEPRECATED',
  API_SUNSET = 'API_SUNSET',
  QUOTA_WARNING = 'QUOTA_WARNING',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  WELCOME = 'WELCOME',
}

/**
 * DTO for creating a notification.
 *
 * Requirements: 8.2, 10.3, 13.5
 */
export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty({ message: 'El userId es obligatorio' })
  userId!: string;

  @IsEnum(NotificationTypeDto, {
    message: `El tipo debe ser uno de: ${Object.values(NotificationTypeDto).join(', ')}`,
  })
  type!: NotificationTypeDto;

  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'El mensaje es obligatorio' })
  message!: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
