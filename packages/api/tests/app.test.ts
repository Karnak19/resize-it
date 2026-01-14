import { describe, it, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { imageController } from "../src/controllers/image.controller";
import { adminController } from "../src/controllers/admin.controller";

describe("API App", () => {
  let app: Elysia;

  beforeAll(() => {
    app = new Elysia()
      .get("/", () => "Hello World")
      .use(adminController)
      .use(imageController);
  });

  describe("smoke tests", () => {
    it("should import and create the app without errors", () => {
      expect(app).toBeDefined();
    });

    it("should respond to root endpoint", async () => {
      const response = await app.handle(new Request("http://localhost/"));
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe("Hello World");
    });

    it("should respond to health endpoint", async () => {
      const response = await app.handle(
        new Request("http://localhost/images/health")
      );
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({ status: "ok" });
    });
  });
});
