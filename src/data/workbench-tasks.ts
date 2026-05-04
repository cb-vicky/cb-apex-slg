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
import type {
  ContractGraceExtension,
  DrawerEntityType,
  DrawerMode,
  TransitionFlowSession,
} from "@/data/contract-transition";
import { customers, tasks as customerTasks } from "@/data/mock-data";
import type { DemoPersona } from "@/types/demo-persona";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkbenchTaskDrawerLaunch {
  entityType: DrawerEntityType;
  mode?: DrawerMode;
  entityId?: string;
  /** When opening the drawer for a specific unified-flow step (e.g. invoice review). */
  flow?: TransitionFlowSession | null;
  context?: {
    customerId?: string;
    contractId?: string;
    latePhase?: "extend" | "resolve";
    queueItemId?: string;
  };
}

export interface WorkbenchTask {
  id: string;
  customerId?: string;
  customerName: string;
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
  destination: string; // full path including query params
  /** When set, My Tasks opens the unified EntityDrawer instead of routing away. */
  drawer?: WorkbenchTaskDrawerLaunch;
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
    // Ingestable late renewal opens the 3-step drawer (ingest_invoice scenario).
    // Non-ingestable late renewal routes to the customer workspace for grace handling.
    const destination =
      isLateRenewal && !q.ingestable && q.customerId && q.activeContractId
        ? `/customers/${q.customerId}?tab=contract&contractId=${q.activeContractId}`
        : `/queue/${q.id}`;
    const drawer: WorkbenchTaskDrawerLaunch | undefined = q.ingestable
      ? isLateRenewal && q.customerId && q.activeContractId
        ? {
            entityType: "queue_item",
            mode: "ingest",
            entityId: q.id,
            // Reuse the same `ingest_invoice` scenario as Early Renewal so the
            // drawer/components/steps are identical. The only differences are the
            // small "contract in extension" banners shown in IngestDrawer + close-prior step.
            flow: {
              scenario: "ingest_invoice",
              step: q.status === "Invoice review" && q.invoiceId ? "invoice_review" : "ingest",
              furthestUnlockedStep:
                q.status === "Invoice review" && q.invoiceId ? "invoice_review" : "ingest",
              queueItemId: q.id,
              customerId: q.customerId,
              contractId: q.activeContractId,
              ...(q.status === "Invoice review" && q.invoiceId ? { invoiceId: q.invoiceId } : {}),
            } satisfies TransitionFlowSession,
            context: {
              customerId: q.customerId,
              contractId: q.activeContractId,
              queueItemId: q.id,
            },
          }
        : {
            entityType: "queue_item",
            mode: "ingest",
            entityId: q.id,
            ...(q.status === "Invoice review" && q.invoiceId
              ? {
                  flow: {
                    scenario: "ingest_invoice",
                    step: "invoice_review",
                    furthestUnlockedStep: "invoice_review",
                    queueItemId: q.id,
                    invoiceId: q.invoiceId,
                    contractId: q.contractId,
                    customerId: q.customerId,
                  } satisfies TransitionFlowSession,
                }
              : {}),
          }
      : isLateRenewal && q.customerId && q.activeContractId
        ? {
            entityType: "transition",
            mode: "late_renewal",
            context: {
              customerId: q.customerId,
              contractId: q.activeContractId,
              latePhase: "extend",
            },
            flow: {
              scenario: "late_grace",
              step: "grace_extend",
              furthestUnlockedStep: "grace_extend",
              customerId: q.customerId,
              contractId: q.activeContractId,
              showStepper: true,
            },
          }
        : undefined;
    const type: WorkbenchTask["type"] =
      isLateRenewal && !q.ingestable ? "late-renewal" : "contract-ingest";
    
    let subtitle = `${q.scenario} · ${q.source}`;
    if (isLateRenewal) {
      subtitle = q.ingestable
        ? "Renewal contract received — ingest and close prior"
        : "Contract expired — extend grace or renew";
    }
    
    derived.push({
      id: `queue-${q.id}`,
      customerId: q.customerId,
      customerName: q.customerName,
      type,
      title: q.documentName,
      subtitle,
      severity: scenarioToSeverity(q.scenario),
      destination,
      drawer,
      assignee: q.uploadedBy,
      source: "queue",
    });
  }

  // Note: Grace extension tasks are now handled through the queue item status.
  // When grace is extended, the queue item moves to "Grace Extended" status (hidden).
  // When the renewal contract becomes ingestable, the queue item moves back to
  // "Pending Review" with ingestable=true and shows as "Renewal contract received".

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
        type: "closure-approval",
        title: `Closure approval: ${req.invoiceId}`,
        subtitle: pendingRenewal
          ? "Early renewal — prior contract closure"
          : "Contract closure document",
        severity: "critical",
        destination,
        drawer: {
          entityType: "invoice",
          mode: "invoice_approval",
          entityId: req.invoiceId,
          context: {
            queueItemId: pendingRenewal?.queueItemId,
          },
        },
        assignee: req.approver,
        source: "approval",
      });
    } else {
      let destination = `/approvals/invoices/${req.invoiceId}`;
      if (req.ingestId) {
        destination += `?ingestId=${encodeURIComponent(req.ingestId)}`;
      }
      const drawer: WorkbenchTaskDrawerLaunch | undefined = {
        entityType: "invoice",
        mode: "invoice_approval",
        entityId: req.invoiceId,
        context: req.ingestId ? { queueItemId: req.ingestId } : undefined,
        ...(req.ingestId
          ? {
              flow: {
                scenario: "ingest_invoice",
                step: "invoice_review",
                furthestUnlockedStep: "invoice_review",
                invoiceId: req.invoiceId,
                queueItemId: req.ingestId,
              } satisfies TransitionFlowSession,
            }
          : {}),
      };
      derived.push({
        id: `approval-${req.id}`,
        customerId: req.customerId || undefined,
        customerName: req.customerName || "Unknown",
        type: "invoice-approval",
        title: `Invoice approval: ${req.invoiceId}`,
        subtitle: `Submitted by ${req.submittedBy}`,
        severity: "high",
        destination,
        drawer,
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
