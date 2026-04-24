import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'vinculo-backend',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };
  }
}
