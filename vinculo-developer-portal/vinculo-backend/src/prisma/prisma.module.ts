import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MockPrismaService } from './mock-prisma.service';

const useMock = process.env.MOCK_DB === 'true';

const prismaProvider = {
  provide: PrismaService,
  useClass: useMock ? MockPrismaService : PrismaService,
};

@Global()
@Module({
  providers: [prismaProvider],
  exports: [PrismaService],
})
export class PrismaModule {}
