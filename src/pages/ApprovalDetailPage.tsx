import { useState, useRef, useEffect, type CSSProperties } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, MessageSquare, AtSign,
  User, Minus, Plus, PanelRightClose, PanelRightOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { currency, shortDate } from "@/lib/utils";
import { SectionCard, KV, StatusBadge } from "@/components/ui/primitives";
import { useScrolled } from "@/hooks/useScrolled";
import { useIngestContext } from "@/context/IngestContext";
import { invoices, customers, contracts } from "@/data/mock-data";
import type { Contract, Customer } from "@/data/mock-data";
import { getInvoiceEnrichment } from "@/data/billing-data";
import { InvoiceHTMLPreview } from "@/components/approvals/InvoiceHTMLPreview";
import type { ApprovalComment } from "@/data/ingest-data";

const TAGGABLE_USERS = [
  { name: "Jordan Kim", role: "Account Executive" },
  { name: "Priya Mehta", role: "CSM" },
  { name: "Alex Nguyen", role: "Billing Ops" },
  { name: "Marcus Lee", role: "Account Executive" },
  { name: "Rachel Torres", role: "CSM" },
  { name: "Lena Schulz", role: "Billing Ops" },
  { name: "Sarah Chen", role: "VP Revenue" },
];

// ---------------------------------------------------------------------------
// Comment Thread
// ---------------------------------------------------------------------------

function highlightMentions(text: string) {
  const parts = text.split(/(@\w[\w\s]*)/g);
  return parts.map((part, i) =>
    part.startsWith("@")
      ? <span key={i} className="rounded bg-blue-50 px-0.5 font-medium text-blue-700">{part}</span>
      : part
  );
}

