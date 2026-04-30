import { useState, useRef, useEffect, useMemo, type CSSProperties } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, MessageSquare, AtSign,
  User, Minus, Plus, PanelRightClose, PanelRightOpen, FileText, FileEdit, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { currency, shortDate } from "@/lib/utils";
import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { useScrolled } from "@/hooks/useScrolled";
import { useIngestContext } from "@/context/IngestContext";
import type { InvoiceFieldOverrides } from "@/data/approval-policy";
import { invoices, customers, contracts } from "@/data/mock-data";
import { verdantRenewalContractTemplate } from "@/data/mock-data";
import type { Contract, Customer, Invoice } from "@/data/mock-data";
import { getInvoiceEnrichment } from "@/data/billing-data";
import { InvoiceHTMLPreview, type InvoicePreviewVariant } from "@/components/approvals/InvoiceHTMLPreview";
import { ApprovalSettingsModal } from "@/components/approvals/ApprovalSettingsModal";
import type { ApprovalComment } from "@/data/ingest-data";

// ---------------------------------------------------------------------------
// Closure document kinds — CN-CLOSE-* = credit note, INV-TERM-* = termination invoice
// ---------------------------------------------------------------------------

type ApprovalDocKind = "invoice" | "credit-note" | "termination-invoice";

function getApprovalDocKind(invoiceId: string | undefined): ApprovalDocKind {
  if (!invoiceId) return "invoice";
  if (invoiceId.startsWith("CN-CLOSE-")) return "credit-note";
  if (invoiceId.startsWith("INV-TERM-")) return "termination-invoice";
  return "invoice";
}

function approvalPreviewVariant(kind: ApprovalDocKind): InvoicePreviewVariant {
  if (kind === "credit-note") return "credit-note";
  if (kind === "termination-invoice") return "termination";
  return "invoice";
}

interface ApprovalDocUi {
  kind: ApprovalDocKind;
  previewTab: string;
  amountField: string;
  dateField: string;
  memoPlaceholder: string;
  toastSent: string;
  approvedBanner: string;
  rejectedBanner: string;
  rejectPlaceholder: string;
  notFoundMessage: string;
  rejectCommentPrefix: string;
  summaryRowLabel: string;
  emptyPreviewHint: string;
  finalSuccessDocLabel: string;
  finalSuccessVerb: string;
  finalSuccessClosing: string;
  finalSuccessOpenDocLabel: string;
}

function getApprovalDocUi(kind: ApprovalDocKind): ApprovalDocUi {
  switch (kind) {
    case "credit-note":
      return {
        kind,
        previewTab: "Credit note",
        amountField: "Credit amount",
        dateField: "Issue date",
        memoPlaceholder: "Add a note that appears on the credit note…",
        toastSent: "Credit note issued",
        approvedBanner: "Credit note approved. Finalising next steps…",
        rejectedBanner: "Credit note cancelled. Redirecting to Approvals…",
        rejectPlaceholder: "Provide a reason for rejecting this credit note…",
        notFoundMessage: "Credit note not found or approval not yet submitted.",
        rejectCommentPrefix: "Credit note rejected",
        summaryRowLabel: "Credit note",
        emptyPreviewHint: "No contract source available for this credit.",
        finalSuccessDocLabel: "Credit note",
        finalSuccessVerb: "issued to",
        finalSuccessClosing:
          ". Credits will post to the customer account per your approval policy.",
        finalSuccessOpenDocLabel: "View credit note",
      };
    case "termination-invoice":
      return {
        kind,
        previewTab: "Invoice",
        amountField: "Invoice amount",
        dateField: "Invoice date",
        memoPlaceholder: "Add a note that appears on the invoice…",
        toastSent: "Termination invoice sent to the customer",
        approvedBanner: "Termination invoice approved. Finalising next steps…",
        rejectedBanner: "Termination invoice cancelled. Redirecting to Approvals…",
        rejectPlaceholder: "Provide a reason for rejecting this termination invoice…",
        notFoundMessage: "Invoice not found or approval not yet submitted.",
        rejectCommentPrefix: "Termination invoice rejected",
        summaryRowLabel: "Termination invoice",
        emptyPreviewHint: "No contract source available for this invoice.",
        finalSuccessDocLabel: "Termination invoice",
        finalSuccessVerb: "sent to",
        finalSuccessClosing: ". Future invoices will follow your approval policy.",
        finalSuccessOpenDocLabel: "Open invoice",
      };
    default:
      return {
        kind: "invoice",
        previewTab: "Invoice",
        amountField: "Invoice amount",
        dateField: "Invoice date",
        memoPlaceholder: "Add a note that appears on the invoice…",
        toastSent: "Invoice sent to the customer",
        approvedBanner: "Invoice approved. Finalising next steps…",
        rejectedBanner: "Invoice cancelled. Redirecting to Approvals…",
        rejectPlaceholder: "Provide a reason for rejecting this invoice…",
        notFoundMessage: "Invoice not found or approval not yet submitted.",
        rejectCommentPrefix: "Invoice rejected",
        summaryRowLabel: "Invoice",
        emptyPreviewHint: "No contract source available for this invoice.",
        finalSuccessDocLabel: "Invoice",
        finalSuccessVerb: "sent to",
        finalSuccessClosing: ". Future invoices will follow your approval policy.",
        finalSuccessOpenDocLabel: "Open Invoice",
      };
  }
}

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
// Comment Thread (unchanged)
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
    const t = setTimeout(onDone, 2400);
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
// Reject Reason Form
// ---------------------------------------------------------------------------

