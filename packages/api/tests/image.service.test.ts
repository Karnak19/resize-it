import { describe, it, expect } from "bun:test";
import { ImageService } from "../src/services/image.service";

describe("ImageService", () => {
  const imageService = new ImageService();

  describe("isHeic", () => {
    it("should return true for a HEIC image buffer", () => {
      // A mock buffer with the 'ftypheic' signature at the correct position
      const heicBuffer = Buffer.concat([
        Buffer.alloc(4),
        Buffer.from("ftypheic"),
        Buffer.alloc(4),
      ]);
      // @ts-ignore - accessing private method for testing
      const result = imageService.isHeic(heicBuffer);
      expect(result).toBe(true);
    });

    it("should return false for a non-HEIC image buffer", () => {
      // A mock buffer without the 'ftypheic' signature
      const jpegBuffer = Buffer.concat([
        Buffer.alloc(4),
        Buffer.from("ftypjpeg"),
        Buffer.alloc(4),
      ]);
      // @ts-ignore - accessing private method for testing
      const result = imageService.isHeic(jpegBuffer);
      expect(result).toBe(false);
    });

    it("should return false for a buffer that is too short", () => {
      const shortBuffer = Buffer.from("ftypheic");
      // @ts-ignore - accessing private method for testing
      const result = imageService.isHeic(shortBuffer);
      expect(result).toBe(false);
    });
  });
});
