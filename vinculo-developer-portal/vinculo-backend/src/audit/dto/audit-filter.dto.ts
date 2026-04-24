import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuditActionDto } from './create-audit-log.dto';

/**
 * DTO for filtering audit log queries.
 * Supports cursor-based pagination and filtering by user, action, resource, and date range.
 *
 * Requirement 14.3: Filter records by user, action type, resource, and date range.
 */
export class AuditFilterDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(AuditActionDto)
  @IsOptional()
  action?: AuditActionDto;

  @IsString()
  @IsOptional()
  resource?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  /** Cursor for cursor-based pagination (ID of the last item) */
  @IsString()
  @IsOptional()
  cursor?: string;

  /** Number of records to return (default 20, max 100) */
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  take?: number;
}

/**
 * DTO for compliance report date range.
 */
export class ComplianceReportDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
