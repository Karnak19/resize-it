import Redis from "ioredis";
import { config } from "../config";
import { MonitoringService } from "./monitoring.service";

export class CacheService {
  private redis: Redis | null = null;
  private readonly enabled: boolean;
  private readonly ttl: number;
  private readonly monitoringService: MonitoringService;

  constructor(monitoringService: MonitoringService) {
    this.enabled = config.dragonfly.enabled;
    this.ttl = config.dragonfly.ttl;
    this.monitoringService = monitoringService;

    if (this.enabled) {
      try {
        this.redis = new Redis({
          host: config.dragonfly.host,
          port: config.dragonfly.port,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        this.redis.on("connect", () => {
          console.log("Connected to Dragonfly DB");
        });

        this.redis.on("error", (err) => {
          console.error("Dragonfly DB connection error:", err);
        });
      } catch (error) {
        console.error("Failed to initialize Dragonfly DB connection:", error);
        this.redis = null;
      }
    } else {
      console.log("Dragonfly caching is disabled");
    }
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns The cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) {
      return null;
    }

    try {
      const startTime = performance.now();
      const data = await this.redis.get(key);
      const endTime = performance.now();

      this.monitoringService.recordMetric("cache_get", {
        key,
        hit: !!data,
        duration: endTime - startTime,
      });

      if (!data) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Optional TTL in seconds (defaults to config value)
   * @returns true if successful, false otherwise
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      const startTime = performance.now();
      const serializedValue = JSON.stringify(value);
      const expiry = ttl || this.ttl;

      await this.redis.set(key, serializedValue, "EX", expiry);

      const endTime = performance.now();

      this.monitoringService.recordMetric("cache_set", {
        key,
        size: serializedValue.length,
        ttl: expiry,
        duration: endTime - startTime,
      });

      return true;
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete a value from cache
   * @param key Cache key
   * @returns true if successful, false otherwise
   */
  async delete(key: string): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      const startTime = performance.now();
      await this.redis.del(key);
      const endTime = performance.now();

      this.monitoringService.recordMetric("cache_delete", {
        key,
        duration: endTime - startTime,
      });

      return true;
    } catch (error) {
      console.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Generate a cache key for an image
   * @param path Original image path
   * @param options Transformation options
   * @returns Cache key
   */
  generateImageCacheKey(path: string, options: Record<string, any>): string {
    const optionsStr = Object.entries(options)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    return `image:${path}:${optionsStr}`;
  }

  /**
   * Close the Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }
}
