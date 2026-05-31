import type { ReactNode } from "react";

/** White rounded section container — matches Summary tab section cards. */
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
    <section className="overflow-hidden rounded-3xl border border-border-default bg-white">
      <div className="flex flex-col gap-4 px-5 py-4">
        <h2 className="font-sora text-[14px] font-bold leading-tight tracking-normal text-text-primary">
          {title}
        </h2>
        <div className={contentClassName ?? "flex max-w-md flex-col gap-4"}>{children}</div>
      </div>
    </section>
  );
}
