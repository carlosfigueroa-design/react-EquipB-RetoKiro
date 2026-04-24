import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SearchQueryDto } from './dto/search-query.dto';

/**
 * Search result item returned by the search service.
 */
export interface SearchResultItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  product: string;
  process: string;
  currentVersion: string;
  lifecycleState: string;
}

/**
 * Paginated search response.
 */
export interface SearchResponse {
  data: SearchResultItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  query: string;
  cached: boolean;
}

/**
 * SearchService — Full-text search, history, and autocomplete.
 *
 * - search(): full-text search using Prisma `contains` (simulating ts_vector),
 *   filters by product/process/version/state, Redis cache `search:{queryHash}` (TTL 120s)
 * - saveHistory(): save search in user's SearchHistory
 * - getHistory(): return recent search history
 * - getSuggestions(): autocomplete based on API names and frequent terms
 *
 * Requirements: 1.4, 1.5, 3.1, 12.1, 12.2, 12.3, 12.5
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  /** Redis cache TTL for search results: 120 seconds */
  static readonly CACHE_TTL_SECONDS = 120;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Full-text search across APIs with filters and Redis caching.
   *
   * Simulates PostgreSQL ts_vector + ts_query using Prisma `contains` for
   * case-insensitive substring matching on name and description fields.
   * Results are cached in Redis with key `search:{queryHash}` and TTL 120s.
   *
   * Requirement 1.5: Search returns results in < 500ms.
   * Requirement 12.1: Search by name, product, process, use case.
   * Requirement 12.2: Results in < 500ms.
   * Requirement 12.3: Filters by product, process, version, state.
   */
  async search(dto: SearchQueryDto): Promise<SearchResponse> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    // Check Redis cache first
    const cacheKey = this.buildCacheKey(dto);
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug(`[SEARCH] Cache hit for key=${cacheKey}`);
      return { ...cached, cached: true };
    }

    // Build Prisma where clause
    const where = this.buildWhereClause(dto.query, dto);

    // Execute search query
    const [apis, total] = await Promise.all([
      this.prisma.api.findMany({
        where: where as any,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          product: true,
          process: true,
          currentVersion: true,
          lifecycleState: true,
        },
      }),
      this.prisma.api.count({ where: where as any }),
    ]);

    const response: SearchResponse = {
      data: apis as SearchResultItem[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      query: dto.query,
      cached: false,
    };

    // Store in Redis cache
    await this.setInCache(cacheKey, response);

    this.logger.log(
      `[SEARCH] query="${dto.query}" results=${total} page=${page}`,
    );

    return response;
  }

  /**
   * Save a search query in the user's search history.
   *
   * Requirement 12.5: Maintain search history for authenticated users.
   */
  async saveHistory(
    userId: string,
    query: string,
    filters?: Record<string, unknown> | null,
    resultCount?: number,
  ) {
    const entry = await this.prisma.searchHistory.create({
      data: {
        userId,
        query,
        filters: (filters || null) as any,
        resultCount: resultCount || 0,
      },
    });

    this.logger.log(
      `[SEARCH] History saved: userId=${userId} query="${query}" results=${resultCount || 0}`,
    );

    return entry;
  }

  /**
   * Get recent search history for a user, ordered by most recent first.
   *
   * Requirement 12.5: Search history accessible for authenticated users.
   */
  async getHistory(userId: string, limit = 20) {
    return this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get autocomplete suggestions based on API names and frequent search terms.
   *
   * Requirement 12.1: Search by name of API.
   */
  async getSuggestions(query: string, limit = 10): Promise<string[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Search API names that contain the query substring
    const apis = await this.prisma.api.findMany({
      where: {
        OR: [
          { name: { contains: normalizedQuery, mode: 'insensitive' } },
          { description: { contains: normalizedQuery, mode: 'insensitive' } },
        ],
      } as any,
      select: { name: true },
      take: limit,
      orderBy: { name: 'asc' },
    });

    const suggestions = apis.map((api: { name: string }) => api.name);

    // Deduplicate
    return [...new Set(suggestions)].slice(0, limit);
  }

  // ─── Internal helpers ────────────────────────────────────

  /**
   * Build the Prisma where clause for search with filters.
   * Uses case-insensitive `contains` to simulate full-text search.
   */
  buildWhereClause(
    query: string,
    filters: Pick<SearchQueryDto, 'product' | 'process' | 'version' | 'state'>,
  ): Record<string, unknown> {
    const normalizedQuery = query.toLowerCase().trim();

    const where: Record<string, unknown> = {
      OR: [
        { name: { contains: normalizedQuery, mode: 'insensitive' } },
        { description: { contains: normalizedQuery, mode: 'insensitive' } },
      ],
    };

    if (filters.product) {
      where.product = filters.product;
    }
    if (filters.process) {
      where.process = filters.process;
    }
    if (filters.version) {
      where.currentVersion = filters.version;
    }
    if (filters.state) {
      where.lifecycleState = filters.state;
    }

    return where;
  }

  /**
   * Build a deterministic Redis cache key from the search query and filters.
   * Format: search:{sha256Hash}
   */
  buildCacheKey(dto: SearchQueryDto): string {
    const payload = JSON.stringify({
      q: dto.query.toLowerCase().trim(),
      product: dto.product || null,
      process: dto.process || null,
      version: dto.version || null,
      state: dto.state || null,
      page: dto.page || 1,
      limit: dto.limit || 20,
    });
    const hash = crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);
    return `search:${hash}`;
  }

  /**
   * Get cached search results from Redis.
   */
  private async getFromCache(key: string): Promise<SearchResponse | null> {
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      this.logger.warn(`[SEARCH] Cache read error: ${err}`);
    }
    return null;
  }

  /**
   * Store search results in Redis cache with TTL.
   */
  private async setInCache(key: string, data: SearchResponse): Promise<void> {
    try {
      await this.redis.set(
        key,
        JSON.stringify(data),
        'EX',
        SearchService.CACHE_TTL_SECONDS,
      );
    } catch (err) {
      this.logger.warn(`[SEARCH] Cache write error: ${err}`);
    }
  }
}