function RejectForm({
  onConfirm,
  onCancel,
  rejectPlaceholder = "Provide a reason for rejecting this invoice…",
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  rejectPlaceholder?: string;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
      <p className="mb-2 text-[12px] font-semibold text-red-700">Rejection Reason</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder={rejectPlaceholder}
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
// Editable critical-fields card (LEFT side)
// ---------------------------------------------------------------------------

function EditableField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[11px] font-medium text-text-muted">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-text-muted">{hint}</p>}
    </div>
  );
}

interface CriticalFieldsCardProps {
  invoice: Invoice;
  overrides: InvoiceFieldOverrides;
  onChange: (next: InvoiceFieldOverrides) => void;
  enrichmentBilling?: { start?: string; end?: string };
  enrichmentPaymentTerms?: string;
  enrichmentPo?: string;
  disabled: boolean;
  isBackdated: boolean;
  amountFieldLabel: string;
  dateFieldLabel: string;
  memoPlaceholder: string;
}

function CriticalFieldsCard({
  invoice,
  overrides,
  onChange,
  enrichmentBilling,
  enrichmentPaymentTerms,
  enrichmentPo,
  disabled,
  isBackdated,
  amountFieldLabel,
  dateFieldLabel,
  memoPlaceholder,
}: CriticalFieldsCardProps) {
  const amount = overrides.amount ?? invoice.amount;
  const dueDate = overrides.dueDate ?? invoice.dueDate;
  const invoiceDate = overrides.invoiceDate ?? invoice.date;
  const paymentTerms = overrides.paymentTerms ?? enrichmentPaymentTerms ?? "Net 30";
  const billingStart = overrides.billingPeriodStart ?? enrichmentBilling?.start ?? invoice.date;
  const billingEnd = overrides.billingPeriodEnd ?? enrichmentBilling?.end ?? invoice.dueDate;
  const taxRate = overrides.taxRate ?? 8;
  const poNumber = overrides.poNumber ?? enrichmentPo ?? "";
  const memo = overrides.memo ?? "";

  return (
    <SectionCard title="Critical fields">
      <div className="grid grid-cols-2 gap-3">
        <EditableField label={amountFieldLabel}>
          <div className="flex items-center rounded-md border border-border-default bg-white px-2 py-1 focus-within:border-cb-orange">
            <span className="mr-0.5 text-[11px] text-text-muted">$</span>
            <input
              type="number"
              value={amount}
              disabled={disabled}
              onChange={(e) => onChange({ ...overrides, amount: Number(e.target.value) })}
              className="w-full bg-transparent text-[12px] font-medium tabular-nums text-text-primary outline-none disabled:cursor-not-allowed"
            />
          </div>
        </EditableField>

        <EditableField label="Tax rate (%)">
          <div className="flex items-center rounded-md border border-border-default bg-white px-2 py-1 focus-within:border-cb-orange">
            <input
              type="number"
              value={taxRate}
              disabled={disabled}
              onChange={(e) => onChange({ ...overrides, taxRate: Number(e.target.value) })}
              className="w-full bg-transparent text-right text-[12px] font-medium tabular-nums text-text-primary outline-none disabled:cursor-not-allowed"
            />
            <span className="ml-0.5 text-[11px] text-text-muted">%</span>
          </div>
        </EditableField>

        <EditableField
          label={dateFieldLabel}
          hint={isBackdated ? "Backdated — will trigger non-standard approval" : undefined}
        >
          <input
            type="date"
            value={invoiceDate}
            disabled={disabled}
            onChange={(e) => onChange({ ...overrides, invoiceDate: e.target.value })}
            className={cn(
              "rounded-md border bg-white px-2 py-1 text-[12px] text-text-primary outline-none focus:border-cb-orange disabled:cursor-not-allowed",
              isBackdated ? "border-amber-300 bg-amber-50/40" : "border-border-default",
            )}
          />
        </EditableField>

        <EditableField label="Due date">
          <input
            type="date"
            value={dueDate}
            disabled={disabled}
            onChange={(e) => onChange({ ...overrides, dueDate: e.target.value })}
            className="rounded-md border border-border-default bg-white px-2 py-1 text-[12px] text-text-primary outline-none focus:border-cb-orange disabled:cursor-not-allowed"
          />
        </EditableField>

        <EditableField label="Payment terms">
          <select
            value={paymentTerms}
            disabled={disabled}
            onChange={(e) => onChange({ ...overrides, paymentTerms: e.target.value })}
            className="rounded-md border border-border-default bg-white px-2 py-1 text-[12px] text-text-primary outline-none focus:border-cb-orange disabled:cursor-not-allowed"
          >
            <option value="Net 0">Net 0 (Due on receipt)</option>
            <option value="Net 15">Net 15</option>
            <option value="Net 30">Net 30</option>
            <option value="Net 45">Net 45</option>
            <option value="Net 60">Net 60</option>
            <option value="Net 90">Net 90</option>
          </select>
        </EditableField>

        <EditableField label="PO number">
          <input
            type="text"
            value={poNumber}
            disabled={disabled}
            placeholder="—"
            onChange={(e) => onChange({ ...overrides, poNumber: e.target.value })}
            className="rounded-md border border-border-default bg-white px-2 py-1 text-[12px] text-text-primary outline-none focus:border-cb-orange disabled:cursor-not-allowed placeholder:text-text-muted"
          />
        </EditableField>

        <EditableField label="Billing period — start">
          <input
            type="date"
            value={billingStart}
            disabled={disabled}
            onChange={(e) => onChange({ ...overrides, billingPeriodStart: e.target.value })}
            className="rounded-md border border-border-default bg-white px-2 py-1 text-[12px] text-text-primary outline-none focus:border-cb-orange disabled:cursor-not-allowed"
          />
        </EditableField>

        <EditableField label="Billing period — end">
          <input
            type="date"
            value={billingEnd}
            disabled={disabled}
            onChange={(e) => onChange({ ...overrides, billingPeriodEnd: e.target.value })}
            className="rounded-md border border-border-default bg-white px-2 py-1 text-[12px] text-text-primary outline-none focus:border-cb-orange disabled:cursor-not-allowed"
          />
        </EditableField>
      </div>

      <div className="mt-3">
        <EditableField label="Memo to customer">
          <textarea
            value={memo}
            disabled={disabled}
            rows={2}
            placeholder={memoPlaceholder}
            onChange={(e) => onChange({ ...overrides, memo: e.target.value })}
            className="w-full resize-none rounded-md border border-border-default bg-white px-2 py-1.5 text-[12px] text-text-primary outline-none focus:border-cb-orange disabled:cursor-not-allowed placeholder:text-text-muted"
          />
        </EditableField>
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Right-panel viewer with Invoice | Contract tabs
// ---------------------------------------------------------------------------

type DocTab = "invoice" | "contract";

function PreviewToolbar({
  active,
  onChange,
  onCollapse,
  page,
  setPage,
  zoom,
  setZoom,
  pageCount,
  documentTabLabel,
}: {
  active: DocTab;
  onChange: (t: DocTab) => void;
  onCollapse: () => void;
  page: number;
  setPage: (p: number) => void;
  zoom: number;
  setZoom: (z: number) => void;
  pageCount: number;
  documentTabLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border-default bg-white px-3 py-2">
      {/* Tab toggle */}
      <div className="flex items-center gap-0.5 rounded-md border border-border-default bg-surface-muted p-0.5">
        <button
          type="button"
          onClick={() => onChange("invoice")}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
            active === "invoice"
              ? "bg-white text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-secondary",
          )}
        >
          <FileEdit size={11} />
          {documentTabLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange("contract")}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
            active === "contract"
              ? "bg-white text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-secondary",
          )}
        >
          <FileText size={11} />
          Contract
        </button>
      </div>

      <div className="flex items-center gap-1">
        {active === "contract" && (
          <>
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="min-w-[58px] text-center text-[11px] tabular-nums text-text-secondary">
              Page {page} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage(Math.min(pageCount, page + 1))}
              disabled={page === pageCount}
              className="rounded p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
            <div className="mx-1 h-4 w-px bg-border-default" />
          </>
        )}

        <button
          type="button"
          onClick={() => setZoom(Math.max(50, zoom - 10))}
          className="rounded p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
          aria-label="Zoom out"
        >
          <Minus size={14} />
        </button>
        <span className="min-w-[36px] text-center text-[11px] tabular-nums text-text-secondary">{zoom}%</span>
        <button
          type="button"
          onClick={() => setZoom(Math.min(200, zoom + 10))}
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
          aria-label="Hide preview"
          title="Hide preview"
        >
          <PanelRightClose size={14} />
        </button>
      </div>
    </div>
  );
}

