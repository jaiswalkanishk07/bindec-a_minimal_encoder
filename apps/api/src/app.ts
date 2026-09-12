import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { BASES, BIT_WIDTHS, ConvertError, convert, explain, META, problem, validate, type Base, type BitWidth, type ConvertRequest } from "@bindec/core";

function isBase(v: unknown): v is Base {
  return typeof v === "string" && (BASES as readonly string[]).includes(v);
}
function isWidth(v: unknown): v is BitWidth {
  return typeof v === "number" && (BIT_WIDTHS as readonly number[]).includes(v);
}

function parseBody(body: unknown): ConvertRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.value !== "string") throw new ConvertError("EMPTY", "value must be a string.");
  if (!isBase(b.from) || !isBase(b.to)) throw new ConvertError("INVALID_DIGIT", "from/to must be bin, dec, hex, or oct.");
  const bitWidth = b.bitWidth === undefined ? undefined : Number(b.bitWidth);
  if (b.bitWidth !== undefined && !isWidth(bitWidth)) {
    throw new ConvertError("OVERFLOW_WIDTH", "bitWidth must be 8, 16, 32, or 64.");
  }
  return {
    value: b.value,
    from: b.from,
    to: b.to,
    signed: Boolean(b.signed),
    bitWidth: isWidth(bitWidth) ? bitWidth : undefined,
  };
}

export type AppOptions = { corsOrigin?: string[]; rateMax?: number };

function parseCorsOrigins(fromEnv?: string, fallback = "http://localhost:5173"): string[] {
  const raw = (fromEnv ?? "").trim();
  return (raw ? raw.split(",").map((o) => o.trim()) : [fallback]).filter(Boolean);
}

export async function buildApp(opts: AppOptions = {}) {
  const app = Fastify({ logger: true, bodyLimit: 32_768 });
  await app.register(helmet);
  const allowed = opts.corsOrigin ?? parseCorsOrigins(process.env.CORS_ORIGIN);
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(new Error("Origin not allowed"), false);
    },
  });
  await app.register(rateLimit, { max: opts.rateMax ?? 120, timeWindow: "1 minute" });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ConvertError) {
      return reply.status(err.status).send(problem(err));
    }
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    return reply.status(status).send({
      type: "urn:bindec:error:INTERNAL",
      title: "INTERNAL",
      status,
      detail: err.message,
    });
  });

  app.get("/v1/health", async () => ({ ok: true }));
  app.get("/v1/meta", async () => META);

  app.post("/v1/validate", async (req) => validate(parseBody(req.body)));
  app.post("/v1/convert", async (req) => convert(parseBody(req.body)));
  app.post("/v1/explain", async (req) => explain(parseBody(req.body)));

  app.get("/v1/convert", async (req) => {
    const q = req.query as Record<string, string | undefined>;
    return convert(
      parseBody({
        value: q.value ?? q.v ?? "",
        from: q.from,
        to: q.to,
        signed: q.signed === "1" || q.signed === "true",
        bitWidth: q.bitWidth ? Number(q.bitWidth) : undefined,
      }),
    );
  });

  return app;
}
