import { motion } from "framer-motion";
import type { Step } from "@bindec/core";
import { GlassCard, SectionLabel } from "../../components/ui.tsx";

export default function ExplainPanel({ steps }: { steps: Step[] }) {
  return (
    <GlassCard>
      <SectionLabel>steps</SectionLabel>
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
    </GlassCard>
  );
}