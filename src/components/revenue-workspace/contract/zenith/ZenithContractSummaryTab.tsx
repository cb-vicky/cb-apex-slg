import type { MouseEvent, ReactNode } from "react";
import { CircleCheck, Info, Maximize2 } from "lucide-react";
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

function SectionHeading({
  title,
  description,
  ready,
}: {
  title: string;
  description: string;
  ready?: boolean;
}) {
  return (
    <div className="max-w-3xl space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-sora text-[14px] font-bold leading-tight tracking-normal text-text-primary">
          {title}
        </h2>
        {ready ? <SummarySectionReadyBadge /> : null}
      </div>
      <p className="text-[13px] leading-relaxed text-text-secondary">{description}</p>
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

function KvExtractCard({ title, rows }: { title: string; rows: ZenithSummaryKvRow[] }) {
  return (
    <div className="w-fit max-w-full overflow-hidden rounded-xl border border-border-default bg-white">
      <div className="flex items-center justify-between gap-6 border-b border-border-subtle px-4 py-2">
        <p className="text-[13px] font-semibold text-text-primary">{title}</p>
        <ExpandCardAction />
      </div>
      <table className="w-auto text-[13px]">
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.label}
              className={index > 0 ? "border-t border-border-subtle" : undefined}
            >
              <th className="bg-gray-50 px-4 py-1.5 text-left font-medium leading-tight whitespace-nowrap text-text-secondary">
                {row.label}
              </th>
              <td className="max-w-md px-4 py-1.5 leading-tight text-text-primary">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MappingStatusIcon({ status }: { status: ZenithSummaryLineItem["mappingStatus"] }) {
  if (status === "mapped") {
    return (
      <CircleCheck
        size={14}
        strokeWidth={2.25}
        className="shrink-0 text-emerald-600"
        aria-hidden
      />
    );
  }
  return (
    <Info
      size={14}
      strokeWidth={2.25}
      className="shrink-0 text-red-600"
      aria-hidden
    />
  );
}

function LineItemsExtractCard({
  items,
  onCardClick,
}: {
  items: ZenithSummaryLineItem[];
  onCardClick?: () => void;
}) {
  const needMapping = zenithSummaryLineItemsNeedMappingCount(items);
  const cardClassName = cn(
    "w-fit max-w-full overflow-hidden rounded-xl border border-border-default bg-white text-left transition-colors",
    needMapping > 0 && "border-l-[3px] border-l-red-500",
    onCardClick && "cursor-pointer hover:border-gray-300 hover:bg-gray-50/60",
  );
  const cardBody = (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <p className="text-[13px] font-semibold text-text-primary">Items ({items.length})</p>
          {needMapping > 0 ? (
            <span className="inline-flex rounded-full bg-red-50 px-2 py-px text-[11px] font-medium leading-4 text-red-700">
              {needMapping} item{needMapping === 1 ? "" : "s"} need mapping
            </span>
          ) : null}
        </div>
        <ExpandCardAction
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      </div>
      <div>
        <table className="w-auto text-left text-[13px]">
          <thead>
            <tr className="border-b border-border-subtle text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              <th className="px-4 py-2 font-semibold">Item</th>
              <th className="px-3 py-2 font-semibold">Frequency</th>
              <th className="px-3 py-2 text-right font-semibold">Qty</th>
              <th className="px-3 py-2 text-right font-semibold">Unit price</th>
              <th className="px-4 py-2 text-right font-semibold">Total price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <MappingStatusIcon status={item.mappingStatus} />
                    <span className="font-semibold text-text-primary">{item.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-text-secondary">{item.frequency}</td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums text-text-primary">
                  {item.quantity}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums text-text-primary">
                  {formatMoney(item.unitPrice)}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap tabular-nums font-medium text-text-primary">
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
      <button type="button" onClick={onCardClick} className={cardClassName}>
        {cardBody}
      </button>
    );
  }

  return <div className={cardClassName}>{cardBody}</div>;
}

function ZenithSummarySectionCard({
  heading,
  description,
  ready,
  children,
  snippetVariant,
}: {
  heading: string;
  description: string;
  ready?: boolean;
  children: ReactNode;
  snippetVariant?: ZenithSnippetVariant;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border-default bg-white">
      <div className="flex flex-col gap-5 px-5 py-4">
        <SectionHeading title={heading} description={description} ready={ready} />
        <div className="flex max-w-full items-start gap-8">
          {children}
          {snippetVariant ? (
            <div className="shrink-0 pt-0.5">
              <ZenithContractSourceSnippet variant={snippetVariant} />
            </div>
          ) : null}
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
  const itemsComplete = areZenithContractItemsComplete(lineItems);
  const billingComplete = isSummarySectionReady(chrome, "Billing info");
  const addressesComplete = isSummarySectionReady(chrome, "Addresses");

  function goToItemsTab() {
    chrome?.setActiveTab("Items");
  }

  return (
    <div className="flex flex-col gap-4">
      <ZenithSummarySectionCard
        heading="Line items extracted"
        description={zenithSummaryLineItemsDescription(lineItems)}
        ready={itemsComplete}
        snippetVariant="line-items"
      >
        <LineItemsExtractCard items={lineItems} onCardClick={chrome ? goToItemsTab : undefined} />
      </ZenithSummarySectionCard>

      <ZenithSummarySectionCard
        heading="Billing info extracted"
        description={zenithSummaryBillingDescription}
        ready={billingComplete}
        snippetVariant="billing"
      >
        <KvExtractCard title="Billing info" rows={zenithSummaryBillingRows} />
      </ZenithSummarySectionCard>

      <ZenithSummarySectionCard
        heading="Addresses resolved"
        description={zenithSummaryAddressesDescription}
        ready={addressesComplete}
        snippetVariant="addresses"
      >
        <KvExtractCard title="Addresses" rows={zenithSummaryAddressRows} />
      </ZenithSummarySectionCard>
    </div>
  );
}
