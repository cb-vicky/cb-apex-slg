import type { Contract } from "@/data/mock-data";
import { KV, SectionCard } from "@/components/ui/primitives";
import { shortDate } from "@/lib/utils";
import { ExternalLink, FileText } from "lucide-react";

export function ContractDocumentsSection({ contract }: { contract: Contract }) {
  return (
    <SectionCard title="Documents & Audit">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="min-w-0 divide-y divide-border-subtle">
          <KV
            label="Signed document"
            value={
              <a href={contract.signedDocumentUrl} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                <FileText size={12} /> View signed PDF <ExternalLink size={11} />
              </a>
            }
          />
          <KV label="Ingestion" value={shortDate(contract.ingestionTimestamp)} />
          <KV label="Extraction confidence" value={`${contract.extractionConfidence}%`} />
          <KV label="Quote match confidence" value={`${contract.quoteMatchConfidence}%`} />
        </div>
        <div className="min-w-0 pt-1">
          <span className="text-[11px] uppercase tracking-wider text-text-muted">Important Clauses</span>
          <ul className="mt-1.5 space-y-1">
            {contract.importantClauses.map((clause) => (
              <li key={clause} className="flex items-start gap-2 text-[13px] text-text-primary">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted" />
                {clause}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}
