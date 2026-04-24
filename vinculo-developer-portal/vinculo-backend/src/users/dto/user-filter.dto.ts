import { IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * DTO for filtering users in the list endpoint.
 *
 * Requirements: 11.1, 11.2
 */
export class UserFilterDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  take?: number;
}
