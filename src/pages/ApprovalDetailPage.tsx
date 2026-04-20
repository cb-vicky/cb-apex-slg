import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronRight, CheckCircle2, XCircle, MessageSquare, AtSign,
  ExternalLink, FileText, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { currency, shortDate } from "@/lib/utils";
import { SectionCard, KV, StatusBadge } from "@/components/ui/primitives";
import { useScrolled } from "@/hooks/useScrolled";
import { useIngestContext } from "@/context/IngestContext";
import { invoices, customers, contracts } from "@/data/mock-data";
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
    <div className="flex gap-2.5 py-3 border-b border-border-subtle last:border-0">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#012A38] text-[10px] font-bold text-white">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-semibold text-text-primary">{comment.author}</span>
          <span className="text-[10px] text-text-muted">{comment.role}</span>
          <span className="ml-auto text-[10px] text-text-muted">{shortDate(comment.timestamp)}</span>
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
        placeholder="Add a comment or note... Use @ to tag someone"
        className="w-full resize-none rounded-lg border border-border-default bg-white px-3 py-2.5 text-[12px] leading-relaxed text-text-primary outline-none focus:border-cb-orange placeholder:text-text-muted"
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
          <AtSign size={12} /> Tag someone
        </button>
        <button type="button" onClick={handleSubmit}
          className="rounded-md bg-[#012A38] px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-[#01374a]">
          <MessageSquare size={11} className="inline mr-1" />
          Add Comment
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
// Reject Reason Form
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

  const invoice = invoices.find((i) => i.id === invoiceId);
  const customer = customers.find((c) => c.id === invoice?.customerId);
  const contract = contracts.find((c) => c.id === invoice?.contractId);
  const enrichment = invoiceId ? getInvoiceEnrichment(invoiceId) : undefined;
  const approval = approvalRequests.find((r) => r.invoiceId === invoiceId);
  const effectiveStatus = invoiceId ? (invoiceStatusOverrides[invoiceId] ?? invoice?.status ?? "—") : "—";

  // Previous invoice for this customer
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

  return (
    <div className="flex flex-1 w-full flex-col">
      {/* Sticky breadcrumb */}
      <div
        ref={stickyRef}
        className={cn(
          "sticky top-0 z-10 flex w-full items-center border-b border-[#F0F1F3] bg-white px-6 py-3 rounded-tl-[24px] transition-shadow duration-200",
          isScrolled && "shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        )}
      >
        <nav className="flex flex-1 items-center gap-1 text-[12px] text-text-muted">
          <button onClick={() => navigate("/approvals")}
            className="text-text-secondary transition-colors hover:text-text-primary">
            Approvals
          </button>
          <ChevronRight size={11} className="text-text-muted/50" />
          <span className="text-text-secondary">Invoices</span>
          <ChevronRight size={11} className="text-text-muted/50" />
          <span className="font-medium text-text-primary">{invoice.id}</span>
        </nav>
        <StatusBadge status={effectiveStatus} />
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 gap-0 min-h-0">
        {/* Left: Invoice HTML Preview */}
        <div className="flex-1 overflow-auto border-r border-border-default px-6 py-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Invoice Preview
          </p>
          <InvoiceHTMLPreview
            invoice={{ ...invoice, status: effectiveStatus }}
            customerName={customer.name}
            enrichment={enrichment}
          />
        </div>

        {/* Right: Review Context Panel */}
        <div className="w-[340px] shrink-0 overflow-auto px-5 py-5">
          <div className="flex flex-col gap-4">

            {/* Approval Metadata */}
            <SectionCard title="Approval Details">
              <div className="grid grid-cols-1 gap-y-0">
                <KV label="Invoice ID" value={invoice.id} />
                <KV label="Status" value={<StatusBadge status={effectiveStatus} />} />
                <KV label="Submitted By" value={approval?.submittedBy ?? "—"} />
                <KV label="Submitted On" value={approval ? shortDate(approval.submittedAt) : "—"} />
                <KV label="Approver" value={approval?.approver ?? "Sarah Chen, VP Revenue"} />
                <KV label="Amount" value={currency(invoice.amount)} />
              </div>
            </SectionCard>

            {/* Previous Invoice */}
            {prevInvoice && (
              <SectionCard title="Previous Invoice">
                <div className="grid grid-cols-1 gap-y-0">
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

            {/* Contract Summary */}
            {contract && (
              <SectionCard title="Contract Summary">
                <div className="grid grid-cols-1 gap-y-0">
                  <KV label="Contract ID" value={contract.id} />
                  <KV label="Status" value={<StatusBadge status={contract.status} />} />
                  <KV label="Term" value={contract.term} />
                  <KV label="TCV" value={currency(contract.tcv)} />
                  <KV label="Renewal Date" value={contract.renewalDate ? shortDate(contract.renewalDate) : "—"} />
                  <KV label="Payment Terms" value={contract.paymentTerms} />
                </div>
              </SectionCard>
            )}

            {/* Related Links */}
            <SectionCard title="Related Links">
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate(`/invoices/${invoice.id}?from=approvals`)}
                  className="flex items-center gap-2 text-[12px] text-blue-600 hover:underline"
                >
                  <FileText size={12} />
                  Invoice Detail — {invoice.id}
                  <ExternalLink size={10} />
                </button>
                {contract && (
                  <button
                    type="button"
                    onClick={() => navigate(`/customers/${customer.id}?tab=contract&contractId=${contract.id}&from=approvals`)}
                    className="flex items-center gap-2 text-[12px] text-blue-600 hover:underline"
                  >
                    <FileText size={12} />
                    Contract — {contract.id}
                    <ExternalLink size={10} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/customers/${customer.id}?tab=customer&from=approvals`)}
                  className="flex items-center gap-2 text-[12px] text-blue-600 hover:underline"
                >
                  <User size={12} />
                  Customer — {customer.name}
                  <ExternalLink size={10} />
                </button>
              </div>
            </SectionCard>

            {/* Comments */}
            <SectionCard title="Comments">
              <div className="mb-3 divide-y divide-border-subtle">
                {(approval?.comments ?? []).map((c) => (
                  <CommentItem key={c.id} comment={c} />
                ))}
                {(!approval || approval.comments.length === 0) && (
                  <p className="py-3 text-[12px] text-text-muted text-center">No comments yet.</p>
                )}
              </div>
              {!approved && !rejected && (
                <CommentInput onSubmit={handleAddComment} />
              )}
            </SectionCard>

            {/* Decision Actions */}
            {!approved && !rejected && (
              <div className="rounded-lg border border-border-default bg-surface-muted p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Decision</p>
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={handleApprove}
                    className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500">
                    <CheckCircle2 size={15} />
                    Approve Invoice
                  </button>
                  {!showRejectForm ? (
                    <button type="button" onClick={() => setShowRejectForm(true)}
                      className="flex items-center justify-center gap-2 rounded-md border border-red-200 bg-white py-2 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-50">
                      <XCircle size={14} />
                      Reject / Cancel
                    </button>
                  ) : (
                    <RejectForm
                      onConfirm={handleReject}
                      onCancel={() => setShowRejectForm(false)}
                    />
                  )}
                </div>
              </div>
            )}

            {approved && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <p className="text-[12px] font-medium text-emerald-700">Invoice approved. Redirecting...</p>
              </div>
            )}

            {rejected && (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <XCircle size={16} className="text-gray-500" />
                <p className="text-[12px] font-medium text-gray-600">Invoice cancelled. Redirecting to Approvals...</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {showToast && (
        <Toast message="Email sent to the customer" onDone={handleToastDone} />
      )}
    </div>
  );
}
