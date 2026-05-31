// ---------------------------------------------------------------------------
// Workbench Task Derivation
// ---------------------------------------------------------------------------
// Aggregates tasks from three sources (Queue, Approvals, Customer tasks) into
// a unified WorkbenchTask[] type for display in the Workbench My Tasks tab.
// ---------------------------------------------------------------------------

import type { QueueItem } from "@/data/queue-data";
import type { ApprovalRequest } from "@/data/ingest-data";
import type { ContractClosure } from "@/data/mock-data";
import type { PendingRenewalIngestion } from "@/data/approval-policy";
import type { ContractGraceExtension } from "@/data/contract-transition";
import { customers, contracts, tasks as customerTasks } from "@/data/mock-data";
import type { DemoPersona } from "@/types/demo-persona";
import { ZENITH_ANALYTICS_INC_ID } from "@/data/zenith-analytics-inc-seed";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkbenchTask {
  id: string;
  customerId?: string;
  customerName: string;
  /** Deterministic first-column label (queue scenario, approval class, customer task theme). */
  kindLabel: string;
  type:
    | "contract-ingest"
    | "invoice-approval"
    | "closure-approval"
    | "billing-task"
    | "late-renewal-extension"
    | "late-renewal";
  title: string;
  subtitle?: string;
  severity: "critical" | "high" | "medium" | "low";
  destination: string;
  assignee?: string;
  dueDate?: string;
  source: "queue" | "approval" | "customer-task" | "contract-lifecycle";
}

export interface TaskGroup {
  customerId?: string;
  customerName: string;
  topSeverity: WorkbenchTask["severity"];
  tasks: WorkbenchTask[];
}

// Minimal context shape required by deriveWorkbenchTasks
export interface WorkbenchTaskContext {
  queueItems: QueueItem[];
  approvalRequests: ApprovalRequest[];
  contractClosures: Record<string, ContractClosure>;
  pendingRenewalIngestions: Record<string, PendingRenewalIngestion>;
  contractGraceExtensions: Record<string, ContractGraceExtension>;
}

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

export const SEVERITY_ORDER: Record<WorkbenchTask["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function scenarioToSeverity(
  scenario: QueueItem["scenario"],
): WorkbenchTask["severity"] {
  switch (scenario) {
    case "Early Renewal":
      return "critical";
    case "Late Renewal":
      return "high";
    case "New Business":
      return "high";
    case "Renewal":
      return "high";
    case "Amendment":
      return "medium";
  }
}

function priorityToSeverity(priority: string): WorkbenchTask["severity"] {
  switch (priority.toLowerCase()) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "medium":
      return "medium";
    default:
      return "low";
  }
}

function taskTypeToTab(type: string): string {
  switch (type) {
    case "Billing":
      return "invoicing";
    case "Renewal":
      return "contract";
    case "Enforcement":
      return "contract";
    case "Usage":
      return "customer";
    default:
      return "customer";
  }
}

/** Whole calendar days from today (UTC date) to `endDate` (YYYY-MM-DD). */
function calendarDaysUntilEndDate(endDateStr: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(endDateStr);
  if (!m) return NaN;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  if ([y, mo, d].some((n) => Number.isNaN(n))) return NaN;
  const endUtc = Date.UTC(y, mo - 1, d);
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((endUtc - todayUtc) / 86400000);
}

function contractExpiryKindFromActiveId(activeContractId: string | undefined): string {
  if (!activeContractId) return "Contract expiry — action needed";
  const c = contracts.find((x) => x.id === activeContractId);
  if (!c?.endDate) return "Contract expiry — action needed";
  const days = calendarDaysUntilEndDate(c.endDate);
  if (Number.isNaN(days)) return "Contract expiry — action needed";
  if (days < 0) return "Contract expired — closeout required";
  if (days === 0) return "Contract expires today";
  if (days === 1) return "Contract expires in 1 day";
  return `Contract expires in ${days} days`;
}

/** Row “task type” for queue tables — matches `WorkbenchTask.kindLabel` for queue-sourced tasks. */
export function queueItemKindLabel(q: QueueItem): string {
  switch (q.scenario) {
    case "New Business":
      return "New deal";
    case "Early Renewal":
      return "Early renewal";
    case "Renewal":
      return "Renewal";
    case "Amendment":
      return "Amendment";
    case "Late Renewal":
      return q.ingestable ? "Late renewal — ingest" : contractExpiryKindFromActiveId(q.activeContractId);
    default:
      return q.scenario;
  }
}

/** Row “task type” for approval tables — matches `WorkbenchTask.kindLabel` for approval-sourced tasks. */
export function approvalRequestKindLabel(req: { invoiceId: string; ingestId?: string }): string {
  if (req.invoiceId.startsWith("CN-CLOSE-")) return "Closure Credit Note Approval";
  if (req.invoiceId.startsWith("INV-TERM-")) return "Termination Charge Approval";
  if (req.ingestId) return "First Invoice Approval";
  return "Invoice Approval";
}

