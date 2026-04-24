/**
 * VÍNCULO Developer Portal — Constantes globales
 */

// Roles del sistema
export const ROLES = {
  PUBLICO: 'PUBLICO',
  EXTERNO: 'EXTERNO',
  LIDER_TECNICO: 'LIDER_TECNICO',
  ADMIN: 'ADMIN',
} as const;

// Estados del ciclo de vida de APIs
export const API_LIFECYCLE_STATES = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  DEPRECATED: 'DEPRECATED',
  SUNSET: 'SUNSET',
} as const;

// Configuración de OTP
export const OTP_CONFIG = {
  LENGTH: 6,
  TTL_SECONDS: 300, // 5 minutos
  MAX_ATTEMPTS: 3,
  BLOCK_DURATION_SECONDS: 900, // 15 minutos
} as const;

// Configuración de JWT
export const JWT_CONFIG = {
  ALGORITHM: 'RS256' as const,
  EXPIRATION: '8h',
  ISSUER: 'vinculo-developer-portal',
} as const;

// Ventanas de migración (días)
export const MIGRATION_WINDOWS = {
  DAYS_30: 30,
  DAYS_60: 60,
  DAYS_90: 90,
} as const;
