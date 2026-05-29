import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Check, Info, Link2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formInputClass } from "@/components/ui/form-field";
import { CustomerLinkSearchResults } from "@/components/workbench/CustomerLinkSearchResults";
import { ExtractedCustomerDetailsCard } from "@/components/workbench/ExtractedCustomerDetailsCard";
import { defaultCustomerSearchTerm } from "@/lib/customer-search-default";
import type { Contract, Customer } from "@/data/mock-data";
import { customers as seedCustomers, getContractsForCustomer } from "@/data/mock-data";
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
    sessionCustomers.forEach((c) => byId.set(c.id, c));
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [sessionCustomers]);

  const [mode, setMode] = useState<Mode>("link");
  const [search, setSearch] = useState(() =>
    defaultCustomerSearchTerm(extracted?.customerName ?? queueItem.customerName),
  );
  const [linkedCustomerId, setLinkedCustomerId] = useState("");
  const [createForm, setCreateForm] = useState(() => ({
    name: extracted?.customerName ?? queueItem.customerName,
    billingLegalEntity: extracted?.customerLegalEntity ?? queueItem.customerName,
    domain: suggestDomainFromCompanyName(extracted?.customerName ?? queueItem.customerName),
  }));

  const extractedSummary = useMemo(
    () =>
      getExtractedCustomerSummary(
        extracted,
        queueItem,
        mode === "create"
          ? { company: createForm.name, domain: createForm.domain }
          : undefined,
      ),
    [extracted, queueItem, mode, createForm.name, createForm.domain],
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

  const createComplete =
    createForm.name.trim().length > 0 &&
    createForm.billingLegalEntity.trim().length > 0 &&
    createForm.domain.trim().length > 0;

  const linkedCustomer = useMemo(
    () => (linkedCustomerId ? siteCustomers.find((c) => c.id === linkedCustomerId) : undefined),
    [linkedCustomerId, siteCustomers],
  );

  const canContinue = mode === "link" ? Boolean(linkedCustomerId) : createComplete;

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

  function handleContinue() {
    if (!canContinue) return;

    if (mode === "link") {
      const linked = siteCustomers.find((c) => c.id === linkedCustomerId);
      if (!linked) return;
      applyQueueItemOverride(queueItem.id, { customerId: linked.id });
      onClose();
      openQueueIngestDrawer(queueItem, linked.id, navigate, resolveDestinationContractId(linked.id));
    } else {
      const created: Customer = buildZenithSessionCustomer({
        name: createForm.name.trim(),
        billingLegalEntity: createForm.billingLegalEntity.trim(),
        domain: createForm.domain.trim(),
      });
      addSessionCustomer(created);
      applyQueueItemOverride(queueItem.id, { customerId: created.id });
      onClose();
      openQueueIngestDrawer(queueItem, created.id, navigate, resolveDestinationContractId(created.id));
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-deal-customer-link-title"
        className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-[560px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-4">
          <h2
            id="new-deal-customer-link-title"
            className="min-w-0 text-[15px] font-bold text-text-primary"
          >
            Customer details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-5">
            <ExtractedCustomerDetailsCard summary={extractedSummary} className="w-fit max-w-[280px]" />
            {linkedCustomer ? (
              <div
                role="status"
                className="mt-3 flex w-full items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2"
              >
                <Check size={14} strokeWidth={2.5} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden />
                <p className="text-[12px] leading-snug text-emerald-800">
                  Linked to existing customer{" "}
                  <span className="font-semibold">{linkedCustomer.name}</span>
                </p>
              </div>
            ) : (
              <div
                role="status"
                className="mt-3 flex w-full items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2"
              >
                <Info size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-red-600" aria-hidden />
                <p className="text-[12px] leading-snug text-red-700">
                  We couldn&apos;t find a match for this customer. Link to an existing customer or create
                  a new one.
                </p>
              </div>
            )}

            <div
              role="tablist"
              aria-label="How to resolve customer"
              className="mt-4 flex rounded-lg border border-border-default bg-gray-100 p-0.5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "link"}
                onClick={() => setMode("link")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                  mode === "link"
                    ? "bg-white text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary",
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
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                  mode === "create"
                    ? "bg-white text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                <UserPlus size={14} strokeWidth={2} aria-hidden />
                Create new customer
              </button>
            </div>

            {mode === "link" ? (
              <div className="mt-4">
                <CustomerLinkSearchResults
                  customers={filteredCustomers}
                  search={search}
                  onSearchChange={setSearch}
                  selectedCustomerId={linkedCustomerId}
                  onSelectCustomer={setLinkedCustomerId}
                />
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-medium text-text-secondary">Company name</span>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                    className={formInputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-medium text-text-secondary">
                    Billing legal entity
                  </span>
                  <input
                    type="text"
                    value={createForm.billingLegalEntity}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, billingLegalEntity: e.target.value }))
                    }
                    className={formInputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-medium text-text-secondary">Primary domain</span>
                  <input
                    type="text"
                    placeholder="e.g. zenithanalytics.com"
                    value={createForm.domain}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, domain: e.target.value }))}
                    className={formInputClass}
                  />
                </label>
              </div>
            )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border-default px-6 py-3">
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
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
