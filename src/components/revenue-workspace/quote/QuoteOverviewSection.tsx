import type { Quote } from "@/data/mock-data";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";

export function QuoteOverviewSection({ quote }: { quote: Quote }) {
  const cards = [
    { label: "Status", value: <StatusBadge status={quote.status} /> },
    { label: "Quote Amount", value: currency(quote.amount) },
    { label: "ARR", value: currency(quote.arr) },
    { label: "TCV", value: currency(quote.tcv) },
    { label: "Discount", value: `${quote.discountPct}%` },
    { label: "Expires", value: shortDate(quote.expiryDate) },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-border-default bg-white px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-text-muted">{card.label}</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
