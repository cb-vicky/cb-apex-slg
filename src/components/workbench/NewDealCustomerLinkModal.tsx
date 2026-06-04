import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { X, CircleCheck, Info, Link2, UserPlus, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateCustomerForm } from "@/components/workbench/CreateCustomerForm";
import {
  buildInitialCreateCustomerForm,
  isCreateCustomerFormComplete,
  toSessionCustomerInput,
  type CreateCustomerFormState,
} from "@/components/workbench/create-customer-form";
import {
  CustomerLinkCustomerTable,
  CustomerLinkSearchBar,
} from "@/components/workbench/CustomerLinkSearchResults";
import { CustomerLinkCondensedStrip } from "@/components/workbench/CustomerLinkCondensedStrip";
import { ExtractedCustomerDetailsCard } from "@/components/workbench/ExtractedCustomerDetailsCard";
import { LinkedCustomerDetailsCard, CUSTOMER_LINK_CARD_WIDTH_CLASS } from "@/components/workbench/LinkedCustomerDetailsCard";
import type { Customer } from "@/data/mock-data";
import { customers as seedCustomers } from "@/data/mock-data";
import { customerLinkSearchSeedCustomers } from "@/data/customer-link-search-seed";
import type { QueueItem } from "@/data/queue-data";
import { buildZenithSessionCustomer } from "@/data/zenith-ingest-session";
import { useIngestContext } from "@/context/IngestContext";
import {
  getExtractedCustomerSummary,
  getExtractedForQueueItem,
  openQueueIngestionTab,
  suggestDomainFromCompanyName,
} from "@/lib/new-deal-customer-link";
import { getCustomerLinkWorkflowVariant } from "@/lib/new-deal-customer-link-workflow";
import { NewDealCustomerLinkMatchFirstPanel } from "./NewDealCustomerLinkMatchFirstPanel";
import type { ExtractedContract } from "@/data/ingest-data";

