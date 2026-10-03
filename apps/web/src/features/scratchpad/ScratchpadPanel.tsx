import { motion } from "framer-motion";
import type { AsciiView, ColorView, PermView } from "@bindec/core";
import { GlassCard, SectionLabel } from "../../components/ui.tsx";

type Props = {
  perm: PermView;
  ascii: AsciiView;
  color: ColorView;
  hasInput: boolean;
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</span>
      <span className="text-sm text-[var(--ink)]">{children}</span>
    </div>
  );
}

export default function ScratchpadPanel({ perm, ascii, color, hasInput }: Props) {
  return (
    <GlassCard>
      <SectionLabel>scratchpad</SectionLabel>
      {!hasInput && <p className="mt-3 text-sm text-[var(--muted)]">Enter a value to see permission, text, and color views.</p>}
      {hasInput && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="mt-3 space-y-3">
          <Row label="perms">
            {perm.valid ? (
              <span className="mono">
                {perm.octal} <span className="text-[var(--accent)]">{perm.rwx}</span>
              </span>
            ) : (
              <span className="text-[var(--muted)]">not a mode (0-7777 octal range)</span>
            )}
          </Row>
          <Row label="ascii">
            {ascii.printable ? (
              <span className="mono text-[var(--accent)]">{ascii.text}</span>
            ) : (
              <span className="mono text-[var(--muted)]">
                {ascii.bytes.length ? ascii.bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ") : "no decodable bytes"}
              </span>
            )}
          </Row>
          <Row label="color">
            {color.valid && color.rgb ? (
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-4 w-4 rounded-full border border-white/20"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="mono">{color.hex}</span>
                <span className="mono text-[var(--muted)]">
                  {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
                </span>
              </span>
            ) : (
              <span className="text-[var(--muted)]">out of 24-bit range</span>
            )}
          </Row>
        </motion.div>
      )}
    </GlassCard>
  );
}
