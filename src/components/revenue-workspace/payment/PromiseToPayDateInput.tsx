import { forwardRef } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  className?: string;
};

export const PromiseToPayDateInput = forwardRef<HTMLInputElement, Props>(
  function PromiseToPayDateInput({ id, value, onChange, onClear, className }, ref) {
    const showClear = value.length > 0;

    return (
      <div className={cn("relative min-w-0", className)}>
        <Input
          ref={ref}
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(showClear && "pr-10")}
        />
        {showClear ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary"
            aria-label="Clear date"
          >
            <X size={14} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>
    );
  },
);