function customerTaskKindLabel(task: { type: string }): string {
  switch (task.type) {
    case "Billing":
      return "Billing follow-up";
    case "Renewal":
      return "Renewal follow-up";
    case "Enforcement":
      return "Enforcement follow-up";
    case "Usage":
      return "Usage review";
    default:
      return `${task.type} task`;
  }
}

// ---------------------------------------------------------------------------
// Derive
// ---------------------------------------------------------------------------

function filterTasksForDemoPersona(
  tasks: WorkbenchTask[],
  persona: DemoPersona,
): WorkbenchTask[] {
  if (persona === "operator") {
    return tasks.filter((t) => t.source !== "approval");
  }
  return tasks.filter((t) => t.source === "approval");
}

export function deriveWorkbenchTasks(
  context: WorkbenchTaskContext,
  options?: { persona?: DemoPersona },
): WorkbenchTask[] {
  const persona = options?.persona ?? "operator";
  const derived: WorkbenchTask[] = [];

  // ── Queue source ──────────────────────────────────────────────────────────
  // context.queueItems already has runtime overrides applied (from IngestContext).
  for (const q of context.queueItems) {
    if (
      q.status !== "Pending Review" &&
      q.status !== "In Progress" &&
      q.status !== "Invoice review" &&
      q.status !== "Returned"
    ) {
      continue;
    }
    const isLateRenewal = q.scenario === "Late Renewal";
    
    // Build destination: route to Customer 360 frame
    let destination = `/customers/${q.customerId}?tab=contract`;
    if (q.status === "Invoice review" && q.invoiceId && q.customerId) {
      destination = `/customers/${q.customerId}?tab=invoicing&invoiceId=${q.invoiceId}`;
    } else if (isLateRenewal && !q.ingestable && q.customerId && q.activeContractId) {
      destination = `/customers/${q.customerId}?tab=contract&contractId=${q.activeContractId}`;
    } else if (q.customerId) {
      destination = `/customers/${q.customerId}?tab=contract&queueItemId=${q.id}`;
    }

    const type: WorkbenchTask["type"] =
      isLateRenewal && !q.ingestable ? "late-renewal" : "contract-ingest";
    
    let subtitle = `${q.scenario} · ${q.source}`;
    if (isLateRenewal) {
      subtitle = q.ingestable
        ? "Renewal contract received — ingest and close prior"
        : "Contract about to expire — choose how to proceed";
    }
    
    derived.push({
      id: `queue-${q.id}`,
      customerId: q.customerId,
      customerName: q.customerName,
      kindLabel: queueItemKindLabel(q),
      type,
      title: q.documentName,
      subtitle,
      severity: scenarioToSeverity(q.scenario),
      destination,
      assignee: q.uploadedBy,
      source: "queue",
    });
  }

  // ── Approval source ───────────────────────────────────────────────────────
  for (const req of context.approvalRequests) {
    if (req.status !== "Pending Approval") continue;
    if (req.invoiceId.startsWith("INV-PENDING")) continue;

    const isClosureDoc =
      req.invoiceId.startsWith("CN-CLOSE-") ||
      req.invoiceId.startsWith("INV-TERM-");

    if (isClosureDoc) {
      // Locate the contractId that generated this closure document
      const closureEntry = Object.entries(context.contractClosures).find(
        ([, cl]) =>
          cl.invoiceId === req.invoiceId ||
          cl.creditNoteId === req.invoiceId,
      );
      const closureContractId = closureEntry?.[0];

      // Check if an Early Renewal ingestion is waiting on this closure
      const pendingRenewal = closureContractId
        ? context.pendingRenewalIngestions[closureContractId]
        : undefined;

      let destination = `/approvals/invoices/${req.invoiceId}`;
      if (closureContractId && pendingRenewal) {
        destination = `/approvals/invoices/${req.invoiceId}?closureFor=${closureContractId}&queueItemId=${pendingRenewal.queueItemId}`;
      }

      derived.push({
        id: `approval-${req.id}`,
        customerId: req.customerId || undefined,
        customerName: req.customerName || "Unknown",
        kindLabel: approvalRequestKindLabel(req),
        type: "closure-approval",
        title: `Closure approval: ${req.invoiceId}`,
        subtitle: pendingRenewal
          ? "Early renewal — prior contract closure"
          : "Contract closure document",
        severity: "critical",
        destination,
        assignee: req.approver,
        source: "approval",
      });
    } else {
      // For Zenith first invoice approvals, route to the Scheduled Contract record with Invoice Preview tab
      let destination: string;
      if (req.customerId === ZENITH_ANALYTICS_INC_ID && req.ingestId) {
        // Open the Scheduled Contract record with Invoice Preview tab active
        const zenithContractId = "CTR-ZA-2026-001";
        destination = `/customers/${ZENITH_ANALYTICS_INC_ID}?tab=contract&contractId=${zenithContractId}&zenithTab=Invoice%20Preview`;
      } else {
        destination = `/approvals/invoices/${req.invoiceId}`;
        if (req.ingestId) {
          destination += `?ingestId=${encodeURIComponent(req.ingestId)}`;
        }
      }
      derived.push({
        id: `approval-${req.id}`,
        customerId: req.customerId || undefined,
        customerName: req.customerName || "Unknown",
        kindLabel: approvalRequestKindLabel(req),
        type: "invoice-approval",
        title: `Invoice approval: ${req.invoiceId}`,
        subtitle: `Submitted by ${req.submittedBy}`,
        severity: "high",
        destination,
        assignee: req.approver,
        source: "approval",
      });
    }
  }

  // ── Customer task source ──────────────────────────────────────────────────
  for (const task of customerTasks) {
    if (task.status !== "Open") continue;
    const customer = customers.find((c) => c.id === task.customerId);
    const tab = taskTypeToTab(task.type);
    derived.push({
      id: `task-${task.id}`,
      customerId: task.customerId,
      customerName: customer?.name ?? "Unknown Customer",
      kindLabel: customerTaskKindLabel(task),
      type: "billing-task",
      title: task.title,
      subtitle: `${task.type} · ${task.assignee}`,
      severity: priorityToSeverity(task.priority),
      destination: `/customers/${task.customerId}?tab=${tab}`,
      assignee: task.assignee,
      dueDate: task.dueDate,
      source: "customer-task",
    });
  }

  return filterTasksForDemoPersona(derived, persona);
}

