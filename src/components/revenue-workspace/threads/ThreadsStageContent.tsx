import { useState, useMemo } from "react";
import {
  Star,
  Paperclip,
  Reply,
  Forward,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  Image,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/data/mock-data";
import {
  getThreadsForCustomer,
  getMessagesForThread,
  type EmailThread,
  type EmailMessage,
} from "@/data/email-threads";

interface Props {
  customer: Customer;
}

export function ThreadsStageContent({ customer }: Props) {
  const threads = useMemo(() => getThreadsForCustomer(customer.id), [customer.id]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    threads[0]?.id ?? null
  );
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyToThread, setReplyToThread] = useState<EmailThread | null>(null);

  const selectedThread = threads.find((t) => t.id === selectedThreadId);
  const messages = selectedThreadId ? getMessagesForThread(selectedThreadId) : [];

  function handleReply(thread: EmailThread) {
    setReplyToThread(thread);
    setComposeOpen(true);
  }

  function handleCompose() {
    setReplyToThread(null);
    setComposeOpen(true);
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1400px] min-h-0 flex-1 px-6 py-4">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-[20px] border border-border-default bg-white shadow-sm">
        {/* Thread List — Left Column */}
        <div className="flex w-[360px] shrink-0 flex-col border-r border-border-default bg-white">
          <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
            <h2 className="font-sora text-[16px] font-semibold text-text-primary">Threads</h2>
            <button
              type="button"
              onClick={handleCompose}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              Compose
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <p className="p-4 text-[14px] text-text-muted">No threads found.</p>
            ) : (
              threads.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  selected={thread.id === selectedThreadId}
                  onClick={() => setSelectedThreadId(thread.id)}
                />
              ))
          )}
        </div>
      </div>

        {/* Email View — Right Column */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-r-[20px] bg-gray-50/50">
          {selectedThread ? (
            <EmailViewer
              thread={selectedThread}
              messages={messages}
              onReply={() => handleReply(selectedThread)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-[14px] text-text-muted">Select a thread to view</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Drawer */}
      {composeOpen && (
        <ComposeDrawer
          customer={customer}
          replyTo={replyToThread}
          onClose={() => {
            setComposeOpen(false);
            setReplyToThread(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thread List Item
// ---------------------------------------------------------------------------

function ThreadListItem({
  thread,
  selected,
  onClick,
}: {
  thread: EmailThread;
  selected: boolean;
  onClick: () => void;
}) {
  const externalParticipants = thread.participants.filter((p) => !p.isInternal);
  const participantNames = externalParticipants.map((p) => p.name.split(" ")[0]).join(", ");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-1 border-b border-border-default px-4 py-3 text-left transition-colors",
        selected ? "bg-blue-50" : "hover:bg-gray-50",
        thread.unread && "bg-blue-50/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "text-[13px]",
            thread.unread ? "font-semibold text-text-primary" : "text-text-secondary",
          )}
        >
          {participantNames}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {thread.starred && <Star size={12} className="fill-amber-400 text-amber-400" />}
          <span className="text-[11px] text-text-muted">
            {formatShortDate(thread.lastMessageDate)}
          </span>
        </div>
      </div>
      <p
        className={cn(
          "line-clamp-1 text-[13px]",
          thread.unread ? "font-medium text-text-primary" : "text-text-secondary",
        )}
      >
        {thread.subject}
      </p>
      <div className="flex items-center gap-2">
        {thread.labels.slice(0, 2).map((label) => (
          <span
            key={label}
            className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-text-muted"
          >
            {label}
          </span>
        ))}
        {thread.messageCount > 1 && (
          <span className="text-[11px] text-text-muted">({thread.messageCount})</span>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Email Viewer
// ---------------------------------------------------------------------------

function EmailViewer({
  thread,
  messages,
  onReply,
}: {
  thread: EmailThread;
  messages: EmailMessage[];
  onReply: () => void;
}) {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(
    new Set([messages[messages.length - 1]?.id])
  );

  function toggleMessage(id: string) {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Thread Header */}
      <div className="flex items-start justify-between border-b border-border-default bg-white px-6 py-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-[18px] font-semibold text-text-primary">{thread.subject}</h3>
          <p className="mt-1 text-[13px] text-text-muted">
            {thread.participants.length} participants · {messages.length} messages
          </p>
        </div>
        <div className="flex items-center gap-2">
            <button
            type="button"
            onClick={onReply}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Reply size={14} />
            Reply
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-gray-100"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-[800px] space-y-3">
          {messages.map((message, idx) => (
            <MessageCard
              key={message.id}
              message={message}
              expanded={expandedMessages.has(message.id)}
              onToggle={() => toggleMessage(message.id)}
              isLast={idx === messages.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message Card
// ---------------------------------------------------------------------------

function MessageCard({
  message,
  expanded,
  onToggle,
  isLast,
}: {
  message: EmailMessage;
  expanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  const initials = message.from.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white transition-shadow",
        expanded ? "border-border-default shadow-sm" : "border-transparent",
      )}
    >
      {/* Header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
      >
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
            message.from.isInternal
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700",
          )}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary">{message.from.name}</span>
            {message.from.isInternal && (
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                Internal
              </span>
            )}
          </div>
          {!expanded && (
            <p className="line-clamp-1 text-[13px] text-text-muted">
              {message.body.split("\n")[0]}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {message.attachments && message.attachments.length > 0 && (
            <Paperclip size={14} className="text-text-muted" />
          )}
          <span className="text-[12px] text-text-muted">{formatDate(message.date)}</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Body — collapsible */}
      {expanded && (
        <div className="border-t border-border-default px-4 py-4">
          {/* To/CC */}
          <div className="mb-4 text-[12px] text-text-muted">
            <p>
              <span className="font-medium">To:</span>{" "}
              {message.to.map((r) => r.email).join(", ")}
            </p>
            {message.cc && message.cc.length > 0 && (
              <p>
                <span className="font-medium">Cc:</span>{" "}
                {message.cc.map((r) => r.email).join(", ")}
              </p>
            )}
          </div>

          {/* Body */}
          <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-text-primary">
            {message.body}
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-gray-50 px-3 py-2"
                >
                  <Paperclip size={14} className="text-text-muted" />
                  <span className="text-[13px] text-text-secondary">{att.name}</span>
                  <span className="text-[11px] text-text-muted">{att.size}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          {isLast && (
            <div className="mt-4 flex items-center gap-2 border-t border-border-default pt-4">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-[13px] text-text-secondary transition-colors hover:bg-gray-50"
              >
                <Reply size={14} />
                Reply
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-[13px] text-text-secondary transition-colors hover:bg-gray-50"
              >
                <Forward size={14} />
                Forward
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compose Drawer (Gmail-style bottom drawer)
// ---------------------------------------------------------------------------

function ComposeDrawer({
  customer,
  replyTo,
  onClose,
}: {
  customer: Customer;
  replyTo: EmailThread | null;
  onClose: () => void;
}) {
  const [minimized, setMinimized] = useState(false);
  const [to, setTo] = useState(
    replyTo
      ? replyTo.participants
          .filter((p) => !p.isInternal)
          .map((p) => p.email)
          .join(", ")
      : ""
  );
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : "");
  const [body, setBody] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showAiSuggestion, setShowAiSuggestion] = useState(!!replyTo?.suggestedAction);

  // AI-generated draft based on thread context
  const aiDraft = replyTo?.suggestedAction
    ? generateAiDraft(replyTo, customer)
    : "";

  function handleApplyAiDraft() {
    setBody(aiDraft);
    setShowAiSuggestion(false);
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 right-6 z-50 flex flex-col rounded-t-2xl border border-b-0 border-border-default bg-white shadow-2xl transition-all",
        minimized ? "h-12 w-[400px]" : "h-[520px] w-[560px]",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-between rounded-t-2xl bg-gray-800 px-4 py-2.5",
          !minimized && "cursor-default",
        )}
      >
        <button
          type="button"
          onClick={() => setMinimized(!minimized)}
          className="text-[14px] font-medium text-white"
        >
          {replyTo ? "Reply" : "New Message"}
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMinimized(!minimized)}
            className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:text-white"
          >
            {minimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* To field */}
          <div className="flex items-center border-b border-border-default px-4 py-2">
            <span className="w-12 text-[13px] text-text-muted">To</span>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 bg-transparent text-[14px] outline-none"
              placeholder="Recipients"
            />
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="text-[13px] text-text-muted hover:text-text-secondary"
              >
                Cc
              </button>
            )}
          </div>

          {/* CC field */}
          {showCc && (
            <div className="flex items-center border-b border-border-default px-4 py-2">
              <span className="w-12 text-[13px] text-text-muted">Cc</span>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="flex-1 bg-transparent text-[14px] outline-none"
                placeholder="CC recipients"
              />
            </div>
          )}

          {/* Subject field */}
          <div className="flex items-center border-b border-border-default px-4 py-2">
            <span className="w-12 text-[13px] text-text-muted">Subject</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 bg-transparent text-[14px] outline-none"
              placeholder="Subject"
            />
          </div>

          {/* AI Suggestion Banner */}
          {showAiSuggestion && aiDraft && (
            <div className="flex items-center gap-3 border-b border-border-default bg-purple-50 px-4 py-2">
              <Sparkles size={16} className="shrink-0 text-purple-600" />
              <p className="flex-1 text-[13px] text-purple-800">
                AI drafted a response based on: {replyTo?.suggestedAction?.summary}
              </p>
              <button
                type="button"
                onClick={handleApplyAiDraft}
                className="rounded-md bg-purple-600 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-purple-700"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setShowAiSuggestion(false)}
                className="text-purple-400 hover:text-purple-600"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Body textarea */}
          <div className="flex-1 overflow-hidden">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="h-full w-full resize-none bg-transparent p-4 text-[14px] leading-relaxed outline-none"
              placeholder="Write your message..."
            />
          </div>

          {/* Footer toolbar */}
          <div className="flex items-center justify-between border-t border-border-default px-4 py-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-gray-100"
              >
                <Bold size={16} />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-gray-100"
              >
                <Italic size={16} />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-gray-100"
              >
                <Underline size={16} />
              </button>
              <div className="mx-1 h-5 w-px bg-border-default" />
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-gray-100"
              >
                <Link size={16} />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-gray-100"
              >
                <List size={16} />
              </button>
              <div className="mx-1 h-5 w-px bg-border-default" />
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-gray-100"
              >
                <Paperclip size={16} />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-gray-100"
              >
                <Image size={16} />
              </button>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Send size={16} />
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Draft Generator
// ---------------------------------------------------------------------------

function generateAiDraft(thread: EmailThread, customer: Customer): string {
  const action = thread.suggestedAction;
  if (!action) return "";

  const greeting = `Hi ${thread.participants.find((p) => !p.isInternal)?.name.split(" ")[0] ?? "there"},`;

  switch (action.type) {
    case "follow-up":
      return `${greeting}

I wanted to follow up on our previous conversation regarding ${thread.subject.replace(/^Re: /, "")}.

${action.summary.includes("overage") ? "I've prepared the overage rate details you requested. Our standard rate is $0.12 per credit after the prepaid block is exhausted. Given your usage trajectory, I'd recommend we discuss a larger credit block to lock in better economics." : "Could you please share an update on your end? I'm happy to schedule a call if that would be helpful."}

Please let me know if you have any questions.

Best regards,
${customer.billingOwner}`;

    case "reminder":
      return `${greeting}

I hope this message finds you well. I wanted to send a friendly reminder about ${thread.subject.replace(/^Re: /, "")}.

${action.summary.includes("payment") ? "As mentioned in our last exchange, the payment was expected to be processed by now. Could you please confirm the current status?" : "Please let me know if there's anything blocking progress on your end that I can help with."}

Thank you for your attention to this matter.

Best regards,
${customer.billingOwner}`;

    case "resolution":
      return `${greeting}

Thank you for your patience as we worked to resolve this issue.

${action.summary.includes("usage") ? "I've attached a detailed usage breakdown that should help clarify the charges in question. As you can see, the total includes both production and staging environment usage." : "I'm pleased to confirm that we've identified the root cause and implemented a fix."}

Please review and let me know if you have any questions or need additional clarification.

Best regards,
${customer.billingOwner}`;

    case "info-request":
      return `${greeting}

Thank you for reaching out. To help address your request, I'll need a bit more information:

1. [Specific question 1]
2. [Specific question 2]

Once I have these details, I'll be able to provide a complete response.

Best regards,
${customer.billingOwner}`;

    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
