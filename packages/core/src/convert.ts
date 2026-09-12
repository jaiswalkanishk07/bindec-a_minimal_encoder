import { ConvertError, ErrorCode } from "./errors.ts";
import type { Base, BitWidth, ConvertOk, ConvertRequest, ExplainOk, Step } from "./types.ts";

const RADIX: Record<Base, number> = { bin: 2, oct: 8, dec: 10, hex: 16 };
const CHARSET: Record<Base, RegExp> = {
  bin: /^[01]+$/,
  oct: /^[0-7]+$/,
  dec: /^[0-9]+$/,
  hex: /^[0-9a-fA-F]+$/,
};
const PREFIX: Record<Base, RegExp> = {
  bin: /^(0b)/i,
  oct: /^(0o)/i,
  dec: /^(0d)/i,
  hex: /^(0x)/i,
};

export const META = {
  bases: ["bin", "dec", "hex", "oct"] as const,
  bitWidths: [8, 16, 32, 64] as const,
  maxDigits: 1024,
};

export function normalizeDigits(value: string, from: Base): { digits: string; warnings: string[] } {
  const warnings: string[] = [];
  let raw = value.trim();
  if (!raw) throw new ConvertError(ErrorCode.EMPTY, "Value is empty.");
  if (raw.includes(".")) {
    throw new ConvertError(ErrorCode.UNSUPPORTED_FRACTION, "Fractional values are not supported yet.");
  }
  raw = raw.replace(/[_\s]/g, "");
  let negative = false;
  if (raw.startsWith("-")) {
    if (from !== "dec") throw new ConvertError(ErrorCode.INVALID_DIGIT, `Invalid ${from} digits.`);
    negative = true;
    raw = raw.slice(1);
  }
  if (PREFIX[from].test(raw)) raw = raw.slice(2);
  if (!raw) throw new ConvertError(ErrorCode.EMPTY, "Value is empty after stripping prefix.");
  if (raw.length > META.maxDigits) {
    throw new ConvertError(ErrorCode.OVERFLOW_WIDTH, `Value exceeds ${META.maxDigits} digits.`);
  }
  if (!CHARSET[from].test(raw)) {
    throw new ConvertError(ErrorCode.INVALID_DIGIT, `Invalid ${from} digits.`);
  }
  const canonical = from === "hex" ? raw.toLowerCase() : raw;
  const stripped = canonical.replace(/^0+(?=.)/, "") || "0";
  if (stripped !== canonical) warnings.push("leading_zeros_stripped");
  return { digits: negative ? `-${stripped}` : stripped, warnings };
}

function parseIntValue(digits: string, from: Base): bigint {
  if (from === "dec") return BigInt(digits);
  return BigInt(`${{ bin: "0b", oct: "0o", hex: "0x" }[from]}${digits}`);
}

function formatUnsigned(n: bigint, to: Base): string {
  if (n < 0n) throw new ConvertError(ErrorCode.OVERFLOW_WIDTH, "Negative value needs signed mode.");
  return n.toString(RADIX[to]);
}

function twosFromBits(bits: string, width: BitWidth): bigint {
  if (bits.length > width) {
    throw new ConvertError(ErrorCode.OVERFLOW_WIDTH, `Binary exceeds ${width} bits.`);
  }
  const padded = bits.padStart(width, "0");
  const unsigned = parseIntValue(padded, "bin");
  const sign = 1n << BigInt(width - 1);
  const mod = 1n << BigInt(width);
  return unsigned >= sign ? unsigned - mod : unsigned;
}

function toTwosBits(n: bigint, width: BitWidth): string {
  const min = -(1n << BigInt(width - 1));
  const max = (1n << BigInt(width - 1)) - 1n;
  if (n < min || n > max) {
    throw new ConvertError(ErrorCode.OVERFLOW_WIDTH, `Value does not fit signed ${width}-bit.`);
  }
  const mod = 1n << BigInt(width);
  const unsigned = n < 0n ? n + mod : n;
  return unsigned.toString(2).padStart(width, "0");
}

function toUnsignedBits(n: bigint, width: BitWidth): string {
  const max = (1n << BigInt(width)) - 1n;
  if (n < 0n || n > max) {
    throw new ConvertError(ErrorCode.OVERFLOW_WIDTH, `Value does not fit unsigned ${width}-bit.`);
  }
  return n.toString(2).padStart(width, "0");
}

export function convert(req: ConvertRequest): ConvertOk {
  if (req.from === req.to) {
    throw new ConvertError(ErrorCode.SAME_BASE, `Target base must differ from source (${req.from}).`);
  }
  const { digits, warnings } = normalizeDigits(req.value, req.from);
  let n: bigint;
  if (req.signed && req.from === "bin" && req.bitWidth) {
    n = twosFromBits(digits, req.bitWidth);
  } else {
    n = parseIntValue(digits, req.from);
  }

  let result: string;
  if (req.to === "bin" && req.bitWidth) {
    result = req.signed ? toTwosBits(n, req.bitWidth) : toUnsignedBits(n, req.bitWidth);
  } else if (n < 0n) {
    result = n.toString(RADIX[req.to]);
  } else {
    result = formatUnsigned(n, req.to);
  }

  return { ok: true, result, normalized: digits, warnings };
}

export function validate(req: ConvertRequest): { ok: true; normalized: string; warnings: string[] } {
  if (req.from === req.to) {
    throw new ConvertError(ErrorCode.SAME_BASE, `Target base must differ from source (${req.from}).`);
  }
  const { digits, warnings } = normalizeDigits(req.value, req.from);
  return { ok: true, normalized: digits, warnings };
}

export function explain(req: ConvertRequest): ExplainOk {
  const converted = convert(req);
  const steps: Step[] = [];
  if (req.from === "bin" && req.to === "dec") {
    const bits = converted.normalized;
    let sum = 0n;
    [...bits].forEach((bit, i) => {
      const power = bits.length - 1 - i;
      const term = BigInt(bit) * (2n ** BigInt(power));
      sum += term;
      steps.push({
        label: `${bit} × 2^${power}`,
        detail: `${term}`,
      });
    });
    steps.push({ label: "sum", detail: sum.toString(10) });
  } else if (req.from === "dec" && req.to === "bin") {
    let n = parseIntValue(converted.normalized, "dec");
    if (n < 0n) n = -n;
    if (n === 0n) steps.push({ label: "0 ÷ 2", detail: "remainder 0" });
    const remainders: string[] = [];
    while (n > 0n) {
      const r = n % 2n;
      steps.push({ label: `${n} ÷ 2`, detail: `remainder ${r}` });
      remainders.push(r.toString());
      n /= 2n;
    }
    if (remainders.length) {
      steps.push({ label: "remainders reversed", detail: remainders.reverse().join("") });
    }
  } else {
    steps.push({ label: "convert", detail: `${req.from} → ${req.to} = ${converted.result}` });
  }
  return { ...converted, steps };
}
