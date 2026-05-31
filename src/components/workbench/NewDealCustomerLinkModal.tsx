import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, CircleCheck, Info, Link2, UserPlus } from "lucide-react";
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
import type { Contract, Customer } from "@/data/mock-data";
import { customers as seedCustomers, getContractsForCustomer } from "@/data/mock-data";
import { customerLinkSearchSeedCustomers } from "@/data/customer-link-search-seed";
import type { QueueItem } from "@/data/queue-data";
import { buildZenithSessionCustomer } from "@/data/zenith-ingest-session";
import {
  ZENITH_ACTIVE_CONTRACT_ID,
  ZENITH_ANALYTICS_INC_ID,
} from "@/data/zenith-analytics-inc-seed";
import { useIngestContext } from "@/context/IngestContext";
import {
  getExtractedCustomerSummary,
  getExtractedForQueueItem,
  openQueueIngestDrawer,
  suggestDomainFromCompanyName,
} from "@/lib/new-deal-customer-link";
import { FileText } from "lucide-react";

function DocumentPreviewPane({ documentTitle }: { documentTitle: string }) {
  return (
    <div className="flex h-full flex-col bg-[#F3F4F6]">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-xl border border-border-default bg-white p-8 shadow-sm">
          <FileText size={48} className="mx-auto mb-4 text-text-muted" />
          <p className="font-medium text-text-primary">{documentTitle}</p>
          <p className="mt-1 text-[12px] text-text-muted">Contract document preview</p>
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
  const { sessionCustomers, sessionContracts, addSessionCustomer, applyQueueItemOverride } = useIngestContext();
  const extracted = getExtractedForQueueItem(queueItem);

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

  function resolveDestinationContractId(customerId: string): string | undefined {
    const fromRow = queueItem.contractId ?? queueItem.activeContractId;
    if (fromRow) return fromRow;
    if (customerId === ZENITH_ANALYTICS_INC_ID) return ZENITH_ACTIVE_CONTRACT_ID;
    const seed = getContractsForCustomer(customerId);
    const extra = sessionContracts.filter((c) => c.customerId === customerId);
    const merged: Contract[] = [...extra, ...seed.filter((s) => !extra.some((e) => e.id === s.id))];
    if (merged.length === 0) return undefined;
    const rank = (status: Contract["status"]) => {
      if (status === "Active") return 0;
      if (status === "Extended") return 1;
      if (status === "Closing") return 2;
      if (status === "Scheduled") return 3;
      return 4;
    };
    return [...merged]
      .sort(
        (a, b) =>
          rank(a.status) - rank(b.status) ||
          new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime(),
      )[0]?.id;
  }

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
    if (!canContinue) return;

    if (mode === "link") {
      const linked = siteCustomers.find((c) => c.id === linkedCustomerId);
      if (!linked) return;
      applyQueueItemOverride(queueItem.id, { customerId: linked.id });
      onClose();
      openQueueIngestDrawer(queueItem, linked.id, navigate, resolveDestinationContractId(linked.id));
    } else {
      const created: Customer = buildZenithSessionCustomer(toSessionCustomerInput(createForm));
      addSessionCustomer(created);
      applyQueueItemOverride(queueItem.id, { customerId: created.id });
      onClose();
      openQueueIngestDrawer(queueItem, created.id, navigate, resolveDestinationContractId(created.id));
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-gray-100"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-deal-customer-link-title"
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border-default bg-white px-6 py-4">
        <h2
          id="new-deal-customer-link-title"
          className="min-w-0 font-sora text-[15px] font-bold text-text-primary"
        >
          Confirm customer to ingest contract
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary"
          aria-label="Close"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[2fr_3fr] overflow-hidden">
        <aside className="flex min-h-0 flex-col overflow-hidden border-r border-border-default bg-[#F3F4F6]">
          <div className="flex h-full min-h-0 flex-1 flex-col">
            <DocumentPreviewPane documentTitle={queueItem.documentName} />
          </div>
        </aside>

        <div className="flex min-h-0 flex-col overflow-hidden bg-gray-100">
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
        </div>
      </div>

      <footer className="flex shrink-0 justify-end gap-2 border-t border-border-default bg-white px-6 py-4">
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
      </footer>
    </div>
  );
}
