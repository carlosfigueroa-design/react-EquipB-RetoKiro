import {
  Injectable,
  Logger,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { JwtService } from '@/auth/jwt.service';
import { MailerService } from '@/mailer/mailer.service';
import { OTP_CONFIG } from '@/common/constants';

/** Shape of the OTP data stored in Redis under key `otp:{email}` */
interface OtpData {
  code: string;
  attempts: number;
}

/** Result returned after a successful OTP verification */
export interface VerifyOtpResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    name: string | null;
    company: string | null;
  };
}

/** Result returned after a successful token refresh */
export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

/** Refresh token expiration: 30 days in milliseconds */
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Generates a cryptographically random 6-digit OTP string (000000–999999).
   */
  generateOtp(): string {
    const otp = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(OTP_CONFIG.LENGTH, '0');
    return otp;
  }

  // ─── Redis key helpers ───────────────────────────────────

  private otpKey(email: string): string {
    return `otp:${email}`;
  }

  private blockedKey(email: string): string {
    return `otp:blocked:${email}`;
  }

  // ─── requestOtp ──────────────────────────────────────────

  /**
   * Generates a 6-digit OTP, stores it in Redis with a 5-minute TTL,
   * and sends it to the user's email via Nodemailer.
   *
   * If the email is blocked (3 consecutive failed attempts), throws 429.
   * If the user does not exist in the database, auto-registers with role EXTERNO.
   */
  async requestOtp(email: string): Promise<Record<string, unknown>> {
    // 1. Check if the email is blocked
    const blocked = await this.redis.get(this.blockedKey(email));
    if (blocked) {
      throw new HttpException(
        'Cuenta bloqueada por múltiples intentos fallidos. Intente de nuevo en 15 minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. Auto-register: if user doesn't exist, create with role EXTERNO
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          role: 'EXTERNO',
          status: 'ACTIVE',
        },
      });
      this.logger.log(`Auto-registered new user: ${email} with role EXTERNO`);
    }

    // 3. Generate OTP
    const code = this.generateOtp();

    // 4. Store OTP in Redis with TTL
    const otpData: OtpData = { code, attempts: 0 };
    const ttl = parseInt(
      process.env.OTP_TTL_SECONDS || String(OTP_CONFIG.TTL_SECONDS),
      10,
    );
    await this.redis.set(this.otpKey(email), JSON.stringify(otpData), 'EX', ttl);

    // 5. Send email via MailerService
    let otpDelivered = false;
    let emailPreviewUrl: string | null = null;
    try {
      emailPreviewUrl = await this.mailerService.sendOtpEmail(email, code);
      otpDelivered = true;
      this.logger.log(`OTP email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
    }

    // 6. Always log OTP in development for debugging
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      this.logger.warn(`🔑 [DEV] OTP for ${email}: ${code}`);
    }

    // 7. In development, include the OTP in the response so the frontend can show it
    const response: Record<string, unknown> = {
      message: 'OTP enviado al email proporcionado',
    };
    if (isDev) {
      response.devOtp = code;
      response.devNote = 'Este campo solo aparece en modo desarrollo';
      if (emailPreviewUrl) {
        response.emailPreviewUrl = emailPreviewUrl;
      }
      if (!otpDelivered) {
        response.emailWarning = 'No se pudo enviar el email. Usa el código mostrado aquí.';
      }
    }

    return response;
  }

  // ─── verifyOtp ───────────────────────────────────────────

  /**
   * Verifies the OTP for the given email.
   *
   * - Validates that the email is not blocked.
   * - Validates that the OTP exists (not expired).
   * - Validates that attempts < MAX_ATTEMPTS.
   * - On success: deletes the OTP from Redis (single-use), issues JWT + refresh token.
   * - On failure: increments attempts; blocks for 15 min after 3 failures.
   */
  async verifyOtp(email: string, otp: string): Promise<VerifyOtpResult> {
    // 1. Check if blocked
    const blocked = await this.redis.get(this.blockedKey(email));
    if (blocked) {
      throw new HttpException(
        'Cuenta bloqueada por múltiples intentos fallidos. Intente de nuevo en 15 minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. Retrieve OTP data from Redis
    const raw = await this.redis.get(this.otpKey(email));
    if (!raw) {
      throw new UnauthorizedException(
        'OTP expirado o no encontrado. Solicite un nuevo código.',
      );
    }

    const otpData: OtpData = JSON.parse(raw);
    const maxAttempts = parseInt(
      process.env.OTP_MAX_ATTEMPTS || String(OTP_CONFIG.MAX_ATTEMPTS),
      10,
    );

    // 3. Check attempts
    if (otpData.attempts >= maxAttempts) {
      // Block the email
      await this.blockEmail(email);
      // Clean up the OTP key
      await this.redis.del(this.otpKey(email));
      throw new HttpException(
        'Cuenta bloqueada por múltiples intentos fallidos. Intente de nuevo en 15 minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 4. Verify OTP
    if (otpData.code !== otp) {
      // Increment attempts
      otpData.attempts += 1;

      if (otpData.attempts >= maxAttempts) {
        // Block after reaching max attempts
        await this.blockEmail(email);
        await this.redis.del(this.otpKey(email));
        throw new HttpException(
          'Cuenta bloqueada por múltiples intentos fallidos. Intente de nuevo en 15 minutos.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Update attempts in Redis, preserving the remaining TTL
      const ttl = await this.redis.ttl(this.otpKey(email));
      if (ttl > 0) {
        await this.redis.set(
          this.otpKey(email),
          JSON.stringify(otpData),
          'EX',
          ttl,
        );
      }

      throw new UnauthorizedException('OTP inválido. Intente de nuevo.');
    }

    // 5. OTP is valid — delete it (single-use)
    await this.redis.del(this.otpKey(email));

    // 6. Fetch user (should exist due to auto-register in requestOtp)
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    // 7. Update lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 8. Issue JWT access token + refresh token
    const accessToken = this.jwtService.signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const rawRefreshToken = this.jwtService.generateRefreshToken();
    await this.storeRefreshToken(rawRefreshToken, user.id);

    this.logger.log(`OTP verified successfully for ${email}`);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        company: user.company,
      },
    };
  }

  // ─── refreshToken ────────────────────────────────────────

  /**
   * Validates a refresh token, rotates it (invalidates old, issues new),
   * and returns a new JWT access token + refresh token pair.
   */
  async refreshToken(token: string): Promise<RefreshResult> {
    const tokenHash = this.jwtService.hashToken(token);

    // 1. Find the refresh token in the database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    // 2. Check expiration
    if (storedToken.expiresAt < new Date()) {
      // Clean up expired token
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedException('Refresh token expirado.');
    }

    // 3. Invalidate the old refresh token (rotation)
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // 4. Issue new access token
    const accessToken = this.jwtService.signToken({
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    });

    // 5. Issue new refresh token
    const newRawRefreshToken = this.jwtService.generateRefreshToken();
    await this.storeRefreshToken(newRawRefreshToken, storedToken.user.id);

    this.logger.log(`Token refreshed for user ${storedToken.user.email}`);

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  // ─── logout ──────────────────────────────────────────────

  /**
   * Invalidates all refresh tokens for the given user.
   */
  async logout(userId: string): Promise<{ message: string }> {
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    this.logger.log(
      `Logout: invalidated ${count} refresh token(s) for user ${userId}`,
    );

    return { message: 'Sesión cerrada exitosamente' };
  }

  // ─── Private helpers ─────────────────────────────────────

  /**
   * Stores a hashed refresh token in the database.
   */
  private async storeRefreshToken(
    rawToken: string,
    userId: string,
  ): Promise<void> {
    const tokenHash = this.jwtService.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });
  }

  /**
   * Blocks an email for 15 minutes after 3 failed OTP attempts.
   */
  private async blockEmail(email: string): Promise<void> {
    const blockDuration = parseInt(
      process.env.OTP_BLOCK_DURATION_SECONDS ||
        String(OTP_CONFIG.BLOCK_DURATION_SECONDS),
      10,
    );
    await this.redis.set(this.blockedKey(email), '1', 'EX', blockDuration);
    this.logger.warn(`Email ${email} blocked for ${blockDuration}s due to failed OTP attempts`);
  }

}
