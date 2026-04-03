import type { CalloutConfig } from "@/data/gettingStarted";
import { ArrowRight } from "lucide-react";

interface Props {
  config: CalloutConfig;
}

export function FooterCallout({ config }: Props) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border-default bg-surface-muted/50 px-6 py-5">
      <div className="max-w-xl">
        <h3 className="text-[15px] font-semibold text-text-primary">{config.title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{config.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-cb-orange px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#e5582e]">
          {config.primaryCta}
          <ArrowRight size={14} />
        </button>
        {config.secondaryCta && (
          <button className="rounded-lg border border-border-default px-4 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-white hover:text-text-primary">
            {config.secondaryCta}
          </button>
        )}
      </div>
    </div>
  );
}
