/** Placeholder index for shell nav items that are not wired to full list pages yet. */
export function ModuleStubPage({ title }: { title: string }) {
  return (
    <div className="h-full w-full overflow-auto px-6 py-6">
      <p className="mb-1 text-[12px] font-semibold uppercase tracking-wider text-text-muted">
        Coming soon
      </p>
      <h1 className="font-sora text-[22px] font-semibold text-text-primary">{title}</h1>
      <p className="mt-2 max-w-md text-[13px] text-text-secondary">
        This module index is a placeholder in the prototype shell.
      </p>
    </div>
  );
}
