import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MockEngineService, MockResponse } from './mock-engine.service';
import { ExecuteSandboxDto } from './dto/execute-sandbox.dto';
import { SandboxFilterDto } from './dto/sandbox-filter.dto';

/**
 * Result of a sandbox execution, including the mock response and session metadata.
 */
export interface SandboxExecutionResult {
  traceId: string;
  apiId: string;
  endpoint: string;
  method: string;
  requestBody: Record<string, unknown> | null;
  responseBody: Record<string, unknown>;
  responseStatus: number;
  latencyMs: number;
  isDemo: boolean;
  createdAt: Date;
}

/**
 * SandboxService — Executes mock API calls and records sessions.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6
 */
@Injectable()
export class SandboxService {
  private readonly logger = new Logger(SandboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mockEngine: MockEngineService,
  ) {}

  /**
   * Execute a sandbox call with unique trace ID, record full request/response
   * in SandboxSession, and simulate realistic latency.
   *
   * Requirement 4.1: Interface with endpoint selector, JSON editor, and response panel.
   * Requirement 4.2: Generate realistic insurance responses.
   * Requirement 4.3: Personalized mock data per partner in authenticated mode.
   * Requirement 4.5: Record request/response with trace ID for debugging.
   * Requirement 4.6: Demo mode with generic read-only data.
   *
   * @param dto - Execution parameters
   * @param userId - Optional user ID (null = demo mode)
   */
  async execute(
    dto: ExecuteSandboxDto,
    userId?: string,
  ): Promise<SandboxExecutionResult> {
    const traceId = this.generateTraceId();
    const method = dto.method || 'POST';
    const isDemo = !userId;
    const body = dto.body || {};

    this.logger.log(
      `[SANDBOX] traceId=${traceId} apiId=${dto.apiId} endpoint=${dto.endpoint} ` +
        `method=${method} isDemo=${isDemo}`,
    );

    // Generate mock response (error scenario or normal)
    let mockResponse: MockResponse;
    if (dto.errorScenario) {
      mockResponse = this.mockEngine.simulateError(dto.errorScenario);
    } else {
      mockResponse = this.mockEngine.generateResponse(
        dto.apiId,
        dto.endpoint,
        body,
        userId,
      );
    }

    // Record the session in the database
    const session = await this.prisma.sandboxSession.create({
      data: {
        userId: userId || null,
        apiId: dto.apiId,
        endpoint: dto.endpoint,
        method,
        requestBody: body as any,
        requestHeaders: (dto.headers || {}) as any,
        responseBody: mockResponse.body as any,
        responseStatus: mockResponse.statusCode,
        traceId,
        latencyMs: mockResponse.latencyMs,
        isDemo,
      },
    });

    this.logger.log(
      `[SANDBOX] Session recorded: id=${session.id} traceId=${traceId} ` +
        `status=${mockResponse.statusCode} latency=${mockResponse.latencyMs}ms`,
    );

    return {
      traceId,
      apiId: dto.apiId,
      endpoint: dto.endpoint,
      method,
      requestBody: body,
      responseBody: mockResponse.body,
      responseStatus: mockResponse.statusCode,
      latencyMs: mockResponse.latencyMs,
      isDemo,
      createdAt: session.createdAt,
    };
  }

  /**
   * Get paginated execution history for a user.
   *
   * Requirement 4.5: Execution history with trace ID for debugging.
   *
   * @param userId - The user ID to filter by
   * @param filters - Optional filters for the history query
   */
  async getHistory(userId: string, filters: SandboxFilterDto = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (filters.apiId) {
      where.apiId = filters.apiId;
    }
    if (filters.endpoint) {
      where.endpoint = { contains: filters.endpoint };
    }
    if (filters.responseStatus) {
      where.responseStatus = filters.responseStatus;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        (where.createdAt as Record<string, unknown>).lte = new Date(filters.dateTo);
      }
    }

    const [sessions, total] = await Promise.all([
      this.prisma.sandboxSession.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sandboxSession.count({ where: where as any }),
    ]);

    return {
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single execution detail by session ID.
   *
   * @param sessionId - The sandbox session ID
   * @param userId - Optional user ID for access control
   */
  async getSessionById(sessionId: string, userId?: string) {
    const where: Record<string, unknown> = { id: sessionId };
    if (userId) {
      where.userId = userId;
    }

    return this.prisma.sandboxSession.findFirst({
      where: where as any,
    });
  }

  /**
   * Generate a unique trace ID for each sandbox execution.
   * Format: sb-{timestamp}-{random}
   */
  generateTraceId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(6).toString('hex');
    return `sb-${timestamp}-${random}`;
  }
}
