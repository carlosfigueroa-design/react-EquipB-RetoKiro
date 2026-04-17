import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const aliado = await this.prisma.aliado.findUnique({ where: { email } });
    if (!aliado) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(password, aliado.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: aliado.id,
      email: aliado.email,
      type: aliado.type,
      status: aliado.status,
    };

    return {
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      expires_in: 3600,
      aliado: {
        id: aliado.id,
        email: aliado.email,
        companyName: aliado.companyName,
        type: aliado.type,
        status: aliado.status,
      },
    };
  }

  async refresh(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const payload = {
        sub: decoded.sub,
        email: decoded.email,
        type: decoded.type,
        status: decoded.status,
      };
      return {
        access_token: this.jwtService.sign(payload),
        token_type: 'Bearer',
        expires_in: 3600,
      };
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
