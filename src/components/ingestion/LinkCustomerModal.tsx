import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Building2, CheckCircle2, Plus, ChevronDown, Search, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLinkCustomerModal } from "@/store/useLinkCustomerModalStore";
import { closeLinkCustomerModal } from "@/store/link-customer-modal-store";
import { useIngestContext } from "@/context/IngestContext";
import { customers, type Customer } from "@/data/mock-data";
import { getExtractedContract } from "@/data/ingest-data";

type Mode = "select" | "create";

export function LinkCustomerModal() {
  const { isOpen, queueItemId } = useLinkCustomerModal();
  const navigate = useNavigate();
  const {
    queueItems,
    sessionCustomers,
    addSessionCustomer,
    startIngestionSession,
    applyQueueItemOverride,
  } = useIngestContext();

  const queueItem = queueItems.find((q) => q.id === queueItemId);
  const sampleId = queueItem?.sampleId as "sample2" | "sample3" | "sample4" | undefined;
  const extracted = sampleId ? getExtractedContract(sampleId) : null;

  const [mode, setMode] = useState<Mode>("select");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    legalEntity: "",
    domain: "",
  });

  const allCustomers = useMemo(() => {
    const seedIds = new Set(customers.map((c) => c.id));
    const extras = sessionCustomers.filter((c) => !seedIds.has(c.id));
    return [...customers, ...extras];
  }, [sessionCustomers]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return allCustomers;
    const q = searchQuery.toLowerCase();
    return allCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.billingLegalEntity.toLowerCase().includes(q) ||
        c.domain.toLowerCase().includes(q)
    );
  }, [allCustomers, searchQuery]);

  const selectedCustomer = selectedCustomerId
    ? allCustomers.find((c) => c.id === selectedCustomerId)
    : null;

  const preselectedCustomer = useMemo(() => {
    if (!queueItem?.customerId) return null;
    return allCustomers.find((c) => c.id === queueItem.customerId) ?? null;
  }, [queueItem?.customerId, allCustomers]);

  useEffect(() => {
    if (preselectedCustomer) {
      setSelectedCustomerId(preselectedCustomer.id);
    }
  }, [preselectedCustomer]);

  function handleClose() {
    closeLinkCustomerModal();
    setMode("select");
    setSelectedCustomerId(null);
    setSearchQuery("");
    setNewCustomer({ name: "", legalEntity: "", domain: "" });
  }

  function handleConfirm() {
    if (!queueItemId || !sampleId) return;

    let customerId: string;
    let customerLink: "matched" | "created" = "matched";

    if (mode === "create") {
      customerId = `cust_${Date.now()}`;
      const newCust: Customer = {
        id: customerId,
        name: newCustomer.name || extracted?.customerName || "New Customer",
        commercialAccount: newCustomer.name || extracted?.customerName || "New Customer",
        billingLegalEntity: newCustomer.legalEntity || extracted?.customerLegalEntity || "",
        chargebeeEntity: "Chargebee Inc.",
        segment: "Growth",
        tier: "Professional",
        ae: "Jordan Kim",
        csm: "Priya Mehta",
        billingOwner: "Alex Nguyen",
        arr: 0,
        tcv: 0,
        prepaidCreditBalance: 0,
        prepaidCreditTotal: 0,
        openAr: 0,
        nextRenewalDate: "",
        riskBadges: [],
        createdAt: new Date().toISOString(),
        domain: newCustomer.domain || "",
        industry: "Technology",
        region: "Americas",
        crmAccountId: "",
        crmSyncStatus: "Not synced",
        crmLastSyncedAt: "",
        paymentMethod: "Invoice",
        currency: "USD",
        taxRegion: "US",
        poRequired: false,
        activeContractCount: 0,
        openQuoteCount: 0,
      };
      addSessionCustomer(newCust);
      customerLink = "created";
    } else {
      if (!selectedCustomerId) return;
      customerId = selectedCustomerId;
    }

    startIngestionSession(queueItemId, customerId, sampleId, customerLink);
    applyQueueItemOverride(queueItemId, { status: "In Progress", customerId });

    handleClose();
    navigate(`/customers/${customerId}?tab=ingestion&queueItemId=${queueItemId}`);
  }

  const canConfirm =
    mode === "create"
      ? newCustomer.name.trim().length > 0
      : selectedCustomerId !== null;

  if (!isOpen || !queueItem || !extracted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 w-[720px] rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-text-muted" />
              <span className="text-xs font-medium text-text-muted">{queueItem.id}</span>
              <span className="text-xs text-text-muted">·</span>
              <span className="text-xs text-text-muted">{extracted.documentName}</span>
            </div>
            <h2 className="mt-1 text-[17px] font-semibold text-text-primary">
              Confirm the customer to link this contract to
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Extracted customer card */}
          <div className="rounded-lg border border-border-default bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Extracted from document
            </div>
            <div className="mt-2 flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-white border border-border-default">
                <Building2 size={20} className="text-text-muted" />
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-semibold text-text-primary">
                  {extracted.customerName}
                </div>
                <div className="mt-0.5 text-sm text-text-secondary">
                  {extracted.customerLegalEntity}
                </div>
              </div>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => setMode("select")}
              className={cn(
                "flex-1 rounded-lg border px-4 py-3 text-left transition-all",
                mode === "select"
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                  : "border-border-default bg-white hover:border-gray-300"
              )}
            >
              <div className="text-sm font-medium text-text-primary">
                Link to existing customer
              </div>
              <div className="mt-0.5 text-xs text-text-muted">
                Search and select from your customer list
              </div>
            </button>
            <button
              onClick={() => setMode("create")}
              className={cn(
                "flex-1 rounded-lg border px-4 py-3 text-left transition-all",
                mode === "create"
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                  : "border-border-default bg-white hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                <Plus size={14} />
                Create new customer
              </div>
              <div className="mt-0.5 text-xs text-text-muted">
                Add a new customer to your account
              </div>
            </button>
          </div>

          {/* Content based on mode */}
          <div className="mt-5">
            {mode === "select" ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex w-full items-center justify-between rounded-lg border border-border-default bg-white px-4 py-3 text-left transition-colors hover:border-gray-300"
                >
                  {selectedCustomer ? (
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded bg-gray-100">
                        <Building2 size={16} className="text-text-muted" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {selectedCustomer.name}
                        </div>
                        <div className="text-xs text-text-muted">
                          {selectedCustomer.billingLegalEntity}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-text-muted">Select a customer…</span>
                  )}
                  <ChevronDown
                    size={16}
                    className={cn(
                      "text-text-muted transition-transform",
                      dropdownOpen && "rotate-180"
                    )}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 right-0 z-10 mt-1 max-h-[280px] overflow-hidden rounded-lg border border-border-default bg-white shadow-lg">
                    <div className="border-b border-border-default p-2">
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                        />
                        <input
                          type="text"
                          placeholder="Search customers…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full rounded-md border border-border-default bg-surface-muted py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-[220px] overflow-auto">
                      {filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setDropdownOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50",
                            selectedCustomerId === c.id && "bg-blue-50"
                          )}
                        >
                          <div className="flex size-8 items-center justify-center rounded bg-gray-100">
                            <Building2 size={16} className="text-text-muted" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-text-primary truncate">
                              {c.name}
                            </div>
                            <div className="text-xs text-text-muted truncate">
                              {c.billingLegalEntity} · {c.domain}
                            </div>
                          </div>
                          {selectedCustomerId === c.id && (
                            <CheckCircle2 size={16} className="shrink-0 text-blue-500" />
                          )}
                        </button>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <div className="px-4 py-6 text-center text-sm text-text-muted">
                          No customers found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    Customer name *
                  </label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder={extracted.customerName}
                    className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    Legal entity
                  </label>
                  <input
                    type="text"
                    value={newCustomer.legalEntity}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({ ...prev, legalEntity: e.target.value }))
                    }
                    placeholder={extracted.customerLegalEntity}
                    className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={newCustomer.domain}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({ ...prev, domain: e.target.value }))
                    }
                    placeholder="example.com"
                    className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border-default px-6 py-4">
          <button
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              canConfirm
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed bg-gray-100 text-gray-400"
            )}
          >
            Link & continue ingestion
          </button>
        </div>
      </div>
    </div>
  );
}
