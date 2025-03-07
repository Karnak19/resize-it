import { ResizeIt } from "@karnak19/resize-it-sdk";

// Get the API URL from environment variables or use a default
const API_URL =
  process.env.NEXT_PUBLIC_RESIZE_IT_API_URL || "http://localhost:3001";
const API_KEY = process.env.NEXT_PUBLIC_RESIZE_IT_API_KEY;

// Create a singleton instance of the ResizeIt SDK
export const resizeItClient = new ResizeIt({
  baseUrl: API_URL,
  apiKey: API_KEY,
  timeout: 30000, // 30 seconds
});
