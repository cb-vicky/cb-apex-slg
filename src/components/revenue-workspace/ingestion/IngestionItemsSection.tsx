import { useState } from "react";
import { CheckCircle2, AlertCircle, ExternalLink, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtractedContract } from "@/data/ingest-data";
import type { IngestionSectionState } from "@/context/ingest-context-core";

interface Props {
  extracted: ExtractedContract;
  sectionState: IngestionSectionState;
  onMarkDone: () => void;
}

const CATALOG_ITEMS = [
  { id: "apex-platform", name: "Apex Platform", sku: "APEX-PLATFORM", type: "Recurring", price: 1200, status: "Active" },
  { id: "growth-crm-yr", name: "Growth CRM", sku: "GROWTH-CRM-YR", type: "Recurring", price: 1200, status: "Active" },
  { id: "growth-crm-mo", name: "Growth CRM", sku: "GROWTH-CRM-MO", type: "Recurring", price: 110, status: "Active" },
  { id: "onboarding-pkg", name: "Onboarding Package", sku: "ONBOARDING-PKG", type: "One-time", price: 2500, status: "Active" },
  { id: "support-premium", name: "Premium Support", sku: "SUPPORT-PREMIUM", type: "Recurring", price: 4200, status: "Active" },
  { id: "ai-credits", name: "AI Agent Credits", sku: "APEX-AI-CREDITS", type: "Prepaid", price: 0.015, status: "Active" },
  { id: "apex-support", name: "Premium Support – 24/7", sku: "APEX-SUPPORT", type: "Recurring", price: 2500, status: "Active" },
  { id: "analytics-pro", name: "Apex Analytics Pro", sku: "APEX-ANALYTICS-PRO", type: "Recurring", price: 65, status: "Active" },
  { id: "data-export", name: "Data Export Module", sku: "DATA-EXPORT", type: "One-time", price: 1500, status: "Active" },
  { id: "sso-addon", name: "SSO Add-on", sku: "SSO-ADDON", type: "Recurring", price: 500, status: "Active" },
];

export function IngestionItemsSection({ extracted, sectionState, onMarkDone }: Props) {
  const { products } = extracted;
  const unmappedItems = products.filter((p) => !p.matched);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [mappings, setMappings] = useState<Record<string, string>>({});

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const filteredCatalog = searchQuery.trim()
    ? CATALOG_ITEMS.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : CATALOG_ITEMS;

  function toggleExpand(sku: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  }

  function handleMap(extractedSku: string, catalogSku: string) {
    setMappings((prev) => ({ ...prev, [extractedSku]: catalogSku }));
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      {sectionState === "issues" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertCircle size={16} className="text-amber-600" />
            <span>
              We couldn't find a match for {unmappedItems.length} item{unmappedItems.length !== 1 && "s"}.{" "}
              <span className="font-medium">Map them with existing items or create new with extracted data</span>
            </span>
          </div>
          <button
            onClick={onMarkDone}
            disabled={unmappedItems.some((i) => !mappings[i.extractedSku])}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              unmappedItems.some((i) => !mappings[i.extractedSku])
                ? "cursor-not-allowed text-amber-400"
                : "text-amber-700 hover:bg-amber-100"
            )}
          >
            Mark as done
          </button>
        </div>
      )}

      {sectionState === "review" && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <CheckCircle2 size={16} className="text-blue-600" />
            <span>All items are matched. Review and confirm.</span>
          </div>
          <button
            onClick={onMarkDone}
            className="rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
          >
            Mark as done
          </button>
        </div>
      )}

      {sectionState === "done" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Items reviewed and mapped</span>
        </div>
      )}

      {/* Catalog search + mapping panel */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <p className="text-sm text-text-secondary">
          Search your Chargebee catalog and map to an existing item.
        </p>

        <div className="relative mt-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, SKU, or type"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border-default bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-text-muted">
            {filteredCatalog.length} items in your catalog
          </span>
          <button className="text-xs text-blue-600 hover:underline">Expand for details</button>
        </div>

        <div className="mt-3 space-y-2">
          {filteredCatalog.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border-default px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{item.name}</span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                      {item.status}
                    </span>
                    <ExternalLink size={12} className="text-text-muted" />
                  </div>
                  <div className="mt-0.5 text-xs text-text-muted">
                    {item.sku} · {item.type} · {formatCurrency(item.price)}
                  </div>
                </div>
              </div>
              <ChevronDown size={16} className="text-text-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Extracted items that need mapping */}
      {unmappedItems.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h4 className="text-sm font-medium text-red-800">Items needing mapping</h4>
          <div className="mt-3 space-y-2">
            {unmappedItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-red-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-red-500" />
                    <span className="font-medium text-text-primary">{item.extractedName}</span>
                  </div>
                  <button
                    onClick={() => toggleExpand(item.extractedSku)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {expandedItems.has(item.extractedSku) ? "Hide" : "Show"} catalog options
                  </button>
                </div>
                <div className="mt-1 text-xs text-text-muted">
                  Extracted SKU: {item.extractedSku} · {item.billingModel} · {formatCurrency(item.unitPrice)}
                </div>
                {mappings[item.extractedSku] && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle2 size={12} />
                    <span>Mapped to: {mappings[item.extractedSku]}</span>
                  </div>
                )}
                {expandedItems.has(item.extractedSku) && (
                  <div className="mt-3 border-t border-border-default pt-3">
                    <div className="text-xs font-medium text-text-muted mb-2">Select a catalog item to map:</div>
                    <div className="space-y-1.5 max-h-[200px] overflow-auto">
                      {CATALOG_ITEMS.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleMap(item.extractedSku, cat.sku)}
                          className={cn(
                            "w-full rounded-md border px-3 py-2 text-left text-xs transition-colors",
                            mappings[item.extractedSku] === cat.sku
                              ? "border-blue-500 bg-blue-50"
                              : "border-border-default hover:bg-gray-50"
                          )}
                        >
                          <div className="font-medium">{cat.name}</div>
                          <div className="text-text-muted">{cat.sku}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matched items summary */}
      {products.filter((p) => p.matched).length > 0 && (
        <div className="rounded-xl border border-border-default bg-white p-5">
          <h4 className="text-sm font-medium text-text-primary">Matched items</h4>
          <div className="mt-3 space-y-2">
            {products
              .filter((p) => p.matched)
              .map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3"
                >
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-800">{item.extractedName}</span>
                  <span className="text-xs text-emerald-600">→ {item.catalogSku}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
