import { forwardRef, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Shared form tokens — modern, calm, enterprise (Linear / Stripe / Vercel).
// Use sentence-case labels (NOT uppercase). Cool blue focus ring. Subtle shadow.
// ---------------------------------------------------------------------------

/** Sentence-case label above any input or select. */
export const formLabelClass =
  "text-[13px] font-medium leading-tight text-text-secondary";

/** Hint or helper text shown below the input. */
export const formHintClass = "text-[12px] leading-snug text-text-muted";

/** Inline error text shown below the input. */
export const formErrorClass = "text-[12px] leading-snug text-red-600";

/** Single-line input / select / date height + chrome. Use this for `<input>`, `<select>`, and prefix-shells. */
export const formInputClass = cn(
  "h-9 w-full rounded-md border border-border-default bg-white px-3 text-[14px] text-text-primary",
  "shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-colors",
  "placeholder:text-text-muted",
  "hover:border-gray-300",
  "focus:border-[color:var(--color-info)] focus:ring-2 focus:ring-blue-100",
  "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-text-muted",
);

/** Multi-line textarea — drops fixed height, keeps the rest of the chrome. */
export const formTextareaClass = cn(
  "w-full rounded-md border border-border-default bg-white px-3 py-2 text-[14px] leading-relaxed text-text-primary",
  "shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-colors",
  "placeholder:text-text-muted",
  "hover:border-gray-300",
  "focus:border-[color:var(--color-info)] focus:ring-2 focus:ring-blue-100",
  "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-text-muted",
);

/** Inline shell for inputs that need a $ / % / unit prefix. Wrap a bare <input> with `bg-transparent outline-none`. */
export const formInputShellClass = cn(
  "flex h-9 w-full items-center rounded-md border border-border-default bg-white px-3",
  "shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors",
  "hover:border-gray-300",
  "focus-within:border-[color:var(--color-info)] focus-within:ring-2 focus-within:ring-blue-100",
);

// ---------------------------------------------------------------------------
// FormField — the canonical label + control + hint group
// ---------------------------------------------------------------------------

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  optional,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className={cn(formLabelClass, "flex items-center gap-1.5")}>
        <span>{label}</span>
        {required ? <span className="text-red-500" aria-hidden>*</span> : null}
        {optional ? (
          <span className="text-[12px] font-normal text-text-muted">(optional)</span>
        ) : null}
      </label>
      {children}
      {error ? <p className={formErrorClass}>{error}</p> : hint ? <p className={formHintClass}>{hint}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Input / Select / Textarea — drop-in styled controls
// ---------------------------------------------------------------------------

export const Input = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(formInputClass, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(formTextareaClass, "resize-none", className)} {...props} />;
  },
);

/** Native select with a chevron. Use inside FormField. */
export const Select = forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(formInputClass, "cursor-pointer appearance-none pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={2}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
        aria-hidden
      />
    </div>
  );
});

// ---------------------------------------------------------------------------
// Prefix / Suffix input (e.g. $ amount, % discount)
// ---------------------------------------------------------------------------

export const PrefixInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { prefix?: ReactNode; suffix?: ReactNode; inputClassName?: string }
>(function PrefixInput({ prefix, suffix, inputClassName, className, ...props }, ref) {
  return (
    <div className={cn(formInputShellClass, className)}>
      {prefix ? <span className="mr-0 shrink-0 text-[13px] text-text-muted">{prefix}</span> : null}
      <input
        ref={ref}
        {...props}
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-muted",
          "disabled:cursor-not-allowed disabled:text-text-muted",
          inputClassName,
        )}
      />
      {suffix ? <span className="ml-1 shrink-0 text-[13px] text-text-muted">{suffix}</span> : null}
    </div>
  );
});

// ---------------------------------------------------------------------------
// FieldStack / FieldGrid — consistent rhythm for groups of fields
// ---------------------------------------------------------------------------

/** Vertical stack of FormFields with consistent gap (16px). */
export function FieldStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-4", className)}>{children}</div>;
}

/** Two-column grid of FormFields with consistent gap (16px). */
export function FieldGrid({
  children,
  columns = 2,
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const cols = columns === 3 ? "sm:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : "";
  return <div className={cn("grid grid-cols-1 gap-x-5 gap-y-4", cols, className)}>{children}</div>;
}
