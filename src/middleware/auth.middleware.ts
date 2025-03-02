import { Elysia } from "elysia";
import { config } from "../config";

export class AuthMiddleware {
  /**
   * Middleware to validate API key
   */
  static apiKeyAuth = (app: Elysia) =>
    app.derive(({ headers, set }) => {
      // Skip API key validation if not enabled
      if (!config.security.enableApiKeyAuth) {
        return {};
      }

      const apiKey = headers["x-api-key"];

      if (!apiKey || !config.security.apiKeys.includes(apiKey)) {
        set.status = 401;
        return { error: "Unauthorized: Invalid API key" };
      }

      return {};
    });

  /**
   * Simple in-memory rate limiter
   */
  static rateLimiter = (app: Elysia) => {
    // Skip rate limiting if not enabled
    if (!config.security.rateLimit.enabled) {
      return app;
    }

    const requests = new Map<string, { count: number; resetTime: number }>();
    const { windowMs, max } = config.security.rateLimit;

    return app.derive(({ headers, set }) => {
      const ip = headers["x-forwarded-for"] || "unknown";
      const now = Date.now();

      // Clean up expired entries
      if (requests.has(ip) && requests.get(ip)!.resetTime < now) {
        requests.delete(ip);
      }

      // Initialize or get current request count
      if (!requests.has(ip)) {
        requests.set(ip, { count: 0, resetTime: now + windowMs });
      }

      const requestInfo = requests.get(ip)!;
      requestInfo.count++;

      // Check if rate limit exceeded
      if (requestInfo.count > max) {
        set.status = 429;
        set.headers["Retry-After"] = Math.ceil(
          (requestInfo.resetTime - now) / 1000
        ).toString();
        return { error: "Too many requests, please try again later" };
      }

      // Set rate limit headers
      set.headers["X-RateLimit-Limit"] = max.toString();
      set.headers["X-RateLimit-Remaining"] = (
        max - requestInfo.count
      ).toString();
      set.headers["X-RateLimit-Reset"] = Math.ceil(
        requestInfo.resetTime / 1000
      ).toString();

      return {};
    });
  };
}
