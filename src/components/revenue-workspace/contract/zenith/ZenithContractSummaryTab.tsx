import type { MouseEvent, ReactNode } from "react";
import { CircleCheck, Maximize2 } from "lucide-react";
import { useZenithContractChrome, type ZenithContractChromeValue } from "./ZenithContractChromeContext";
import { areZenithContractItemsComplete } from "./zenith-contract-tab-status";
import type { ZenithContractContentTab } from "./zenith-contract-tabs";
import { ZenithContractSourceSnippet, type ZenithSnippetVariant } from "./ZenithContractSourceSnippet";
import {
  zenithSummaryAddressRows,
  zenithSummaryAddressesDescription,
  zenithSummaryBillingDescription,
  zenithSummaryBillingRows,
  zenithSummaryLineItems,
  zenithSummaryLineItemsDescription,
  zenithSummaryLineItemsNeedMappingCount,
  type ZenithSummaryKvRow,
  type ZenithSummaryLineItem,
} from "@/data/zenith-contract-summary";
import { cn } from "@/lib/utils";

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function SummarySectionReadyBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold leading-4 text-emerald-800">
      <CircleCheck size={12} strokeWidth={2.25} className="shrink-0 text-emerald-600" aria-hidden />
      Ready
    </span>
  );
}

function SectionNeedsMappingBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold leading-4 text-amber-800">
      {count} item{count === 1 ? "" : "s"} need mapping
    </span>
  );
}

function SectionHeading({
  title,
  description,
  ready,
  needsMappingCount,
}: {
  title: string;
  description: string;
  ready?: boolean;
  needsMappingCount?: number;
}) {
  return (
    <div className="max-w-3xl space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-sora text-[14px] font-bold leading-tight tracking-normal text-text-primary">
          {title}
        </h2>
        {ready ? <SummarySectionReadyBadge /> : null}
        {!ready && needsMappingCount && needsMappingCount > 0 ? (
          <SectionNeedsMappingBadge count={needsMappingCount} />
        ) : null}
      </div>
      <p className="text-[13px] leading-relaxed text-text-secondary">{description}</p>
    </div>
  );
}

function SectionDot({ isLast = false, hasError = false }: { isLast?: boolean; hasError?: boolean }) {
  return (
    <div className="flex flex-col items-center self-stretch">
      {/* Dot */}
      <div
        className={cn(
          "mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 bg-white",
          hasError ? "border-red-400" : "border-gray-400"
        )}
      />
      {/* Connecting line */}
      {!isLast && (
        <div
          className={cn(
            "w-px flex-1",
            hasError
              ? "bg-gradient-to-b from-red-300 to-gray-200"
              : "bg-gradient-to-b from-gray-300 to-gray-200"
          )}
        />
      )}
    </div>
  );
}