function DocumentPreviewPanel({
  invoice,
  customer,
  contract,
  enrichment,
  onCollapse,
  invoiceOverrides,
  previewVariant,
  documentTabLabel,
  emptyPreviewHint,
}: {
  invoice: Invoice;
  customer: Customer;
  contract?: Contract;
  enrichment?: ReturnType<typeof getInvoiceEnrichment>;
  onCollapse: () => void;
  invoiceOverrides: InvoiceFieldOverrides;
  previewVariant: InvoicePreviewVariant;
  documentTabLabel: string;
  emptyPreviewHint: string;
}) {
  const [tab, setTab] = useState<DocTab>("invoice");
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const pageCount = 3;

  // Apply editable overrides to a working copy of the invoice for the preview
  const effectiveInvoice: Invoice = {
    ...invoice,
    amount: invoiceOverrides.amount ?? invoice.amount,
    dueDate: invoiceOverrides.dueDate ?? invoice.dueDate,
    date: invoiceOverrides.invoiceDate ?? invoice.date,
  };

  return (
    <div className="flex h-full flex-col bg-[#EEF0F2]">
      <PreviewToolbar
        active={tab}
        onChange={setTab}
        onCollapse={onCollapse}
        page={page}
        setPage={setPage}
        zoom={zoom}
        setZoom={setZoom}
        pageCount={pageCount}
        documentTabLabel={documentTabLabel}
      />

      <div className="flex-1 overflow-auto p-4">
        <div
          className="mx-auto rounded-sm border border-border-default bg-white shadow-[0_2px_12px_rgba(17,24,39,0.08)]"
          style={{ zoom: zoom / 100 } as CSSProperties}
        >
          {tab === "invoice" ? (
            <InvoiceHTMLPreview
              invoice={effectiveInvoice}
              customerName={customer.name}
              enrichment={enrichment}
              variant={previewVariant}
            />
          ) : contract ? (
            <div className="px-8 py-7">
              <ContractDocumentBody contract={contract} customer={customer} />
            </div>
          ) : (
            <div className="px-8 py-12 text-center text-[12px] text-text-muted">
              {emptyPreviewHint}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contract Document Body — unchanged from before
// ---------------------------------------------------------------------------

function ContractDocumentBody({ contract, customer }: { contract: Contract; customer: Customer }) {
  return (
    <div className="space-y-5 font-mono text-[11px] leading-relaxed text-text-secondary">
      <div className="text-center">
        <p className="text-[13px] font-bold uppercase tracking-widest text-text-primary">
          Master Subscription Agreement
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">Order Form</p>
        <p className="mt-0.5 text-[10px] text-text-muted">Contract ID: {contract.id}</p>
      </div>

      <hr className="border-border-subtle" />

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

      <div>
        <p className="font-semibold text-text-primary">1. TERM</p>
        <p className="mt-1">
          {contract.term} commencing {shortDate(contract.effectiveDate)} and ending {shortDate(contract.endDate)}.
        </p>
      </div>

      <hr className="border-border-subtle" />

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
                  {p.unitPrice < 1 ? `$${p.unitPrice.toFixed(3)}/cr` : `$${p.unitPrice.toLocaleString()}`}
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

      <div>
        <p className="font-semibold text-text-primary">3. PRICING & COMMITMENT</p>
        <p className="mt-1">Total Contract Value (TCV): {currency(contract.tcv)}</p>
        <p>Minimum Annual Commit: {currency(contract.minAnnualCommit)}</p>
        {contract.prepaidCreditTotal > 0 && (
          <p>Prepaid Credits: {contract.prepaidCreditTotal.toLocaleString()} credits</p>
        )}
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">4. BILLING & PAYMENT</p>
        <p className="mt-1">Billing Frequency: {contract.billingFrequency}.</p>
        <p className="mt-0.5">Payment Terms: {contract.paymentTerms} from invoice date.</p>
      </div>

      <hr className="border-border-subtle" />

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
  const [searchParams] = useSearchParams();
  const ingestId = searchParams.get("ingestId") ?? "";
  // Early renewal context: present when this approval is for a closure credit note/invoice
  const closureFor = searchParams.get("closureFor") ?? "";
  const closureQueueItemId = searchParams.get("queueItemId") ?? "";
  const navigate = useNavigate();
  const { ref: stickyRef, isScrolled } = useScrolled();
  const {
    approvalRequests, updateApprovalStatus, addApprovalComment,
    setInvoiceStatusOverride, invoiceStatusOverrides,
    invoiceFieldOverrides, setInvoiceFieldOverride,
    firstApprovalCompletedFor, markFirstApprovalCompleted,
    approvalPolicy, setApprovalPolicy,
    pendingRenewalIngestions, clearPendingRenewalIngestion,
    addSessionContract, applyQueueItemOverride,
    showRenewalToast,
  } = useIngestContext();

  const [showToast, setShowToast] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [viewerCollapsed, setViewerCollapsed] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFinalSuccess, setShowFinalSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const docUi = useMemo(() => getApprovalDocUi(getApprovalDocKind(invoiceId)), [invoiceId]);

  // Static invoice lookup — may be undefined for runtime-created closure documents
  const staticInvoice = invoices.find((i) => i.id === invoiceId);

  // Approval request may have been created in-session for closure documents
  const approval = approvalRequests.find((r) => r.invoiceId === invoiceId);

  // For closure documents (CN-CLOSE-* or INV-TERM-*), build a synthetic invoice
  // from the approval request so the page can render
  const isClosureDocument = Boolean(
    invoiceId && (invoiceId.startsWith("CN-CLOSE-") || invoiceId.startsWith("INV-TERM-"))
  );
  const syntheticInvoice: Invoice | undefined = isClosureDocument && approval
    ? {
        id: approval.invoiceId,
        customerId: approval.customerId,
        contractId: closureFor,
        date: approval.invoiceDate,
        dueDate: approval.invoiceDate,
        amount: approval.invoiceAmount,
        status: approval.status === "Pending Approval" ? "Pending Approval" : "Approved",
        lineItems: [
          {
            description: invoiceId?.startsWith("CN-CLOSE-")
              ? "Contract closure — credit note for unused prepaid balance"
              : "Contract termination charge",
            amount: approval.invoiceAmount,
          },
        ],
        owner: "Alex Nguyen",
      }
    : undefined;

  const effectiveInvoice = staticInvoice ?? syntheticInvoice;
  const customer = customers.find((c) => c.id === effectiveInvoice?.customerId);
  const contract = contracts.find((c) => c.id === effectiveInvoice?.contractId)
    ?? (closureFor ? contracts.find((c) => c.id === closureFor) : undefined);
  const enrichment = invoiceId ? getInvoiceEnrichment(invoiceId) : undefined;
  const effectiveStatus = invoiceId ? (invoiceStatusOverrides[invoiceId] ?? effectiveInvoice?.status ?? "—") : "—";
  const overrides = invoiceId ? (invoiceFieldOverrides[invoiceId] ?? {}) : {};

  // Backdated detection — invoice date earlier than today
  const todayIso = new Date().toISOString().slice(0, 10);
  const effectiveInvoiceDate = overrides.invoiceDate ?? effectiveInvoice?.date ?? "";
  const isBackdated = effectiveInvoiceDate !== "" && effectiveInvoiceDate < todayIso;

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

    // Early renewal auto-ingest: if this approval is for a closure document
    // and there's a pending renewal ingestion against the prior contract, create
    // the scheduled contract and mark the queue item as ingested.
    if (closureFor && closureQueueItemId && pendingRenewalIngestions[closureFor]) {
      const pending = pendingRenewalIngestions[closureFor];
      const closureEffectiveDate = effectiveInvoice?.date ?? todayIso;
      const newContract = {
        ...verdantRenewalContractTemplate,
        scheduledStartDate: closureEffectiveDate,
        replacesContractId: closureFor,
      };
      addSessionContract(newContract);
      applyQueueItemOverride(pending.queueItemId, {
        status: "Ingested",
        contractId: newContract.id,
      });
      clearPendingRenewalIngestion(closureFor);
      showRenewalToast(
        `Renewal ${newContract.id} scheduled to activate ${shortDate(closureEffectiveDate)} — prior contract closing.`,
        pending.customerId
      );
    }

    setToastMessage(docUi.toastSent);
    setShowToast(true);
  }

  function handleToastDone() {
    setShowToast(false);

    // If this was a closure approval for an early renewal, navigate to the
    // customer's contract tab (list view) to see both contracts.
    if (closureFor && closureQueueItemId && customer) {
      navigate(`/customers/${customer.id}?tab=contract`);
      return;
    }

    // Per spec: only trigger the merchant approval-policy modal on the FIRST
    // invoice approval within an ingestion cycle (URL carries ?ingestId=…).
    // Manual approvals from /approvals (no ingestId) just go to the invoice.
    if (ingestId && !firstApprovalCompletedFor[ingestId]) {
      markFirstApprovalCompleted(ingestId);
      setShowSettingsModal(true);
    } else {
      navigate(`/invoices/${invoiceId}?from=approvals`);
    }
  }

  function handleSavePolicy(policy: typeof approvalPolicy) {
    setApprovalPolicy(policy);
    setShowSettingsModal(false);
    setShowFinalSuccess(true);
  }

  function handleSkipPolicy() {
    setShowSettingsModal(false);
    setShowFinalSuccess(true);
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
      text: `${docUi.rejectCommentPrefix}. Reason: ${reason}`,
      timestamp: new Date().toISOString(),
    });
    setTimeout(() => navigate("/approvals"), 1200);
  }

  if (!effectiveInvoice || !customer) {
    return (
      <div className="flex flex-1 w-full flex-col items-center justify-center py-16 text-text-muted">
        <p className="text-[14px]">{docUi.notFoundMessage}</p>
        <button onClick={() => navigate("/approvals")}
          className="mt-3 text-[12px] text-blue-600 hover:underline">
          Back to Approvals
        </button>
      </div>
    );
  }

  const invoice = effectiveInvoice;

  // ── Final success state — replaces the whole page after policy save ────
  if (showFinalSuccess) {
    const policyLabel =
      approvalPolicy.mode === "auto-approve" ? "Auto-approve, always"
      : approvalPolicy.mode === "always-approve" ? "Send for approval, always"
      : approvalPolicy.mode === "non-standard" ? "Send for approval, only if non-standard"
      : "No policy set";
    return (
      <div className="flex flex-1 w-full flex-col">
        <div
          ref={stickyRef}
          className={cn(
            "sticky top-0 z-10 flex w-full items-center justify-between border-b border-[#F0F1F3] bg-white px-6 py-3 rounded-tl-[24px] transition-shadow duration-200",
            isScrolled && "shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          )}
        >
          <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <button onClick={() => navigate("/approvals")}
              className="text-text-secondary transition-colors hover:text-text-primary">
              Approvals
            </button>
            <ChevronRight size={11} className="text-text-muted/50" />
            <span className="font-medium text-text-primary">{invoice.id}</span>
            <span className="mx-2 text-text-muted/40">·</span>
            <span className="text-emerald-600 font-medium">Setup complete</span>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 px-6 py-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[18px] font-semibold text-text-primary">All set</p>
              <p className="text-[12px] text-text-muted">
                <span className="font-medium text-text-primary">{docUi.finalSuccessDocLabel}</span>{" "}
                <span className="font-medium text-text-primary">{invoice.id}</span>{" "}
                {docUi.finalSuccessVerb}{" "}
                <span className="font-medium text-text-primary">{customer.name}</span>
                {docUi.finalSuccessClosing}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border-default bg-surface-muted">
            <div className="border-b border-border-default px-4 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Summary</p>
            </div>
            <div className="divide-y divide-border-subtle px-4">
              <div className="flex items-center justify-between py-2.5">
                <p className="text-[12px] text-text-muted">{docUi.summaryRowLabel}</p>
                <p className="text-[13px] font-medium text-text-primary">{invoice.id} · {currency(invoice.amount)}</p>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <p className="text-[12px] text-text-muted">Customer</p>
                <p className="text-[13px] font-medium text-text-primary">{customer.name}</p>
              </div>
              {contract && (
                <div className="flex items-center justify-between py-2.5">
                  <p className="text-[12px] text-text-muted">Contract</p>
                  <p className="text-[13px] font-medium text-text-primary">{contract.id}</p>
                </div>
              )}
              <div className="flex items-center justify-between py-2.5">
                <p className="text-[12px] text-text-muted">Approval policy</p>
                <p className="text-[13px] font-medium text-text-primary">{policyLabel}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/customers/${customer.id}?tab=customer`)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#012A38] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#01374a]"
            >
              View Customer
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => navigate(`/invoices/${invoice.id}?from=approvals`)}
              className="inline-flex items-center gap-1 rounded-md border border-border-default bg-white px-4 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
            >
              {docUi.finalSuccessOpenDocLabel}
            </button>
            <button
              type="button"
              onClick={() => navigate("/queue")}
              className="ml-auto text-[12px] font-medium text-text-muted transition-colors hover:text-text-primary"
            >
              Back to Queue
            </button>
          </div>
        </div>
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
          <span className="shrink-0 font-medium text-text-primary">{currency(overrides.amount ?? invoice.amount)}</span>
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

      {/* Two-pane body: (editable form + comments rail) | document preview tabs */}
      <div className="flex flex-1 min-h-0">
        <div className="flex min-w-0 flex-1 overflow-auto">
          <div className="flex w-full gap-6 px-6 py-5">
            {/* LEFT: editable critical fields + status banners + collaboration */}
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              {/* Inline status banners */}
              {showRejectForm && canDecide && (
                <RejectForm
                  onConfirm={handleReject}
                  onCancel={() => setShowRejectForm(false)}
                  rejectPlaceholder={docUi.rejectPlaceholder}
                />
              )}
              {approved && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <p className="text-[12px] font-medium text-emerald-700">
                    {docUi.approvedBanner}
                  </p>
                </div>
              )}
              {rejected && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <XCircle size={16} className="text-gray-500" />
                  <p className="text-[12px] font-medium text-gray-600">
                    {docUi.rejectedBanner}
                  </p>
                </div>
              )}

              {/* Editable critical fields card */}
              <CriticalFieldsCard
                invoice={invoice}
                overrides={overrides}
                onChange={(next) => invoiceId && setInvoiceFieldOverride(invoiceId, next)}
                enrichmentBilling={
                  enrichment?.billingPeriodStart
                    ? { start: enrichment.billingPeriodStart, end: enrichment.billingPeriodEnd }
                    : undefined
                }
                enrichmentPaymentTerms={enrichment?.paymentTerms}
                enrichmentPo={enrichment?.poNumber}
                disabled={!canDecide}
                isBackdated={isBackdated}
                amountFieldLabel={docUi.amountField}
                dateFieldLabel={docUi.dateField}
                memoPlaceholder={docUi.memoPlaceholder}
              />

              {/* Approval metadata + contract summary */}
              <SectionCard title="Approval & Context">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
                  <span className="text-text-muted">Submitted by</span>
                  <span className="text-text-primary">{approval?.submittedBy ?? "—"}</span>
                  <span className="text-text-muted">Submitted on</span>
                  <span className="text-text-primary">{approval ? shortDate(approval.submittedAt) : "—"}</span>
                  <span className="text-text-muted">Approver</span>
                  <span className="text-text-primary">{approval?.approver ?? "Sarah Chen, VP Revenue"}</span>
                  {contract && (
                    <>
                      <span className="text-text-muted">Contract</span>
                      <span className="text-text-primary">{contract.id} · {contract.term}</span>
                      <span className="text-text-muted">TCV</span>
                      <span className="text-text-primary">{currency(contract.tcv)}</span>
                    </>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Sticky Comments rail */}
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

        {/* RIGHT: Invoice | Contract preview tabs (collapsible) */}
        <div
          className={cn(
            "shrink-0 overflow-hidden border-l border-border-default transition-all duration-200",
            viewerCollapsed ? "w-0" : "w-[480px]"
          )}
        >
          {!viewerCollapsed && (
            <DocumentPreviewPanel
              invoice={invoice}
              customer={customer}
              contract={contract}
              enrichment={enrichment}
              onCollapse={() => setViewerCollapsed(true)}
              invoiceOverrides={overrides}
              previewVariant={approvalPreviewVariant(docUi.kind)}
              documentTabLabel={docUi.previewTab}
              emptyPreviewHint={docUi.emptyPreviewHint}
            />
          )}
        </div>

        {viewerCollapsed && (
          <div className="border-l border-border-default">
            <button
              type="button"
              onClick={() => setViewerCollapsed(false)}
              className="flex h-full w-8 flex-col items-center justify-center gap-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
              title="Show preview"
            >
              <PanelRightOpen size={14} />
              <span className="rotate-90 whitespace-nowrap text-[9px] uppercase tracking-widest">
                Preview
              </span>
            </button>
          </div>
        )}
      </div>

      {showToast && (
        <Toast message={toastMessage} onDone={handleToastDone} />
      )}

      {showSettingsModal && (
        <ApprovalSettingsModal
          initial={approvalPolicy}
          onSave={handleSavePolicy}
          onSkip={handleSkipPolicy}
        />
      )}
    </div>
  );
}
