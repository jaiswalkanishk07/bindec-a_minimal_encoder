export const BASES = ["bin", "dec", "hex", "oct"] as const;
export type Base = (typeof BASES)[number];

export const BIT_WIDTHS = [8, 16, 32, 64] as const;
export type BitWidth = (typeof BIT_WIDTHS)[number];

export type ConvertRequest = {
  value: string;
  from: Base;
  to: Base;
  signed?: boolean;
  bitWidth?: BitWidth;
};

export type ConvertOk = {
  ok: true;
  result: string;
  normalized: string;
  warnings: string[];
};

export type Step = { label: string; detail: string };

export type ExplainOk = ConvertOk & { steps: Step[] };
