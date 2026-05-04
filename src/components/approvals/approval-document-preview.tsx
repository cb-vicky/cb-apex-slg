import { useState, type CSSProperties } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileEdit,
  FileText,
  Minus,
  PanelRightClose,
  Plus,
} from "lucide-react";
import { cn, currency, shortDate } from "@/lib/utils";
import type { Contract, Customer, Invoice } from "@/data/mock-data";
import type { InvoiceFieldOverrides } from "@/data/approval-policy";
import type { InvoiceEnrichment } from "@/data/billing-data";
import { InvoiceHTMLPreview, type InvoicePreviewVariant } from "@/components/approvals/InvoiceHTMLPreview";

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
                  {p.name} <span className="text-text-muted">({p.sku})</span>
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
            <p className="mt-4 border-b border-border-default pb-1 font-semibold text-text-primary">Sarah Chen</p>
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

export function ApprovalDocumentPreviewPane({
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
  enrichment?: InvoiceEnrichment;
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

  const effectiveInvoice: Invoice = {
    ...invoice,
    amount: invoiceOverrides.amount ?? invoice.amount,
    dueDate: invoiceOverrides.dueDate ?? invoice.dueDate,
    date: invoiceOverrides.invoiceDate ?? invoice.date,
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-gray-100">
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

      <div className="min-h-0 flex-1 overflow-auto p-4">
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
            <div className="px-8 py-12 text-center text-[12px] text-text-muted">{emptyPreviewHint}</div>
          )}
        </div>
      </div>
    </div>
  );
}
