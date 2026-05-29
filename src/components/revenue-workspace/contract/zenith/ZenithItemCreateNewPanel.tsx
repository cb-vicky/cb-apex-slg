import { useState } from "react";
import { Package } from "lucide-react";
import { formInputClass } from "@/components/ui/form-field";
import {
  itemTypeFromFrequency,
  suggestSkuFromProductName,
} from "@/data/zenith-catalog-items";
import type { ZenithSummaryLineItem } from "@/data/zenith-contract-summary";
import { cn } from "@/lib/utils";

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function ExtractedItemSummary({ item }: { item: ZenithSummaryLineItem }) {
  return (
    <div className="w-fit max-w-full rounded-lg border border-border-default bg-gray-100 px-3 py-2">
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        From contract
      </p>
      <ul className="flex flex-col gap-1">
        <li className="flex items-center gap-2.5">
          <Package size={14} strokeWidth={1.75} className="shrink-0 text-text-muted" />
          <span className="text-[13px] font-semibold text-text-primary">{item.name}</span>
        </li>
        <li className="pl-[22px] text-[12px] text-text-secondary">
          {item.frequency} · {formatMoney(item.unitPrice)} unit price · Qty {item.quantity}
        </li>
      </ul>
    </div>
  );
}

export type ZenithCreateItemPayload = {
  name: string;
  sku: string;
  itemType: "Recurring" | "One-time" | "Usage";
  billingFrequency: string;
  unitPrice: number;
};

interface Props {
  embedded?: boolean;
  extractedItem: ZenithSummaryLineItem;
  /** When false, omits the contract extract summary (e.g. manual add row). */
  showExtractedSummary?: boolean;
  onCreate?: (payload: ZenithCreateItemPayload) => void;
}

export function ZenithItemCreateNewPanel({
  embedded = false,
  extractedItem,
  showExtractedSummary = true,
  onCreate,
}: Props) {
  const [form, setForm] = useState(() => ({
    name: extractedItem.name,
    sku: suggestSkuFromProductName(extractedItem.name),
    itemType: itemTypeFromFrequency(extractedItem.frequency),
    billingFrequency: extractedItem.frequency,
    unitPrice: String(extractedItem.unitPrice),
  }));

  const complete =
    form.name.trim().length > 0 &&
    form.sku.trim().length > 0 &&
    form.billingFrequency.trim().length > 0 &&
    form.unitPrice.trim().length > 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        embedded ? "py-0" : "bg-gray-50/80 px-3 py-3",
      )}
    >
      <p className="text-[12px] text-text-muted">
        {showExtractedSummary
          ? "Review extracted details and create a new catalog item in your site."
          : "Create a new catalog item in your site and add it to this contract."}
      </p>

      {showExtractedSummary ? <ExtractedItemSummary item={extractedItem} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-[12px] font-medium text-text-secondary">Product name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className={cn(formInputClass, "h-8 text-[13px]")}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-text-secondary">SKU</span>
          <input
            type="text"
            value={form.sku}
            onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))}
            className={cn(formInputClass, "h-8 font-mono text-[13px]")}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-text-secondary">Item type</span>
          <select
            value={form.itemType}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                itemType: e.target.value as "Recurring" | "One-time" | "Usage",
              }))
            }
            className={cn(formInputClass, "h-8 text-[13px]")}
          >
            <option value="Recurring">Recurring</option>
            <option value="One-time">One-time</option>
            <option value="Usage">Usage</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-text-secondary">Billing frequency</span>
          <input
            type="text"
            value={form.billingFrequency}
            onChange={(e) => setForm((prev) => ({ ...prev, billingFrequency: e.target.value }))}
            className={cn(formInputClass, "h-8 text-[13px]")}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-text-secondary">Unit price (USD)</span>
          <input
            type="text"
            inputMode="decimal"
            value={form.unitPrice}
            onChange={(e) => setForm((prev) => ({ ...prev, unitPrice: e.target.value }))}
            className={cn(formInputClass, "h-8 text-[13px]")}
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!complete}
          onClick={() => {
            const unitPrice = Number.parseFloat(form.unitPrice.replace(/,/g, "")) || 0;
            onCreate?.({
              name: form.name.trim(),
              sku: form.sku.trim(),
              itemType: form.itemType,
              billingFrequency: form.billingFrequency.trim(),
              unitPrice,
            });
          }}
          className={cn(
            "inline-flex h-7 items-center rounded-full px-3 text-[11px] font-semibold transition-colors",
            complete
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "cursor-not-allowed bg-blue-300 text-white",
          )}
        >
          Create item
        </button>
      </div>
    </div>
  );
}
