export const ErrorCode = {
  EMPTY: "EMPTY",
  INVALID_DIGIT: "INVALID_DIGIT",
  OVERFLOW_WIDTH: "OVERFLOW_WIDTH",
  UNSUPPORTED_FRACTION: "UNSUPPORTED_FRACTION",
  SAME_BASE: "SAME_BASE",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class ConvertError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string, status = 400) {
    super(message);
    this.name = "ConvertError";
    this.code = code;
    this.status = status;
  }
}

export function problem(err: ConvertError) {
  return {
    type: `urn:bindec:error:${err.code}`,
    title: err.code,
    status: err.status,
    detail: err.message,
  };
}
