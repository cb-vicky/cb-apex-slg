import { Check, ChevronRight, Lock, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDrawerStore } from "@/store/useDrawerStore";
import { patchFlowSession } from "@/store/drawer-store";
import { IngestDrawer } from "@/components/transitions/IngestDrawer";
import { InvoiceReviewStep } from "@/components/transitions/InvoiceReviewStep";
import { InvoiceApprovalDrawer } from "@/components/approvals/InvoiceApprovalDrawer";
import { EarlyRenewalClosePriorStep } from "@/components/transitions/EarlyRenewalClosePriorStep";
import { ExtendGraceStep } from "@/components/transitions/ExtendGraceStep";
import { ApprovalSettingsStep } from "@/components/transitions/ApprovalSettingsStep";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import { UnifiedDrawerChromeProvider, useUnifiedDrawerChrome } from "@/context/UnifiedDrawerChromeContext";
import { useIngestContext } from "@/context/IngestContext";
import type { FlowScenario, FlowStepId, TransitionFlowSession } from "@/data/contract-transition";
import { cn, shortDate } from "@/lib/utils";

type StepDef = { id: FlowStepId; label: string; short: string };

function buildIngestInvoiceSteps(queueScenario?: string): StepDef[] {
  if (queueScenario === "Early Renewal" || queueScenario === "Late Renewal") {
    return [
      { id: "ingest", label: "Contract extraction", short: "1" },
      { id: "close_prior", label: "Close prior", short: "2" },
      { id: "invoice_review", label: "Invoice review", short: "3" },
    ];
  }
  return [
    { id: "ingest", label: "Contract extraction", short: "1" },
    { id: "invoice_review", label: "Invoice review", short: "2" },
  ];
}

const LATE_GRACE_STEPS: StepDef[] = [
  { id: "grace_extend", label: "Extend grace", short: "1" },
];

function stepRank(step: FlowStepId, ordered: StepDef[]): number {
  const i = ordered.findIndex((s) => s.id === step);
  return i;
}

