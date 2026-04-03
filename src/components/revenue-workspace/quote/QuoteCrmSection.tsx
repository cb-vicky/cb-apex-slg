import type { Quote } from "@/data/mock-data";
import { KV, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

export function QuoteCrmSection({ quote }: { quote: Quote }) {
  return (
    <SectionCard title="CRM & Collaboration">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="divide-y divide-border-subtle">
          <KV label="Source CRM" value={quote.source} />
          <KV
            label="Opportunity"
            value={
              <a href={quote.crmOpportunityLink} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                View in Salesforce <ExternalLink size={11} />
              </a>
            }
          />
          <KV label="Sync status" value={<StatusBadge status={quote.crmSyncStatus} />} />
          <KV label="Last synced amount" value={currency(quote.lastSyncedAmount)} />
        </div>
        <div className="divide-y divide-border-subtle">
          <KV label="Customer viewed" value={quote.customerViewedAt ? shortDate(quote.customerViewedAt) : "Not yet"} />
          <KV label="Customer accepted" value={quote.customerAcceptedAt ? shortDate(quote.customerAcceptedAt) : "Not yet"} />
          <div className="py-1.5">
            <span className="text-[11px] uppercase tracking-wider text-text-muted">Send History</span>
            <div className="mt-1 space-y-1">
              {quote.sendHistory.map((entry) => (
                <div key={entry.date} className="flex items-center gap-2 text-[13px]">
                  <span className="text-text-secondary">{shortDate(entry.date)}</span>
                  <span className="text-text-primary font-medium">{entry.method}</span>
                  <StatusBadge status={entry.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