// ---------------------------------------------------------------------------
// Sort — flat list (severity first; optional “new” rows bubble within band)
// ---------------------------------------------------------------------------

export function sortWorkbenchTasksBySeverity(
  tasks: WorkbenchTask[],
  options?: { newTaskIds?: Set<string> },
): WorkbenchTask[] {
  const newIds = options?.newTaskIds;
  return [...tasks].sort((a, b) => {
    const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (s !== 0) return s;
    if (newIds && newIds.size > 0) {
      const aN = newIds.has(a.id) ? 0 : 1;
      const bN = newIds.has(b.id) ? 0 : 1;
      if (aN !== bN) return aN - bN;
    }
    return a.id.localeCompare(b.id);
  });
}

// ---------------------------------------------------------------------------
// Group
// ---------------------------------------------------------------------------

export function groupWorkbenchTasks(tasks: WorkbenchTask[]): TaskGroup[] {
  const groupMap = new Map<string, TaskGroup>();

  for (const task of tasks) {
    const key = task.customerId || "__unmatched__";
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        customerId: task.customerId,
        customerName: task.customerId ? task.customerName : "Unmatched",
        topSeverity: task.severity,
        tasks: [],
      });
    }
    const group = groupMap.get(key)!;
    group.tasks.push(task);
    if (SEVERITY_ORDER[task.severity] < SEVERITY_ORDER[group.topSeverity]) {
      group.topSeverity = task.severity;
    }
  }

  // Sort tasks within each group by severity descending
  for (const group of groupMap.values()) {
    group.tasks.sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
    );
  }

  // Sort groups by top severity descending
  const groups = [...groupMap.values()];
  groups.sort(
    (a, b) => SEVERITY_ORDER[a.topSeverity] - SEVERITY_ORDER[b.topSeverity],
  );

  return groups;
}

// ---------------------------------------------------------------------------
// Stats helpers (used by the summary strip)
// ---------------------------------------------------------------------------

export function computeWorkbenchStats(context: WorkbenchTaskContext) {
  const pendingApprovals = context.approvalRequests.filter(
    (r) => r.status === "Pending Approval",
  );
  const needsReviewQueue = context.queueItems.filter(
    (q) =>
      q.status === "Pending Review" ||
      q.status === "In Progress" ||
      q.status === "Invoice review" ||
      q.status === "Returned",
  );
  const tcvPending =
    needsReviewQueue.reduce((sum, q) => sum + q.tcv, 0) +
    pendingApprovals.reduce((sum, r) => sum + r.invoiceAmount, 0);
  const inflightClosures = Object.keys(context.pendingRenewalIngestions).length;
  const openGraceExtensions = Object.values(context.contractGraceExtensions ?? {}).filter(
    (e) => !e.resolved,
  ).length;

  return {
    pendingApprovalCount: pendingApprovals.length,
    needsReviewCount: needsReviewQueue.length,
    tcvPending,
    inflightClosures,
    openGraceExtensions,
  };
}
