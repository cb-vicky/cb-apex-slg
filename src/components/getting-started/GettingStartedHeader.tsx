import type { Role, RoleConfig } from "@/data/gettingStarted";

interface Props {
  role: Role;
  config: RoleConfig;
}

export function GettingStartedHeader({ config }: Props) {
  return (
    <div className="flex items-start justify-between gap-6">
      {/* Left: title + subtitle */}
      <div className="flex max-w-2xl flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Welcome back, John.
        </h1>
        <p className="text-[14px] leading-relaxed text-text-secondary">
          {config.subtitle}
        </p>
      </div>

      {/* Right: badges + CTAs */}
      <div className="flex shrink-0 flex-col items-end justify-end gap-3 self-stretch">
        {/* CTAs */}
        <div className="flex items-center gap-2">
          <button className="rounded-lg bg-cb-orange px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#e5582e]">
            {config.primaryCta}
          </button>
          <button className="rounded-lg border border-border-default px-4 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary">
            {config.secondaryCta}
          </button>
        </div>
      </div>
    </div>
  );
}
