import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { OpenApiParserService } from './openapi-parser.service';
import { ApiFilterDto } from './dto/api-filter.dto';
import { CreateApiDto } from './dto/create-api.dto';
import { UpdateApiDto } from './dto/update-api.dto';

/** Redis cache keys and TTLs */
const CACHE_KEY_CATALOG = 'api:catalog';
const CACHE_TTL_CATALOG = 300; // 5 minutes
const CACHE_KEY_DETAIL_PREFIX = 'api:detail:';
const CACHE_TTL_DETAIL = 600; // 10 minutes

/**
 * Service for managing APIs: CRUD operations, caching, and OpenAPI spec upload.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.6, 6.1, 7.1
 */
@Injectable()
export class ApisService {
  private readonly logger = new Logger(ApisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly openApiParser: OpenApiParserService,
  ) {}

  /**
   * List APIs with filters and cursor-based pagination.
   * Results are cached in Redis under `api:catalog` (TTL 300s).
   *
   * Requirement 3.1: Search with filters by product, process, version, state. < 500ms.
   */
  async findAll(filters: ApiFilterDto) {
    const take = filters.take ?? 20;

    // Build cache key from filters for granular caching
    const cacheKey = this.buildCatalogCacheKey(filters);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return JSON.parse(cached);
    }

    // Build Prisma where clause from filters
    const where: Prisma.ApiWhereInput = {};

    if (filters.product) {
      where.product = filters.product as Prisma.EnumApiProductFilter;
    }

    if (filters.process) {
      where.process = filters.process as Prisma.EnumApiProcessFilter;
    }

    if (filters.version) {
      where.currentVersion = filters.version;
    }

    if (filters.lifecycleState) {
      where.lifecycleState =
        filters.lifecycleState as Prisma.EnumApiLifecycleStateFilter;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Cursor-based pagination
    const findManyArgs: Prisma.ApiFindManyArgs = {
      where,
      take: take + 1, // fetch one extra to determine if there's a next page
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        descriptionEn: true,
        product: true,
        process: true,
        currentVersion: true,
        lifecycleState: true,
        slaUptime: true,
        contactName: true,
        contactEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    };

    if (filters.cursor) {
      findManyArgs.cursor = { id: filters.cursor };
      findManyArgs.skip = 1; // skip the cursor item itself
    }

    const apis = await this.prisma.api.findMany(findManyArgs);

    const hasNextPage = apis.length > take;
    const data = hasNextPage ? apis.slice(0, take) : apis;
    const nextCursor = hasNextPage ? data[data.length - 1]?.id : undefined;

    const result = {
      data,
      pagination: {
        hasNextPage,
        nextCursor,
        count: data.length,
      },
    };

    // Cache the result
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL_CATALOG);
    this.logger.debug(`Cached ${cacheKey} (TTL ${CACHE_TTL_CATALOG}s)`);

