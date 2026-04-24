import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '@/common/constants';

/** Payload embedded in the access token */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/** Decoded token including standard JWT claims */
export interface DecodedToken extends JwtPayload {
  iat: number;
  exp: number;
  iss: string;
}

@Injectable()
export class JwtService implements OnModuleInit {
  private readonly logger = new Logger(JwtService.name);
  private privateKey!: string;
  private publicKey!: string;

  onModuleInit(): void {
    this.loadOrGenerateKeys();
  }

  // ─── Key management ──────────────────────────────────────

  /**
   * Loads RSA keys from environment variables or generates a new pair.
   * In production, keys MUST be provided via JWT_PRIVATE_KEY / JWT_PUBLIC_KEY.
   */
  private loadOrGenerateKeys(): void {
    const envPrivate = process.env.JWT_PRIVATE_KEY;
    const envPublic = process.env.JWT_PUBLIC_KEY;

    if (envPrivate && envPublic) {
      this.privateKey = envPrivate;
      this.publicKey = envPublic;
      this.logger.log('RSA keys loaded from environment variables');
      return;
    }

    this.logger.warn(
      'JWT_PRIVATE_KEY / JWT_PUBLIC_KEY not set — generating ephemeral RSA key pair (dev only)',
    );

    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  // ─── Access token ────────────────────────────────────────

  /**
   * Signs a JWT access token with RS256.
   * Claims: sub (userId), email, role, exp (8h), iss.
   */
  signToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.privateKey, {
      algorithm: JWT_CONFIG.ALGORITHM,
      expiresIn: JWT_CONFIG.EXPIRATION,
      issuer: JWT_CONFIG.ISSUER,
    });
  }

  /**
   * Verifies and decodes a JWT access token.
   * Throws if the token is invalid, expired, or has a wrong issuer.
   */
  verifyToken(token: string): DecodedToken {
    return jwt.verify(token, this.publicKey, {
      algorithms: [JWT_CONFIG.ALGORITHM],
      issuer: JWT_CONFIG.ISSUER,
    }) as DecodedToken;
  }

  // ─── Refresh token ──────────────────────────────────────

  /**
   * Generates a cryptographically random refresh token (64 hex chars).
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Returns a SHA-256 hash of the given token for safe storage.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // ─── Getters (for guards / testing) ─────────────────────

  getPublicKey(): string {
    return this.publicKey;
  }
}
