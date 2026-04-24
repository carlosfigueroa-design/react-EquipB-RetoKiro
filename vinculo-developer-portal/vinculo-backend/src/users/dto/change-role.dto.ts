import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

/**
 * Valid user roles matching the Prisma UserRole enum.
 */
export enum UserRoleDto {
  PUBLICO = 'PUBLICO',
  EXTERNO = 'EXTERNO',
  LIDER_TECNICO = 'LIDER_TECNICO',
  ADMIN = 'ADMIN',
}

/**
 * DTO for changing a user's role.
 *
 * Requirement 11.2: Allow ADMIN to change user roles.
 */
export class ChangeRoleDto {
  @IsNotEmpty({ message: 'El nuevo rol es obligatorio' })
  @IsEnum(UserRoleDto, {
    message: `El rol debe ser uno de: ${Object.values(UserRoleDto).join(', ')}`,
  })
  role!: UserRoleDto;
}
