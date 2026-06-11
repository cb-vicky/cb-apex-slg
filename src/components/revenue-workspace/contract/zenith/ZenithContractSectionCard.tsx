import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** White rounded section container with external title — matches Summary tab section cards. */
export function ZenithContractSectionCard({
  title,
  children,
  contentClassName,
}: {
  title: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <section className="mx-auto w-full max-w-[560px]">
      <h2 className="mb-2 font-sora text-[14px] font-bold leading-tight tracking-normal text-text-primary">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border-default bg-white">
        <div className={cn("flex flex-col gap-4 px-5 py-4", contentClassName)}>{children}</div>
      </div>
    </section>
  );
}
