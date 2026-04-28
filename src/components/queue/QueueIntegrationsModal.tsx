import { X, CheckCircle2, Plug, ExternalLink } from "lucide-react";

interface Props {
  onClose: () => void;
}

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "connected" | "available";
}

const integrations: Integration[] = [
  {
    id: "salesforce",
    name: "Salesforce CPQ",
    category: "CRM / CPQ",
    description: "Sync signed orders, opportunities, and quote handoffs.",
    status: "connected",
  },
  {
    id: "docusign",
    name: "DocuSign CLM",
    category: "Contract lifecycle",
    description: "Pull signed agreements as soon as they complete.",
    status: "connected",
  },
  {
    id: "ironclad",
    name: "Ironclad",
    category: "Contract lifecycle",
    description: "Ingest commercial documents and approval metadata.",
    status: "available",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "CRM",
    description: "Map deals and contacts to APEX customers.",
    status: "available",
  },
  {
    id: "netsuite",
    name: "NetSuite",
    category: "ERP",
    description: "Reconcile customer master and billing legal entities.",
    status: "available",
  },
  {
    id: "workday",
    name: "Workday Financials",
    category: "ERP",
    description: "Push invoices and revenue postings to GL.",
    status: "available",
  },
  {
    id: "pandadoc",
    name: "PandaDoc",
    category: "Contract lifecycle",
    description: "Receive signed PDFs as queue items.",
    status: "available",
  },
];

export function QueueIntegrationsModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 flex max-h-[85vh] w-[640px] flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-text-primary">
              <Plug size={15} className="text-cb-orange" />
              Connect a source
            </h2>
            <p className="mt-0.5 text-[12px] text-text-muted">
              Stream signed contracts directly into the Queue from CRM, CLM, or ERP systems.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            {integrations.map((i) => (
              <div
                key={i.id}
                className="flex flex-col gap-2 rounded-lg border border-border-default bg-white p-3 transition-colors hover:border-cb-orange/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-text-primary">{i.name}</p>
                    <p className="mt-0.5 text-[11px] text-text-muted">{i.category}</p>
                  </div>
                  {i.status === "connected" ? (
                    <span className="flex shrink-0 items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <CheckCircle2 size={10} />
                      Connected
                    </span>
                  ) : (
                    <span className="shrink-0 rounded border border-border-default bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
                      Available
                    </span>
                  )}
                </div>
                <p className="flex-1 text-[11px] leading-snug text-text-secondary">{i.description}</p>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-border-default bg-white px-2 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
                >
                  {i.status === "connected" ? "Manage" : "Connect"}
                  <ExternalLink size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border-default px-6 py-3">
          <p className="text-[11px] text-text-muted">
            Need a custom source? Use the Chargebee REST API.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border-default bg-white px-4 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
