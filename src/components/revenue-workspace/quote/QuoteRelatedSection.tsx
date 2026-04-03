import type { Quote } from "@/data/mock-data";
import { SectionCard } from "@/components/ui/primitives";
import { ArrowRight, FileText, GitCompare, Receipt, ScrollText } from "lucide-react";

export function QuoteRelatedSection({ quote }: { quote: Quote }) {
  return (
    <SectionCard title="Related Records">
      <div className="grid grid-cols-2 gap-3">
        <RelatedItem
          icon={ScrollText}
          label="Current Active Contract"
          value={quote.relatedContractId}
          sublabel="Active until Jun 30, 2026"
        />
        <RelatedItem
          icon={GitCompare}
          label="Key Changes vs Current Contract"
          value="Seats 150 → 400, +AI credit block, 18% discount"
          sublabel="Quote v3 proposes expansion"
        />
        <RelatedItem
          icon={FileText}
          label="Expected New Contract"
          value="Will create CON-2026-xxxx"
          sublabel="Co-termed to existing end date"
        />
        <RelatedItem
          icon={Receipt}
          label="Invoice Plan Preview"
          value="Annual upfront + monthly overage"
          sublabel="First invoice on effective date"
        />
      </div>
    </SectionCard>
  );
}

function RelatedItem({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: typeof ArrowRight;
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border-default px-3 py-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-muted">
        <Icon size={14} className="text-text-secondary" />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-text-muted">{label}</p>
        <p className="text-[13px] font-medium text-text-primary">{value}</p>
        <p className="text-[12px] text-text-secondary">{sublabel}</p>
      </div>
    </div>
  );
}
