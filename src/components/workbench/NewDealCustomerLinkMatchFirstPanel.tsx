import { useEffect, useMemo, useRef, useState } from "react";
import { CircleCheck, Link2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/data/mock-data";
import type { ExtractedContract } from "@/data/ingest-data";
import type { QueueItem } from "@/data/queue-data";
import type { ExtractedCustomerSummary } from "@/lib/new-deal-customer-link";
import {
  buildMatchFoundCustomerList,
  buildSimilarCustomerBrowseList,
  rankCustomersForMatchBrowse,
  suggestClosestCustomerMatch,
} from "@/lib/new-deal-customer-link-workflow";
import { ExtractedCustomerDetailsCard } from "./ExtractedCustomerDetailsCard";
import { LinkedCustomerDetailsCard, CUSTOMER_LINK_CARD_WIDTH_CLASS } from "./LinkedCustomerDetailsCard";
import { CustomerClosestMatchPanel } from "./CustomerClosestMatchPanel";
import { CustomerLinkCondensedStrip } from "./CustomerLinkCondensedStrip";
import {
  CustomerLinkCustomerTable,
  CustomerLinkSearchBar,
} from "./CustomerLinkSearchResults";
import { CreateCustomerForm } from "./CreateCustomerForm";
import type { CreateCustomerFormState } from "./create-customer-form";

type Mode = "link" | "create";
type MatchPhase = "closest" | "browse";
type CustomerListScope = "similar" | "all";

function filterCustomersBySearch(customers: Customer[], search: string): Customer[] {
  const q = search.trim().toLowerCase();
  if (!q) return customers;
  return customers.filter((c) => {
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
}

interface Props {
  queueItem: QueueItem;
  extracted: ExtractedContract | null;
  siteCustomers: Customer[];
  extractedSummary: ExtractedCustomerSummary;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  search: string;
  onSearchChange: (value: string) => void;
  linkedCustomerId: string;
  onLinkedCustomerIdChange: (id: string) => void;
  createForm: CreateCustomerFormState;
  onCreateFormChange: (next: CreateCustomerFormState) => void;
}

export function NewDealCustomerLinkMatchFirstPanel({
  queueItem,
  extracted,
  siteCustomers,
  extractedSummary,
  mode,
  onModeChange,
  search,
  onSearchChange,
  linkedCustomerId,
  onLinkedCustomerIdChange,
  createForm,
  onCreateFormChange,
}: Props) {
  const closestMatch = useMemo(
    () => suggestClosestCustomerMatch(queueItem, extracted, siteCustomers),
    [queueItem, extracted, siteCustomers],
  );

  const [matchPhase, setMatchPhase] = useState<MatchPhase>("closest");
  const [customerListScope, setCustomerListScope] = useState<CustomerListScope>("similar");
  const [closestMatchRejected, setClosestMatchRejected] = useState(false);
  const [aiSuggestedCustomerId, setAiSuggestedCustomerId] = useState<string | null>(
    () => closestMatch?.id ?? null,
  );

  const panelScrollRef = useRef<HTMLDivElement>(null);
  const compactSentinelRef = useRef<HTMLDivElement>(null);
  const [isPanelCompact, setIsPanelCompact] = useState(false);

  useEffect(() => {
    if (closestMatch?.id) setAiSuggestedCustomerId(closestMatch.id);
  }, [closestMatch?.id]);

  useEffect(() => {
    const root = panelScrollRef.current;
    const sentinel = compactSentinelRef.current;
    if (!root || !sentinel || matchPhase !== "browse") return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsPanelCompact(!entry.isIntersecting),
      { root, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [matchPhase, mode]);

  const linkedCustomer = useMemo(
    () => (linkedCustomerId ? siteCustomers.find((c) => c.id === linkedCustomerId) : undefined),
    [linkedCustomerId, siteCustomers],
  );

  const matchFoundList = useMemo(
    () => buildMatchFoundCustomerList(queueItem, extracted, siteCustomers),
    [queueItem, extracted, siteCustomers],
  );

  const isLinked = Boolean(linkedCustomer);
  const showClosestBanner = matchPhase === "closest" && matchFoundList.length > 0;
  const showBrowseWorkspace = matchPhase === "browse";

  const similarBrowseList = useMemo(
    () =>
      buildSimilarCustomerBrowseList(
        queueItem,
        extracted,
        siteCustomers,
        aiSuggestedCustomerId,
      ),
    [queueItem, extracted, siteCustomers, aiSuggestedCustomerId],
  );

  const similarMatchCustomerIds = useMemo(
    () => similarBrowseList.slice(1).map((c) => c.id),
    [similarBrowseList],
  );

  const allBrowseCustomers = useMemo(() => {
    const similarIds = new Set(similarBrowseList.map((c) => c.id));
    const others = rankCustomersForMatchBrowse(
      queueItem,
      extracted,
      siteCustomers,
      aiSuggestedCustomerId,
    ).filter((c) => !similarIds.has(c.id));
    return [...similarBrowseList, ...others];
  }, [queueItem, extracted, siteCustomers, aiSuggestedCustomerId, similarBrowseList]);

  const browseCustomers = useMemo(() => {
    if (matchPhase !== "browse") return [];
    const base =
      customerListScope === "similar" ? similarBrowseList : allBrowseCustomers;
    return filterCustomersBySearch(base, search);
  }, [matchPhase, customerListScope, similarBrowseList, allBrowseCustomers, search]);

  const showSimilarMatchLabels = matchPhase === "browse";
  const hasMatchSelection = matchPhase === "closest" && Boolean(linkedCustomerId);

  function enterBrowseMode(scope: CustomerListScope = "similar") {
    setMatchPhase("browse");
    setCustomerListScope(scope);
    onModeChange("link");
  }

  function handleViewAllCustomers() {
    setClosestMatchRejected(true);
    enterBrowseMode("all");
  }

  function handleSelectCustomer(customerId: string) {
    onLinkedCustomerIdChange(linkedCustomerId === customerId ? "" : customerId);
  }

  return (
    <div
      ref={panelScrollRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6"
    >
      <section className="pt-6 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[13px] font-semibold text-text-primary">Extracted customer details</h3>
          {hasMatchSelection ? (
            <span
              role="status"
              className={cn(
                "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium leading-4 text-emerald-700",
                "motion-safe:animate-customer-link-ready-pill-in motion-reduce:animate-none motion-reduce:opacity-100",
              )}
            >
              <CircleCheck size={12} strokeWidth={2} className="shrink-0 text-emerald-600" aria-hidden />
              Ready
            </span>
          ) : null}
        </div>
        {isLinked && linkedCustomer && matchPhase === "browse" ? (
          <div className="mt-2 flex w-fit max-w-full flex-wrap items-center gap-3">
            <ExtractedCustomerDetailsCard
              summary={extractedSummary}
              linked
              className={cn(CUSTOMER_LINK_CARD_WIDTH_CLASS, "bg-white")}
            />
            <Link2 size={18} strokeWidth={2} className="shrink-0 text-emerald-600" aria-hidden />
            <LinkedCustomerDetailsCard customer={linkedCustomer} />
          </div>
        ) : (
          <ExtractedCustomerDetailsCard
            summary={extractedSummary}
            className="mt-2 w-fit max-w-full bg-white"
          />
        )}
      </section>

      {showClosestBanner ? (
        <div className="pb-6">
          <CustomerClosestMatchPanel
            matches={matchFoundList}
            selectedCustomerId={linkedCustomerId}
            onSelectCustomer={handleSelectCustomer}
            onViewAllCustomers={handleViewAllCustomers}
          />
        </div>
      ) : showBrowseWorkspace ? (
        <>
          <div
            role="tablist"
            aria-label="How to resolve customer"
            className="inline-flex w-fit max-w-full rounded-xl border border-border-default bg-white p-1 shadow-sm"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "link"}
              onClick={() => onModeChange("link")}
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
                onModeChange("create");
                onLinkedCustomerIdChange("");
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
                onSearchChange={onSearchChange}
                selectedCustomerId={linkedCustomerId}
                selectedCustomerName={linkedCustomer?.name}
                onClearSelection={() => handleSelectCustomer("")}
                customersCount={browseCustomers.length}
                matchFirstBrowseMeta={
                  matchPhase === "browse"
                    ? {
                        similarCustomersCount: similarBrowseList.length,
                        showAllCustomers: customerListScope === "all",
                        onViewAllCustomers: () => setCustomerListScope("all"),
                      }
                    : undefined
                }
                className={isPanelCompact ? "py-2.5" : "pb-0 pt-4"}
              />
            ) : null}
          </div>

          <div className={cn("pb-6", mode === "link" ? "mt-4" : isPanelCompact ? "mt-3" : "mt-4")}>
            {mode === "link" ? (
              browseCustomers.length === 0 ? (
                <div className="overflow-hidden rounded-lg border border-border-default bg-white px-4 py-4 text-center">
                  <p className="text-[13px] text-text-muted">
                    {customerListScope === "similar"
                      ? "No similar customers match your search."
                      : "No customers match your search."}
                  </p>
                </div>
              ) : (
                <CustomerLinkCustomerTable
                  customers={browseCustomers}
                  selectedCustomerId={linkedCustomerId}
                  onSelectCustomer={handleSelectCustomer}
                  closestMatchCustomerId={
                    showSimilarMatchLabels ? aiSuggestedCustomerId : null
                  }
                  highlightClosestMatchRow={
                    showSimilarMatchLabels && !closestMatchRejected
                  }
                  similarMatchCustomerIds={
                    showSimilarMatchLabels ? similarMatchCustomerIds : []
                  }
                />
              )
            ) : (
              <CreateCustomerForm value={createForm} onChange={onCreateFormChange} />
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
