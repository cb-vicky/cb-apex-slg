import { useState } from "react";
import type { Task, Customer, Quote, Contract, Invoice } from "@/data/mock-data";
import type { Stage } from "./RevenueJourneyRail";
import type { RevenueArrangement } from "@/data/revrec-data";
import { cn, shortDate } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  IdCard,
  Lightbulb,
  ListChecks,
  Shield,
  User,
  Zap,
} from "lucide-react";
import {
  type InsightItem,
  type LinkedRecord,
  type NextAction,
  type CustomerHealthData,
  getCustomerInsights,
  getQuoteInsights,
  getContractInsights,
  getInvoicingInsights,
  getPaymentInsights,
  getRevRecInsights,
  getQuoteLinkedRecords,
  getContractLinkedRecords,
  getInvoicingLinkedRecords,
  getPaymentLinkedRecords,
  getRevRecLinkedRecords,
  getQuoteActions,
  getContractActions,
  getInvoicingActions,
  getPaymentActions,
  getRevRecActions,
  deriveCustomerHealth,
} from "./derive-stage-data";
import { getInvoices } from "@/data/mock-data";
import { getQuotesForCustomer } from "@/data/mock-data";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RailSection({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: typeof Brain; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border-default last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-muted/60"
      >
        <Icon size={13} className="shrink-0 text-text-secondary" />
        <h4 className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-text-primary">{title}</h4>
        <ChevronDown
          size={13}
          className={cn("shrink-0 text-text-muted transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

const severityIcon = {
  warning: <AlertTriangle size={13} className="shrink-0 text-amber-500" />,
  info: <Lightbulb size={13} className="shrink-0 text-blue-500" />,
  success: <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />,
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  activeStage: Stage;
  tasks: Task[];
  customer: Customer;
  quote: Quote | null;
  contract: Contract | null;
  invoice?: Invoice;
  revenueArrangement?: RevenueArrangement;
}

export function InsightRail({ activeStage, tasks, customer, quote, contract, invoice, revenueArrangement }: Props) {
  const isCustomerStage = activeStage === "customer";
  const customerInvoices = getInvoices(customer.id);
  const customerQuotes = getQuotesForCustomer(customer.id);

  const insights: InsightItem[] = (() => {
    switch (activeStage) {
      case "customer": return getCustomerInsights(customer);
      case "quote": return quote ? getQuoteInsights(quote, contract) : [{ severity: "info", text: "No quote found for this customer." }];
      case "contract": return getContractInsights(contract, customerInvoices);
      case "invoicing": return invoice && contract ? getInvoicingInsights(invoice, contract) : [];
      case "payment": return getPaymentInsights(customer.id);
      case "revrec": return getRevRecInsights(revenueArrangement);
      default: return [];
    }
  })();

  const linked: LinkedRecord[] = (() => {
    switch (activeStage) {
      case "quote": return getQuoteLinkedRecords(quote);
      case "contract": return getContractLinkedRecords(contract, customerQuotes, customerInvoices);
      case "invoicing": return invoice ? getInvoicingLinkedRecords(invoice, customer.id) : [];
      case "payment": return getPaymentLinkedRecords(customer.id);
      case "revrec": return getRevRecLinkedRecords(revenueArrangement);
      default: return [];
    }
  })();

  const actions: NextAction[] = (() => {
    switch (activeStage) {
      case "quote": return getQuoteActions(quote);
      case "contract": return getContractActions(contract, customerInvoices);
      case "invoicing": return invoice ? getInvoicingActions(invoice) : [];
      case "payment": return getPaymentActions(customer.id);
      case "revrec": return getRevRecActions(revenueArrangement);
      default: return [];
    }
  })();

  const health: CustomerHealthData = deriveCustomerHealth(customer);

  return (
    <aside className="w-[320px] shrink-0">
      <div className="overflow-hidden rounded-lg border border-border-default bg-white">
      {/* Account details — Overview tab only, collapsed by default */}
      {isCustomerStage && <AccountDetailsSection customer={customer} />}

      {/* Next best actions */}
      {actions.length > 0 && (
        <RailSection title="Next Best Action" icon={Zap}>
          <div className="space-y-2">
            {actions.map((action) => (
              <button key={action.label} className="flex w-full items-start gap-2 rounded-md border border-border-default px-2.5 py-2 text-left transition-colors hover:bg-surface-muted">
                <ArrowRight size={13} className="mt-0.5 shrink-0 text-cb-orange" />
                <div>
                  <p className="text-[13px] font-medium text-text-primary">{action.label}</p>
                  <p className="text-[12px] text-text-secondary">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </RailSection>
      )}


      {/* AI Insights */}
      <RailSection title={isCustomerStage ? "Account Insights" : "AI Insights"} icon={Brain}>
        <div className="space-y-2">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[13px] text-text-primary">
              {severityIcon[insight.severity]}
              <span>{insight.text}</span>
            </div>
          ))}
        </div>
      </RailSection>

      {/* Linked Records */}
      {linked.length > 0 && (
        <RailSection title="Linked Records" icon={FileText}>
          <div className="space-y-1.5">
            {linked.map((record) => (
              <div key={record.id} className="flex items-center gap-2 text-[13px]">
                <FileText size={13} className="text-text-muted" />
                <span className="text-text-secondary">{record.label}:</span>
                <span className="font-medium text-blue-600">{record.id}</span>
              </div>
            ))}
          </div>
        </RailSection>
      )}

      {/* Open Tasks */}
      <RailSection title="Open Tasks" icon={ListChecks}>
        <div className="space-y-2">
          {tasks.filter((t) => t.status === "Open").map((task) => (
            <div key={task.id} className="flex items-start gap-2 rounded-md border border-border-default px-2.5 py-2">
              <div className={cn(
                "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                task.priority === "High" ? "bg-red-400" : "bg-amber-400",
              )} />
              <div>
                <p className="text-[13px] font-medium text-text-primary">{task.title}</p>
                <p className="text-[12px] text-text-secondary">
                  {task.assignee} &middot; Due {shortDate(task.dueDate)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </RailSection>

      {/* Customer Health */}
      <RailSection title={isCustomerStage ? "Account Health" : "Customer Health"} icon={isCustomerStage ? Shield : Clock}>
        <div className="space-y-1 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">NPS</span>
            <span className="font-medium text-text-primary">{health.nps}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Support tickets (30d)</span>
            <span className="font-medium text-text-primary">{health.supportTickets30d}</span>
          </div>
          {health.openEscalations > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Open escalations</span>
              <span className="font-medium text-red-600">{health.openEscalations}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Product adoption</span>
            <span className={cn("font-medium", health.adoptionColor)}>{health.productAdoption}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Churn risk</span>
            <span className={cn("font-medium", health.churnColor)}>{health.churnRisk}</span>
          </div>
        </div>
      </RailSection>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Account Details — Overview tab only. Collapsed by default.
// ---------------------------------------------------------------------------
function AccountDetailsSection({ customer }: { customer: Customer }) {
  return (
    <RailSection title="Account Details" icon={IdCard}>
      <div className="space-y-3 text-[13px]">
        {/* Identity */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Identity</p>
          <DetailRow label="Segment" value={`${customer.segment} · ${customer.tier}`} />
          <DetailRow label="Industry" value={customer.industry} />
          <DetailRow label="Region" value={customer.region} />
          <DetailRow label="Customer since" value={shortDate(customer.createdAt)} />
        </div>

        {/* Entities */}
        <div className="space-y-1.5 border-t border-border-subtle pt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            <span className="inline-flex items-center gap-1">
              <Building2 size={11} /> Entities
            </span>
          </p>
          <DetailRow label="Account" value={customer.commercialAccount} />
          <DetailRow label="Billing Entity" value={customer.billingLegalEntity} />
          <DetailRow label="CB Entity" value={customer.chargebeeEntity} />
        </div>

        {/* Ownership */}
        <div className="space-y-1.5 border-t border-border-subtle pt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            <span className="inline-flex items-center gap-1">
              <User size={11} /> Ownership
            </span>
          </p>
          <DetailRow label="AE" value={customer.ae} />
          <DetailRow label="CSM" value={customer.csm} />
          <DetailRow label="Billing Owner" value={customer.billingOwner} />
        </div>
      </div>
    </RailSection>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-text-secondary">{label}</span>
      <span className="truncate text-right font-medium text-text-primary">{value}</span>
    </div>
  );
}
