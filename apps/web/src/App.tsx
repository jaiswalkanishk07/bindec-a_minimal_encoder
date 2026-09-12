import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ConvertError, type Base, type BitWidth, type Step } from "@bindec/core";
import { localConvert, remoteConvert, remoteExplain } from "./lib/api.ts";
import { loadHistory, pushHistory, type Hist } from "./lib/history.ts";

const BASES: Base[] = ["bin", "dec", "hex", "oct"];
const WIDTHS: BitWidth[] = [8, 16, 32, 64];

function params() {
  const q = new URLSearchParams(location.search);
  return {
    from: (BASES.includes(q.get("from") as Base) ? q.get("from") : "bin") as Base,
    to: (BASES.includes(q.get("to") as Base) ? q.get("to") : "dec") as Base,
    value: q.get("v") ?? "",
  };
}

export default function App() {
  const init = params();
  const [from, setFrom] = useState<Base>(init.from);
  const [to, setTo] = useState<Base>(init.to);
  const [value, setValue] = useState(init.value);
  const [signed, setSigned] = useState(false);
  const [bitWidth, setBitWidth] = useState<BitWidth>(8);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [degraded, setDegraded] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [history, setHistory] = useState<Hist[]>(() => loadHistory());
  const [copied, setCopied] = useState(false);

  const payload = useMemo(
    () => ({ value, from, to, signed, bitWidth: from === "bin" || to === "bin" ? bitWidth : undefined }),
    [value, from, to, signed, bitWidth],
  );

  useEffect(() => {
    const url = new URL(location.href);
    url.searchParams.set("from", from);
    url.searchParams.set("to", to);
    if (value) url.searchParams.set("v", value);
    else url.searchParams.delete("v");
    window.history.replaceState(null, "", url);
  }, [from, to, value]);

  useEffect(() => {
    if (!value.trim()) {
      setResult("");
      setError("");
      setSteps([]);
      return;
    }
    try {
      const local = localConvert(payload);
      setResult(local.result);
      setError("");
    } catch (e) {
      setResult("");
      setError(e instanceof ConvertError ? e.message : "Invalid input");
      setSteps([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const remote = await remoteConvert(payload);
        setResult(remote.result);
        setDegraded("degraded" in remote && remote.degraded);
        const ex = await remoteExplain(payload);
        setSteps(ex.steps);
        setHistory(pushHistory({ at: Date.now(), from, to, value, result: remote.result }));
      } catch (e) {
        setError(e instanceof ConvertError ? e.message : "Convert failed");
      }
    }, 180);
    return () => clearTimeout(t);
  }, [payload, from, to, value]);

  function swap() {
    setFrom(to);
    setTo(from);
    setValue(result || value);
  }

  function toggleBit(i: number) {
    const w = bitWidth;
    let bits = (from === "bin" && value.replace(/[^01]/g, "") ? value.replace(/[^01]/g, "") : "0").padStart(w, "0");
    if (bits.length > w) bits = bits.slice(-w);
    const arr = bits.split("");
    arr[i] = arr[i] === "1" ? "0" : "1";
    setFrom("bin");
    setValue(arr.join(""));
  }

  const bits = useMemo(() => {
    const raw = from === "bin" ? value.replace(/[^01]/g, "") : result && to === "bin" ? result : "";
    return raw.padStart(bitWidth, "0").slice(-bitWidth).split("");
  }, [from, to, value, result, bitWidth]);

  async function copyOut() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="aurora" />
      <div className="grid-fade" />
      <main className="relative z-10 mx-auto flex max-w-3xl flex-col gap-6 px-5 py-10">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.28em] text-[var(--muted)]">BINDEC</p>
            <h1 className="display mt-1 text-4xl italic text-[var(--ink)]">Number console</h1>
          </div>
          <button
            type="button"
            onClick={() => setSigned((s) => !s)}
            className="glass rounded-full px-3 py-1.5 text-xs"
          >
            {signed ? "signed" : "unsigned"}
          </button>
        </header>

        <motion.section layout className="glass rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            {BASES.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setFrom(b)}
                className={`rounded-full px-3 py-1 text-xs ${from === b ? "bg-[var(--accent)] text-[#07201a]" : "bg-white/5"}`}
              >
                {b}
              </button>
            ))}
            <button type="button" onClick={swap} className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs">
              swap
            </button>
            {BASES.map((b) => (
              <button
                key={`to-${b}`}
                type="button"
                onClick={() => setTo(b)}
                className={`rounded-full px-3 py-1 text-xs ${to === b ? "bg-[var(--accent)] text-[#07201a]" : "bg-white/5"}`}
              >
                {b}
              </button>
            ))}
          </div>

          <label className="mt-5 block text-xs text-[var(--muted)]">input</label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={from === "bin" ? "1011" : "11"}
            autoCapitalize="off"
            autoCorrect="off"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-2xl outline-none focus:border-[var(--accent)]"
          />

          {from === "bin" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {["0", "1", "⌫"].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setValue((v) => (k === "⌫" ? v.slice(0, -1) : v + k))}
                  className="min-w-12 rounded-xl bg-white/8 px-3 py-2 text-sm"
                >
                  {k}
                </button>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-[var(--muted)]">result · {to}</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={result || error || "idle"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="display mt-1 text-3xl italic"
                >
                  {error || result || "—"}
                </motion.p>
              </AnimatePresence>
            </div>
            <button type="button" onClick={copyOut} className="glass rounded-full px-3 py-1.5 text-xs">
              {copied ? "copied" : "copy"}
            </button>
          </div>
          {degraded && <p className="mt-3 text-xs text-amber-300/80">API offline — using local core</p>}
        </motion.section>

        <section className="glass rounded-3xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-[var(--muted)]">bits</p>
            <div className="flex gap-1">
              {WIDTHS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setBitWidth(w)}
                  className={`rounded-full px-2 py-1 text-[10px] ${bitWidth === w ? "bg-[var(--accent)] text-[#07201a]" : "bg-white/5"}`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {bits.map((bit, i) => (
              <motion.button
                key={`${bitWidth}-${i}`}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => toggleBit(i)}
                className={`h-9 w-9 rounded-lg text-sm ${bit === "1" ? "bg-[var(--accent)] text-[#07201a]" : "bg-white/8"}`}
              >
                {bit}
              </motion.button>
            ))}
          </div>
        </section>

        <section className="glass rounded-3xl p-5">
          <p className="text-xs text-[var(--muted)]">steps</p>
          <ul className="mt-3 space-y-2">
            {steps.map((s, i) => (
              <motion.li
                key={`${s.label}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex justify-between gap-4 text-sm"
              >
                <span>{s.label}</span>
                <span className="text-[var(--accent)]">{s.detail}</span>
              </motion.li>
            ))}
            {!steps.length && <li className="text-sm text-[var(--muted)]">Enter a value to see the walkthrough.</li>}
          </ul>
        </section>

        <section>
          <p className="mb-2 text-xs text-[var(--muted)]">recent</p>
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <button
                key={h.at}
                type="button"
                onClick={() => {
                  setFrom(h.from as Base);
                  setTo(h.to as Base);
                  setValue(h.value);
                }}
                className="glass rounded-2xl px-4 py-3 text-left text-sm"
              >
                {h.value} · {h.from} → {h.to} = {h.result}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
