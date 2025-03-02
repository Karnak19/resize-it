import { config } from "../config";

interface RequestMetric {
  path: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  ip: string;
  userAgent?: string;
}

interface ImageProcessingMetric {
  originalPath: string;
  transformations: Record<string, any>;
  outputFormat: string;
  inputSize: number;
  outputSize: number;
  processingTime: number;
  timestamp: number;
}

interface CacheMetric {
  key: string;
  operation: string;
  duration: number;
  timestamp: number;
  [key: string]: any;
}

export class MonitoringService {
  private requestMetrics: RequestMetric[] = [];
  private imageProcessingMetrics: ImageProcessingMetric[] = [];
  private cacheMetrics: CacheMetric[] = [];
  private genericMetrics: Record<string, any[]> = {};
  private startTime = Date.now();
  private maxMetricsCount = 1000; // Limit the number of metrics stored in memory

  /**
   * Record a request metric
   */
  recordRequest(metric: RequestMetric): void {
    this.requestMetrics.push(metric);

    // Trim the metrics array if it gets too large
    if (this.requestMetrics.length > this.maxMetricsCount) {
      this.requestMetrics = this.requestMetrics.slice(-this.maxMetricsCount);
    }
  }

  /**
   * Record an image processing metric
   */
  recordImageProcessing(metric: ImageProcessingMetric): void {
    this.imageProcessingMetrics.push(metric);

    // Trim the metrics array if it gets too large
    if (this.imageProcessingMetrics.length > this.maxMetricsCount) {
      this.imageProcessingMetrics = this.imageProcessingMetrics.slice(
        -this.maxMetricsCount
      );
    }
  }

  /**
   * Record a generic metric
   * @param type The type/category of metric
   * @param data The metric data
   */
  recordMetric(type: string, data: Record<string, any>): void {
    // Initialize the array for this metric type if it doesn't exist
    if (!this.genericMetrics[type]) {
      this.genericMetrics[type] = [];
    }

    // Add timestamp if not provided
    const metricWithTimestamp = {
      ...data,
      timestamp: data.timestamp || Date.now(),
    };

    // Add the metric
    this.genericMetrics[type].push(metricWithTimestamp);

    // Trim the metrics array if it gets too large
    if (this.genericMetrics[type].length > this.maxMetricsCount) {
      this.genericMetrics[type] = this.genericMetrics[type].slice(
        -this.maxMetricsCount
      );
    }

    // Special handling for cache metrics
    if (type.startsWith("cache_")) {
      const cacheMetric: CacheMetric = {
        key: data.key,
        operation: type.replace("cache_", ""),
        duration: data.duration || 0,
        timestamp: metricWithTimestamp.timestamp,
        ...data,
      };

      this.cacheMetrics.push(cacheMetric);

      // Trim the cache metrics array if it gets too large
      if (this.cacheMetrics.length > this.maxMetricsCount) {
        this.cacheMetrics = this.cacheMetrics.slice(-this.maxMetricsCount);
      }
    }
  }

  /**
   * Get basic statistics about the service
   */
  getStats(): Record<string, any> {
    const now = Date.now();
    const uptime = now - this.startTime;

    // Calculate request statistics
    const totalRequests = this.requestMetrics.length;
    const recentRequests = this.requestMetrics.filter(
      (m) => now - m.timestamp < 60000
    ).length;

    // Calculate average response time
    const avgResponseTime =
      totalRequests > 0
        ? this.requestMetrics.reduce((sum, m) => sum + m.duration, 0) /
          totalRequests
        : 0;

    // Calculate status code distribution
    const statusCodes = this.requestMetrics.reduce((acc, m) => {
      const key = Math.floor(m.statusCode / 100) + "xx";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate endpoint usage
    const endpointUsage = this.requestMetrics.reduce((acc, m) => {
      acc[m.path] = (acc[m.path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate image processing statistics
    const totalProcessed = this.imageProcessingMetrics.length;
    const avgProcessingTime =
      totalProcessed > 0
        ? this.imageProcessingMetrics.reduce(
            (sum, m) => sum + m.processingTime,
            0
          ) / totalProcessed
        : 0;

    // Calculate compression ratio
    const avgCompressionRatio =
      totalProcessed > 0
        ? this.imageProcessingMetrics.reduce(
            (sum, m) => sum + m.inputSize / m.outputSize,
            0
          ) / totalProcessed
        : 0;

    // Calculate format distribution
    const formatDistribution = this.imageProcessingMetrics.reduce((acc, m) => {
      acc[m.outputFormat] = (acc[m.outputFormat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate cache statistics
    const totalCacheOps = this.cacheMetrics.length;
    const cacheHits = this.cacheMetrics.filter(
      (m) => m.operation === "get" && m.hit
    ).length;
    const cacheMisses = this.cacheMetrics.filter(
      (m) => m.operation === "get" && !m.hit
    ).length;
    const cacheHitRate =
      cacheHits + cacheMisses > 0 ? cacheHits / (cacheHits + cacheMisses) : 0;

    const avgCacheGetTime = this.calculateAvgMetricDuration(
      this.cacheMetrics,
      "get"
    );
    const avgCacheSetTime = this.calculateAvgMetricDuration(
      this.cacheMetrics,
      "set"
    );

    return {
      uptime,
      requests: {
        total: totalRequests,
        recentPerMinute: recentRequests,
        avgResponseTime,
        statusCodes,
        endpointUsage,
      },
      imageProcessing: {
        total: totalProcessed,
        avgProcessingTime,
        avgCompressionRatio,
        formatDistribution,
      },
      cache: {
        total: totalCacheOps,
        hits: cacheHits,
        misses: cacheMisses,
        hitRate: cacheHitRate,
        avgGetTime: avgCacheGetTime,
        avgSetTime: avgCacheSetTime,
      },
    };
  }

  /**
   * Helper method to calculate average duration for a specific operation
   */
  private calculateAvgMetricDuration(
    metrics: CacheMetric[],
    operation: string
  ): number {
    const filteredMetrics = metrics.filter((m) => m.operation === operation);
    return filteredMetrics.length > 0
      ? filteredMetrics.reduce((sum, m) => sum + m.duration, 0) /
          filteredMetrics.length
      : 0;
  }

  /**
   * Create a middleware to record request metrics
   */
  createRequestMetricsMiddleware() {
    return (app: any) =>
      app.derive(async ({ request, set }: any, next: () => Promise<any>) => {
        const startTime = performance.now();
        const result = await next();
        const endTime = performance.now();

        this.recordRequest({
          path: request.path,
          method: request.method,
          statusCode: set.status,
          duration: endTime - startTime,
          timestamp: Date.now(),
          ip: request.headers["x-forwarded-for"] || "unknown",
          userAgent: request.headers["user-agent"],
        });

        return result;
      });
  }
}