    return result;
  }

  /**
   * Get full API detail by ID, including OpenAPI spec, versions, and metrics.
   * Cached in Redis under `api:detail:{apiId}` (TTL 600s).
   *
   * Requirement 3.2: Full detail with OpenAPI spec, versions, and metrics.
   * Requirement 3.3: Show endpoint descriptions, parameters, schemas, and examples.
   */
  async findById(id: string) {
    const cacheKey = `${CACHE_KEY_DETAIL_PREFIX}${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return JSON.parse(cached);
    }

    const api = await this.prisma.api.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            sandboxSessions: true,
            consumptions: true,
          },
        },
      },
    });

    if (!api) {
      throw new NotFoundException(`API con ID "${id}" no encontrada`);
    }

    const result = {
      ...api,
      metrics: {
        totalSandboxSessions: api._count.sandboxSessions,
        totalConsumers: api._count.consumptions,
      },
      _count: undefined,
    };

    // Cache the result
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL_DETAIL);
    this.logger.debug(`Cached ${cacheKey} (TTL ${CACHE_TTL_DETAIL}s)`);

    return result;
  }

  /**
   * Create a new API in DRAFT state.
   * Generates a URL-friendly slug from the name.
   * Logs the creation to the audit log (console for now).
   *
   * Requirement 6.1: Accept and process API creation.
   * Requirement 3.6: Document HTTP response codes.
   */
  async create(dto: CreateApiDto) {
    const slug = this.generateSlug(dto.name);

    // Check for slug uniqueness
    const existing = await this.prisma.api.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException(
        `Ya existe una API con el slug "${slug}". Elija un nombre diferente.`,
      );
    }

    const api = await this.prisma.api.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        descriptionEn: dto.descriptionEn,
        product: dto.product as Prisma.InputJsonValue as never,
        process: dto.process as Prisma.InputJsonValue as never,
        currentVersion: dto.currentVersion ?? '1.0.0',
        lifecycleState: 'DRAFT',
        slaUptime: dto.slaUptime ?? 99.9,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        contactSlack: dto.contactSlack,
      },
    });

    // Audit log — console placeholder until AuditService is implemented (task 6)
    this.logger.log(
      `[AUDIT] API_CREATED: id=${api.id}, name="${api.name}", slug="${api.slug}", state=DRAFT`,
    );

    // Invalidate catalog cache since a new API was added
    await this.invalidateCatalogCache();

    return api;
  }

  /**
   * Update an existing API and invalidate related caches.
   *
   * Requirement 3.2: Update API details.
   */
  async update(id: string, dto: UpdateApiDto) {
    // Verify the API exists
    const existing = await this.prisma.api.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`API con ID "${id}" no encontrada`);
    }

    // Build update data, only including provided fields
    const updateData: Prisma.ApiUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
      updateData.slug = this.generateSlug(dto.name);

      // Check slug uniqueness if name changed
      const slugConflict = await this.prisma.api.findFirst({
        where: {
          slug: updateData.slug as string,
          id: { not: id },
        },
      });
      if (slugConflict) {
        throw new BadRequestException(
          `Ya existe una API con el slug "${updateData.slug}". Elija un nombre diferente.`,
        );
      }
    }

    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.descriptionEn !== undefined) updateData.descriptionEn = dto.descriptionEn;
    if (dto.product !== undefined)
      updateData.product = dto.product as Prisma.InputJsonValue as never;
    if (dto.process !== undefined)
      updateData.process = dto.process as Prisma.InputJsonValue as never;
    if (dto.currentVersion !== undefined) updateData.currentVersion = dto.currentVersion;
    if (dto.slaUptime !== undefined) updateData.slaUptime = dto.slaUptime;
    if (dto.testCases !== undefined)
      updateData.testCases = dto.testCases as unknown as Prisma.InputJsonValue;
    if (dto.sandboxConfig !== undefined)
      updateData.sandboxConfig = dto.sandboxConfig as unknown as Prisma.InputJsonValue;
    if (dto.codeSnippets !== undefined)
      updateData.codeSnippets = dto.codeSnippets as unknown as Prisma.InputJsonValue;
    if (dto.contactName !== undefined) updateData.contactName = dto.contactName;
    if (dto.contactEmail !== undefined) updateData.contactEmail = dto.contactEmail;
    if (dto.contactSlack !== undefined) updateData.contactSlack = dto.contactSlack;

    const api = await this.prisma.api.update({
      where: { id },
      data: updateData,
    });

    // Audit log — console placeholder
    this.logger.log(`[AUDIT] API_UPDATED: id=${api.id}, name="${api.name}"`);

    // Invalidate caches
    await this.invalidateApiCaches(id);

    return api;
  }

  /**
   * Upload and parse an OpenAPI 3.1 specification for an API.
   * Validates the spec using OpenApiParserService, then stores it in the `specOpenApi` field.
   *
   * Requirement 7.1: Parse valid OpenAPI 3.1 specs into structured objects.
   */
  async uploadSpec(id: string, file: Buffer) {
    // Verify the API exists
    const existing = await this.prisma.api.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`API con ID "${id}" no encontrada`);
    }

    // Parse and validate the OpenAPI spec
    const parseResult = this.openApiParser.parse(file);

    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'La especificación OpenAPI no es válida',
        errors: parseResult.errors,
      });
    }

    // Store the parsed spec as JSON
    const api = await this.prisma.api.update({
      where: { id },
      data: {
        specOpenApi: parseResult.spec as unknown as Prisma.InputJsonValue,
      },
    });

    // Audit log — console placeholder
    this.logger.log(`[AUDIT] API_SPEC_UPLOADED: id=${api.id}, name="${api.name}"`);

    // Invalidate caches
    await this.invalidateApiCaches(id);

    return api;
  }

  // ─── Private Helpers ──────────────────────────────────

  /**
   * Generate a URL-friendly slug from a name.
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric
      .replace(/\s+/g, '-') // spaces to hyphens
      .replace(/-+/g, '-') // collapse multiple hyphens
      .replace(/^-|-$/g, ''); // trim leading/trailing hyphens
  }

  /**
   * Build a cache key for catalog queries based on filters.
   */
  private buildCatalogCacheKey(filters: ApiFilterDto): string {
    const parts = [CACHE_KEY_CATALOG];
    if (filters.product) parts.push(`p:${filters.product}`);
    if (filters.process) parts.push(`pr:${filters.process}`);
    if (filters.version) parts.push(`v:${filters.version}`);
    if (filters.lifecycleState) parts.push(`s:${filters.lifecycleState}`);
    if (filters.search) parts.push(`q:${filters.search}`);
    if (filters.cursor) parts.push(`c:${filters.cursor}`);
    if (filters.take) parts.push(`t:${filters.take}`);
    return parts.join(':');
  }

  /**
   * Invalidate all catalog cache entries.
   * Uses a pattern scan to delete all keys starting with `api:catalog`.
   */
  private async invalidateCatalogCache(): Promise<void> {
    const keys = await this.scanKeys(`${CACHE_KEY_CATALOG}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
      this.logger.debug(`Invalidated ${keys.length} catalog cache entries`);
    }
  }

  /**
   * Invalidate both catalog and detail caches for a specific API.
   */
  private async invalidateApiCaches(apiId: string): Promise<void> {
    // Invalidate detail cache
    const detailKey = `${CACHE_KEY_DETAIL_PREFIX}${apiId}`;
    await this.redis.del(detailKey);
    this.logger.debug(`Invalidated detail cache: ${detailKey}`);

    // Invalidate catalog cache
    await this.invalidateCatalogCache();
  }

  /**
   * Scan Redis for keys matching a pattern.
   * Uses SCAN to avoid blocking Redis with KEYS command.
   */
  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, foundKeys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');

    return keys;
  }
}
