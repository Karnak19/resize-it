import { Elysia, error } from "elysia";
import { config } from "../config";
import { verifyApiKey, getApiKeyWithProject } from "../lib/api-keys";

export const ApiKeyService = new Elysia({ name: "Service.ApiKey" }).derive(
  { as: "scoped" },
  async ({ headers }) => {
    const apiKey = headers["x-api-key"];

    if (!config.security.enableApiKeyAuth) {
      return {};
    }

    if (!apiKey) {
      return error(401, { message: "Unauthorized: Missing API key" });
    }

    // If SaaS mode is enabled, validate API key against the database
    if (config.security.saasMode) {
      try {
        // Validate the API key using our read-access-layer
        const isValidApiKey = await verifyApiKey(apiKey);

        if (!isValidApiKey) {
          return error(401, { message: "Unauthorized: Invalid API key" });
        }

        // Get the API key details with project information
        const apiKeyRecord = await getApiKeyWithProject(apiKey);

        if (!apiKeyRecord) {
          // This should not happen since verifyApiKey already checked for existence
          return error(401, { message: "Unauthorized: Invalid API key" });
        }

        return {
          apiKey,
          projectId: apiKeyRecord.projectId,
          userId: apiKeyRecord.userId,
          bucketName: apiKeyRecord.projectBucketName,
        };
      } catch (err) {
        console.error("Error validating API key:", err);
        return error(500, { message: "Internal server error" });
      }
    } else {
      // If SaaS mode is disabled, use the traditional API key validation
      if (!config.security.apiKeys.includes(apiKey)) {
        return error(401, { message: "Unauthorized: Invalid API key" });
      }

      return { apiKey };
    }
  }
);

// New middleware that can accept API key from query parameters for image resize operations
export const ImageAuthMiddleware = new Elysia({
  name: "Middleware.ImageAuth",
}).derive({ as: "scoped" }, async ({ headers, query }) => {
  // Try to get API key from header first, then from query parameter
  const apiKey = headers["x-api-key"] || query.apiKey;

  if (!config.security.enableApiKeyAuth) {
    return {};
  }

  if (!apiKey) {
    return error(401, { message: "Unauthorized: Missing API key" });
  }

  // If SaaS mode is enabled, validate API key against the database
  if (config.security.saasMode) {
    try {
      // Validate the API key using our read-access-layer
      const isValidApiKey = await verifyApiKey(apiKey);

      if (!isValidApiKey) {
        return error(401, { message: "Unauthorized: Invalid API key" });
      }

      // Get the API key details with project information
      const apiKeyRecord = await getApiKeyWithProject(apiKey);

      if (!apiKeyRecord) {
        // This should not happen since verifyApiKey already checked for existence
        return error(401, { message: "Unauthorized: Invalid API key" });
      }

      return {
        apiKey,
        projectId: apiKeyRecord.projectId,
        userId: apiKeyRecord.userId,
        bucketName: apiKeyRecord.projectBucketName,
      };
    } catch (err) {
      console.error("Error validating API key:", err);
      return error(500, { message: "Internal server error" });
    }
  } else {
    // If SaaS mode is disabled, use the traditional API key validation
    if (!config.security.apiKeys.includes(apiKey)) {
      return error(401, { message: "Unauthorized: Invalid API key" });
    }

    return { apiKey };
  }
});