function ExpandCardAction({ onClick }: { onClick?: (e: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded p-0.5 text-text-muted/80 transition-colors hover:bg-gray-100 hover:text-text-primary"
      aria-label="Expand"
    >
      <Maximize2 size={11} strokeWidth={1.75} />
    </button>
  );
}

function KvExtractCard({
  title,
  rows,
  onCardClick,
}: {
  title: string;
  rows: ZenithSummaryKvRow[];
  onCardClick?: () => void;
}) {
  const wrapperClassName = cn(
    "w-full overflow-hidden rounded-xl border border-border-default bg-white transition-colors",
    onCardClick && "cursor-pointer hover:border-gray-300",
  );

  const cardContent = (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-4 py-2.5">
        <p className="text-[13px] font-semibold text-text-primary">{title}</p>
        <ExpandCardAction
          onClick={(e) => {
            e.stopPropagation();
            onCardClick?.();
          }}
        />
      </div>
      <div className="max-h-[180px] overflow-y-auto">
        <table className="w-full text-[13px]">
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.label}
                className={index > 0 ? "border-t border-border-subtle" : undefined}
              >
                <th className="bg-gray-50/80 px-3 py-1.5 text-left font-medium leading-tight whitespace-nowrap text-text-secondary">
                  {row.label}
                </th>
                <td className="px-3 py-1.5 leading-tight text-text-primary">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  if (onCardClick) {
    return (
      <button type="button" onClick={onCardClick} className={cn(wrapperClassName, "text-left")}>
        {cardContent}
      </button>
    );
  }

  return <div className={wrapperClassName}>{cardContent}</div>;
}

function LineItemsExtractCard({
  items,
  onCardClick,
}: {
  items: ZenithSummaryLineItem[];
  onCardClick?: () => void;
}) {
  const needMapping = zenithSummaryLineItemsNeedMappingCount(items);
  const wrapperClassName = cn(
    "w-full overflow-hidden rounded-xl border border-border-default bg-white text-left transition-colors",
    onCardClick && "cursor-pointer hover:border-gray-300",
  );
  const cardBody = (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-2.5">
        <span className="flex items-center gap-1.5">
          <p className="text-[13px] font-semibold text-text-primary">Items ({items.length})</p>
          {needMapping > 0 && (
            <span className="h-2 w-2 rounded-full bg-red-500" aria-label="Items need mapping" />
          )}
        </span>
        <ExpandCardAction
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      </div>
      <div className="max-h-[180px] overflow-y-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-sm">
            <tr className="border-b border-border-subtle text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              <th className="px-3 py-2 font-semibold">Item</th>
              <th className="px-2 py-2 font-semibold">Frequency</th>
              <th className="px-2 py-2 text-right font-semibold">Qty</th>
              <th className="px-2 py-2 text-right font-semibold">Unit price</th>
              <th className="px-3 py-2 text-right font-semibold">Total price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="font-semibold text-text-primary">{item.name}</span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-text-secondary">{item.frequency}</td>
                <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums text-text-primary">
                  {item.quantity}
                </td>
                <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums text-text-primary">
                  {formatMoney(item.unitPrice)}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums font-medium text-text-primary">
                  {formatMoney(item.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  if (onCardClick) {
    return (
      <button type="button" onClick={onCardClick} className={wrapperClassName}>
        {cardBody}
      </button>
    );
  }

  return <div className={wrapperClassName}>{cardBody}</div>;
}

function ZenithSummarySectionCard({
  heading,
  description,
  ready,
  needsMappingCount,
  children,
  snippetVariant,
  isLast = false,
  hasError = false,
}: {
  heading: string;
  description: string;
  ready?: boolean;
  needsMappingCount?: number;
  children: ReactNode;
  snippetVariant?: ZenithSnippetVariant;
  isLast?: boolean;
  hasError?: boolean;
}) {
  return (
    <section className="flex gap-3">
      {/* Vertical dot + line anchor */}
      <SectionDot isLast={isLast} hasError={hasError} />
      {/* Two-column grid layout: 35-65 split */}
      <div className="grid min-w-0 flex-1 grid-cols-[35fr_65fr] gap-12 pb-12">
        {/* Left column: Title, description, and source snippet */}
        <div className="flex flex-col gap-3">
          <SectionHeading title={heading} description={description} ready={ready} needsMappingCount={needsMappingCount} />
          {snippetVariant ? (
            <div className="mt-1 flex-1">
              <ZenithContractSourceSnippet variant={snippetVariant} fillContainer />
            </div>
          ) : null}
        </div>
        {/* Right column: Extracted data table */}
        <div className="flex items-start">
          {children}
        </div>
      </div>
    </section>
  );
}

function isSummarySectionReady(
  chrome: ZenithContractChromeValue | null,
  tab: ZenithContractContentTab,
): boolean {
  return chrome?.getContentTabStatus(tab) === "complete";
}

export function ZenithContractSummaryTab() {
  const chrome = useZenithContractChrome();
  const lineItems = chrome?.contractLineItems ?? zenithSummaryLineItems;
  const itemsComplete = areZenithContractItemsComplete({
    items: lineItems,
  });
  const billingComplete = isSummarySectionReady(chrome, "Billing info");
  const addressesComplete = isSummarySectionReady(chrome, "Addresses");

  function goToItemsTab() {
    chrome?.setActiveTab("Items");
  }

  function goToBillingTab() {
    chrome?.setActiveTab("Billing info");
  }

  function goToAddressesTab() {
    chrome?.setActiveTab("Addresses");
  }

  const needsMappingCount = zenithSummaryLineItemsNeedMappingCount(lineItems);

  return (
    <div className="flex flex-col py-2">
      <ZenithSummarySectionCard
        heading="Line items extracted"
        description={zenithSummaryLineItemsDescription(lineItems)}
        ready={itemsComplete}
        needsMappingCount={needsMappingCount}
        snippetVariant="line-items"
        hasError={needsMappingCount > 0}
      >
        <LineItemsExtractCard items={lineItems} onCardClick={chrome ? goToItemsTab : undefined} />
      </ZenithSummarySectionCard>

      <ZenithSummarySectionCard
        heading="Billing info extracted"
        description={zenithSummaryBillingDescription}
        ready={billingComplete}
        snippetVariant="billing"
      >
        <KvExtractCard title="Billing info" rows={zenithSummaryBillingRows} onCardClick={chrome ? goToBillingTab : undefined} />
      </ZenithSummarySectionCard>

      <ZenithSummarySectionCard
        heading="Addresses resolved"
        description={zenithSummaryAddressesDescription}
        ready={addressesComplete}
        snippetVariant="addresses"
        isLast
      >
        <KvExtractCard title="Addresses" rows={zenithSummaryAddressRows} onCardClick={chrome ? goToAddressesTab : undefined} />
      </ZenithSummarySectionCard>
    </div>
  );
}
