import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { apiKey, project, type ApiKey } from "db-schema";
import { cacheService } from "../services/cache.service";

/**
 * API Keys read-access-layer
 * Provides functions to read API keys from the database
 */

// Cache TTL in seconds (5 minutes)
const API_KEY_CACHE_TTL = 300;

// Cache key prefixes
const API_KEY_CACHE_PREFIX = "api_key:";
const API_KEY_PROJECT_CACHE_PREFIX = "api_key_project:";
const API_KEY_LIST_CACHE_PREFIX = "api_key_list:";

/**
 * Extended API key type that includes project information
 */
export type ApiKeyWithProject = ApiKey & {
  projectBucketName: string;
};

/**
 * Get an API key by its key value
 * @param key The API key value
 * @returns The API key or null if not found
 */
export async function getApiKeyByKey(key: string): Promise<ApiKey | null> {
  // Generate cache key
  const cacheKey = `${API_KEY_CACHE_PREFIX}${key}`;

  // Try to get from cache first
  const cachedApiKey = await cacheService.get<ApiKey>(cacheKey);
  if (cachedApiKey) {
    return cachedApiKey;
  }

  // If not in cache, query the database
  const results = await db
    .select()
    .from(apiKey)
    .where(eq(apiKey.key, key))
    .limit(1);

  const result = results.length > 0 ? results[0] : null;

  // Cache the result if found
  if (result) {
    await cacheService.set(cacheKey, result, API_KEY_CACHE_TTL);
  }

  return result;
}

/**
 * Get an API key with project information by its key value
 * @param key The API key value
 * @returns The API key with project information or null if not found
 */
export async function getApiKeyWithProject(
  key: string
): Promise<ApiKeyWithProject | null> {
  // Generate cache key
  const cacheKey = `${API_KEY_PROJECT_CACHE_PREFIX}${key}`;

  // Try to get from cache first
  const cachedApiKey = await cacheService.get<ApiKeyWithProject>(cacheKey);
  if (cachedApiKey) {
    return cachedApiKey;
  }

  // If not in cache, query the database
  const results = await db
    .select({
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key,
      projectId: apiKey.projectId,
      userId: apiKey.userId,
      isActive: apiKey.isActive,
      lastUsed: apiKey.lastUsed,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
      expiresAt: apiKey.expiresAt,
      projectBucketName: project.bucketName,
    })
    .from(apiKey)
    .innerJoin(project, eq(apiKey.projectId, project.id))
    .where(eq(apiKey.key, key))
    .limit(1);

  const result = results.length > 0 ? (results[0] as ApiKeyWithProject) : null;

  // Cache the result if found
  if (result) {
    await cacheService.set(cacheKey, result, API_KEY_CACHE_TTL);
  }

  return result;
}

/**
 * Get all API keys for a project
 * @param projectId The project ID
 * @returns Array of API keys
 */
export async function getApiKeysByProject(
  projectId: string
): Promise<ApiKey[]> {
  // Generate cache key
  const cacheKey = `${API_KEY_LIST_CACHE_PREFIX}${projectId}`;

  // Try to get from cache first
  const cachedApiKeys = await cacheService.get<ApiKey[]>(cacheKey);
  if (cachedApiKeys) {
    return cachedApiKeys;
  }

  // If not in cache, query the database
  const results = await db
    .select()
    .from(apiKey)
    .where(eq(apiKey.projectId, projectId));

  // Cache the results
  await cacheService.set(cacheKey, results, API_KEY_CACHE_TTL);

  return results;
}

/**
 * Get all active API keys for a project
 * @param projectId The project ID
 * @returns Array of active API keys
 */
export async function getActiveApiKeysByProject(
  projectId: string
): Promise<ApiKey[]> {
  // Generate cache key
  const cacheKey = `${API_KEY_LIST_CACHE_PREFIX}active:${projectId}`;

  // Try to get from cache first
  const cachedApiKeys = await cacheService.get<ApiKey[]>(cacheKey);
  if (cachedApiKeys) {
    return cachedApiKeys;
  }

  // If not in cache, query the database
  const results = await db
    .select()
    .from(apiKey)
    .where(and(eq(apiKey.projectId, projectId), eq(apiKey.isActive, true)));

  // Cache the results
  await cacheService.set(cacheKey, results, API_KEY_CACHE_TTL);

  return results;
}

/**
 * Verify if an API key is valid
 * @param key The API key value
 * @returns True if the key is valid (exists, is active, and not expired)
 */
export async function verifyApiKey(key: string): Promise<boolean> {
  const apiKeyRecord = await getApiKeyByKey(key);

  if (!apiKeyRecord) {
    return false;
  }

  // Check if the key is active
  if (!apiKeyRecord.isActive) {
    return false;
  }

  // Check if the key has expired
  if (apiKeyRecord.expiresAt && new Date(apiKeyRecord.expiresAt) < new Date()) {
    return false;
  }

  return true;
}

/**
 * Invalidate cache for an API key
 * @param key The API key value
 */
export async function invalidateApiKeyCache(key: string): Promise<void> {
  await Promise.all([
    cacheService.delete(`${API_KEY_CACHE_PREFIX}${key}`),
    cacheService.delete(`${API_KEY_PROJECT_CACHE_PREFIX}${key}`),
  ]);
}

/**
 * Invalidate cache for a project's API keys
 * @param projectId The project ID
 */
export async function invalidateProjectApiKeysCache(
  projectId: string
): Promise<void> {
  await Promise.all([
    cacheService.delete(`${API_KEY_LIST_CACHE_PREFIX}${projectId}`),
    cacheService.delete(`${API_KEY_LIST_CACHE_PREFIX}active:${projectId}`),
  ]);
}
