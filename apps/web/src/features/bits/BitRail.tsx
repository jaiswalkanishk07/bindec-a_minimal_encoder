import { motion } from "framer-motion";
import type { BitWidth } from "@bindec/core";
import { GlassCard, SectionLabel } from "../../components/ui.tsx";

const WIDTHS: BitWidth[] = [8, 16, 32, 64];

export default function BitRail({
  bitWidth,
  onWidth,
  bits,
  onToggle,
}: {
  bitWidth: BitWidth;
  onWidth: (w: BitWidth) => void;
  bits: string[];
  onToggle: (i: number) => void;
}) {
  return (
    <GlassCard>
      <div className="mb-3 flex items-center justify-between">
        <SectionLabel>bits</SectionLabel>
        <div className="flex gap-1">
          {WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onWidth(w)}
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
            onClick={() => onToggle(i)}
            className={`h-10 w-10 min-w-10 rounded-lg text-sm ${bit === "1" ? "bg-[var(--accent)] text-[#07201a]" : "bg-white/8"}`}
          >
            {bit}
          </motion.button>
        ))}
      </div>
    </GlassCard>
  );
}