import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function PromiseToPayNoteTextarea({
  value,
  onChange,
  id,
  placeholder = "Add context for this promise to pay…",
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, 100), 300);
    el.style.height = `${next}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      id={id}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full min-h-[100px] max-h-[300px] resize-none overflow-y-auto rounded-md border border-border-default bg-white px-3 py-2 text-[14px] leading-relaxed text-text-primary",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-colors",
        "placeholder:text-text-muted hover:border-gray-300",
        "focus:border-[color:var(--color-info)] focus:ring-2 focus:ring-blue-100",
      )}
    />
  );
}
