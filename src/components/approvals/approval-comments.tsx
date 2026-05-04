import { useState, useRef } from "react";
import { AtSign, MessageSquare, User } from "lucide-react";
import { cn, shortDate } from "@/lib/utils";
import type { ApprovalComment } from "@/data/ingest-data";

export const APPROVAL_TAGGABLE_USERS = [
  { name: "Jordan Kim", role: "Account Executive" },
  { name: "Priya Mehta", role: "CSM" },
  { name: "Alex Nguyen", role: "Billing Ops" },
  { name: "Marcus Lee", role: "Account Executive" },
  { name: "Rachel Torres", role: "CSM" },
  { name: "Lena Schulz", role: "Billing Ops" },
  { name: "Sarah Chen", role: "VP Revenue" },
];

function highlightMentions(text: string) {
  const parts = text.split(/(@\w[\w\s]*)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="rounded bg-blue-50 px-0.5 font-medium text-blue-700">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function ApprovalCommentItem({ comment }: { comment: ApprovalComment }) {
  const initials = comment.author
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  return (
    <div className="flex gap-3.5 border-b border-border-subtle py-4 last:border-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#012A38] text-[11px] font-bold text-white">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-[13px] font-semibold text-text-primary">{comment.author}</span>
          <span className="ml-auto shrink-0 text-[12px] text-text-muted">{shortDate(comment.timestamp)}</span>
        </div>
        <p className="mt-1.5 text-[14px] leading-relaxed text-text-secondary">{highlightMentions(comment.text)}</p>
      </div>
    </div>
  );
}

/** Bordered card: thread + optional composer — reuse in queue ingest completion, approval full page, etc. */
export function ApprovalCommentsCard({
  comments,
  onSubmitComment,
  id,
  className,
  listMaxHeightClass = "max-h-[280px]",
}: {
  comments: ApprovalComment[];
  /** When set, shows the comment composer below the thread. */
  onSubmitComment?: (text: string) => void;
  id?: string;
  className?: string;
  /** Tailwind max-height for the scrollable list (taller on full-page layouts). */
  listMaxHeightClass?: string;
}) {
  return (
    <div id={id} className={cn("overflow-hidden rounded-lg border border-border-default bg-white", className)}>
      <div className="flex items-center gap-2.5 border-b border-border-subtle bg-gray-50 px-5 py-3">
        <MessageSquare size={15} className="text-text-muted" aria-hidden />
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-text-primary">Comments</h3>
        <span className="ml-auto rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-[12px] font-medium leading-4 text-gray-600">
          {comments.length}
        </span>
      </div>
      <div className={cn("overflow-y-auto px-5", listMaxHeightClass)}>
        {comments.map((c) => (
          <ApprovalCommentItem key={c.id} comment={c} />
        ))}
        {comments.length === 0 && (
          <p className="py-8 text-center text-[14px] text-text-muted lg:py-10">No comments yet.</p>
        )}
      </div>
      {onSubmitComment ? (
        <div className="border-t border-border-subtle p-4">
          <ApprovalCommentInput onSubmit={onSubmitComment} />
        </div>
      ) : null}
    </div>
  );
}

export function ApprovalCommentInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagQuery, setTagQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredUsers = APPROVAL_TAGGABLE_USERS.filter((u) =>
    u.name.toLowerCase().includes(tagQuery.toLowerCase()),
  );

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setText(val);
    const atIdx = val.lastIndexOf("@");
    if (atIdx !== -1 && atIdx >= val.length - 20) {
      const afterAt = val.slice(atIdx + 1);
      if (!afterAt.includes(" ")) {
        setTagQuery(afterAt);
        setShowTagDropdown(true);
        return;
      }
    }
    setShowTagDropdown(false);
  }

  function insertTag(name: string) {
    const atIdx = text.lastIndexOf("@");
    const newText = text.slice(0, atIdx) + `@${name} `;
    setText(newText);
    setShowTagDropdown(false);
    textareaRef.current?.focus();
  }

  function handleSubmit() {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        rows={3}
        placeholder="Add a comment... Use @ to tag"
        className="w-full resize-none rounded-md border border-border-default bg-white px-4 py-3 text-[14px] leading-relaxed text-text-primary outline-none placeholder:text-text-muted focus:border-cb-orange"
      />
      {showTagDropdown && filteredUsers.length > 0 && (
        <div className="absolute bottom-[calc(100%+4px)] left-0 z-20 w-64 rounded-lg border border-border-default bg-white py-1.5 shadow-lg">
          {filteredUsers.map((u) => (
            <button
              key={u.name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertTag(u.name);
              }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-surface-muted"
            >
              <User size={15} className="shrink-0 text-text-muted" />
              <div>
                <p className="text-[14px] font-medium text-text-primary">{u.name}</p>
                <p className="text-[12px] text-text-muted">{u.role}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setText(text + "@");
            textareaRef.current?.focus();
            setShowTagDropdown(true);
            setTagQuery("");
          }}
          className="flex items-center gap-1.5 text-[13px] text-text-muted transition-colors hover:text-text-secondary"
        >
          <AtSign size={14} /> Tag
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-md bg-[#012A38] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#01374a]"
        >
          Post
        </button>
      </div>
    </div>
  );
}
