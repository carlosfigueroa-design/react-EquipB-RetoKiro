import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'vinculo-dev-jwt-secret-2026',
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      type: payload.type,
      status: payload.status,
    };
  }
}
