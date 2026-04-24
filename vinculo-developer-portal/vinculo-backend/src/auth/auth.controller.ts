import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  CurrentUser,
  AuthenticatedUser,
} from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Public endpoints ────────────────────────────────────

  @Public()
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar OTP por email',
    description:
      'Genera un OTP de 6 dígitos y lo envía al email proporcionado. Si el usuario no existe, se auto-registra con rol EXTERNO.',
  })
  @ApiResponse({ status: 200, description: 'OTP enviado al email proporcionado' })
  @ApiResponse({ status: 400, description: 'Email inválido' })
  @ApiResponse({ status: 429, description: 'Cuenta bloqueada por múltiples intentos fallidos' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.email);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar OTP y obtener JWT',
    description:
      'Verifica el OTP de 6 dígitos. Si es válido, retorna un JWT RS256 (8h) y un refresh token rotativo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa. Retorna accessToken, refreshToken y perfil del usuario.',
  })
  @ApiResponse({ status: 400, description: 'Formato de OTP inválido' })
  @ApiResponse({ status: 401, description: 'OTP inválido o expirado' })
  @ApiResponse({ status: 429, description: 'Cuenta bloqueada por múltiples intentos fallidos' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refrescar token JWT',
    description:
      'Valida el refresh token, lo rota (invalida el anterior) y emite un nuevo par JWT + refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refrescado exitosamente. Retorna nuevo accessToken y refreshToken.',
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  // ─── Authenticated endpoints ─────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Invalida todos los refresh tokens del usuario autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener perfil del usuario actual',
    description: 'Retorna el perfil del usuario autenticado extraído del JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario actual',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
