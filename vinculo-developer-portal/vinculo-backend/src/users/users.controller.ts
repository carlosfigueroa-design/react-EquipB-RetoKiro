import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ChangeRoleDto } from './dto/change-role.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

/**
 * Controller for the Users module.
 * All endpoints require ADMIN role.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users — List users with optional filters.
   *
   * Requirement 11.1: List users with role, status, and last access date.
   */
  @Get()
  @ApiOperation({
    summary: 'Listar usuarios',
    description:
      'Lista todos los usuarios con filtros opcionales por rol, estado y búsqueda. ' +
      'Solo accesible para administradores.',
  })
  @ApiQuery({ name: 'role', required: false, description: 'Filtrar por rol' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, email o empresa' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Cursor para paginación' })
  @ApiQuery({ name: 'take', required: false, description: 'Cantidad de resultados por página' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN' })
  async findAll(@Query() filters: UserFilterDto) {
    return this.usersService.findAll(filters);
  }

  /**
   * GET /users/:id — User detail.
   *
   * Requirement 11.1: View user detail.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Detalle de usuario',
    description: 'Retorna el detalle completo de un usuario. Solo accesible para administradores.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario (UUID)' })
  @ApiResponse({ status: 200, description: 'Detalle del usuario' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * PATCH /users/:id/role — Change user role.
   *
   * Requirement 11.2: Allow ADMIN to change user roles.
   * Requirement 11.3: Log role changes to audit.
   */
  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cambiar rol de usuario',
    description:
      'Cambia el rol de un usuario y registra la acción en el log de auditoría. ' +
      'Solo accesible para administradores.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario (UUID)' })
  @ApiResponse({ status: 200, description: 'Rol actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o rol ya asignado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async changeRole(
    @Param('id') id: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.usersService.changeRole(id, dto.role, admin.id);
  }

  /**
   * PATCH /users/:id/status — Activate/deactivate user.
   *
   * Requirement 11.2: Allow ADMIN to activate/deactivate users.
   * Requirement 11.3: Log status changes to audit.
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activar/desactivar usuario',
    description:
      'Cambia el estado de un usuario (activar/desactivar) y registra la acción en el log de auditoría. ' +
      'Solo accesible para administradores.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario (UUID)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o estado ya asignado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.usersService.changeStatus(id, dto.status, admin.id);
  }
}
