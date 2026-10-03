import { describe, expect, it } from "vitest";
import { asciiView, colorView, ConvertError, convert, explain, permView, validate, views } from "../src/index.ts";

describe("convert", () => {
  it("bin to dec", () => {
    expect(convert({ value: "1011", from: "bin", to: "dec" }).result).toBe("11");
  });
  it("dec to bin", () => {
    expect(convert({ value: "11", from: "dec", to: "bin" }).result).toBe("1011");
  });
  it("strips prefixes and grouping", () => {
    expect(convert({ value: "0b1010_1100", from: "bin", to: "dec" }).result).toBe("172");
    expect(convert({ value: "0xFF", from: "hex", to: "dec" }).result).toBe("255");
    expect(convert({ value: "0o17", from: "oct", to: "dec" }).result).toBe("15");
  });
  it("uses BigInt for large values", () => {
    const v = "18446744073709551616";
    expect(convert({ value: v, from: "dec", to: "hex" }).result).toBe("10000000000000000");
    expect(JSON.parse(JSON.stringify({ result: v })).result).toBe(v);
  });
  it("signed two's complement", () => {
    expect(convert({ value: "11111111", from: "bin", to: "dec", signed: true, bitWidth: 8 }).result).toBe("-1");
    expect(convert({ value: "-1", from: "dec", to: "bin", signed: true, bitWidth: 8 }).result).toBe("11111111");
  });
  it("overflows width", () => {
    expect(() => convert({ value: "256", from: "dec", to: "bin", bitWidth: 8 })).toThrow(ConvertError);
  });
  it("rejects empty and bad digits", () => {
    expect(() => convert({ value: "  ", from: "bin", to: "dec" })).toThrow(/empty/i);
    expect(() => convert({ value: "102", from: "bin", to: "dec" })).toThrow(/Invalid/);
    expect(() => convert({ value: "1.01", from: "bin", to: "dec" })).toThrow(/Fractional/);
  });
  it("rejects same base", () => {
    expect(() => convert({ value: "101", from: "bin", to: "bin" })).toThrow(/differ/i);
    expect(() => validate({ value: "10", from: "dec", to: "dec" })).toThrow(/differ/i);
  });
  it("validate normalizes", () => {
    expect(validate({ value: "00101", from: "bin", to: "dec" }).normalized).toBe("101");
  });
  it("explain has steps", () => {
    const e = explain({ value: "101", from: "bin", to: "dec" });
    expect(e.steps.length).toBeGreaterThan(1);
    expect(e.result).toBe("5");
  });
});

describe("views", () => {
  it("perm maps octal to rwx", () => {
    expect(permView({ value: "755", from: "oct" })).toMatchObject({ octal: "755", rwx: "rwx r-x r-x", valid: true });
    expect(permView({ value: "493", from: "dec" })).toMatchObject({ rwx: "rwx r-x r-x", valid: true });
    expect(permView({ value: "0o644", from: "oct" })).toMatchObject({ rwx: "rw- r-- r--", valid: true });
  });
  it("perm rejects out of range", () => {
    expect(permView({ value: "9999", from: "dec" }).valid).toBe(false);
    expect(permView({ value: "", from: "dec" }).valid).toBe(false);
  });
  it("ascii decodes printable bytes", () => {
    const a = asciiView({ value: "4869", from: "hex" });
    expect(a.printable).toBe(true);
    expect(a.text).toBe("Hi");
  });
  it("ascii marks non-printable", () => {
    expect(asciiView({ value: "ff", from: "hex" }).printable).toBe(false);
    expect(asciiView({ value: "0", from: "dec" }).printable).toBe(false);
  });
  it("color splits rgb", () => {
    expect(colorView({ value: "ff7f50", from: "hex" })).toMatchObject({
      hex: "#ff7f50",
      rgb: { r: 255, g: 127, b: 80 },
      valid: true,
    });
    expect(colorView({ value: "16711680", from: "dec" }).hex).toBe("#ff0000");
    expect(colorView({ value: "1ffffff", from: "hex" }).valid).toBe(false);
  });
  it("views bundles all three", () => {
    const v = views({ value: "644", from: "oct" });
    expect(v.perm.rwx).toBe("rw- r-- r--");
    expect(v.ascii.bytes).toEqual([1, 164]);
    expect(v.color.valid).toBe(true);
  });
});
