import { beforeAll, describe, expect, it, mock, spyOn } from "bun:test";
import { ResizeIt } from "./index";

describe("ResizeIt SDK", () => {
  // Mock fetch for testing
  const originalFetch = global.fetch;

  // Add beforeEach function
  let beforeEachFn: () => void;
  beforeAll(() => {
    beforeEachFn = () => {
      // Reset fetch to the original implementation before each test
      global.fetch = originalFetch;
    };
    beforeEachFn();
  });

  describe("constructor", () => {
    it("should initialize with default options", () => {
      const sdk = new ResizeIt({ baseUrl: "https://api.example.com" });
      // @ts-ignore - accessing private property for testing
      expect(sdk.config.baseUrl).toBe("https://api.example.com");
      // @ts-ignore - accessing private property for testing
      expect(sdk.config.timeout).toBe(30000);
    });

    it("should remove trailing slash from baseUrl", () => {
      const sdk = new ResizeIt({ baseUrl: "https://api.example.com/" });
      // @ts-ignore - accessing private property for testing
      expect(sdk.config.baseUrl).toBe("https://api.example.com");
    });
  });

  describe("getResizeUrl", () => {
    it("should generate a correct URL with basic options", () => {
      const sdk = new ResizeIt({ baseUrl: "https://api.example.com" });
      const url = sdk.getResizeUrl("images/test.jpg", {
        width: 300,
        height: 200,
        format: "webp",
        quality: 80,
      });

      expect(url).toBe(
        "https://api.example.com/images/resize/images/test.jpg?width=300&height=200&format=webp&quality=80"
      );
    });

    it("should include transformation options in the URL", () => {
      const sdk = new ResizeIt({ baseUrl: "https://api.example.com" });
      const url = sdk.getResizeUrl("images/test.jpg", {
        width: 300,
        height: 200,
        rotate: 90,
        flip: true,
        grayscale: true,
      });

      expect(url).toBe(
        "https://api.example.com/images/resize/images/test.jpg?width=300&height=200&rotate=90&flip=true&grayscale=true"
      );
    });

    it("should include watermark options in the URL", () => {
      const sdk = new ResizeIt({ baseUrl: "https://api.example.com" });
      const url = sdk.getResizeUrl("images/test.jpg", {
        width: 300,
        height: 200,
        watermark: {
          text: "Example",
          position: "bottom-right",
          opacity: 0.5,
        },
      });

      expect(url).toBe(
        "https://api.example.com/images/resize/images/test.jpg?width=300&height=200&watermarkText=Example&watermarkPosition=bottom-right&watermarkOpacity=0.5"
      );
    });

    it("should include crop options in the URL", () => {
      const sdk = new ResizeIt({ baseUrl: "https://api.example.com" });
      const url = sdk.getResizeUrl("images/test.jpg", {
        width: 300,
        height: 200,
        crop: {
          left: 10,
          top: 20,
          width: 100,
          height: 100,
        },
      });

      expect(url).toBe(
        "https://api.example.com/images/resize/images/test.jpg?width=300&height=200&cropLeft=10&cropTop=20&cropWidth=100&cropHeight=100"
      );
    });
  });

  describe("uploadImage", () => {
    it("should upload a buffer correctly", async () => {
      // Mock fetch to return a successful response
      global.fetch = mock(() => {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              path: "images/test.jpg",
              url: "https://api.example.com/images/test.jpg",
            }),
          headers: new Headers(),
          redirected: false,
          status: 200,
          statusText: "OK",
          type: "basic" as ResponseType,
          url: "https://api.example.com/upload",
          clone: () => ({} as Response),
          body: null,
          bodyUsed: false,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          blob: () => Promise.resolve(new Blob([])),
          formData: () => Promise.resolve(new FormData()),
          text: () => Promise.resolve(""),
        } as Response);
      });

      const sdk = new ResizeIt({ baseUrl: "https://api.example.com" });
      const buffer = Buffer.from("test image data");
      const response = await sdk.uploadImage(buffer, {
        path: "images/test.jpg",
        contentType: "image/jpeg",
      });

      expect(response.success).toBe(true);
      expect(response.path).toBe("images/test.jpg");
      expect(response.url).toBe("https://api.example.com/images/test.jpg");

      // Verify fetch was called with the right arguments
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/images/upload",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.any(String),
        })
      );
    });

    it("should handle errors correctly", async () => {
      // Mock fetch to return an error response
      global.fetch = mock(() => {
        return Promise.resolve({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          json: () =>
            Promise.resolve({
              error: "Invalid image data",
            }),
          headers: new Headers(),
          redirected: false,
          type: "basic" as ResponseType,
          url: "https://api.example.com/upload",
          clone: () => ({} as Response),
          body: null,
          bodyUsed: false,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          blob: () => Promise.resolve(new Blob([])),
          formData: () => Promise.resolve(new FormData()),
          text: () => Promise.resolve(""),
        } as Response);
      });

      const sdk = new ResizeIt({ baseUrl: "https://api.example.com" });
      const buffer = Buffer.from("test image data");

      await expect(
        sdk.uploadImage(buffer, {
          path: "images/test.jpg",
          contentType: "image/jpeg",
        })
      ).rejects.toThrow("Failed to upload image: Invalid image data");
    });
  });

  describe("getResizedImage", () => {
    it("should fetch a resized image correctly", async () => {
      // Mock fetch to return a successful response
      const mockBlob = new Blob(["test image data"], { type: "image/webp" });
      global.fetch = mock(() => {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
          headers: new Headers(),
          redirected: false,
          status: 200,
          statusText: "OK",
          type: "basic" as ResponseType,
          url: "https://api.example.com/resize/images/test.jpg",
          clone: () => ({} as Response),
          body: null,
          bodyUsed: false,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          json: () => Promise.resolve({}),
          formData: () => Promise.resolve(new FormData()),
          text: () => Promise.resolve(""),
        } as Response);
      });

      const sdk = new ResizeIt({ baseUrl: "https://api.example.com" });
      const blob = await sdk.getResizedImage("images/test.jpg", {
        width: 300,
        height: 200,
      });

      expect(blob).toBe(mockBlob);

      // Verify fetch was called with the right URL
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/images/resize/images/test.jpg?width=300&height=200",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should handle errors correctly", async () => {
      // Mock fetch to return an error response
      global.fetch = mock(() => {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: "Not Found",
          headers: new Headers(),
          redirected: false,
          type: "basic" as ResponseType,
          url: "https://api.example.com/resize/images/nonexistent.jpg",
          clone: () => ({} as Response),
          body: null,
          bodyUsed: false,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          blob: () => Promise.resolve(new Blob([])),
          json: () => Promise.resolve({}),
          formData: () => Promise.resolve(new FormData()),
          text: () => Promise.resolve(""),
        } as Response);
      });

      const sdk = new ResizeIt({ baseUrl: "https://api.example.com" });

      await expect(
        sdk.getResizedImage("images/nonexistent.jpg")
      ).rejects.toThrow("Failed to get resized image: 404 Not Found");
    });
  });
});
