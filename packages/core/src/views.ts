import type { Base } from "./types.ts";
import { normalizeDigits } from "./convert.ts";

export type ViewsInput = { value: string; from: Base };

export type PermView = { octal: string; rwx: string; valid: boolean };
export type AsciiView = { text: string; bytes: number[]; printable: boolean };
export type ColorView = {
  hex: string;
  rgb: { r: number; g: number; b: number } | null;
  css: string | null;
  valid: boolean;
};

export type ViewsResult = { perm: PermView; ascii: AsciiView; color: ColorView };

function toBigUnsigned(value: string, from: Base): bigint {
  const { digits } = normalizeDigits(value, from);
  if (from === "dec") return BigInt(digits);
  return BigInt(`${{ bin: "0b", oct: "0o", hex: "0x" }[from]}${digits}`);
}

function parseOctal(value: string, from: Base): bigint | null {
  try {
    return toBigUnsigned(value, from);
  } catch {
    return null;
  }
}

export function permView(input: ViewsInput): PermView {
  const n = parseOctal(input.value, input.from);
  if (n === null || n < 0n || n > 0o7777n) {
    return { octal: "", rwx: "", valid: false };
  }
  const octal = n.toString(8);
  const triple = octal.slice(-3).padStart(3, "0");
  const rwx = [...triple]
    .map((d) => {
      const b = Number(d).toString(2).padStart(3, "0");
      return `${b[0] === "1" ? "r" : "-"}${b[1] === "1" ? "w" : "-"}${b[2] === "1" ? "x" : "-"}`;
    })
    .join(" ");
  return { octal, rwx, valid: true };
}

export function asciiView(input: ViewsInput): AsciiView {
  const n = parseOctal(input.value, input.from);
  if (n === null || n < 0n) return { text: "", bytes: [], printable: false };
  const hex = n.toString(16).padStart(2, "0");
  const padded = hex.length % 2 === 0 ? hex : `0${hex}`;
  const bytes: number[] = [];
  for (let i = 0; i < padded.length; i += 2) bytes.push(Number.parseInt(padded.slice(i, i + 2), 16));
  if (bytes.length > 64) return { text: "", bytes: bytes.slice(0, 64), printable: false };
  const printable = bytes.length > 0 && bytes.every((b) => b >= 32 && b <= 126);
  const text = printable ? String.fromCharCode(...bytes) : "";
  return { text, bytes, printable };
}

export function colorView(input: ViewsInput): ColorView {
  const n = parseOctal(input.value, input.from);
  if (n === null || n < 0n || n > 0xffffffn) {
    return { hex: "", rgb: null, css: null, valid: false };
  }
  const hex = `#${n.toString(16).padStart(6, "0")}`;
  const r = Number((n >> 16n) & 0xffn);
  const g = Number((n >> 8n) & 0xffn);
  const b = Number(n & 0xffn);
  return { hex, rgb: { r, g, b }, css: `rgb(${r}, ${g}, ${b})`, valid: true };
}

export function views(input: ViewsInput): ViewsResult {
  return { perm: permView(input), ascii: asciiView(input), color: colorView(input) };
}
