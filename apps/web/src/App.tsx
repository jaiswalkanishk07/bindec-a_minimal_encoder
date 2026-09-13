import { useEffect, useMemo, useState } from "react";
import { ConvertError, type Base, type BitWidth, type Step } from "@bindec/core";
import Background from "./components/fx/Background.tsx";
import ConsoleCard from "./features/convert/ConsoleCard.tsx";
import BitRail from "./features/bits/BitRail.tsx";
import ExplainPanel from "./features/explain/ExplainPanel.tsx";
import HistoryPanel from "./features/history/HistoryPanel.tsx";
import { localConvert, remoteConvert, remoteExplain } from "./lib/api.ts";
import { loadHistory, pushHistory, type Hist } from "./lib/history.ts";

const BASES: Base[] = ["bin", "dec", "hex", "oct"];

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
    try {
      await navigator.clipboard.writeText(result);
    } catch {
      // Older WebViews: fall back to a hidden textarea + exec("copy").
      const ta = document.createElement("textarea");
      ta.value = result;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <Background />
      <main className="relative z-10 mx-auto flex max-w-3xl flex-col gap-6 px-5 py-10">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.28em] text-[var(--muted)]">BINDEC</p>
            <h1 className="display mt-1 text-4xl italic text-[var(--ink)]">Number console</h1>
          </div>
          <button type="button" onClick={() => setSigned((s) => !s)} className="glass rounded-full px-3 py-1.5 text-xs">
            {signed ? "signed" : "unsigned"}
          </button>
        </header>

        <ConsoleCard
          from={from}
          to={to}
          value={value}
          result={result}
          error={error}
          degraded={degraded}
          copied={copied}
          onFrom={setFrom}
          onTo={setTo}
          onValue={setValue}
          onSwap={swap}
          onCopy={copyOut}
        />

        <BitRail bitWidth={bitWidth} onWidth={setBitWidth} bits={bits} onToggle={toggleBit} />

        <ExplainPanel steps={steps} />

        <HistoryPanel
          history={history}
          onPick={(f, t, v) => {
            setFrom(f);
            setTo(t);
            setValue(v);
          }}
        />
      </main>
    </div>
  );
}