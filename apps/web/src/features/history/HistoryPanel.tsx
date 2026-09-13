import type { Base } from "@bindec/core";
import { SectionLabel } from "../../components/ui.tsx";
import type { Hist } from "../../lib/history.ts";

export default function HistoryPanel({
  history,
  onPick,
}: {
  history: Hist[];
  onPick: (from: Base, to: Base, value: string) => void;
}) {
  return (
    <section>
      <SectionLabel>recent</SectionLabel>
      <div className="flex flex-col gap-2">
        {history.map((h) => (
          <button
            key={h.at}
            type="button"
            onClick={() => onPick(h.from as Base, h.to as Base, h.value)}
            className="glass rounded-2xl px-4 py-3 text-left text-sm"
          >
            {h.value} · {h.from} → {h.to} = {h.result}
          </button>
        ))}
      </div>
    </section>
  );
}