import { IsEnum, IsNotEmpty } from 'class-validator';

/**
 * Enum matching Prisma's MigrationWindow for the deprecation migration window.
 *
 * Requirement 8.3: Configurable migration window of 30, 60, or 90 days.
 */
export enum MigrationWindowDto {
  DAYS_30 = 'DAYS_30',
  DAYS_60 = 'DAYS_60',
  DAYS_90 = 'DAYS_90',
}

/**
 * DTO for deprecating an API. Requires a migration window selection.
 *
 * Requirement 8.3: Allow configuring the migration window (30/60/90 days).
 */
export class DeprecateApiDto {
  @IsNotEmpty({ message: 'La ventana de migración es obligatoria' })
  @IsEnum(MigrationWindowDto, {
    message:
      'La ventana de migración debe ser DAYS_30, DAYS_60 o DAYS_90',
  })
  migrationWindow!: MigrationWindowDto;
}
