import { Sparkles, X } from "lucide-react";
import { Textarea } from "@/components/ui/form-field";

interface AiChatPanelProps {
  onClose?: () => void;
}

/** Right-rail AI chat — visibility and toggle live in `AppShell`. */
export function AiChatPanel({ onClose }: AiChatPanelProps) {
  return (
    <section
      aria-label="AI assistant"
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[24px] border border-border-default bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-border-default px-4 py-3">
        <Sparkles size={16} strokeWidth={2} className="shrink-0 text-cb-orange" aria-hidden />
        <h2 className="truncate font-sora text-[14px] font-semibold text-text-primary">
          AI assistant
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-gray-100 hover:text-text-secondary"
          aria-label="Close AI assistant"
        >
          <X size={14} strokeWidth={2} aria-hidden />
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <Textarea
          id="ai-chat-input"
          rows={6}
          placeholder="Ask about customers, billing, contracts, or policies…"
          className="min-h-[120px] flex-1 resize-y"
          aria-label="Message to AI assistant"
        />
      </div>
    </section>
  );
}