function CommentItem({ comment }: { comment: ApprovalComment }) {
  const initials = comment.author.split(" ").map((n) => n[0]).join("").slice(0, 2);
  return (
    <div className="flex gap-2.5 py-2.5 border-b border-border-subtle last:border-0">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#012A38] text-[9px] font-bold text-white">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-[11px] font-semibold text-text-primary">{comment.author}</span>
          <span className="ml-auto shrink-0 text-[10px] text-text-muted">{shortDate(comment.timestamp)}</span>
        </div>
        <p className="mt-0.5 text-[12px] leading-relaxed text-text-secondary">
          {highlightMentions(comment.text)}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comment Input with @-tagging
// ---------------------------------------------------------------------------

function CommentInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagQuery, setTagQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredUsers = TAGGABLE_USERS.filter((u) =>
    u.name.toLowerCase().includes(tagQuery.toLowerCase())
  );

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setText(val);
    const atIdx = val.lastIndexOf("@");
    if (atIdx !== -1 && atIdx >= val.length - 20) {
      const afterAt = val.slice(atIdx + 1);
      if (!afterAt.includes(" ")) {
        setTagQuery(afterAt);
        setShowTagDropdown(true);
        return;
      }
    }
    setShowTagDropdown(false);
  }

  function insertTag(name: string) {
    const atIdx = text.lastIndexOf("@");
    const newText = text.slice(0, atIdx) + `@${name} `;
    setText(newText);
    setShowTagDropdown(false);
    textareaRef.current?.focus();
  }

  function handleSubmit() {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        rows={3}
        placeholder="Add a comment... Use @ to tag"
        className="w-full resize-none rounded-md border border-border-default bg-white px-2.5 py-2 text-[12px] leading-relaxed text-text-primary outline-none focus:border-cb-orange placeholder:text-text-muted"
      />
      {showTagDropdown && filteredUsers.length > 0 && (
        <div className="absolute bottom-[calc(100%+4px)] left-0 z-20 w-56 rounded-lg border border-border-default bg-white py-1 shadow-lg">
          {filteredUsers.map((u) => (
            <button
              key={u.name}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertTag(u.name); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-muted"
            >
              <User size={12} className="shrink-0 text-text-muted" />
              <div>
                <p className="text-[12px] font-medium text-text-primary">{u.name}</p>
                <p className="text-[10px] text-text-muted">{u.role}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="mt-1.5 flex items-center justify-between">
        <button type="button"
          onClick={() => { setText(text + "@"); textareaRef.current?.focus(); setShowTagDropdown(true); setTagQuery(""); }}
          className="flex items-center gap-1 text-[11px] text-text-muted transition-colors hover:text-text-secondary">
          <AtSign size={11} /> Tag
        </button>
        <button type="button" onClick={handleSubmit}
          className="rounded-md bg-[#012A38] px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-[#01374a]">
          Post
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg">
      <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
      <p className="text-[13px] font-medium text-emerald-700">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reject Reason Form (inline card at top of left column)
// ---------------------------------------------------------------------------

function RejectForm({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
      <p className="mb-2 text-[12px] font-semibold text-red-700">Rejection Reason</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="Provide a reason for rejecting this invoice..."
        className="w-full resize-none rounded-lg border border-red-200 bg-white px-3 py-2 text-[12px] text-text-primary outline-none focus:border-red-400 placeholder:text-text-muted"
      />
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => onConfirm(reason)}
          disabled={!reason.trim()}
          className={cn(
            "rounded-md px-3 py-1.5 text-[12px] font-medium text-white transition-colors",
            reason.trim() ? "bg-red-600 hover:bg-red-500" : "cursor-not-allowed bg-gray-300"
          )}>
          Confirm Rejection
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-md border border-border-default px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contract PDF Viewer (toolbar + grey canvas + contract body)
// ---------------------------------------------------------------------------

function ContractSourceViewer({
  contract,
  customer,
  onCollapse,
}: {
  contract: Contract;
  customer: Customer;
  onCollapse: () => void;
}) {
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
          style={{ zoom: zoom / 100 } as CSSProperties}
        >
          <div className="px-8 py-7">
            <ContractDocumentBody contract={contract} customer={customer} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contract Document Body — renders Contract + Customer as PDF-style text
// ---------------------------------------------------------------------------

function ContractDocumentBody({ contract, customer }: { contract: Contract; customer: Customer }) {
  return (
    <div className="space-y-5 font-mono text-[11px] leading-relaxed text-text-secondary">
      {/* Header */}
      <div className="text-center">
        <p className="text-[13px] font-bold uppercase tracking-widest text-text-primary">
          Master Subscription Agreement
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">
          Order Form
        </p>
        <p className="mt-0.5 text-[10px] text-text-muted">Contract ID: {contract.id}</p>
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
          {customer.billingLegalEntity} ("Customer")
        </p>
      </div>

      <hr className="border-border-subtle" />

      {/* Term */}
      <div>
        <p className="font-semibold text-text-primary">1. TERM</p>
        <p className="mt-1">
          {contract.term} commencing {shortDate(contract.effectiveDate)} and ending {shortDate(contract.endDate)}.
        </p>
      </div>

      <hr className="border-border-subtle" />

      {/* Subscription Services */}
      <div>
        <p className="font-semibold text-text-primary">2. SUBSCRIPTION SERVICES</p>
        <table className="mt-2 w-full text-[10px]">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="pb-1 text-left font-semibold text-text-muted">Product / SKU</th>
              <th className="pb-1 text-right font-semibold text-text-muted">Qty</th>
              <th className="pb-1 text-right font-semibold text-text-muted">Unit Price</th>
              <th className="pb-1 text-right font-semibold text-text-muted">Disc</th>
            </tr>
          </thead>
          <tbody>
            {contract.products.map((p, i) => (
              <tr key={i} className="border-b border-border-subtle last:border-0">
                <td className="py-1 pr-2">
                  {p.name}{" "}
                  <span className="text-text-muted">({p.sku})</span>
                </td>
                <td className="py-1 text-right tabular-nums">{p.quantity || "—"}</td>
                <td className="py-1 text-right tabular-nums">
                  {p.unitPrice < 1
                    ? `$${p.unitPrice.toFixed(3)}/cr`
                    : `$${p.unitPrice.toLocaleString()}`}
                </td>
                <td className="py-1 text-right tabular-nums">
                  {p.discountApplied > 0 ? `${p.discountApplied}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="border-border-subtle" />

      {/* Pricing & Commitment */}
      <div>
        <p className="font-semibold text-text-primary">3. PRICING & COMMITMENT</p>
        <p className="mt-1">Total Contract Value (TCV): {currency(contract.tcv)}</p>
        <p>Minimum Annual Commit: {currency(contract.minAnnualCommit)}</p>
        {contract.prepaidCreditTotal > 0 && (
          <p>Prepaid Credits: {contract.prepaidCreditTotal.toLocaleString()} credits</p>
        )}
      </div>

      <hr className="border-border-subtle" />

      {/* Payment */}
      <div>
        <p className="font-semibold text-text-primary">4. BILLING & PAYMENT</p>
        <p className="mt-1">Billing Frequency: {contract.billingFrequency}.</p>
        <p className="mt-0.5">Payment Terms: {contract.paymentTerms} from invoice date.</p>
      </div>

      <hr className="border-border-subtle" />

      {/* Signatures */}
      <div>
        <p className="font-semibold text-text-primary">SIGNATURES</p>
        <div className="mt-2 grid grid-cols-2 gap-6">
          <div>
            <p className="text-text-muted">For Provider:</p>
            <p className="mt-4 border-b border-border-default pb-1 font-semibold text-text-primary">
              Sarah Chen
            </p>
            <p className="text-text-muted">VP Revenue, Chargebee</p>
            <p className="mt-0.5 text-text-muted">Date: {shortDate(contract.signedDate)}</p>
          </div>
          <div>
            <p className="text-text-muted">For Customer:</p>
            <p className="mt-4 border-b border-border-default pb-1 font-semibold text-text-primary">
              Authorized Signatory
            </p>
            <p className="text-text-muted">{customer.name}</p>
            <p className="mt-0.5 text-text-muted">Date: {shortDate(contract.signedDate)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function ApprovalDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { ref: stickyRef, isScrolled } = useScrolled();
  const {
    approvalRequests, updateApprovalStatus, addApprovalComment,
    setInvoiceStatusOverride, invoiceStatusOverrides,
  } = useIngestContext();

  const [showToast, setShowToast] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [viewerCollapsed, setViewerCollapsed] = useState(false);

  const invoice = invoices.find((i) => i.id === invoiceId);
  const customer = customers.find((c) => c.id === invoice?.customerId);
  const contract = contracts.find((c) => c.id === invoice?.contractId);
  const enrichment = invoiceId ? getInvoiceEnrichment(invoiceId) : undefined;
  const approval = approvalRequests.find((r) => r.invoiceId === invoiceId);
  const effectiveStatus = invoiceId ? (invoiceStatusOverrides[invoiceId] ?? invoice?.status ?? "—") : "—";

  // Previous invoice for this customer (for comparison context)
  const prevInvoice = invoice
    ? invoices
        .filter((i) => i.customerId === invoice.customerId && i.id !== invoice.id && i.status !== "Pending Review")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : undefined;

  function handleAddComment(text: string) {
    if (!approval) return;
    const comment: ApprovalComment = {
      id: `ac-${Date.now()}`,
      author: "You",
      role: "Billing Ops",
      text,
      timestamp: new Date().toISOString(),
    };
    addApprovalComment(approval.id, comment);
  }

  function handleApprove() {
    if (!approval || !invoiceId) return;
    updateApprovalStatus(approval.id, "Approved");
    setInvoiceStatusOverride(invoiceId, "Approved");
    setApproved(true);
    setShowToast(true);
  }

  function handleToastDone() {
    setShowToast(false);
    navigate(`/invoices/${invoiceId}?from=approvals`);
  }

  function handleReject(reason: string) {
    if (!approval || !invoiceId) return;
    updateApprovalStatus(approval.id, "Rejected");
    setInvoiceStatusOverride(invoiceId, "Cancelled");
    setRejected(true);
    setShowRejectForm(false);
    addApprovalComment(approval.id, {
      id: `ac-rej-${Date.now()}`,
      author: "You",
      role: "Billing Ops",
      text: `Invoice rejected. Reason: ${reason}`,
      timestamp: new Date().toISOString(),
    });
    setTimeout(() => navigate("/approvals"), 1200);
  }

  if (!invoice || !customer) {
    return (
      <div className="flex flex-1 w-full flex-col items-center justify-center py-16 text-text-muted">
        <p className="text-[14px]">Invoice not found or approval not yet submitted.</p>
        <button onClick={() => navigate("/approvals")}
          className="mt-3 text-[12px] text-blue-600 hover:underline">
          Back to Approvals
        </button>
      </div>
    );
  }

  const canDecide = !approved && !rejected;

  return (
    <div className="flex flex-1 w-full flex-col">
      {/* Sticky breadcrumb + CTAs */}
      <div
        ref={stickyRef}
        className={cn(
          "sticky top-0 z-10 flex w-full items-center gap-4 border-b border-[#F0F1F3] bg-white px-6 py-3 rounded-tl-[24px] transition-shadow duration-200",
          isScrolled && "shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        )}
      >
        <nav className="flex min-w-0 flex-1 items-center gap-1 text-[12px] text-text-muted">
          <button onClick={() => navigate("/approvals")}
            className="text-text-secondary transition-colors hover:text-text-primary">
            Approvals
          </button>
          <ChevronRight size={11} className="text-text-muted/50" />
          <span className="truncate font-medium text-text-primary">{invoice.id}</span>
          <span className="mx-2 text-text-muted/40">·</span>
          <span className="truncate text-text-secondary">{customer.name}</span>
          <span className="mx-2 text-text-muted/40">·</span>
          <span className="shrink-0 font-medium text-text-primary">{currency(invoice.amount)}</span>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={effectiveStatus} />
          {canDecide && (
            <>
              <div className="mx-1 h-5 w-px bg-border-default" />
              <button
                type="button"
                onClick={() => setShowRejectForm((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors",
                  showRejectForm
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-red-200 bg-white text-red-600 hover:bg-red-50"
                )}
              >
                <XCircle size={13} />
                Reject
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                <CheckCircle2 size={13} />
                Approve
              </button>
            </>
          )}
        </div>
      </div>

      {/* Two-pane body: (invoice + comments rail) | contract PDF viewer */}
      <div className="flex flex-1 min-h-0">
        {/* Left outer: scrollable container holding [invoice column] + [sticky comments aside] */}
        <div className="flex min-w-0 flex-1 overflow-auto">
          <div className="flex w-full gap-6 px-6 py-5">
            {/* Invoice column (scrollable content lives in parent) */}
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              {/* Inline status banners */}
              {showRejectForm && canDecide && (
                <RejectForm
                  onConfirm={handleReject}
                  onCancel={() => setShowRejectForm(false)}
                />
              )}
              {approved && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <p className="text-[12px] font-medium text-emerald-700">
                    Invoice approved. Redirecting to invoice detail…
                  </p>
                </div>
              )}
              {rejected && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <XCircle size={16} className="text-gray-500" />
                  <p className="text-[12px] font-medium text-gray-600">
                    Invoice cancelled. Redirecting to Approvals…
                  </p>
                </div>
              )}

              {/* Metadata cards (stacked, single-column KVs with dividers) */}
              <SectionCard title="Approval Details">
                <div className="divide-y divide-border-subtle">
                  <KV label="Invoice ID" value={invoice.id} />
                  <KV label="Submitted By" value={approval?.submittedBy ?? "—"} />
                  <KV label="Submitted On" value={approval ? shortDate(approval.submittedAt) : "—"} />
                  <KV label="Approver" value={approval?.approver ?? "Sarah Chen, VP Revenue"} />
                  <KV label="Amount" value={currency(invoice.amount)} />
                </div>
              </SectionCard>

              {contract && (
                <SectionCard title="Contract Summary">
                  <div className="divide-y divide-border-subtle">
                    <KV label="Contract ID" value={contract.id} />
                    <KV label="Status" value={<StatusBadge status={contract.status} />} />
                    <KV label="Term" value={contract.term} />
                    <KV label="TCV" value={currency(contract.tcv)} />
                    <KV label="Renewal Date" value={contract.renewalDate ? shortDate(contract.renewalDate) : "—"} />
                    <KV label="Payment Terms" value={contract.paymentTerms} />
                  </div>
                </SectionCard>
              )}

              {prevInvoice && (
                <SectionCard title="Previous Invoice">
                  <div className="divide-y divide-border-subtle">
                    <KV label="Invoice ID" value={prevInvoice.id} />
                    <KV label="Date" value={shortDate(prevInvoice.date)} />
                    <KV label="Amount" value={currency(prevInvoice.amount)} />
                    <KV label="Status" value={<StatusBadge status={prevInvoice.status} />} />
                  </div>
                  <p className={cn(
                    "mt-2 text-[11px] font-medium",
                    invoice.amount > prevInvoice.amount ? "text-amber-600" : "text-emerald-600"
                  )}>
                    {invoice.amount > prevInvoice.amount
                      ? `▲ ${currency(invoice.amount - prevInvoice.amount)} vs prior`
                      : `▼ ${currency(prevInvoice.amount - invoice.amount)} vs prior`}
                  </p>
                </SectionCard>
              )}

              {/* Invoice preview */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Invoice Preview
                </p>
                <InvoiceHTMLPreview
                  invoice={{ ...invoice, status: effectiveStatus }}
                  customerName={customer.name}
                  enrichment={enrichment}
                />
              </div>
            </div>

            {/* Sticky Comments rail (mirrors validation aside on IngestContractPage) */}
            <aside className="hidden w-[300px] shrink-0 self-start sticky top-4 lg:block">
              <div className="overflow-hidden rounded-lg border border-border-default bg-white">
                <div className="flex items-center gap-2 border-b border-border-subtle bg-[#F7F7F8] px-3 py-2">
                  <MessageSquare size={12} className="text-text-muted" />
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-primary">
                    Comments
                  </h3>
                  <span className="ml-auto rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-text-muted ring-1 ring-border-default">
                    {approval?.comments.length ?? 0}
                  </span>
                </div>
                <div className="max-h-[420px] overflow-y-auto px-3">
                  {(approval?.comments ?? []).map((c) => (
                    <CommentItem key={c.id} comment={c} />
                  ))}
                  {(!approval || approval.comments.length === 0) && (
                    <p className="py-8 text-center text-[12px] text-text-muted">
                      No comments yet.
                    </p>
                  )}
                </div>
                {canDecide && (
                  <div className="border-t border-border-subtle p-2.5">
                    <CommentInput onSubmit={handleAddComment} />
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* RIGHT: Contract source PDF viewer (collapsible) */}
        <div
          className={cn(
            "shrink-0 overflow-hidden border-l border-border-default transition-all duration-200",
            viewerCollapsed ? "w-0" : "w-[460px]"
          )}
        >
          {!viewerCollapsed && contract && (
            <ContractSourceViewer
              contract={contract}
              customer={customer}
              onCollapse={() => setViewerCollapsed(true)}
            />
          )}
          {!viewerCollapsed && !contract && (
            <div className="flex h-full items-center justify-center p-6 text-[12px] text-text-muted">
              No contract source available for this invoice.
            </div>
          )}
        </div>

        {/* Collapsed expand tab on right edge */}
        {viewerCollapsed && (
          <div className="border-l border-border-default">
            <button
              type="button"
              onClick={() => setViewerCollapsed(false)}
              className="flex h-full w-8 flex-col items-center justify-center gap-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
              title="Show contract source"
            >
              <PanelRightOpen size={14} />
              <span className="rotate-90 whitespace-nowrap text-[9px] uppercase tracking-widest">
                Contract
              </span>
            </button>
          </div>
        )}
      </div>

      {showToast && (
        <Toast message="Email sent to the customer" onDone={handleToastDone} />
      )}
    </div>
  );
}
