import { IsEnum, IsNotEmpty } from 'class-validator';

/**
 * Valid user statuses matching the Prisma UserStatus enum.
 */
export enum UserStatusDto {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  INACTIVE = 'INACTIVE',
}

/**
 * DTO for changing a user's status (activate/deactivate).
 *
 * Requirement 11.2: Allow ADMIN to activate/deactivate users.
 */
export class ChangeStatusDto {
  @IsNotEmpty({ message: 'El nuevo estado es obligatorio' })
  @IsEnum(UserStatusDto, {
    message: `El estado debe ser uno de: ${Object.values(UserStatusDto).join(', ')}`,
  })
  status!: UserStatusDto;
}
