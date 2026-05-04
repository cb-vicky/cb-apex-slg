import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { closeDrawer, openDrawer } from "@/store/drawer-store";
import type { FlowStepId } from "@/data/contract-transition";
import { useDemoPersona } from "@/context/DemoPersonaContext";

const STEPS: FlowStepId[] = ["ingest", "close_prior", "grace_extend", "invoice_review", "approval"];

/**
 * Deep link: `/approvals/invoices/:invoiceId?ingestId=…&step=…`
 * opens the global drawer over Workbench.
 */
export function useApprovalUrlDrawerSync() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [params] = useSearchParams();
  const ingestId = params.get("ingestId") ?? "";
  const stepRaw = params.get("step") ?? "";
  const closureQueueItemId = params.get("queueItemId") ?? "";
  const { persona } = useDemoPersona();

  useEffect(() => {
    if (!invoiceId) return;
    const queueLink = ingestId || closureQueueItemId;
    const hasIngestLink = Boolean(ingestId);

    const defaultStep: FlowStepId =
      hasIngestLink && persona === "approver"
        ? "invoice_review"
        : hasIngestLink
          ? "ingest"
          : "approval";

    let step: FlowStepId = STEPS.includes(stepRaw as FlowStepId) ? (stepRaw as FlowStepId) : defaultStep;
    if (hasIngestLink && step === "approval") {
      step = persona === "approver" ? "invoice_review" : "ingest";
    }

    const furthest: FlowStepId = STEPS.includes(step) ? step : defaultStep;

    if (hasIngestLink && (step === "ingest" || step === "invoice_review")) {
      openDrawer({
        entityType: "queue_item",
        mode: "ingest",
        entityId: ingestId,
        context: { queueItemId: ingestId },
        flow: {
          scenario: "ingest_invoice",
          step,
          furthestUnlockedStep: furthest,
          queueItemId: ingestId,
          invoiceId,
          showStepper: true,
        },
      });
      return;
    }

    openDrawer({
      entityType: "invoice",
      mode: "invoice_approval",
      entityId: invoiceId,
      context: { queueItemId: queueLink || undefined },
      flow: {
        scenario: hasIngestLink ? "ingest_invoice" : "invoice_only",
        step,
        furthestUnlockedStep: furthest,
        showStepper: hasIngestLink,
        invoiceId,
        queueItemId: queueLink || undefined,
      },
    });
  }, [invoiceId, ingestId, stepRaw, closureQueueItemId, persona]);

  useEffect(
    () => () => {
      closeDrawer();
    },
    [],
  );
}
