import { convert, ConvertError, explain, type Base, type BitWidth, type Step } from "@bindec/core";

export type Payload = {
  value: string;
  from: Base;
  to: Base;
  signed?: boolean;
  bitWidth?: BitWidth;
};

async function post<T>(path: string, body: Payload): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new ConvertError(data.title ?? "INVALID_DIGIT", data.detail ?? "Request failed.", res.status);
  return data as T;
}

export function localConvert(p: Payload) {
  return convert(p);
}

export async function remoteConvert(p: Payload) {
  try {
    return await post<{ result: string; normalized: string; warnings: string[] }>("/v1/convert", p);
  } catch (err) {
    if (err instanceof ConvertError && err.status === 400) throw err;
    return { ...convert(p), degraded: true as const };
  }
}

export async function remoteExplain(p: Payload): Promise<{ steps: Step[]; degraded?: boolean }> {
  try {
    return await post<{ steps: Step[] }>("/v1/explain", p);
  } catch {
    return { steps: explain(p).steps, degraded: true };
  }
}