function DocumentPreviewPane({
  documentTitle,
  extracted,
  queueItem,
}: {
  documentTitle: string;
  extracted: ExtractedContract | null;
  queueItem: QueueItem;
}) {
  const [zoom, setZoom] = useState(70);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  const customerName = extracted?.customerName || queueItem.customerName;
  const customerLegalEntity = extracted?.customerLegalEntity || queueItem.customerName;
  const customerContactName = extracted?.primaryContactName;
  const customerContactEmail = extracted?.primaryContactEmail;
  const docId = extracted?.docId?.toUpperCase() || queueItem.id;

  return (
    <div className="flex h-full flex-col bg-[#E8EAED]">
      <div className="flex shrink-0 items-center gap-3 border-b border-black/10 bg-[#3C3F44] px-3 py-2 text-white shadow-sm">
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <div className="rounded bg-white/10 p-1.5">
            <FileText size={14} className="text-white/90" />
          </div>
          <span className="truncate text-[13px] font-medium text-white/95">Contract Preview</span>
        </div>

        <div
          className="flex min-w-0 flex-1 items-center justify-center gap-0.5"
          aria-label={`Page ${currentPage} of ${totalPages}`}
        >
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={15} strokeWidth={2} />
          </button>
          <span className="min-w-[3.25rem] text-center text-[11px] tabular-nums text-white/75">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={15} strokeWidth={2} />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1 py-0.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(40, z - 10))}
            className="rounded p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="min-w-[2.25rem] text-center text-[11px] tabular-nums text-white/75">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(150, z + 10))}
            className="rounded p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <span className="mx-0.5 h-4 w-px bg-white/15" aria-hidden />
          <button
            type="button"
            className="rounded p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Download"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-auto p-4"
        role="region"
        aria-label="PDF document viewer"
      >
        <div
          className={cn(
            "mx-auto w-full min-h-[calc(100%-0.5rem)]",
            "rounded-sm border border-black/[0.08] bg-white",
            "shadow-[0_1px_3px_rgba(0,0,0,0.12),0_6px_20px_rgba(0,0,0,0.14)]",
          )}
          style={{ zoom: zoom / 100 } as CSSProperties}
        >
            <div className="px-8 py-10 sm:px-10">
              <div className="border-b border-gray-200 pb-5">
                <div className="text-center">
                  <h1 className="text-xl font-bold text-gray-900">MASTER SERVICE AGREEMENT</h1>
                  <p className="mt-1.5 text-xs text-gray-600">Contract #{docId}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-6 border-b border-gray-200 pb-5">
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Provider</h3>
                  <p className="mt-1.5 text-sm font-medium text-gray-900">Chargebee Inc.</p>
                  <p className="text-xs text-gray-600">340 S Lemon Ave #1111</p>
                  <p className="text-xs text-gray-600">Walnut, CA 91789</p>
                </div>
                <div
                  className={cn(
                    "relative rounded-md px-2.5 py-2",
                    "bg-amber-50 ring-2 ring-amber-400/55 ring-inset",
                    "shadow-[inset_3px_0_0_0_rgba(245,158,11,0.85)]",
                  )}
                >
                  <span className="mb-1.5 inline-flex rounded bg-amber-500/90 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-white">
                    Customer
                  </span>
                  <h3 className="sr-only">Customer</h3>
                  <p className="text-sm font-medium text-gray-900">{customerLegalEntity}</p>
                  {customerName !== customerLegalEntity ? (
                    <p className="mt-0.5 text-xs text-gray-600">{customerName}</p>
                  ) : null}
                  {customerContactName ? (
                    <p className="mt-1.5 text-xs text-gray-700">
                      <span className="text-gray-500">Contact:</span> {customerContactName}
                    </p>
                  ) : null}
                  {customerContactEmail ? (
                    <p className="text-xs text-gray-600">{customerContactEmail}</p>
                  ) : null}
                </div>
              </div>

              {extracted && (
                <>
                  <div className="mt-6">
                    <h2 className="text-sm font-semibold text-gray-900">1. Contract Terms</h2>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">Effective Date:</span>
                        <span className="ml-1.5 font-medium text-gray-900">{formatDate(extracted.terms.startDate)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">End Date:</span>
                        <span className="ml-1.5 font-medium text-gray-900">{formatDate(extracted.terms.endDate)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Term Length:</span>
                        <span className="ml-1.5 font-medium text-gray-900">{extracted.terms.term}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Auto-Renewal:</span>
                        <span className="ml-1.5 font-medium text-gray-900">{extracted.terms.autoRenew ? "Yes" : "No"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h2 className="text-sm font-semibold text-gray-900">2. Pricing Schedule</h2>
                    <table className="mt-3 w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-1.5 text-left font-medium text-gray-600">Product</th>
                          <th className="py-1.5 text-right font-medium text-gray-600">Qty</th>
                          <th className="py-1.5 text-right font-medium text-gray-600">Unit Price</th>
                          <th className="py-1.5 text-right font-medium text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extracted.products.map((product, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-1.5 text-gray-900">{product.extractedName}</td>
                            <td className="py-1.5 text-right text-gray-600">{product.quantity}</td>
                            <td className="py-1.5 text-right text-gray-600">{formatCurrency(product.unitPrice)}</td>
                            <td className="py-1.5 text-right font-medium text-gray-900">
                              {formatCurrency(product.quantity * product.unitPrice * (1 - product.discount / 100))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-gray-200">
                          <td colSpan={3} className="py-2 text-right font-semibold text-gray-900">
                            Total Contract Value:
                          </td>
                          <td className="py-2 text-right text-base font-bold text-gray-900">
                            {formatCurrency(extracted.terms.tcv)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="mt-6">
                    <h2 className="text-sm font-semibold text-gray-900">3. Billing Terms</h2>
                    <div className="mt-3 text-xs text-gray-600">
                      <p>
                        <span className="font-medium text-gray-900">Billing Frequency:</span>{" "}
                        {extracted.terms.billingFrequency}
                      </p>
                      <p className="mt-1.5">
                        <span className="font-medium text-gray-900">Payment Terms:</span>{" "}
                        {extracted.terms.paymentTerms}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {!extracted && (
                <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
                  <FileText size={32} className="mb-3 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">{documentTitle}</p>
                  <p className="mt-1 text-xs text-gray-400">Contract details loading...</p>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}

type Mode = "link" | "create";

interface Props {
  queueItem: QueueItem;
  onClose: () => void;
}

export function NewDealCustomerLinkModal({ queueItem, onClose }: Props) {
  const navigate = useNavigate();
  const {
    sessionCustomers,
    addSessionCustomer,
    applyQueueItemOverride,
    startIngestionSession,
  } = useIngestContext();
  const extracted = getExtractedForQueueItem(queueItem);
  const workflowVariant = getCustomerLinkWorkflowVariant(queueItem);

  const siteCustomers = useMemo(() => {
    const byId = new Map(seedCustomers.map((c) => [c.id, c]));
    customerLinkSearchSeedCustomers.forEach((c) => byId.set(c.id, c));
    sessionCustomers.forEach((c) => byId.set(c.id, c));
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [sessionCustomers]);

  const [mode, setMode] = useState<Mode>("link");
  const [search, setSearch] = useState("");
  const [linkedCustomerId, setLinkedCustomerId] = useState("");
  const initialExtractedSummary = useMemo(
    () => getExtractedCustomerSummary(extracted, queueItem),
    [extracted, queueItem],
  );

  const [createForm, setCreateForm] = useState<CreateCustomerFormState>(() =>
    buildInitialCreateCustomerForm({
      company: initialExtractedSummary.company,
      billingLegalEntity: extracted?.customerLegalEntity ?? queueItem.customerName,
      domain: suggestDomainFromCompanyName(initialExtractedSummary.company),
      contactName: initialExtractedSummary.contactName,
      contactEmail: initialExtractedSummary.contactEmail,
    }),
  );

  const extractedSummary = useMemo(
    () =>
      getExtractedCustomerSummary(
        extracted,
        queueItem,
        mode === "create"
          ? {
              company: createForm.company,
              domain: suggestDomainFromCompanyName(createForm.company),
            }
          : undefined,
      ),
    [extracted, queueItem, mode, createForm.company],
  );

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return siteCustomers;
    return siteCustomers.filter((c) => {
      const haystack = [
        c.name,
        c.billingLegalEntity,
        c.domain,
        c.region,
        c.id,
        c.crmAccountId ?? "",
        c.csm,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, siteCustomers]);

  const createComplete = isCreateCustomerFormComplete(createForm);

  const linkedCustomer = useMemo(
    () => (linkedCustomerId ? siteCustomers.find((c) => c.id === linkedCustomerId) : undefined),
    [linkedCustomerId, siteCustomers],
  );

  const canContinue = mode === "link" ? Boolean(linkedCustomerId) : createComplete;
  const isLinkedInLinkMode = mode === "link" && !!linkedCustomer;

  const panelScrollRef = useRef<HTMLDivElement>(null);
  const compactSentinelRef = useRef<HTMLDivElement>(null);
  const [isPanelCompact, setIsPanelCompact] = useState(false);

  useEffect(() => {
    const root = panelScrollRef.current;
    const sentinel = compactSentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsPanelCompact(!entry.isIntersecting),
      { root, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [mode]);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [handleEscape]);

  function handleContinue() {
    if (!canContinue || !queueItem.sampleId) return;

    const sampleId = queueItem.sampleId as "sample2" | "sample3" | "sample4" | "sample5";

    if (mode === "link") {
      const linked = siteCustomers.find((c) => c.id === linkedCustomerId);
      if (!linked) return;
      startIngestionSession(queueItem.id, linked.id, sampleId, "matched");
      applyQueueItemOverride(queueItem.id, { status: "In Progress", customerId: linked.id });
      onClose();
      openQueueIngestionTab(linked.id, queueItem.id, navigate);
    } else {
      const created: Customer = buildZenithSessionCustomer(toSessionCustomerInput(createForm));
      addSessionCustomer(created);
      startIngestionSession(queueItem.id, created.id, sampleId, "created");
      applyQueueItemOverride(queueItem.id, { status: "In Progress", customerId: created.id });
      onClose();
      openQueueIngestionTab(created.id, queueItem.id, navigate);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-gray-100"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-deal-customer-link-title"
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border-default bg-white px-6 py-3">
        <h2
          id="new-deal-customer-link-title"
          className="min-w-0 font-sora text-[15px] font-bold text-text-primary"
        >
          Confirm customer to ingest contract
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border-default px-4 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={handleContinue}
            className={cn(
              "rounded-md px-4 py-1.5 text-[13px] font-semibold text-white transition-colors",
              canContinue
                ? "bg-blue-600 hover:bg-blue-700"
                : "cursor-not-allowed bg-blue-300",
            )}
          >
            Continue to ingest
          </button>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary"
            aria-label="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[2fr_3fr] overflow-hidden">
        <aside className="flex min-h-0 flex-col overflow-hidden border-r border-border-default bg-[#F3F4F6]">
          <div className="flex h-full min-h-0 flex-1 flex-col">
            <DocumentPreviewPane
              documentTitle={queueItem.documentName}
              extracted={extracted}
              queueItem={queueItem}
            />
          </div>
        </aside>

        <div className="flex min-h-0 flex-col overflow-hidden bg-gray-100">
          {workflowVariant === "match_first" ? (
            <NewDealCustomerLinkMatchFirstPanel
              queueItem={queueItem}
              extracted={extracted}
              siteCustomers={siteCustomers}
              extractedSummary={extractedSummary}
              mode={mode}
              onModeChange={setMode}
              search={search}
              onSearchChange={setSearch}
              linkedCustomerId={linkedCustomerId}
              onLinkedCustomerIdChange={setLinkedCustomerId}
              createForm={createForm}
              onCreateFormChange={setCreateForm}
            />
          ) : (
          <div
            ref={panelScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6"
          >
            <section className="pt-6 pb-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[13px] font-semibold text-text-primary">
                  Extracted customer details
                </h3>
                {isLinkedInLinkMode ? (
                  <span
                    role="status"
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium leading-4 text-emerald-700"
                    title={`Linked to ${linkedCustomer.name}`}
                  >
                    <CircleCheck size={12} strokeWidth={2} className="shrink-0 text-emerald-600" aria-hidden />
                    Completed
                    <span className="sr-only">Linked to {linkedCustomer.name}</span>
                  </span>
                ) : (
                  <span
                    role="status"
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-medium leading-4 text-red-700"
                  >
                    <Info size={12} strokeWidth={2} className="shrink-0 text-red-600" aria-hidden />
                    No match found — link or create customer
                  </span>
                )}
              </div>
              {isLinkedInLinkMode ? (
                <div className="mt-2 flex w-fit max-w-full flex-wrap items-center gap-3">
                  <ExtractedCustomerDetailsCard
                    summary={extractedSummary}
                    linked
                    className={cn(CUSTOMER_LINK_CARD_WIDTH_CLASS, "bg-white")}
                  />
                  <Link2
                    size={18}
                    strokeWidth={2}
                    className="shrink-0 text-emerald-600"
                    aria-hidden
                  />
                  <LinkedCustomerDetailsCard customer={linkedCustomer} />
                </div>
              ) : (
                <ExtractedCustomerDetailsCard
                  summary={extractedSummary}
                  needsAction={mode === "create" || !linkedCustomerId}
                  className="mt-2 w-fit max-w-full bg-white"
                />
              )}
            </section>

            <div
              role="tablist"
              aria-label="How to resolve customer"
              className="inline-flex w-fit max-w-full rounded-xl border border-border-default bg-white p-1 shadow-sm"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "link"}
                onClick={() => setMode("link")}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-200",
                  mode === "link"
                    ? "bg-blue-600 text-white shadow-[0_2px_8px_-2px_rgba(37,99,235,0.45)]"
                    : "text-text-secondary hover:bg-gray-50 hover:text-text-primary",
                )}
              >
                <Link2 size={14} strokeWidth={2} aria-hidden />
                Link to existing
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "create"}
                onClick={() => {
                  setMode("create");
                  setLinkedCustomerId("");
                }}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-200",
                  mode === "create"
                    ? "bg-blue-600 text-white shadow-[0_2px_8px_-2px_rgba(37,99,235,0.45)]"
                    : "text-text-secondary hover:bg-gray-50 hover:text-text-primary",
                )}
              >
                <UserPlus size={14} strokeWidth={2} aria-hidden />
                Create new customer
              </button>
            </div>

            <div ref={compactSentinelRef} className="pointer-events-none h-px w-full" aria-hidden />

            <div
              className={cn(
                "sticky top-0 z-10 -mx-6 bg-gray-100 px-6",
                isPanelCompact && "border-b border-border-default shadow-sm",
              )}
            >
              {isPanelCompact ? (
                <CustomerLinkCondensedStrip
                  summary={extractedSummary}
                  linkedCustomer={mode === "link" ? linkedCustomer : undefined}
                  className="-mx-6 px-6"
                />
              ) : null}
              {mode === "link" ? (
                <CustomerLinkSearchBar
                  search={search}
                  onSearchChange={setSearch}
                  selectedCustomerId={linkedCustomerId}
                  selectedCustomerName={linkedCustomer?.name}
                  onClearSelection={() => setLinkedCustomerId("")}
                  customersCount={filteredCustomers.length}
                  className={isPanelCompact ? "py-2.5" : "pb-0 pt-4"}
                />
              ) : null}
            </div>

            <div className={cn("pb-6", mode === "link" ? "mt-4" : isPanelCompact ? "mt-3" : "mt-4")}>
              {mode === "link" ? (
                <CustomerLinkCustomerTable
                  customers={filteredCustomers}
                  selectedCustomerId={linkedCustomerId}
                  onSelectCustomer={setLinkedCustomerId}
                />
              ) : (
                <CreateCustomerForm value={createForm} onChange={setCreateForm} />
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