function UnifiedFlowShellHeader({
  onClose,
  queueId,
  invoiceId,
  scenario,
  contractId,
  latePhase,
  sourceInfo,
}: {
  onClose: () => void;
  queueId?: string;
  invoiceId?: string | undefined;
  scenario: FlowScenario;
  contractId?: string;
  latePhase?: "extend" | "resolve";
  sourceInfo?: { source: string; uploadedAt: string };
}) {
  const navigate = useNavigate();

  const flowTitle =
    scenario === "invoice_only"
      ? "Approvals"
      : scenario === "late_grace"
        ? latePhase === "resolve"
          ? "Late renewal · resolve"
          : "Late renewal · grace"
        : "Contract ingest";

  return (
    <header className="shrink-0 border-b border-gray-100 bg-white px-4 py-1.5 sm:px-5">
      <div className="flex min-h-[28px] items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
          <nav className="flex min-w-0 flex-wrap items-center gap-1 text-[12px] leading-tight text-text-muted">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/queue");
              }}
              className="text-text-secondary transition-colors hover:text-text-primary"
            >
              Queue
            </button>
            <ChevronRight size={11} className="mx-0.5 shrink-0 text-text-muted/50" />
            <span className="truncate font-medium text-text-primary">{flowTitle}</span>
            {queueId ? (
              <>
                <ChevronRight size={11} className="mx-0.5 shrink-0 text-text-muted/50" />
                <span className="truncate text-text-secondary">{queueId}</span>
              </>
            ) : null}
            {scenario === "late_grace" && contractId ? (
              <>
                <ChevronRight size={11} className="mx-0.5 shrink-0 text-text-muted/50" />
                <span className="truncate font-mono text-[11px] text-text-secondary">{contractId}</span>
              </>
            ) : null}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {sourceInfo ? (
            <div className="flex items-center gap-3 text-[11px] leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-text-muted">Source</span>
                <span className="font-medium text-text-primary">{sourceInfo.source}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-text-muted">Uploaded</span>
                <span className="font-medium text-text-primary">{sourceInfo.uploadedAt}</span>
              </div>
            </div>
          ) : null}
          {invoiceId ? (
            <span className="rounded border border-border-subtle bg-surface-muted px-2 py-1 font-mono text-[11px] leading-tight text-text-secondary">
              {invoiceId}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function UnifiedFlowStepper({
  activeFlow,
  orderedSteps,
  furthestRank,
  goStep,
}: {
  activeFlow: TransitionFlowSession;
  orderedSteps: StepDef[];
  furthestRank: number;
  goStep: (id: FlowStepId) => void;
}) {
  const { trailingActions } = useUnifiedDrawerChrome();

  const currentRank = stepRank(activeFlow.step, orderedSteps);
  if (currentRank < 0) return null;

  return (
    <div className="relative z-10 shrink-0 rounded-bl-3xl rounded-br-3xl border border-gray-200 bg-white/65 px-4 py-2 shadow-[0_8px_24px_-12px_rgba(17,24,39,0.18)] backdrop-blur-md backdrop-saturate-150 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <div className="flex min-w-0 flex-1 items-center justify-center gap-0 sm:justify-start sm:gap-1">
          {orderedSteps.map((s, idx) => {
            const stepRankVal = stepRank(s.id, orderedSteps);
            const active = activeFlow.step === s.id;
            const completed = currentRank > stepRankVal;
            const lockedForward = stepRankVal > furthestRank;
            const clickable = !lockedForward;

            return (
              <div key={s.id} className="flex min-w-0 items-center">
                {idx > 0 ? (
                  <div
                    className={cn(
                      "mx-1.5 hidden h-px w-5 shrink-0 sm:mx-2 sm:block sm:w-8",
                      completed ? "bg-emerald-500/70" : "bg-border-default",
                    )}
                    aria-hidden
                  />
                ) : null}
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => goStep(s.id)}
                  title={lockedForward ? "Complete the previous step first" : `Go to ${s.label}`}
                  className={cn(
                    "group flex min-w-0 max-w-[140px] flex-col items-center gap-1 rounded-md px-2 py-1 text-left transition-colors sm:max-w-none sm:flex-row sm:items-center sm:gap-2 sm:px-2.5 sm:py-1",
                    clickable && "hover:bg-white",
                    !clickable && "cursor-not-allowed opacity-50",
                    active && "bg-white ring-1 ring-border-default",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                      active && "bg-[color:var(--color-info)] text-white",
                      !active && completed && "bg-emerald-600 text-white",
                      !active && !completed && !lockedForward && "border border-border-default bg-white text-text-secondary",
                      lockedForward && "border border-dashed border-text-muted/40 bg-surface-muted text-text-muted",
                    )}
                  >
                    {lockedForward ? (
                      <Lock size={11} strokeWidth={2.5} className="opacity-80" aria-hidden />
                    ) : completed ? (
                      <Check size={12} strokeWidth={2.75} aria-hidden />
                    ) : (
                      <span aria-hidden>{s.short}</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "max-w-[100px] truncate text-center text-[12px] font-medium sm:max-w-none sm:text-left",
                      active ? "text-text-primary" : "text-text-muted group-hover:text-text-secondary",
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        {trailingActions ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{trailingActions}</div>
        ) : null}
      </div>
    </div>
  );
}

function UnifiedFlowShellInner({ onClose }: { onClose: () => void }) {
  const { flow, entityType, entityId, context } = useDrawerStore();
  const { persona } = useDemoPersona();
  const { queueItems } = useIngestContext();

  if (!flow) return null;

  const activeFlow = flow;

  const queueId =
    flow.queueItemId ?? (entityType === "queue_item" ? entityId : undefined) ?? context?.queueItemId;
  const invoiceId =
    flow.invoiceId ?? (entityType === "invoice" ? entityId : undefined) ?? undefined;

  const queueItem = queueId ? queueItems.find((q) => q.id === queueId) : undefined;
  const contractIdForHeader =
    flow.contractId ?? context?.contractId ?? queueItem?.contractId ?? queueItem?.activeContractId;

  const ingestSteps = buildIngestInvoiceSteps(queueItem?.scenario);
  const latePhase = context?.latePhase;

  const orderedSteps: StepDef[] =
    activeFlow.scenario === "late_grace"
      ? LATE_GRACE_STEPS.map((s) =>
          s.id === "grace_extend" && latePhase === "resolve"
            ? { ...s, label: "Resolve grace" }
            : s,
        )
      : activeFlow.scenario === "ingest_invoice"
        ? ingestSteps
        : [];

  const furthestStep = activeFlow.furthestUnlockedStep ?? orderedSteps[0]?.id ?? "ingest";
  const rawFurthestRank = orderedSteps.length > 0 ? stepRank(furthestStep, orderedSteps) : 0;
  const furthestRank = rawFurthestRank < 0 ? 0 : rawFurthestRank;

  const showStepper =
    (activeFlow.scenario === "ingest_invoice" || activeFlow.scenario === "late_grace") &&
    orderedSteps.length > 0;

  function goStep(id: FlowStepId) {
    if (activeFlow.scenario === "invoice_only") {
      patchFlowSession({ step: id });
      return;
    }
    if (activeFlow.scenario === "late_grace") {
      const targetRank = stepRank(id, LATE_GRACE_STEPS);
      if (targetRank < 0) return;
      if (targetRank > furthestRank) return;
      patchFlowSession({ step: id });
      return;
    }
    if (activeFlow.scenario !== "ingest_invoice") {
      patchFlowSession({ step: id });
      return;
    }
    const targetRank = stepRank(id, ingestSteps);
    if (targetRank < 0) return;
    if (targetRank > furthestRank) return;
    patchFlowSession({
      step: id,
      ingestReadOnly: id === "ingest" && persona === "approver",
    });
  }

  const shellKey = `${activeFlow.key ?? "flow"}-${activeFlow.step}-${queueId ?? ""}-${invoiceId ?? ""}`;

  const ingestReadOnly = Boolean(activeFlow.ingestReadOnly);

  const lateContractId = flow.contractId ?? context?.contractId;

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col bg-gray-100">
      <UnifiedFlowShellHeader
        onClose={onClose}
        queueId={queueId}
        invoiceId={invoiceId}
        scenario={activeFlow.scenario}
        contractId={contractIdForHeader}
        latePhase={latePhase}
        sourceInfo={
          queueItem
            ? { source: queueItem.source, uploadedAt: shortDate(queueItem.uploadedAt) }
            : undefined
        }
      />

      {showStepper ? (
        <UnifiedFlowStepper
          activeFlow={activeFlow}
          orderedSteps={orderedSteps}
          furthestRank={furthestRank}
          goStep={goStep}
        />
      ) : null}

      <div key={shellKey} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {flow.scenario === "ingest_invoice" && flow.step === "ingest" && queueId ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <IngestDrawer
              entityType="queue_item"
              mode="ingest"
              entityId={queueId}
              context={context}
              onClose={onClose}
              presentation="page"
              omitHeader
              readOnly={ingestReadOnly}
            />
          </div>
        ) : null}

        {flow.scenario === "ingest_invoice" && flow.step === "close_prior" && queueId ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <EarlyRenewalClosePriorStep queueItemId={queueId} />
          </div>
        ) : null}

        {flow.scenario === "ingest_invoice" && flow.step === "invoice_review" && queueId && invoiceId ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <InvoiceReviewStep queueItemId={queueId} invoiceId={invoiceId} />
          </div>
        ) : null}

        {flow.scenario === "invoice_only" && flow.step === "approval" && invoiceId ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <InvoiceApprovalDrawer
              invoiceId={invoiceId}
              queueItemId={queueId}
              onClose={onClose}
              omitHeader={false}
            />
          </div>
        ) : null}

        {flow.scenario === "late_grace" &&
        flow.step === "grace_extend" &&
        lateContractId ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <ExtendGraceStep
              queueItemId={queueId ?? ""}
              contractId={lateContractId}
            />
          </div>
        ) : null}

        {flow.step === "approval_settings" ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <ApprovalSettingsStep queueItemId={queueId} invoiceId={invoiceId} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function UnifiedFlowShell({ onClose }: { onClose: () => void }) {
  return (
    <UnifiedDrawerChromeProvider>
      <UnifiedFlowShellInner onClose={onClose} />
    </UnifiedDrawerChromeProvider>
  );
}
