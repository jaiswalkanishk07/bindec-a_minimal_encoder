import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function GlassCard({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`glass rounded-2xl p-5 ${className}`}>{children}</section>;
}

export function BasePill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
        active ? "bg-[var(--accent)] text-[#07201a]" : "bg-white/5 text-[var(--ink)] hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export function Key({
  children,
  onPress,
  className = "",
}: {
  children: ReactNode;
  onPress: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={onPress}
      className={`min-h-11 min-w-11 rounded-lg bg-white/8 px-3 py-2 text-sm active:bg-white/15 ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs tracking-[0.2em] text-[var(--muted)]">{children}</p>;
}