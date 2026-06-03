import { useRef, useEffect, useState } from "react";
import { addCollectionComment } from "@/data/collections-comments";
import { SectionCard } from "@/components/ui/primitives";
import { FieldStack, FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

function AutoGrowTextarea({
  value,
  onChange,
  id,
  placeholder,
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
        "focus:border-[color:var(--color-cb-orange)] focus:ring-2 focus:ring-orange-100",
      )}
    />
  );
}

interface Props {
  customerId: string;
  authorName: string;
  defaultPinned?: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function AddCollectionCommentForm({
  customerId,
  authorName,
  defaultPinned = false,
  onCancel,
  onSave,
}: Props) {
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(defaultPinned);

  function handleSave() {
    const trimmed = body.trim();
    if (!trimmed) return;

    addCollectionComment({
      customerId,
      body: trimmed,
      authorName,
      pinned,
    });

    onSave();
  }

  const canSave = body.trim().length > 0;

  return (
    <SectionCard title="Add comment">
      <FieldStack>
        <FormField label="Comment" htmlFor="collection-comment-body" required>
          <AutoGrowTextarea
            id="collection-comment-body"
            value={body}
            onChange={setBody}
            placeholder="Add context for collections — payment behavior, internal coordination, escalation notes…"
          />
        </FormField>

        <label className="flex w-fit cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="h-4 w-4 rounded border-border-default text-[color:var(--color-cb-orange)] focus:ring-[color:var(--color-cb-orange)]"
          />
          <span className="text-[13px] font-medium text-text-primary">Pin comment</span>
          <span className="text-[12px] text-text-muted">Shows in Overview pinned section</span>
        </label>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-lg bg-[color:var(--color-cb-orange)] px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-lg border border-border-default bg-white px-4 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </FieldStack>
    </SectionCard>
  );
}
