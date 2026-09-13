import { describe, expect, it } from "vitest";
import { ConvertError, convert, validate } from "@bindec/core";

// Client/server parity: the same @bindec/core functions run in the browser (optimistic)
// and the API (canonical). Re-running the shared cases in the web workspace proves parity.
describe("web parity — @bindec/core in the browser workspace", () => {
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
  it("BigInt large values stay strings", () => {
    const v = "18446744073709551616";
    const r = convert({ value: v, from: "dec", to: "hex" });
    expect(r.result).toBe("10000000000000000");
    expect(typeof r.result).toBe("string");
    expect(JSON.parse(JSON.stringify({ r: v })).r).toBe(v);
  });
  it("signed two's complement", () => {
    expect(convert({ value: "11111111", from: "bin", to: "dec", signed: true, bitWidth: 8 }).result).toBe("-1");
    expect(convert({ value: "-1", from: "dec", to: "bin", signed: true, bitWidth: 8 }).result).toBe("11111111");
  });
  it("rejects same base and bad digits", () => {
    expect(() => validate({ value: "10", from: "dec", to: "dec" })).toThrow(ConvertError);
    expect(() => convert({ value: "102", from: "bin", to: "dec" })).toThrow(/Invalid/);
  });
});