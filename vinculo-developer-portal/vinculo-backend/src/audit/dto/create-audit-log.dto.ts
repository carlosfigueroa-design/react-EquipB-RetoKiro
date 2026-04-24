import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
} from 'class-validator';
import { Prisma } from '@prisma/client';

/**
 * AuditAction enum values matching the Prisma schema.
 */
export enum AuditActionDto {
  USER_CREATED = 'USER_CREATED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',
  API_CREATED = 'API_CREATED',
  API_UPDATED = 'API_UPDATED',
  API_PUBLISHED = 'API_PUBLISHED',
  API_DEPRECATED = 'API_DEPRECATED',
  API_SUNSET = 'API_SUNSET',
  API_REACTIVATED = 'API_REACTIVATED',
  API_SPEC_UPLOADED = 'API_SPEC_UPLOADED',
  API_DOCS_GENERATED = 'API_DOCS_GENERATED',
  SANDBOX_EXECUTED = 'SANDBOX_EXECUTED',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
}

/**
 * DTO for creating an audit log entry.
 *
 * Requirements: 14.1 — Register action in immutable JSON format including
 * user, action, affected resource, timestamp, and origin IP.
 */
export class CreateAuditLogDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(AuditActionDto, {
    message: `La acción debe ser una de: ${Object.values(AuditActionDto).join(', ')}`,
  })
  action!: AuditActionDto;

  @IsString()
  @IsNotEmpty()
  resource!: string;

  @IsString()
  @IsOptional()
  resourceId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Prisma.InputJsonValue;

  @IsString()
  @IsNotEmpty()
  ipAddress!: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
