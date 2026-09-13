import { AnimatePresence, motion } from "framer-motion";
import type { Base } from "@bindec/core";
import { BasePill, Key } from "../../components/ui.tsx";

const BASES: Base[] = ["bin", "dec", "hex", "oct"];

export default function ConsoleCard({
  from,
  to,
  value,
  result,
  error,
  degraded,
  copied,
  onFrom,
  onTo,
  onValue,
  onSwap,
  onCopy,
}: {
  from: Base;
  to: Base;
  value: string;
  result: string;
  error: string;
  degraded: boolean;
  copied: boolean;
  onFrom: (b: Base) => void;
  onTo: (b: Base) => void;
  onValue: (v: string) => void;
  onSwap: () => void;
  onCopy: () => void;
}) {
  return (
    <motion.section layout className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {BASES.map((b) => (
            <BasePill key={`from-${b}`} active={from === b} onClick={() => onFrom(b)}>
              {b}
            </BasePill>
          ))}
        </div>
        <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onSwap} className="ml-auto rounded-full bg-white/10 px-3 py-1.5 text-xs">
          swap
        </motion.button>
        <div className="flex gap-1.5">
          {BASES.map((b) => (
            <BasePill key={`to-${b}`} active={to === b} onClick={() => onTo(b)}>
              {b}
            </BasePill>
          ))}
        </div>
      </div>

      <label className="mt-5 block text-xs text-[var(--muted)]">input</label>
      <input
        value={value}
        onChange={(e) => onValue(e.target.value)}
        placeholder={from === "bin" ? "1011" : "11"}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-2xl outline-none focus:border-[var(--accent)]"
      />

      {from === "bin" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {["0", "1", "⌫"].map((k) => (
            <Key key={k} onPress={() => onValue(k === "⌫" ? value.slice(0, -1) : value + k)}>
              {k}
            </Key>
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
        <button type="button" onClick={onCopy} className="glass rounded-full px-3 py-1.5 text-xs">
          {copied ? "copied" : "copy"}
        </button>
      </div>
      {degraded && <p className="mt-3 text-xs text-amber-300/80">API offline — using local core</p>}
    </motion.section>
  );
}