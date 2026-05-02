import type { ExtractedContract } from "@/data/ingest-data";
import { currency, shortDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  documentTitle: string;
  extracted: ExtractedContract | null;
  className?: string;
}

export function PDFPreviewPanel({ documentTitle, extracted, className }: Props) {
  return (
    <div className={cn("flex flex-col rounded-lg border border-border-default bg-white", className)}>
      <div className="border-b border-border-subtle px-2.5 py-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Document</p>
        <p className="truncate text-[12px] font-medium text-text-primary">{documentTitle}</p>
      </div>
      <div className="max-h-[280px] min-h-[160px] overflow-y-auto p-2.5 font-mono text-[10px] leading-relaxed text-text-secondary">
        {extracted ? (
          <div className="space-y-2">
            <p className="text-center text-[11px] font-bold uppercase tracking-widest text-text-primary">
              Signed agreement (preview)
            </p>
            <p className="text-center text-text-muted">Extracted {shortDate(extracted.extractedAt)}</p>
            <hr className="border-border-subtle" />
            <p>
              <span className="text-text-muted">Customer: </span>
              <span className={cn(!extracted.customerFound && "text-amber-700")}>
                {extracted.customerLegalEntity}
              </span>
            </p>
            <p>
              <span className="text-text-muted">TCV: </span>
              {currency(extracted.terms.tcv)}
            </p>
            <p>
              <span className="text-text-muted">Term: </span>
              {extracted.terms.startDate} → {extracted.terms.endDate}
            </p>
            <table className="mt-1 w-full">
              <tbody>
                {extracted.products.slice(0, 4).map((p, i) => (
                  <tr key={i} className="border-t border-border-subtle">
                    <td className="py-1 pr-1">
                      <span className={cn(!p.matched && "text-amber-700")}>{p.extractedName}</span>
                    </td>
                    <td className="py-1 text-right text-text-muted">{p.extractedSku}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-6 text-center text-text-muted">
            No extracted fields for this item. Open the queue ingest page to add details or comments.
          </p>
        )}
      </div>
    </div>
  );
}
