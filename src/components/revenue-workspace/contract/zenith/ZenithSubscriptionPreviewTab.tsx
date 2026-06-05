import { useMemo } from "react";
import { AlertCircle, Calendar, CreditCard, FileText, Users } from "lucide-react";
import { useZenithContractChrome } from "./ZenithContractChromeContext";
import {
  zenithSummaryLineItems,
  zenithSummaryLineItemsNeedMappingCount,
  type ZenithSummaryLineItem,
} from "@/data/zenith-contract-summary";
import { getExtractedContract, type ExtractedContract } from "@/data/ingest-data";
import { SectionCard } from "@/components/ui/primitives";
import { WorkspaceTableShell, WTable, WThead, WTh, WTbody, WTr, WTd } from "@/components/ui/data-table";
import { currency, shortDate } from "@/lib/utils";

interface OverviewCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

function OverviewCard({ label, value, icon }: OverviewCardProps) {
  return (
    <div className="rounded-xl border border-border-default bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-text-muted">{icon}</span>}
        <p className="text-[11px] uppercase tracking-wider text-text-muted">{label}</p>
      </div>
      <p className="mt-1.5 text-[15px] font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function generateSubscriptionId(sampleId?: string): string {
  if (sampleId === "sample5") return "SUB-PS-2026-001";
  if (sampleId === "sample3") return "SUB-VH-2026-001";
  return "SUB-ZA-2026-001";
}

interface SubscriptionOverviewProps {
  lineItems: ZenithSummaryLineItem[];
  extracted: ExtractedContract;
  subscriptionId: string;
}

function SubscriptionOverviewSection({ lineItems, extracted, subscriptionId }: SubscriptionOverviewProps) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const { terms } = extracted;
  
  return (
    <div className="grid grid-cols-4 gap-3">
      <OverviewCard 
        label="Subscription ID" 
        value={subscriptionId}
        icon={<FileText size={14} />}
      />
      <OverviewCard 
        label="Start Date" 
        value={shortDate(terms.startDate)}
        icon={<Calendar size={14} />}
      />
      <OverviewCard 
        label="End Date" 
        value={shortDate(terms.endDate)}
        icon={<Calendar size={14} />}
      />
      <OverviewCard 
        label="Term" 
        value={terms.term}
      />
      <OverviewCard 
        label="Billing Frequency" 
        value={terms.billingFrequency}
        icon={<CreditCard size={14} />}
      />
      <OverviewCard 
        label="Payment Terms" 
        value={terms.paymentTerms}
      />
      <OverviewCard 
        label="Auto Renewal" 
        value={terms.autoRenew ? "Yes" : "No"}
      />
      <OverviewCard 
        label="Total Contract Value" 
        value={currency(terms.tcv || subtotal)}
      />
    </div>
  );
}

interface SubscriptionCustomerProps {
  extracted: ExtractedContract;
}

function SubscriptionCustomerSection({ extracted }: SubscriptionCustomerProps) {
  const { addresses } = extracted;
  const billingAddress = addresses.billing;
  
  return (
    <SectionCard title="Customer" bodyClassName="p-4">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <Users size={20} className="text-blue-600" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-text-primary">{extracted.customerLegalEntity || extracted.customerName}</p>
          <p className="mt-0.5 text-[13px] text-text-secondary">{billingAddress.line1}</p>
          {billingAddress.line2 && (
            <p className="text-[13px] text-text-secondary">{billingAddress.line2}</p>
          )}
          <p className="text-[13px] text-text-secondary">
            {billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}, {billingAddress.country}
          </p>
          <p className="mt-2 text-[13px] text-text-muted">
            Primary contact: <span className="font-medium text-text-secondary">{extracted.primaryContactName}</span> · {extracted.primaryContactEmail}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

function SubscriptionItemsSection({ lineItems }: { lineItems: ZenithSummaryLineItem[] }) {
  return (
    <SectionCard title="Subscription Items" bodyClassName="p-0">
      <WorkspaceTableShell className="rounded-none border-0 shadow-none">
        <WTable className="text-[14px] leading-snug">
          <WThead className="text-[12px] [&_th]:px-3.5 [&_th]:py-3">
            <WTh>Item</WTh>
            <WTh>Billing Frequency</WTh>
            <WTh align="right">Qty</WTh>
            <WTh align="right">Unit Price</WTh>
            <WTh align="right">Total</WTh>
          </WThead>
          <WTbody striped={false}>
            {lineItems.map((item) => (
              <WTr key={item.id}>
                <WTd className="px-3.5 py-3">
                  <span className="font-semibold text-text-primary">{item.name}</span>
                </WTd>
                <WTd className="px-3.5 py-3 text-[13px] text-text-secondary">{item.frequency}</WTd>
                <WTd align="right" className="px-3.5 py-3 tabular-nums">
                  {item.quantity}
                </WTd>
                <WTd align="right" className="px-3.5 py-3 tabular-nums">
                  {currency(item.unitPrice)}
                </WTd>
                <WTd align="right" className="px-3.5 py-3 tabular-nums font-semibold">
                  {currency(item.totalPrice)}
                </WTd>
              </WTr>
            ))}
          </WTbody>
        </WTable>
      </WorkspaceTableShell>
      <div className="flex justify-end border-t border-border-default px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-[13px] text-text-secondary">Total</span>
          <span className="text-[16px] font-bold tabular-nums text-text-primary">
            {currency(lineItems.reduce((sum, item) => sum + item.totalPrice, 0))}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

function CannotPreviewBanner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-amber-200 bg-amber-50 px-8 py-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
        <AlertCircle size={28} className="text-amber-600" />
      </div>
      <div className="text-center">
        <p className="text-[16px] font-semibold text-amber-900">
          Cannot show subscription preview
        </p>
        <p className="mt-1 text-[14px] text-amber-700">
          All items must be resolved before the subscription can be previewed.
        </p>
        <p className="mt-2 text-[13px] text-amber-600">
          Go to the Items tab to resolve mapping issues.
        </p>
      </div>
    </div>
  );
}

export function ZenithSubscriptionPreviewTab() {
  const chrome = useZenithContractChrome();
  const lineItems = chrome?.contractLineItems ?? zenithSummaryLineItems;
  const unmappedCount = zenithSummaryLineItemsNeedMappingCount(lineItems);
  const sampleId = chrome?.ingestionSampleId;
  
  const extracted = useMemo(
    () => getExtractedContract(sampleId),
    [sampleId]
  );
  
  const subscriptionId = generateSubscriptionId(sampleId);

  if (unmappedCount > 0) {
    return <CannotPreviewBanner />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Subscription Preview
        </p>
        <p className="mt-0.5 text-[13px] text-text-secondary">
          Review the subscription that will be created from this contract.
        </p>
      </div>

      <SubscriptionOverviewSection 
        lineItems={lineItems} 
        extracted={extracted}
        subscriptionId={subscriptionId}
      />
      <SubscriptionCustomerSection extracted={extracted} />
      <SubscriptionItemsSection lineItems={lineItems} />
    </div>
  );
}
