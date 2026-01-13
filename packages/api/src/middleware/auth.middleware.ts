import { Elysia } from "elysia";
import { config } from "../config";

export const ApiKeyService = new Elysia({ name: "Service.ApiKey" }).derive(
  { as: "scoped" },
  ({ headers, set }) => {
    const apiKey = headers["x-api-key"];

    if (!config.security.enableApiKeyAuth) {
      return {};
    }

    if (!apiKey || !config.security.apiKeys.includes(apiKey)) {
      set.status = 401;
      return { message: "Unauthorized: Invalid API key" };
    }

    return { apiKey };
  }
);
