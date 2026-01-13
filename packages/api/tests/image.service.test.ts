import { describe, it, expect } from "bun:test";
import { ImageService } from "../src/services/image.service";

describe("ImageService", () => {
  const imageService = new ImageService();

  describe("isHeic", () => {
    const validSignatures = [
      "ftypheic",
      "ftypheix",
      "ftyphevc",
      "ftyphevx",
      "ftypmif1",
      "ftypmsf1",
    ];

    for (const signature of validSignatures) {
      it(`should return true for a HEIC image buffer with signature ${signature}`, () => {
        const heicBuffer = Buffer.concat([
          Buffer.alloc(4),
          Buffer.from(signature),
          Buffer.alloc(4),
        ]);
        // @ts-ignore - accessing private method for testing
        const result = imageService.isHeic(heicBuffer);
        expect(result).toBe(true);
      });
    }

    const validShortSignatures = ["heic", "heix", "hevc", "hevx"];

    for (const signature of validShortSignatures) {
      it(`should return true for a HEIC image buffer with short signature ${signature}`, () => {
        const heicBuffer = Buffer.concat([
          Buffer.alloc(8),
          Buffer.from(signature),
          Buffer.alloc(4),
        ]);
        // @ts-ignore - accessing private method for testing
        const result = imageService.isHeic(heicBuffer);
        expect(result).toBe(true);
      });
    }

    it("should return false for a non-HEIC image buffer", () => {
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
