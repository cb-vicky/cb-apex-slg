import { useState, useEffect } from "react";
import { openDrawer } from "@/store/drawer-store";
import { X, Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { sampleDocs, analysisMessages } from "@/data/ingest-data";
import { getQueueItemBySample } from "@/data/queue-data";
import { useIngestContext } from "@/context/IngestContext";

interface Props {
  onClose: () => void;
}

type Step = "choose" | "loading" | "done";

export function UploadModal({ onClose }: Props) {
  const { setSelectedSample } = useIngestContext();

  const [step, setStep] = useState<Step>("choose");
  const [chosenSample, setChosenSample] = useState<"sample2" | "sample3" | null>(null);
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);

  // Drive the loading animation
  useEffect(() => {
    if (step !== "loading") return;

    const totalMs = 3200;
    const tickMs = 60;
    const steps = totalMs / tickMs;
    let tick = 0;

    const iv = setInterval(() => {
      tick++;
      setProgress(Math.min((tick / steps) * 100, 100));
      setMsgIdx(Math.floor((tick / steps) * (analysisMessages.length - 1)));
      if (tick >= steps) {
        clearInterval(iv);
        setStep("done");
      }
    }, tickMs);

    return () => clearInterval(iv);
  }, [step]);

  // Auto-navigate after done
  useEffect(() => {
    if (step !== "done" || !chosenSample) return;
    const t = setTimeout(() => {
      setSelectedSample(chosenSample);
      const queueItem = getQueueItemBySample(chosenSample);
      if (queueItem) {
        openDrawer({ entityType: "queue_item", mode: "ingest", entityId: queueItem.id });
      }
      onClose();
    }, 600);
    return () => clearTimeout(t);
  }, [step, chosenSample, setSelectedSample, onClose]);

  function handleSampleClick(id: "sample2" | "sample3") {
    setChosenSample(id);
    setStep("loading");
    setProgress(0);
    setMsgIdx(0);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={step === "choose" ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative z-10 w-[520px] rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-text-primary">Upload Signed Contract</h2>
            <p className="mt-0.5 text-[12px] text-text-muted">
              Upload a signed contract document to begin the ingestion workflow.
            </p>
          </div>
          {step === "choose" && (
            <button
              onClick={onClose}
              className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {step === "choose" && (
            <>
              {/* Upload area */}
              <div className="flex cursor-default flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-default bg-surface-muted px-6 py-8 text-center">
                <Upload size={28} className="mb-3 text-text-muted" />
                <p className="text-[13px] font-medium text-text-secondary">
                  Drag and drop a PDF or click to browse
                </p>
                <p className="mt-1 text-[11px] text-text-muted">
                  Supports signed PDF contracts, order forms, and MSAs
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-md border border-border-default bg-white px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
                >
                  Browse files
                </button>
              </div>

              {/* Sample documents */}
              <div className="mt-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Or use a sample document
                </p>
                <div className="flex flex-col gap-2">
                  {sampleDocs.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => handleSampleClick(doc.id)}
                      className="flex items-start gap-3 rounded-lg border border-border-default bg-white px-4 py-3 text-left transition-colors hover:border-cb-orange/40 hover:bg-cb-orange/5"
                    >
                      <FileText size={16} className="mt-0.5 shrink-0 text-text-muted" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-text-primary">{doc.label}</p>
                        <p className="mt-0.5 text-[11px] text-text-muted">{doc.subtitle}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-text-muted">{doc.documentName}</p>
                      </div>
                      <span
                        className={cn(
                          "mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                          doc.path === "happy"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        )}
                      >
                        {doc.path === "happy" ? "Happy path" : "Exception path"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {(step === "loading" || step === "done") && (
            <div className="flex flex-col items-center py-6">
              {step === "loading" ? (
                <Loader2 size={32} className="mb-4 animate-spin text-cb-orange" />
              ) : (
                <CheckCircle2 size={32} className="mb-4 text-emerald-500" />
              )}

              <p className="text-[14px] font-semibold text-text-primary">
                {step === "loading" ? "Analysing document..." : "Analysis complete"}
              </p>
              <p className="mt-1 text-[12px] text-text-muted">
                {step === "loading"
                  ? analysisMessages[msgIdx]
                  : "Redirecting to verification workspace..."}
              </p>

              {/* Progress bar */}
              <div className="mt-6 h-1.5 w-full rounded-full bg-surface-subtle">
                <div
                  className="h-1.5 rounded-full bg-cb-orange transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {step === "loading" && (
                <div className="mt-4 space-y-1.5 self-start">
                  {analysisMessages.map((msg, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {i < msgIdx ? (
                        <CheckCircle2 size={12} className="shrink-0 text-emerald-500" />
                      ) : i === msgIdx ? (
                        <Loader2 size={12} className="shrink-0 animate-spin text-cb-orange" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-border-default" />
                      )}
                      <span
                        className={cn(
                          "text-[11px]",
                          i < msgIdx
                            ? "text-emerald-600"
                            : i === msgIdx
                              ? "font-medium text-text-primary"
                              : "text-text-muted"
                        )}
                      >
                        {msg}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "choose" && (
          <div className="flex justify-end gap-2 border-t border-border-default px-6 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border-default px-4 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
