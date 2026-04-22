import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Link2,
  Minus,
  PanelRightClose,
  PanelRightOpen,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { currency, shortDate } from "@/lib/utils";
import { SectionCard, KV, StatusBadge } from "@/components/ui/primitives";
import { useScrolled } from "@/hooks/useScrolled";
import { getExtractedContract, buildIngestResult } from "@/data/ingest-data";
import type { ExtractedContract } from "@/data/ingest-data";
import { useIngestContext } from "@/context/IngestContext";
import type { Customer } from "@/data/mock-data";

// ---------------------------------------------------------------------------
// Section anchors used to deep-link validation issues → extracted fields
// ---------------------------------------------------------------------------

const SECTION_IDS = {
  document: "ingest-sec-document",
  customer: "ingest-sec-customer",
  quote: "ingest-sec-quote",
  terms: "ingest-sec-terms",
  financial: "ingest-sec-financial",
  products: "ingest-sec-products",
} as const;

function scrollToSection(id: string) {
  if (typeof window === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------------------------------------------------------------------------
// Contract Document Viewer (PDF-style page body)
// ---------------------------------------------------------------------------

function ContractDocumentViewer({ doc }: { doc: ExtractedContract }) {
  const isHappy = doc.docId === "sample1";
  const products = doc.products;

  return (
    <div className="space-y-4 font-mono text-[11px] leading-relaxed text-text-secondary">
      {/* Header */}
      <div className="text-center">
        <p className="text-[13px] font-bold uppercase tracking-widest text-text-primary">
          Master Subscription Agreement
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">
          Order Form — {isHappy ? "Renewal" : "New Business"}
        </p>
        <p className="mt-0.5 text-[10px] text-text-muted">
          Document: {doc.documentName}
        </p>
      </div>

      <hr className="border-border-subtle" />

      {/* Parties */}
      <div>
        <p className="font-semibold text-text-primary">PARTIES</p>
        <p className="mt-1">
          <span className="text-text-muted">Provider: </span>
          Chargebee US – Acme Merchant ("Provider")
        </p>
        <p className="mt-0.5">
          <span className="text-text-muted">Customer: </span>
          <span className={cn(!doc.customerFound && "text-amber-700 underline decoration-dotted")}>
            {doc.customerLegalEntity}
          </span>{" "}
          ("Customer")
        </p>
        {!doc.customerFound && (
          <p className="mt-1 text-amber-600">⚠ Customer not found in system</p>
        )}
      </div>

      <hr className="border-border-subtle" />

      {/* Term */}
      <div>
        <p className="font-semibold text-text-primary">1. TERM</p>
        <p className="mt-1">
          {doc.terms.term} commencing {doc.terms.startDate} and ending {doc.terms.endDate}.
        </p>
        <p className="mt-0.5">
          Auto-renewal: {doc.terms.autoRenew ? "Yes — 60-day cancellation notice required." : "No."}
        </p>
      </div>

      <hr className="border-border-subtle" />

      {/* Services */}
      <div>
        <p className="font-semibold text-text-primary">2. SUBSCRIPTION SERVICES</p>
        <table className="mt-2 w-full text-[10px]">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="pb-1 text-left font-semibold text-text-muted">Product / SKU</th>
              <th className="pb-1 text-right font-semibold text-text-muted">Qty</th>
              <th className="pb-1 text-right font-semibold text-text-muted">Unit Price</th>
              <th className="pb-1 text-right font-semibold text-text-muted">Discount</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={i} className="border-b border-border-subtle last:border-0">
                <td className="py-1 pr-2">
                  <span className={cn(!p.matched && "text-amber-700 underline decoration-dotted")}>
                    {p.extractedName}
                  </span>
                  <span className="ml-1 text-text-muted">({p.extractedSku})</span>
                  {!p.matched && <span className="ml-1 text-amber-600">⚠ unmatched</span>}
                </td>
                <td className="py-1 text-right">{p.quantity || "—"}</td>
                <td className="py-1 text-right">
                  {p.unitPrice < 1 ? `$${p.unitPrice.toFixed(3)}/cr` : `$${p.unitPrice.toLocaleString()}`}
                </td>
                <td className="py-1 text-right">{p.discount > 0 ? `${p.discount}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="border-border-subtle" />

      {/* Pricing */}
      <div>
        <p className="font-semibold text-text-primary">3. PRICING AND COMMITMENT</p>
        <div className="mt-1 space-y-0.5">
          <p>Total Contract Value (TCV): <span className="font-semibold text-text-primary">{currency(doc.terms.tcv)}</span></p>
          <p>Annual Recurring Revenue (ARR): <span className="font-semibold text-text-primary">{currency(doc.terms.arr)}</span></p>
          {doc.terms.minCommit > 0 && (
            <p>Minimum Annual Commitment: <span className="font-semibold text-text-primary">{currency(doc.terms.minCommit)}</span></p>
          )}
          {doc.terms.prepaidCredits > 0 && (
            <p>Prepaid AI Credits: <span className="font-semibold text-text-primary">{doc.terms.prepaidCredits.toLocaleString()} credits</span></p>
          )}
        </div>
      </div>

      <hr className="border-border-subtle" />

      {/* Payment */}
      <div>
        <p className="font-semibold text-text-primary">4. PAYMENT TERMS</p>
        <p className="mt-1">
          Billing frequency: {doc.terms.billingFrequency}.
        </p>
        <p className="mt-0.5">
          Payment due: {doc.terms.paymentTerms} from invoice date.
        </p>
      </div>

      <hr className="border-border-subtle" />

      {/* Governing law */}
      <div>
        <p className="font-semibold text-text-primary">5. GOVERNING LAW</p>
        <p className="mt-1">
          This Agreement shall be governed by the laws of the State of Delaware.
        </p>
      </div>

      <hr className="border-border-subtle" />

      {/* Signatures */}
      <div>
        <p className="font-semibold text-text-primary">SIGNATURES</p>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <p className="text-text-muted">For Provider:</p>
            <p className="mt-3 border-b border-border-default pb-1 font-semibold text-text-primary">
              Sarah Chen
            </p>
            <p className="text-text-muted">VP Revenue, Chargebee</p>
            <p className="text-text-muted">Date: {shortDate("2026-04-10")}</p>
          </div>
          <div>
            <p className="text-text-muted">For Customer:</p>
            <p className="mt-3 border-b border-border-default pb-1 font-semibold text-text-primary">
              {isHappy ? "Mira Patel" : "David Chen"}
            </p>
            <p className="text-text-muted">CFO, {isHappy ? "Echo Corp" : "Zenith Analytics"}</p>
            <p className="text-text-muted">Date: {shortDate("2026-04-12")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PDF Document Viewer (right panel): grey canvas, toolbar, paged white page
// ---------------------------------------------------------------------------

function PdfDocumentViewer({ doc, onCollapse }: { doc: ExtractedContract; onCollapse: () => void }) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const pageCount = 3;

  return (
    <div className="flex h-full flex-col bg-[#EEF0F2]">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border-default bg-white px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="min-w-[60px] text-center text-[11px] tabular-nums text-text-secondary">
            Page {page} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
            className="rounded p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="rounded p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
            aria-label="Zoom out"
          >
            <Minus size={14} />
          </button>
          <span className="min-w-[38px] text-center text-[11px] tabular-nums text-text-secondary">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="rounded p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
            aria-label="Zoom in"
          >
            <Plus size={14} />
          </button>
          <div className="mx-1 h-4 w-px bg-border-default" />
          <button
            type="button"
            onClick={onCollapse}
            className="rounded p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
            aria-label="Hide document"
            title="Hide document"
          >
            <PanelRightClose size={14} />
          </button>
        </div>
      </div>

      {/* Grey canvas with 16px padding around the white page */}
      <div className="flex-1 overflow-auto p-4">
        <div
          className="mx-auto rounded-sm border border-border-default bg-white shadow-[0_2px_12px_rgba(17,24,39,0.08)]"
          style={{ zoom: zoom / 100 } as React.CSSProperties}
        >
          <div className="px-8 py-7">
            <ContractDocumentViewer doc={doc} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Validation Check Row (optionally clickable — scrolls left pane to anchor)
// ---------------------------------------------------------------------------

function ValidationRow({
  label,
  status,
  detail,
  anchorId,
}: {
  label: string;
  status: "pass" | "warn" | "fail";
  detail?: string;
  anchorId?: string;
}) {
  const icon =
    status === "pass" ? (
      <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
    ) : status === "warn" ? (
      <AlertTriangle size={13} className="shrink-0 text-amber-500" />
    ) : (
      <AlertCircle size={13} className="shrink-0 text-red-500" />
    );
  const textColor =
    status === "pass"
      ? "text-emerald-700"
      : status === "warn"
        ? "text-amber-700"
        : "text-red-700";

  const content = (
    <>
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0 text-left">
        <p className={cn("text-[12px] font-medium leading-snug", textColor)}>{label}</p>
        {detail && <p className="mt-0.5 text-[11px] leading-snug text-text-muted">{detail}</p>}
      </div>
    </>
  );

  const baseClass =
    "flex w-full items-start gap-2 rounded-md border-b border-border-subtle px-2 py-1.5 last:border-0";

  if (anchorId) {
    return (
      <button
        type="button"
        onClick={() => scrollToSection(anchorId)}
        className={cn(
          baseClass,
          "-mx-2 cursor-pointer transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-default",
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
}

// ---------------------------------------------------------------------------
// Inline Create Customer Form
// ---------------------------------------------------------------------------

interface CreateCustomerFormProps {
  extractedName: string;
  onCreated: (c: Customer) => void;
}

function CreateCustomerForm({ extractedName, onCreated }: CreateCustomerFormProps) {
  const [name, setName] = useState(extractedName);
  const [entity, setEntity] = useState(extractedName + " Inc.");
  const [ae, setAe] = useState("Jordan Kim");
  const [csm, setCsm] = useState("Rachel Torres");

  function handleCreate() {
    const newCustomer: Customer = {
      id: "cust_zenith_006",
      name,
      commercialAccount: name + " – North America",
      billingLegalEntity: entity,
      chargebeeEntity: "Chargebee US – Acme Merchant",
      segment: "Mid-Market",
      tier: "Tier 2",
      ae,
      csm,
      billingOwner: "Alex Nguyen",
      arr: 155000,
      tcv: 155000,
      prepaidCreditBalance: 0,
      prepaidCreditTotal: 0,
      openAr: 155000,
      nextRenewalDate: "2027-04-30",
      riskBadges: [],
      createdAt: new Date().toISOString().slice(0, 10),
      domain: name.toLowerCase().replace(/\s/g, "") + ".io",
      industry: "AI Analytics",
      region: "North America",
      crmAccountId: "",
      crmSyncStatus: "Not synced",
      crmLastSyncedAt: "",
      paymentMethod: "Wire",
      currency: "USD",
      taxRegion: "US – New York",
      poRequired: false,
      activeContractCount: 1,
      openQuoteCount: 0,
    };
    onCreated(newCustomer);
  }

  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-700">Create New Customer</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-0.5 block text-[11px] text-text-muted">Company Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-border-default bg-white px-2 py-1 text-[12px] text-text-primary outline-none focus:border-cb-orange" />
        </div>
        <div>
          <label className="mb-0.5 block text-[11px] text-text-muted">Billing Legal Entity</label>
          <input value={entity} onChange={(e) => setEntity(e.target.value)}
            className="w-full rounded border border-border-default bg-white px-2 py-1 text-[12px] text-text-primary outline-none focus:border-cb-orange" />
        </div>
        <div>
          <label className="mb-0.5 block text-[11px] text-text-muted">Account Executive</label>
          <input value={ae} onChange={(e) => setAe(e.target.value)}
            className="w-full rounded border border-border-default bg-white px-2 py-1 text-[12px] text-text-primary outline-none focus:border-cb-orange" />
        </div>
        <div>
          <label className="mb-0.5 block text-[11px] text-text-muted">CSM</label>
          <input value={csm} onChange={(e) => setCsm(e.target.value)}
            className="w-full rounded border border-border-default bg-white px-2 py-1 text-[12px] text-text-primary outline-none focus:border-cb-orange" />
        </div>
      </div>
      <button type="button" onClick={handleCreate}
        className="mt-3 rounded-md bg-text-primary px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#222]">
        Create Customer
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Create Product Form
// ---------------------------------------------------------------------------

function CreateProductForm({ onCreated }: { onCreated: () => void }) {
  const [planName, setPlanName] = useState("Apex Analytics Pro");
  const [sku, setSku] = useState("APEX-ANALYTICS-PRO");
  const [unitPrice, setUnitPrice] = useState("65");

  function handleCreate() {
    onCreated();
  }

  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-700">Create New Plan</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-0.5 block text-[11px] text-text-muted">Plan Name</label>
          <input value={planName} onChange={(e) => setPlanName(e.target.value)}
            className="w-full rounded border border-border-default bg-white px-2 py-1 text-[12px] text-text-primary outline-none focus:border-cb-orange" />
        </div>
        <div>
          <label className="mb-0.5 block text-[11px] text-text-muted">SKU</label>
          <input value={sku} onChange={(e) => setSku(e.target.value)}
            className="w-full rounded border border-border-default bg-white px-2 py-1 text-[12px] text-text-primary outline-none focus:border-cb-orange" />
        </div>
        <div>
          <label className="mb-0.5 block text-[11px] text-text-muted">Unit Price (per seat/month)</label>
          <input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)}
            className="w-full rounded border border-border-default bg-white px-2 py-1 text-[12px] text-text-primary outline-none focus:border-cb-orange" />
        </div>
        <div>
          <label className="mb-0.5 block text-[11px] text-text-muted">Billing Model</label>
          <input defaultValue="Per seat / month" readOnly
            className="w-full rounded border border-border-default bg-surface-muted px-2 py-1 text-[12px] text-text-muted" />
        </div>
      </div>
      <button type="button" onClick={handleCreate}
        className="mt-3 rounded-md bg-text-primary px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#222]">
        Create Plan
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Issue callout (with optional inline expand)
// ---------------------------------------------------------------------------

interface IssueCalloutProps {
  title: string;
  resolved: boolean;
  resolvedLabel?: string;
  onExpand: () => void;
  expanded: boolean;
  children?: React.ReactNode;
}

function IssueCallout({ title, resolved, resolvedLabel, onExpand, expanded, children }: IssueCalloutProps) {
  if (resolved) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
        <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
        <p className="text-[12px] font-medium text-emerald-700">{resolvedLabel ?? title}</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-red-200 bg-red-50/50">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <AlertCircle size={14} className="shrink-0 text-red-500" />
        <p className="flex-1 min-w-0 text-[12px] font-semibold text-red-700">{title}</p>
        <button type="button" onClick={onExpand}
          className="shrink-0 rounded border border-red-200 bg-white px-2 py-0.5 text-[11px] font-medium text-red-700 transition-colors hover:bg-red-50">
          {expanded ? "Cancel" : "Resolve"}
          {expanded ? <ChevronUp size={11} className="inline ml-0.5" /> : <ChevronDown size={11} className="inline ml-0.5" />}
        </button>
      </div>
      {expanded && <div className="border-t border-red-100 px-3 pb-3">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completion State
// ---------------------------------------------------------------------------

function CompletionState({ docId, onOpenContract, onBack }: {
  docId: "sample1" | "sample2";
  onOpenContract: () => void;
  onBack: () => void;
}) {
  const contractId = docId === "sample1" ? "CON-2026-0190" : "CON-INGEST-002";
  const effectiveDateLabel = "May 1, 2026";
  const lines = docId === "sample1"
    ? [
        { type: "contract" as const, id: contractId, label: `Contract ${contractId}`, action: "created" as const },
        { type: "quote" as const, id: "QT-2026-0042", label: "Quote QT-2026-0042", action: "linked" as const },
        { type: "customer" as const, id: "cust_echo_001", label: "Customer: Echo Corp", action: "reused" as const },
        { type: "product" as const, id: "APEX-PLATFORM", label: "APEX-PLATFORM, APEX-AI-CREDITS, APEX-SUPPORT", action: "reused" as const },
      ]
    : [
        { type: "customer" as const, id: "cust_zenith_006", label: "Customer: Zenith Analytics", action: "created" as const },
        { type: "product" as const, id: "APEX-ANALYTICS-PRO", label: "Plan: APEX-ANALYTICS-PRO", action: "created" as const },
        { type: "contract" as const, id: contractId, label: `Contract ${contractId}`, action: "created" as const },
      ];

  const actionColor = (a: "created" | "linked" | "reused") =>
    a === "created" ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : a === "linked" ? "text-blue-600 bg-blue-50 border-blue-200"
      : "text-gray-500 bg-gray-50 border-gray-200";

  return (
    <div className="flex flex-col items-start gap-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={22} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-text-primary">Contract Ingested Successfully</p>
          <p className="text-[12px] text-text-muted">
            Contract <span className="font-medium text-text-primary">{contractId}</span> is scheduled to activate on{" "}
            <span className="font-medium text-text-primary">{effectiveDateLabel}</span>. Billing will be generated from the first month after activation.
          </p>
        </div>
      </div>

      <div className="w-full rounded-lg border border-border-default bg-surface-muted">
        <div className="border-b border-border-default px-4 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Created / Linked Objects</p>
        </div>
        <div className="divide-y divide-border-subtle px-4">
          {lines.map((obj) => (
            <div key={obj.id} className="flex items-center justify-between py-2.5">
              <p className="text-[13px] font-medium text-text-primary">{obj.label}</p>
              <span className={cn("rounded border px-2 py-0.5 text-[10px] font-semibold capitalize", actionColor(obj.action))}>
                {obj.action}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={onOpenContract}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#012A38] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#01374a]">
          Open Contract <ChevronRight size={14} />
        </button>
        <button type="button" onClick={onBack}
          className="rounded-md border border-border-default px-4 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-muted">
          Back to Contracts
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function IngestContractPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { ref: stickyRef, isScrolled } = useScrolled();
  const { addSessionCustomer, addSessionProductSku, setIngestResult } = useIngestContext();

  const sampleParam = searchParams.get("sample");
  const docId: "sample1" | "sample2" = sampleParam === "2" ? "sample2" : "sample1";
  const doc = getExtractedContract(docId);
  const isHappy = docId === "sample1";

  // UI state
  const [viewerCollapsed, setViewerCollapsed] = useState(false);
  const [quoteLinkConfirmed, setQuoteLinkConfirmed] = useState(false);
  const [customerResolved, setCustomerResolved] = useState(false);
  const [productResolved, setProductResolved] = useState(false);
  const [customerExpandOpen, setCustomerExpandOpen] = useState(false);
  const [productExpandOpen, setProductExpandOpen] = useState(false);
  const [resolvedCustomer, setResolvedCustomer] = useState<Customer | null>(null);
  const [finished, setFinished] = useState(false);

  const allBlockersResolved = isHappy
    ? quoteLinkConfirmed
    : customerResolved && productResolved;

  function handleFinish() {
    const result = buildIngestResult(docId, resolvedCustomer?.id ?? "cust_zenith_006");
    setIngestResult(result);
    setFinished(true);
  }

  function handleOpenContract() {
    const contractId = docId === "sample1" ? "CON-2026-0190" : "CON-INGEST-002";
    navigate(`/contracts/${contractId}?from=ingest`);
  }

  function handleCustomerCreated(c: Customer) {
    addSessionCustomer(c);
    setResolvedCustomer(c);
    setCustomerResolved(true);
    setCustomerExpandOpen(false);
  }

  function handleProductCreated() {
    addSessionProductSku("APEX-ANALYTICS-PRO");
    setProductResolved(true);
    setProductExpandOpen(false);
  }

  return (
    <div className="flex flex-1 w-full flex-col">
      {/* Sticky breadcrumb header + primary CTAs */}
      <div
        ref={stickyRef}
        className={cn(
          "sticky top-0 z-10 flex w-full items-center justify-between gap-4 border-b border-[#F0F1F3] bg-white px-6 py-3 rounded-tl-[24px] transition-shadow duration-200",
          isScrolled && "shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
        )}
      >
        <nav className="flex min-w-0 items-center gap-1 text-[12px] text-text-muted">
          <button
            onClick={() => navigate("/contracts")}
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            Contracts
          </button>
          <ChevronRight size={11} className="text-text-muted/50" />
          <span className="font-medium text-text-primary">Ingest Contract</span>
          <ChevronRight size={11} className="text-text-muted/50" />
          <span className="truncate max-w-[240px] font-medium text-text-primary">{doc.documentName}</span>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <StatusBadge status={finished ? "Completed" : "In Progress"} />

          {!finished && (
            <>
              {allBlockersResolved ? (
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700">
                  <CheckCircle2 size={12} />
                  Ready to ingest
                </span>
              ) : (
                <span className="text-[12px] text-text-secondary">Resolve blocking issues</span>
              )}
              <button
                type="button"
                onClick={() => navigate("/contracts")}
                className="rounded-md border border-border-default px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!allBlockersResolved}
                onClick={handleFinish}
                className={cn(
                  "rounded-md px-4 py-1.5 text-[12px] font-semibold text-white transition-colors",
                  allBlockersResolved
                    ? "bg-[#012A38] hover:bg-[#01374a]"
                    : "cursor-not-allowed bg-gray-300",
                )}
              >
                Finish Ingestion
              </button>
            </>
          )}
        </div>
      </div>

      {/* Two-column body: LEFT = extracted fields + sticky validation · RIGHT = PDF viewer */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT: extracted fields (scrollable) + validation (sticky) */}
        <div className="flex min-w-0 flex-1 overflow-auto">
          {finished ? (
            <div className="w-full px-6 py-5">
              <CompletionState
                docId={docId}
                onOpenContract={handleOpenContract}
                onBack={() => navigate("/contracts")}
              />
            </div>
          ) : (
            <div className="flex w-full gap-6 px-6 py-5">
              {/* Extracted field cards (scrollable) */}
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <div id={SECTION_IDS.document} className="scroll-mt-4">
                  <SectionCard title="Document Details">
                    <div className="divide-y divide-border-subtle">
                      <KV label="Document" value={doc.documentName} />
                      <KV label="Extracted" value={shortDate(doc.extractedAt)} />
                    </div>
                  </SectionCard>
                </div>

                <div id={SECTION_IDS.customer} className="scroll-mt-4">
                  <SectionCard title="Customer Mapping">
                    <div className="flex flex-col gap-3">
                      <div className="divide-y divide-border-subtle">
                        <KV label="Extracted Name" value={doc.customerName} />
                        <KV label="Legal Entity" value={doc.customerLegalEntity} />
                        {isHappy && (
                          <>
                            <KV
                              label="Matched Customer"
                              value={
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 size={12} className="text-emerald-500" />
                                  Echo Corp (cust_echo_001)
                                </span>
                              }
                            />
                            <KV label="CB Entity" value="Chargebee US – Acme Merchant" />
                          </>
                        )}
                      </div>

                      {!isHappy && (
                        <IssueCallout
                          title="Customer not found in system"
                          resolved={customerResolved}
                          resolvedLabel={`Customer created: ${resolvedCustomer?.name ?? "Zenith Analytics"}`}
                          expanded={customerExpandOpen}
                          onExpand={() => setCustomerExpandOpen(!customerExpandOpen)}
                        >
                          <CreateCustomerForm
                            extractedName={doc.customerName}
                            onCreated={handleCustomerCreated}
                          />
                        </IssueCallout>
                      )}
                    </div>
                  </SectionCard>
                </div>

                {isHappy && (
                  <div id={SECTION_IDS.quote} className="scroll-mt-4">
                    <SectionCard title="Quote Match">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between rounded-lg border border-border-default bg-surface-muted px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Link2 size={14} className="text-blue-500" />
                            <div>
                              <p className="text-[12px] font-semibold text-text-primary">QT-2026-0042</p>
                              <p className="text-[11px] text-text-muted">
                                Echo Corp · Renewal · {currency(523600)} TCV · Confidence: {doc.quoteMatchConfidence}%
                              </p>
                            </div>
                          </div>
                          {quoteLinkConfirmed ? (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                              <CheckCircle2 size={12} />
                              Linked
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setQuoteLinkConfirmed(true)}
                              className="rounded-md bg-blue-600 px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-blue-500"
                            >
                              Link to this Quote
                            </button>
                          )}
                        </div>
                      </div>
                    </SectionCard>
                  </div>
                )}

                <div id={SECTION_IDS.terms} className="scroll-mt-4">
                  <SectionCard title="Contract Terms">
                    <div className="divide-y divide-border-subtle">
                      <KV label="Term" value={doc.terms.term} />
                      <KV label="Start Date" value={shortDate(doc.terms.startDate)} />
                      <KV label="End Date" value={shortDate(doc.terms.endDate)} />
                      <KV label="Billing Frequency" value={doc.terms.billingFrequency} />
                      <KV label="Payment Terms" value={doc.terms.paymentTerms} />
                      <KV label="Auto-Renew" value={doc.terms.autoRenew ? "Yes" : "No"} />
                    </div>
                  </SectionCard>
                </div>

                <div id={SECTION_IDS.financial} className="scroll-mt-4">
                  <SectionCard title="Financial Summary">
                    <div className="divide-y divide-border-subtle">
                      <KV label="TCV" value={currency(doc.terms.tcv)} />
                      <KV label="ARR" value={currency(doc.terms.arr)} />
                      {doc.terms.minCommit > 0 && <KV label="Min. Annual Commit" value={currency(doc.terms.minCommit)} />}
                      {doc.terms.prepaidCredits > 0 && (
                        <KV label="Prepaid Credits" value={`${doc.terms.prepaidCredits.toLocaleString()} credits`} />
                      )}
                    </div>
                  </SectionCard>
                </div>

                <div id={SECTION_IDS.products} className="scroll-mt-4">
                  <SectionCard title="Products / Plan Mapping">
                    <div className="flex flex-col gap-2">
                      {doc.products.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-3 rounded-lg border border-border-default px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium text-text-primary">{p.extractedName}</p>
                            <p className="text-[11px] text-text-muted">
                              SKU: {p.extractedSku} · Qty: {p.quantity || "—"} · {p.billingModel}
                            </p>
                          </div>
                          {p.matched ? (
                            <span className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                              <CheckCircle2 size={12} /> Matched
                            </span>
                          ) : productResolved ? (
                            <span className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                              <CheckCircle2 size={12} /> Plan created
                            </span>
                          ) : (
                            <span className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-amber-600">
                              <AlertTriangle size={12} /> Unmatched
                            </span>
                          )}
                        </div>
                      ))}
                      {!isHappy && !productResolved && (
                        <IssueCallout
                          title="Product SKU not in catalog"
                          resolved={productResolved}
                          resolvedLabel="Plan created: APEX-ANALYTICS-PRO"
                          expanded={productExpandOpen}
                          onExpand={() => setProductExpandOpen(!productExpandOpen)}
                        >
                          <CreateProductForm onCreated={handleProductCreated} />
                        </IssueCallout>
                      )}
                    </div>
                  </SectionCard>
                </div>
              </div>

              {/* Sticky validation aside — compact list, clickable → scroll to field */}
              <aside className="sticky top-4 hidden w-[260px] shrink-0 self-start lg:block">
                <div className="flex flex-col">
                  {isHappy ? (
                        <>
                          <ValidationRow
                            label="Customer found and matched"
                            status="pass"
                            detail="Echo Corp (cust_echo_001)"
                            anchorId={SECTION_IDS.customer}
                          />
                          <ValidationRow
                            label="Quote match found"
                            status={quoteLinkConfirmed ? "pass" : "warn"}
                            detail={quoteLinkConfirmed ? "Linked to QT-2026-0042" : "Link to existing quote to confirm"}
                            anchorId={SECTION_IDS.quote}
                          />
                          <ValidationRow
                            label="All products mapped to catalog"
                            status="pass"
                            anchorId={SECTION_IDS.products}
                          />
                          <ValidationRow
                            label="Billing entity configured"
                            status="pass"
                            detail="Chargebee US – Acme Merchant"
                            anchorId={SECTION_IDS.customer}
                          />
                          <ValidationRow
                            label="Payment terms present"
                            status="pass"
                            detail="Net 45"
                            anchorId={SECTION_IDS.terms}
                          />
                          <ValidationRow
                            label="Contract dates valid"
                            status="pass"
                            detail="May 1 2026 → Apr 30 2028"
                            anchorId={SECTION_IDS.terms}
                          />
                        </>
                      ) : (
                        <>
                          <ValidationRow
                            label="Customer found and matched"
                            status={customerResolved ? "pass" : "fail"}
                            detail={customerResolved ? `Created: ${resolvedCustomer?.name}` : "Zenith Analytics Inc. not in system"}
                            anchorId={SECTION_IDS.customer}
                          />
                          <ValidationRow
                            label="All products mapped to catalog"
                            status={productResolved ? "pass" : "fail"}
                            detail={productResolved ? "APEX-ANALYTICS-PRO created" : "APEX-ANALYTICS-PRO not in catalog"}
                            anchorId={SECTION_IDS.products}
                          />
                          <ValidationRow
                            label="Payment terms present"
                            status="pass"
                            detail="Net 30"
                            anchorId={SECTION_IDS.terms}
                          />
                          <ValidationRow
                            label="Contract dates valid"
                            status="pass"
                            detail="May 1 2026 → Apr 30 2027"
                            anchorId={SECTION_IDS.terms}
                          />
                          <ValidationRow
                            label="Billing entity configured"
                            status="pass"
                            detail="Chargebee US – Acme Merchant"
                            anchorId={SECTION_IDS.customer}
                          />
                        </>
                      )}
                </div>
              </aside>
            </div>
          )}
        </div>

        {/* RIGHT: PDF viewer (grey canvas, paged, zoomable, collapsible) */}
        <div
          className={cn(
            "shrink-0 overflow-hidden border-l border-border-default transition-all duration-200",
            viewerCollapsed ? "w-0" : "w-[460px]",
          )}
        >
          {!viewerCollapsed && (
            <PdfDocumentViewer doc={doc} onCollapse={() => setViewerCollapsed(true)} />
          )}
        </div>

        {/* Collapsed expand tab on right edge */}
        {viewerCollapsed && (
          <div className="border-l border-border-default">
            <button
              type="button"
              onClick={() => setViewerCollapsed(false)}
              className="flex h-full w-8 flex-col items-center justify-center gap-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
              title="Show document"
            >
              <PanelRightOpen size={14} />
              <span className="rotate-90 whitespace-nowrap text-[9px] uppercase tracking-widest">Document</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
