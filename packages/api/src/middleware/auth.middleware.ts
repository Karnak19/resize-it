import { Elysia } from "elysia";
import { config } from "../config";

export const ApiKeyService = new Elysia({ name: "Service.ApiKey" }).derive(
  { as: "scoped" },
  ({ headers, status }) => {
    const apiKey = headers["x-api-key"];

    if (!config.security.enableApiKeyAuth) {
      return {};
    }

    if (!apiKey || !config.security.apiKeys.includes(apiKey)) {
      throw status(401, { message: "Unauthorized: Invalid API key" });
    }

    return { apiKey };
  }
);
