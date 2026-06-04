import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Customer, Task } from "@/data/mock-data";
import { getQuotesForCustomer, getContractsForCustomer, getTasks } from "@/data/mock-data";
import { useIngestContext } from "@/context/IngestContext";
import { SectionCard, KV } from "@/components/ui/primitives";
import { shortDate, cn } from "@/lib/utils";
import { PinnedNotesSection } from "@/components/notes";
import { CustomerNbaCard } from "./CustomerNbaCard";
import { AiInsightsCard } from "./AiInsightsCard";
import { CustomerMetricsSection } from "./CustomerMetricsSection";
import { SupportCommsSection } from "./SupportCommsSection";
import { LifecycleSummarySection } from "./LifecycleSummarySection";
import { CustomerTimelineSection } from "./CustomerTimelineSection";
import { WorkspaceSectionAnchor } from "../WorkspaceSectionAnchor";
import {
  getCustomerExternalLinkedRecords,
  deriveCustomerHealth,
  mergeContractsWithRuntimeClosures,
  getPrimaryCustomerAction,
  getCustomerInsightsEnriched,
  type ExternalLinkedRecord,
  type CustomerHealthData,
  type CustomerWorkspaceSession,
} from "../derive-stage-data";

interface Props {
  customer: Customer;
}

export function CustomerStageContent({ customer }: Props) {
  const {
    queueItems,
    contractClosures,
    contractGraceExtensions,
    invoiceStatusOverrides,
    sessionContracts,
    approvalRequests,
  } = useIngestContext();

  const workspaceSession = useMemo<CustomerWorkspaceSession>(
    () => ({
      queueItems,
      contractClosures,
      contractGraceExtensions,
      invoiceStatusOverrides,
      sessionContracts,
      approvalRequests,
    }),
    [queueItems, contractClosures, contractGraceExtensions, invoiceStatusOverrides, sessionContracts, approvalRequests],
  );

  const customerQuotes = getQuotesForCustomer(customer.id);
  const customerContracts = useMemo(
    () =>
      mergeContractsWithRuntimeClosures(
        getContractsForCustomer(customer.id),
        contractClosures,
        contractGraceExtensions,
      ),
    [customer.id, contractClosures, contractGraceExtensions],
  );

  const tasks = getTasks(customer.id);
  const openTasks = useMemo(() => tasks.filter((t) => t.status === "Open"), [tasks]);
  const health = deriveCustomerHealth(customer);
  const linked = getCustomerExternalLinkedRecords(customer, customerQuotes, customerContracts);
  const action = getPrimaryCustomerAction(customer, workspaceSession);
  const insights = getCustomerInsightsEnriched(customer, workspaceSession);

  return (
    <div className="flex flex-col gap-3">
      <WorkspaceSectionAnchor id="ws-section-customer-notes">
        <PinnedNotesSection customerId={customer.id} customerName={customer.name} />
      </WorkspaceSectionAnchor>
      <WorkspaceSectionAnchor id="ws-section-customer-nba">
        <CustomerNbaCard action={action} />
      </WorkspaceSectionAnchor>
      <WorkspaceSectionAnchor id="ws-section-customer-metrics">
        <CustomerMetricsSection customer={customer} />
      </WorkspaceSectionAnchor>
      {linked.length > 0 ? (
        <WorkspaceSectionAnchor id="ws-section-customer-linked">
          <LinkedRecordsSection records={linked} />
        </WorkspaceSectionAnchor>
      ) : null}
      <WorkspaceSectionAnchor id="ws-section-customer-account">
        <AccountDetailsSection customer={customer} health={health} />
      </WorkspaceSectionAnchor>
      {openTasks.length > 0 ? (
        <WorkspaceSectionAnchor id="ws-section-customer-open-tasks">
          <OpenTasksSection tasks={openTasks} />
        </WorkspaceSectionAnchor>
      ) : null}
      <WorkspaceSectionAnchor id="ws-section-customer-insights">
        <AiInsightsCard insights={insights} />
      </WorkspaceSectionAnchor>
      <WorkspaceSectionAnchor id="ws-section-customer-support">
        <SupportCommsSection customerId={customer.id} />
      </WorkspaceSectionAnchor>
      <WorkspaceSectionAnchor id="ws-section-customer-lifecycle">
        <LifecycleSummarySection customerId={customer.id} />
      </WorkspaceSectionAnchor>
      <WorkspaceSectionAnchor id="ws-section-customer-activity">
        <CustomerTimelineSection customerId={customer.id} />
      </WorkspaceSectionAnchor>
    </div>
  );
}

function LinkedRecordsSection({ records }: { records: ExternalLinkedRecord[] }) {
  if (records.length === 0) return null;

  return (
    <SectionCard title="Linked Records">
      <div className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
        {records.map((r, idx) => (
          <LinkedRecordKV key={`${r.kind}-${r.value}-${idx}`} record={r} />
        ))}
      </div>
    </SectionCard>
  );
}

function LinkedRecordKV({ record }: { record: ExternalLinkedRecord }) {
  if (record.href) {
    return (
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle py-2 last:border-0">
        <span className="text-[13px] text-text-secondary">{record.label}</span>
        <a
          href={record.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-right text-[13px] font-medium text-blue-600 hover:underline"
        >
          {record.value}
          <ArrowUpRight size={12} className="shrink-0" />
        </a>
      </div>
    );
  }
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle py-2 last:border-0">
      <span className="text-[13px] text-text-secondary">{record.label}</span>
      <span className="text-right text-[13px] font-medium text-blue-600">{record.value}</span>
    </div>
  );
}

function AccountDetailsSection({
  customer,
  health,
}: {
  customer: Customer;
  health: CustomerHealthData;
}) {
  return (
    <SectionCard title="Account Details">
      <div className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
        <KV label="NPS" value={health.nps} />
        <KV label="Support tickets (30d)" value={health.supportTickets30d} />
        {health.openEscalations > 0 && (
          <KV label="Open escalations" value={health.openEscalations} valueClassName="text-red-600" />
        )}
        <KV label="Churn risk" value={health.churnRisk} valueClassName={health.churnColor} />
        <KV label="Segment" value={`${customer.segment} · ${customer.tier}`} />
        <KV label="Industry" value={customer.industry} />
        <KV label="Region" value={customer.region} />
        <KV label="Customer since" value={shortDate(customer.createdAt)} />
        <KV label="Account" value={customer.commercialAccount} />
        <KV label="Billing Entity" value={customer.billingLegalEntity} />
        <KV label="CB Entity" value={customer.chargebeeEntity} />
      </div>
    </SectionCard>
  );
}

function OpenTasksSection({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return null;

  return (
    <SectionCard
      title="Open Tasks"
      actions={<span className="text-[12px] text-text-muted">{tasks.length} open</span>}
    >
      <div className="divide-y divide-border-subtle">
        {tasks.slice(0, 5).map((task) => (
          <div
            key={task.id}
            className="group py-2.5 first:pt-0 last:pb-0 transition-colors hover:bg-surface-muted/50 -mx-1 rounded px-1"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full bg-gray-200 transition-colors",
                  task.priority === "High" ? "group-hover:bg-red-400" : "group-hover:bg-amber-400",
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-snug text-text-primary">
                {task.title}
              </span>
            </div>
            <div className="mt-0.5 flex gap-2">
              <span className="inline-block w-2 shrink-0" aria-hidden />
              <span className="text-[12px] leading-snug text-text-secondary">
                {task.assignee} · Due {shortDate(task.dueDate)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
