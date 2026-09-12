import { afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.ts";

const app = await buildApp();
const limitApp = await buildApp({ rateMax: 2 });

afterAll(async () => {
  await app.close();
  await limitApp.close();
});

describe("api", () => {
  it("health", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });
  it("meta exposes bases and widths", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/meta" });
    expect(res.statusCode).toBe(200);
    expect(res.json().bases).toContain("bin");
    expect(res.json().bitWidths).toEqual([8, 16, 32, 64]);
  });
  it("validate normalizes", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/validate",
      payload: { value: "00101", from: "bin", to: "dec" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().normalized).toBe("101");
  });
  it("converts", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/convert",
      payload: { value: "1011", from: "bin", to: "dec" },
    });
    expect(res.json().result).toBe("11");
  });
  it("rejects bad binary", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/convert",
      payload: { value: "102", from: "bin", to: "dec" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().title).toBe("INVALID_DIGIT");
  });
  it("rejects same base with SAME_BASE", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/convert",
      payload: { value: "101", from: "bin", to: "bin" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().title).toBe("SAME_BASE");
  });
  it("explains", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/explain",
      payload: { value: "101", from: "bin", to: "dec" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().steps.length).toBeGreaterThan(1);
  });
  it("get convert", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/convert?from=dec&to=bin&value=10" });
    expect(res.json().result).toBe("1010");
  });
  it("enforces CORS allowlist", async () => {
    const allowed = await app.inject({
      method: "GET",
      url: "/v1/health",
      headers: { origin: "http://localhost:5173" },
    });
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    const blocked = await app.inject({
      method: "GET",
      url: "/v1/health",
      headers: { origin: "https://evil.example.com" },
    });
    expect(blocked.statusCode).toBe(200);
    expect(blocked.headers["access-control-allow-origin"]).toBeUndefined();
  });
  it("rate limits", async () => {
    const hits = [];
    for (let i = 0; i < 3; i++) hits.push(await limitApp.inject({ method: "GET", url: "/v1/health" }));
    expect(hits[0].statusCode).toBe(200);
    expect(hits[1].statusCode).toBe(200);
    expect(hits[2].statusCode).toBe(429);
  });
});
