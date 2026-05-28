import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ChevronRight,
  Maximize2,
  Menu,
  MessageCircle,
  Minimize2,
  Paperclip,
  Send,
  SquarePen,
  X,
} from "lucide-react";
import { ASSISTANT_MOCK_REPLY } from "@/components/assistant/assistantMockReply";
import { renderAssistantMarkdown } from "@/components/assistant/assistantMarkdown";
import {
  type ChatMessage,
  useAssistantChats,
  type ChatSession,
} from "@/lib/assistantChatsContext";
import {
  WORKSPACE_FLIGHT_ENTER_MS,
  WORKSPACE_FLIGHT_EASE_ENTER,
  useAssistantWorkspace,
} from "@/lib/assistantWorkspace";
import { flipWithVT } from "@/lib/viewTransitions";
import {
  WORKSPACE_ARTIFACT_WIDTH_MIN,
  clampWorkspaceArtifactWidth,
  type AssistantArtifact,
} from "@/lib/assistantArtifacts";
import { AssistantMinimizeGlyph } from "@/components/assistant/AssistantMinimizeGlyph";
import { WorkspaceSessionsList } from "@/components/assistant/WorkspaceSessionsList";
import {
  SESSIONS_RAIL_COLLAPSED_W,
  SESSIONS_RAIL_FULL_W,
  useSessionsRailCollapse,
} from "@/lib/sessionsRailCollapse";
import { formatSessionRelativeTime } from "@/lib/sessionRelativeTime";
import {
  REASONING_INITIAL_STATE,
  REASONING_LINE_INTERVAL_MS,
  REASONING_MAX_VISIBLE_LINES,
  REASONING_SCRIPT,
  REASONING_TOTAL_MS,
  reasoningReducer,
  type ReasoningState,
} from "@/lib/assistantReasoning";
import {
  InlineArtifactCard,
  WorkspaceArtifactColumn,
} from "@/components/assistant/AssistantArtifactCards";
import {
  AssistantMark,
  AssistantMessageActions,
  UserBubbleText,
} from "@/components/assistant/AssistantBubble";
import { AssistantProfileIcon } from "@/components/assistant/AssistantProfileIcon";
import { cn } from "@/lib/utils";

const SIDEBAR_WIDTH_STORAGE_KEY = "cb-apex-board:ai-sidebar-width";
const SIDEBAR_WIDTH_DEFAULT = 320;
const SIDEBAR_WIDTH_MIN = 260;
const SIDEBAR_WIDTH_ABS_MAX = 820;
/** Pixel width of the docked strip (matches `w-8` in `ASIDE_COLLAPSED`). */
const SIDEBAR_COLLAPSED_W = 32;
/** Hover affordance for the collapsed strip. */
const SIDEBAR_COLLAPSED_HOVER_W = 36;

const ASIDE_BASE =
  "squircle flex flex-col border-l border-gray-300 bg-slate-50 shadow-[inset_1px_0_0_rgba(148,163,184,0.12)] md:relative md:h-full md:min-h-0 md:rounded-none md:border-l md:shadow-none";

const ASIDE_EXPANDED = `${ASIDE_BASE} max-w-none min-w-0`;

const ASIDE_COLLAPSED = `${ASIDE_BASE} hidden w-8 md:flex`;

function readStoredSidebarWidth(): number {
  try {
    const raw = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    if (!raw) return SIDEBAR_WIDTH_DEFAULT;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return SIDEBAR_WIDTH_DEFAULT;
    return clampSidebarWidth(n);
  } catch {
    return SIDEBAR_WIDTH_DEFAULT;
  }
}

function persistSidebarWidth(width: number) {
  try {
    localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(width));
  } catch {
    /* ignore */
  }
}

function maxSidebarWidthForViewport(): number {
  return Math.min(
    SIDEBAR_WIDTH_ABS_MAX,
    Math.max(SIDEBAR_WIDTH_MIN, Math.floor(window.innerWidth * 0.55)),
  );
}

function clampSidebarWidth(w: number): number {
  return Math.max(
    SIDEBAR_WIDTH_MIN,
    Math.min(maxSidebarWidthForViewport(), Math.round(w)),
  );
}

const USER_MSG_BUBBLE =
  "squircle ml-8 rounded-[2rem_2rem_0_2rem] bg-primary-50 px-3.5 py-2 text-sm text-primary-700";

const ASSISTANT_MSG_STACK =
  "mr-6 flex w-full min-w-0 max-w-full flex-col items-start gap-1.5";

const ASSISTANT_MSG_TEXT = "w-full min-w-0 text-sm leading-relaxed text-slate-800";

const NEW_SESSION_SUGGESTIONS = [
  "Configure my Product Catalog",
  "Brand my Checkout & Portal",
  "Connect a Payment Gateway",
  "Launch my First Subscription",
  "Audit my Dunning Workflow",
  "Run a Pricing Sensitivity Test",
  "Find Expansion Opportunities",
  "Check my Tax Compliance",
  "Summarize my Churn Trends",
  "Draft a Retention Playbook",
] as const;

function pickRandomNewSessionSuggestions(n = 4): string[] {
  const pool = [...NEW_SESSION_SUGGESTIONS];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    if (i !== j) {
      const t = pool[i]!;
      pool[i] = pool[j]!;
      pool[j] = t;
    }
  }
  return pool.slice(0, n);
}

const ASSISTANT_STREAM_WORD_MS = 42;

/** Max textarea height (~10–11 lines at text-sm); must match `max-h-[min(40vh,…)]` on the control. */
const DRAFT_TEXTAREA_MAX_HEIGHT_PX = 220;

function getDraftTextareaMaxHeightPx(el: HTMLTextAreaElement, fallback: number) {
  const raw = getComputedStyle(el).maxHeight;
  if (raw && raw !== "none") {
    if (raw.endsWith("px")) {
      const n = Number.parseFloat(raw);
      if (Number.isFinite(n)) return n;
    }
    if (raw.endsWith("vh")) {
      const n = Number.parseFloat(raw);
      if (Number.isFinite(n)) return (n / 100) * window.innerHeight;
    }
  }
  return Math.min(0.4 * window.innerHeight, fallback);
}

function wordsForAssistantStream(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/** Prefix of `source` through the end of the `wordIndex`-th word (\\S+), preserving newlines and markdown. */
function prefixThroughWordIndex(source: string, wordIndex: number): string {
  if (wordIndex <= 0) return "";
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  let count = 0;
  while ((m = re.exec(source)) !== null) {
    count += 1;
    if (count === wordIndex) {
      return source.slice(0, m.index + m[0].length);
    }
  }
  return source;
}

// ─── Chat sub-components ────────────────────────────────────────────────────
// Defined here (not extracted to their own files) because they all read from
// `AIAgentSidebar` state or callbacks via props and aren't reused elsewhere.

/** Empty-state prompt suggestions shown when a new session has no messages. */
function SuggestionChips({
  chips,
  onPick,
}: {
  chips: string[];
  onPick: (text: string) => void;
}) {
  return (
    <div className="space-y-2" aria-label="Suggested prompts">
      <p className="text-xs font-medium text-slate-500">Try one of these</p>
      <ul className="flex flex-col gap-1.5">
        {chips.map((label) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => onPick(label)}
              className="squircle w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 transition hover:border-slate-300 hover:bg-slate-50/90"
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * "Thinking" stream that fills the slot between the user's message being
 * posted and the assistant reply beginning to stream. Newest line at the
 * bottom; older lines fade out via the linear-gradient mask at the top.
 */
function ReasoningStream({ state }: { state: ReasoningState }) {
  const showTopFade = state.totalEmitted > REASONING_MAX_VISIBLE_LINES;
  return (
    <div className="flex justify-start">
      <div
        className="mr-6 w-full max-w-[min(100%,18rem)] min-w-0"
        aria-busy="true"
        aria-label="Generating response"
      >
        <div className="relative">
          {showTopFade && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-px z-10 h-[4.75rem] transition-opacity duration-300"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 18%, rgba(255,255,255,0.9) 38%, rgba(255,255,255,0.65) 60%, rgba(255,255,255,0.3) 82%, rgba(255,255,255,0) 100%)",
              }}
            />
          )}
          <div className="flex flex-col gap-1">
            {state.lines.length === 0 ? (
              <p
                aria-hidden
                className="animate-reasoning-shimmer bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500 bg-[length:220%_100%] bg-clip-text text-[12px] leading-[13px] text-transparent [-webkit-text-fill-color:transparent] [overflow-wrap:anywhere]"
              >
                …
              </p>
            ) : (
              state.lines.map((entry) => (
                <div
                  key={entry.id}
                  className="grid motion-reduce:opacity-100 motion-safe:animate-reasoning-row-enter"
                  style={{ gridTemplateRows: "1fr" }}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="animate-reasoning-shimmer bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500 bg-[length:220%_100%] bg-clip-text text-[12px] leading-[13px] text-transparent [-webkit-text-fill-color:transparent] [overflow-wrap:anywhere]">
                      {entry.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Header row that lives in the absolutely-positioned glass overlay above the
 * scroll list. The same DOM morphs between two looks:
 *
 *   - sidebar: "Chargebee Assistant" eyebrow + 11px session subtitle, plus
 *     side buttons (open sessions list, new session).
 *   - workspace: a single 13px semibold session title; side buttons fade out
 *     and collapse their width so the title block can grow into the row.
 *
 * `headerMorphTarget` flips on the second paint of a transition (see the
 * effect in `AIAgentSidebar`) so the CSS transitions interpolate font-size,
 * color, weight, opacity and the side-button scale/width.
 */
function ChatHeader({
  panelId,
  headerMorphTarget,
  prefersReducedMotion,
  sessionsOpen,
  setSessionsOpen,
  isWorkspace,
  activeSessionSummary,
  onToggleWorkspace,
  onMinimize,
}: {
  panelId: string;
  headerMorphTarget: "sidebar" | "workspace";
  prefersReducedMotion: boolean;
  sessionsOpen: boolean;
  setSessionsOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
  isWorkspace: boolean;
  activeSessionSummary: string;
  onToggleWorkspace: () => void;
  onMinimize: () => void;
}) {
  const morphedToWorkspace = headerMorphTarget === "workspace";
  const headerMorphMs = prefersReducedMotion
    ? 0
    : Math.round(WORKSPACE_FLIGHT_ENTER_MS * 0.7);
  /** Easing matched to the column width animation. */
  const headerMorphEase = WORKSPACE_FLIGHT_EASE_ENTER;

  /** Side buttons fade + scale + collapse width during the morph. */
  const sideButtonStyle: CSSProperties = {
    transitionProperty: "opacity, transform, max-width, margin",
    transitionDuration: `${headerMorphMs}ms`,
    transitionTimingFunction: headerMorphEase,
    transformOrigin: "center",
    opacity: morphedToWorkspace ? 0 : 1,
    transform: morphedToWorkspace ? "scale(0.6)" : "scale(1)",
    maxWidth: morphedToWorkspace ? 0 : 32,
    pointerEvents: morphedToWorkspace ? "none" : undefined,
    overflow: "hidden",
  };

  /** Eyebrow ("Chargebee Assistant") line — collapses away in workspace look. */
  const eyebrowStyle: CSSProperties = {
    transitionProperty: "opacity, transform, max-height, margin",
    transitionDuration: `${headerMorphMs}ms`,
    transitionTimingFunction: headerMorphEase,
    opacity: morphedToWorkspace ? 0 : 1,
    transform: morphedToWorkspace ? "translateY(-2px)" : "translateY(0)",
    maxHeight: morphedToWorkspace ? 0 : 40,
    overflow: morphedToWorkspace ? "hidden" : "visible",
  };

  /** Session-title line — sidebar = 11px slate-500; workspace = 13px semibold slate-900. */
  const titleStyle: CSSProperties = {
    transitionProperty: "font-size, color, font-weight, letter-spacing",
    transitionDuration: `${headerMorphMs}ms`,
    transitionTimingFunction: headerMorphEase,
    fontSize: morphedToWorkspace ? 13 : 11,
    color: morphedToWorkspace ? "#0f172a" : "#64748b",
    fontWeight: morphedToWorkspace ? 600 : 400,
  };

  const sessionsActive = sessionsOpen && !isWorkspace;

  return (
    <header className="relative z-10 flex h-[3.125rem] items-center gap-2 overflow-visible px-1 py-1.5 md:px-2">
      <button
        type="button"
        onClick={() => setSessionsOpen((o) => !o)}
        aria-expanded={sessionsOpen}
        aria-controls={`${panelId}-sessions`}
        id={`${panelId}-sessions-trigger`}
        aria-label={sessionsActive ? "Close sessions" : "Open sessions"}
        aria-hidden={morphedToWorkspace || undefined}
        tabIndex={morphedToWorkspace ? -1 : 0}
        className={[
          "squircle shrink-0 rounded-2xl p-1.5 transition",
          sessionsActive
            ? "bg-slate-200/90 text-slate-900 ring-1 ring-slate-300/80"
            : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900",
        ].join(" ")}
        title={sessionsActive ? "Close sessions" : "Sessions"}
        style={sessionsActive ? undefined : sideButtonStyle}
      >
        {sessionsActive ? (
          <X className="h-4 w-4" strokeWidth={1.75} />
        ) : (
          <Menu className="h-4 w-4" strokeWidth={1.75} />
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {sessionsActive ? (
          <h2
            id={`${panelId}-sessions-title`}
            className="font-sora truncate text-[13px] font-semibold leading-tight text-slate-900"
          >
            Sessions
          </h2>
        ) : (
          <>
            <div
              className="min-w-0 max-w-full"
              style={eyebrowStyle}
              aria-hidden={morphedToWorkspace || undefined}
            >
              <span className="font-sora block min-w-0 truncate text-[13px] text-slate-900">
                <span className="font-bold">Chargebee</span>{" "}
                <span className="font-normal">Assistant</span>
              </span>
            </div>
            <p className="font-sora truncate leading-tight" style={titleStyle}>
              {activeSessionSummary}
            </p>
          </>
        )}
      </div>

      <div className="relative hidden shrink-0 items-center gap-0.5 md:inline-flex">
        <button
          type="button"
          onClick={onToggleWorkspace}
          className="squircle relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-800"
          title={
            isWorkspace
              ? "Exit Assistant workspace"
              : "Open Assistant workspace"
          }
          aria-label={
            isWorkspace
              ? "Exit Assistant workspace"
              : "Open Assistant workspace"
          }
        >
          <span className="relative block h-4 w-4 shrink-0">
            <Maximize2
              className={[
                "absolute inset-0 h-4 w-4 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
                isWorkspace
                  ? "pointer-events-none scale-90 opacity-0"
                  : "scale-100 opacity-100",
              ].join(" ")}
              strokeWidth={1.75}
              aria-hidden
            />
            <Minimize2
              className={[
                "absolute inset-0 h-4 w-4 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
                isWorkspace
                  ? "scale-100 opacity-100"
                  : "pointer-events-none scale-90 opacity-0",
              ].join(" ")}
              strokeWidth={1.75}
              aria-hidden
            />
          </span>
        </button>
        <button
          type="button"
          onClick={onMinimize}
          className="squircle inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-800"
          title="Minimize assistant"
          aria-label="Minimize assistant"
        >
          <AssistantMinimizeGlyph
            mountCross="from-mirror"
            className="pointer-events-none block h-4 w-4"
          />
        </button>
      </div>
    </header>
  );
}

/**
 * Sticky "new session" pencil button that floats below the glass header.
 * Hidden in workspace mode (the new-session affordance lives in the
 * persistent sessions rail there) and while the sessions overlay is open.
 */
function FloatingNewSessionButton({
  hidden,
  headerOverlayH,
  prefersReducedMotion,
  onCreate,
}: {
  hidden: boolean;
  headerOverlayH: number;
  prefersReducedMotion: boolean;
  onCreate: () => void;
}) {
  const morphMs = prefersReducedMotion
    ? 0
    : Math.round(WORKSPACE_FLIGHT_ENTER_MS * 0.7);
  return (
    <div
      className="pointer-events-none absolute left-0 z-99 flex items-center px-1 md:px-2"
      style={{
        top: headerOverlayH,
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(-4px)" : "translateY(0)",
        transitionProperty: "opacity, transform",
        transitionDuration: `${morphMs}ms`,
        transitionTimingFunction: WORKSPACE_FLIGHT_EASE_ENTER,
      }}
      aria-hidden={hidden || undefined}
    >
      <button
        type="button"
        onClick={onCreate}
        className="squircle pointer-events-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-800"
        title="New session"
        aria-label="New session"
        tabIndex={hidden ? -1 : 0}
      >
        <SquarePen className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

/**
 * Sessions overlay: glass scrim + listbox that floats over the chat panel
 * while the user picks a different session. Tapping the scrim or `Escape`
 * dismisses (handled by `AIAgentSidebar`). Workspace mode uses the
 * persistent sessions rail instead and never mounts this.
 */
function SessionsOverlay({
  panelId,
  headerOverlayH,
  sessions,
  activeSessionId,
  sessionListTimeTick,
  now,
  onPick,
  onDismiss,
}: {
  panelId: string;
  headerOverlayH: number;
  sessions: ChatSession[];
  activeSessionId: string;
  sessionListTimeTick: number;
  now: Date;
  onPick: (id: string) => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-20"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${panelId}-sessions-title`}
    >
      <button
        type="button"
        className={[
          "absolute inset-0 z-0 h-full w-full cursor-pointer border-0 p-0 focus:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-500/30",
          "bg-gradient-to-b from-white/60 via-slate-100/65 to-slate-200/55",
          "backdrop-blur-2xl backdrop-brightness-[0.97] backdrop-saturate-150 [-webkit-backdrop-filter:blur(24px)_saturate(1.2)]",
          "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45),inset_0_0_0_0.5px_rgba(15,23,42,0.04)]",
          "motion-reduce:animate-none motion-safe:animate-sessions-scrim-in",
          "motion-reduce:opacity-100",
        ].join(" ")}
        aria-label="Close session list"
        onClick={onDismiss}
      />
      <p className="sr-only" id={`${panelId}-sessions-hint`}>
        Select a session
      </p>
      <ul
        id={`${panelId}-sessions`}
        data-refresh-tick={sessionListTimeTick}
        className="pointer-events-none absolute inset-0 z-10 flex min-h-0 w-full list-none flex-col items-stretch gap-0.5 overflow-y-auto overscroll-contain px-2 md:px-3 [scrollbar-gutter:stable] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:animate-none motion-safe:animate-sessions-pills-in"
        style={{
          paddingTop: headerOverlayH + 4,
          paddingBottom: 6,
        }}
        role="listbox"
        aria-label="Session list"
        aria-describedby={`${panelId}-sessions-hint`}
      >
        {sessions.map((s) => {
          const selected = s.id === activeSessionId;
          return (
            <li key={s.id} className="pointer-events-auto min-w-0 w-full">
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onPick(s.id)}
                className={[
                  "squircle group flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-2xl px-0 py-1.5 text-left transition-colors",
                  selected
                    ? "bg-primary-100/60 text-slate-900"
                    : "text-slate-800 hover:bg-white/45",
                ].join(" ")}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center"
                  aria-hidden
                >
                  <MessageCircle
                    className={[
                      "h-4 w-4",
                      selected
                        ? "text-primary-600"
                        : "text-slate-500 group-hover:text-slate-600",
                    ].join(" ")}
                    strokeWidth={1.75}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex w-full min-w-0 items-baseline justify-between gap-2">
                    <span
                      className={[
                        "min-w-0 max-w-full flex-1 truncate text-left text-[13px] leading-tight",
                        selected
                          ? "font-semibold text-slate-900"
                          : "font-medium",
                      ].join(" ")}
                    >
                      {s.summaryTitle}
                    </span>
                    <time
                      className={[
                        "shrink-0 text-[11px] leading-tight tabular-nums",
                        selected ? "text-slate-600" : "text-slate-500",
                      ].join(" ")}
                      dateTime={new Date(s.lastActivityAt).toISOString()}
                    >
                      {formatSessionRelativeTime(
                        new Date(s.lastActivityAt),
                        now,
                      )}
                    </time>
                  </div>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-slate-400 opacity-70 group-hover:opacity-100"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Footer composer: textarea + attach + send. The card background follows
 * the panel-active/inactive state (`panelInactive`) so it recedes into the
 * page chrome when the assistant isn't being interacted with.
 */
function ChatComposer({
  panelId,
  textareaRef,
  attachmentInputRef,
  draft,
  setDraft,
  onSend,
  loading,
  panelInactive,
}: {
  panelId: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  attachmentInputRef: React.RefObject<HTMLInputElement | null>;
  draft: string;
  setDraft: (next: string) => void;
  onSend: () => void;
  loading: boolean;
  panelInactive: boolean;
}) {
  const cardClass = panelInactive
    ? "border-slate-200/60 bg-white/70 shadow-none backdrop-blur-sm"
    : "border-slate-200 bg-white shadow-sm";
  return (
    <div
      className={`squircle relative min-w-0 rounded-3xl border p-1 transition-[background-color,box-shadow,border-color] duration-150 ease-out focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100 ${cardClass}`}
    >
      <label htmlFor={`${panelId}-input`} className="sr-only">
        Ask Assistant
      </label>
      <input
        ref={attachmentInputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        multiple
      />
      <textarea
        ref={textareaRef}
        id={`${panelId}-input`}
        rows={1}
        placeholder="Ask Assistant..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        className="min-h-9 w-full min-w-0 max-h-[min(40vh,220px)] resize-none overflow-y-hidden bg-transparent px-2 pt-1 pb-9 text-sm leading-snug text-slate-900 outline-none [overflow-wrap:break-word] placeholder:text-slate-400"
      />
      <button
        type="button"
        onClick={() => attachmentInputRef.current?.click()}
        className="squircle absolute bottom-1.5 left-1.5 z-10 flex h-9 w-9 items-center justify-center rounded-2xl p-0 text-slate-400 transition hover:bg-slate-100/80 hover:text-slate-600"
        aria-label="Add attachment"
        title="Add attachment"
      >
        <Paperclip className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={onSend}
        disabled={!draft.trim() || loading}
        className="squircle absolute bottom-1.5 right-1.5 z-10 flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-500 text-white transition hover:bg-primary-600 disabled:pointer-events-none disabled:opacity-40"
        aria-label="Send message"
      >
        <Send className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

/**
 * Vertical strip rendered to the right of the aside when the panel is
 * docked. Clicking expands the panel; hover bumps the strip width slightly
 * for an inviting affordance.
 */
function CollapsedStrip({
  width,
  headerOverlayH,
  showFullPanel,
  hoverActive,
  prefersReducedMotion,
  onOpen,
  onHoverChange,
}: {
  width: number;
  headerOverlayH: number;
  showFullPanel: boolean;
  hoverActive: boolean;
  prefersReducedMotion: boolean;
  onOpen: () => void;
  onHoverChange: (hover: boolean) => void;
}) {
  return (
    <div
      className="group absolute inset-y-0 right-0 z-0 flex flex-col"
      aria-hidden={showFullPanel}
      style={{
        width,
        transition: prefersReducedMotion
          ? undefined
          : "width 180ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        tabIndex={showFullPanel ? -1 : 0}
        aria-label="Expand AI assistant"
        title="Expand AI assistant"
        className="flex h-full w-full items-center justify-center bg-transparent transition-colors duration-150 ease-out hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-primary-500/40"
      >
        <div
          className="pointer-events-none absolute top-0 flex w-full items-center justify-center py-1.5"
          style={{ minHeight: Math.max(headerOverlayH, 38) }}
        >
          <AssistantMinimizeGlyph
            flipHorizontal
            mountCross="to-mirror"
            className="h-3.5 w-3.5 shrink-0 text-slate-500 transition-colors duration-150 ease-out group-hover:text-slate-800"
          />
        </div>
        <AssistantProfileIcon
          className={`pointer-events-none h-4 w-4 transition-transform duration-180 ease-out ${
            hoverActive ? "scale-[1.125]" : "scale-100"
          }`}
        />
      </button>
    </div>
  );
}

/**
 * Chargebee Assistant — chat surface that lives inside the app shell.
 *
 *  Modes (driven by `useAssistantWorkspace`):
 *  - "sidebar":   narrow right-hand panel (resizable, default 320px).
 *  - "workspace": expanded view that fills the row alongside the 272px left
 *                 rail; can pair with a third "artifact" column on the right.
 *
 *  Active / inactive (sidebar mode only):
 *  - The panel goes "active" on hover or click inside the aside, and
 *    "inactive" on hover/click outside (see the `isPanelActive` effect).
 *  - `panelInactive` switches to a calm look: transparent backgrounds, no
 *    header/footer glass, no composer shadow, muted artifact cards. All
 *    transitions share the 150ms `panelTransition` so the flip is uniform.
 *
 *  Transitions (both owned by the View Transitions API; React flips
 *  the state synchronously inside `flushSync` and the browser snapshot-
 *  morphs `assistant-column`):
 *  - Workspace flight: triggered via `enterWorkspace` / `exitWorkspace`
 *    in `lib/assistantWorkspace.tsx`; runs with `kind="workspace"` so
 *    the off-right anchor + slide-from-left keyframes apply.
 *  - Dock flight: `collapse()` / `openPanel()` toggle `expanded` inside
 *    `flipWithVT(..., { kind: "assistant-dock" })`. The aside morphs
 *    panelWidth ↔ 32 px and the chat panel crossfades against the
 *    dock strip. Reduced-motion / mobile / non-VT browsers skip the VT
 *    and snap state.
 *
 *  Artifact tabs:
 *  - Inline preview cards under assistant messages (`InlineArtifactCard`)
 *    open the artifact in the workspace's right column. Multiple artifacts
 *    stack as tabs (`openArtifactTabs`); the column unmounts when the last
 *    tab closes. Returning to sidebar mode clears all open tabs.
 *
 *  Scroll model:
 *  - The chat list is the inner `<div ref={listRef} overflow-y-auto>`. Its
 *    paddings reserve space for the absolutely-positioned glass header and
 *    footer (sized by ResizeObservers). A transient `bottomSpacerPx` is
 *    added on `send()` so a freshly-posted user bubble can scroll up to the
 *    top with breathing room below; the spacer is cleared once the
 *    assistant reply finishes streaming or when the layout reflows
 *    (mode flip / panel resize / artifact column toggling).
 */
export function AIAgentSidebar() {
  const {
    mode: workspaceMode,
    enter: enterWorkspace,
    exit: exitWorkspace,
    prefersReducedMotion: prefersWorkspaceReducedMotion,
  } = useAssistantWorkspace();
  const isWorkspace = workspaceMode === "workspace";
  const sessionsRail = useSessionsRailCollapse();
  const panelId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const draftTextareaRef = useRef<HTMLTextAreaElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const pendingScrollToUserMessageIdRef = useRef<string | null>(null);
  const sessionsPopoverRef = useRef<HTMLDivElement>(null);
  const headerOverlayRef = useRef<HTMLDivElement>(null);
  const footerOverlayRef = useRef<HTMLElement>(null);
  const [headerOverlayH, setHeaderOverlayH] = useState(56);
  const [footerOverlayH, setFooterOverlayH] = useState(0);
  const replyGenerationRef = useRef(0);
  const initialWidth = useMemo(() => readStoredSidebarWidth(), []);
  const panelWidthRef = useRef(initialWidth);
  const [expanded, setExpanded] = useState(false);
  const [isPanelActive, setIsPanelActive] = useState(true);
  const asideRef = useRef<HTMLElement>(null);
  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const [collapsedStripHover, setCollapsedStripHover] = useState(false);
  /**
   * Chat-header typography toggle: sidebar mode (small "Chargebee
   * Assistant" eyebrow + 11px subtitle + side buttons) vs workspace mode
   * (single 13px semibold title, no side buttons). The mode flip itself
   * is captured by the View Transitions snapshot, so we just track the
   * steady state here.
   */
  const headerMorphTarget: "workspace" | "sidebar" = isWorkspace
    ? "workspace"
    : "sidebar";
  const [isMd, setIsMd] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [reasoning, dispatchReasoning] = useReducer(
    reasoningReducer,
    REASONING_INITIAL_STATE,
  );
  const [bottomSpacerPx, setBottomSpacerPx] = useState(0);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  /** Bumps on an interval so relative session times refresh while the list is open. */
  const [sessionListTimeTick, setSessionListTimeTick] = useState(0);
  const {
    sessions,
    setSessions,
    activeSessionId,
    setActiveSessionId,
    createNewSession: createSessionInContext,
    sessionsByRecent,
    /*
     * sessionMessages + the artifact-column state below live in the chats
     * provider (mounted above <Routes>) so they survive route changes
     * without re-mounting the assistant subtree. Setter signatures are
     * unchanged.
     */
    sessionMessages,
    setSessionMessages,
    openArtifactTabs,
    setOpenArtifactTabs,
    activeArtifactTabId,
    setActiveArtifactTabId,
    artifactWidth,
    setArtifactWidth,
  } = useAssistantChats();
  /**
   * Mirror the lifted `artifactWidth` into a ref so the pointer-resize
   * handler can read the starting width on pointerdown without re-binding.
   */
  const artifactWidthRef = useRef(artifactWidth);
  useEffect(() => {
    artifactWidthRef.current = artifactWidth;
  }, [artifactWidth]);

  const activeArtifact = useMemo(
    () =>
      openArtifactTabs.find((a) => a.id === activeArtifactTabId) ?? null,
    [openArtifactTabs, activeArtifactTabId],
  );

  const messages = useMemo(
    () => sessionMessages[activeSessionId] ?? [],
    [sessionMessages, activeSessionId],
  );

  const newSessionSuggestionChips = useMemo(() => {
    if (loading || messages.length > 0) return [];
    return pickRandomNewSessionSuggestions(4);
  }, [activeSessionId, loading, messages.length]);

  /** Grows with panel width when resized on md+; clamped 0–36px. */
  const sidebarPadX = useMemo(() => {
    if (!isMd) return 14;
    return Math.max(0, Math.min(36, Math.round(10 + panelWidth * 0.058)));
  }, [isMd, panelWidth]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsMd(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const onResize = () => {
      setPanelWidth((w) => {
        const next = clampSidebarWidth(w);
        panelWidthRef.current = next;
        return next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /**
   * Snap the list to the bottom when the chat list DOM (re)mounts.
   *
   * The chat panel JSX is rendered inside `<aside>` (sidebar mode) or
   * `<section>` (workspace mode). Toggling between modes is an element-type
   * swap, so React unmounts/remounts the entire subtree — `listRef` ends up
   * bound to a fresh DOM node with `scrollTop = 0`.
   *
   * Re-running on `isWorkspace` ensures the latest mock messages stay in
   * view across mode flips, matching the behavior on initial mount.
   */
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [isWorkspace]);

  /**
   * Drop the transient bottom spacer when it's no longer useful, which is
   * any of:
   *   - The most recent assistant reply finishes streaming (the spacer was
   *     reserved during `send()` so the new user bubble could scroll to
   *     the top during reasoning).
   *   - The layout reflows (mode flip, sidebar resize, artifact column
   *     toggling/resize). The spacer was sized to the *previous* list
   *     dimensions; leaving it in place shows up as a viewport-tall blank
   *     pad below the messages — the symptom users see as "the chat
   *     won't scroll" or "scroll behaves weirdly".
   */
  const lastMessage = messages[messages.length - 1];
  const isStreamingReply =
    lastMessage?.role === "assistant" && lastMessage.isStreaming === true;
  useEffect(() => {
    if (isStreamingReply) return;
    setBottomSpacerPx((prev) => (prev === 0 ? prev : 0));
  }, [
    isStreamingReply,
    isWorkspace,
    panelWidth,
    openArtifactTabs.length,
    artifactWidth,
  ]);

  const fitDraftTextarea = useCallback(() => {
    const ta = draftTextareaRef.current;
    if (!ta) return;
    const maxPx = getDraftTextareaMaxHeightPx(
      ta,
      DRAFT_TEXTAREA_MAX_HEIGHT_PX,
    );
    // Collapse then measure; force overflow off so height matches content (avoids spurious scrollbars).
    ta.style.height = "0px";
    ta.style.overflowY = "hidden";
    const nextH = Math.min(ta.scrollHeight, maxPx);
    ta.style.height = `${nextH}px`;
    ta.style.overflowY = nextH + 0.5 >= maxPx ? "auto" : "hidden";
  }, []);

  useLayoutEffect(() => {
    fitDraftTextarea();
  }, [draft, fitDraftTextarea, expanded, isMd, panelWidth]);

  useEffect(() => {
    window.addEventListener("resize", fitDraftTextarea, { passive: true });
    return () => window.removeEventListener("resize", fitDraftTextarea);
  }, [fitDraftTextarea]);

  useLayoutEffect(() => {
    const id = pendingScrollToUserMessageIdRef.current;
    const list = listRef.current;
    if (!id || !list) return;
    const el = list.querySelector(
      `[data-chat-message-id="${CSS.escape(id)}"]`,
    );
    if (!(el instanceof HTMLElement)) return;
    pendingScrollToUserMessageIdRef.current = null;
    /** Wait for the spacer to render so there’s room for the message to land at top. */
    const raf = requestAnimationFrame(() => {
      const sr = list.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      /** Pin the bubble just below the glass header so it isn't hidden behind it. */
      const target =
        list.scrollTop + (er.top - sr.top) - (headerOverlayH + 8);
      list.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [messages, bottomSpacerPx, headerOverlayH]);

  /**
   * Track the heights of the absolutely-positioned chat header and footer
   * so the scroll list reserves matching paddings (preventing the first /
   * last message from sitting under the glass overlays).
   *
   * `isWorkspace` is in the deps because the entire chat-panel subtree
   * remounts across modes — the previous observer was attached to DOM nodes
   * that no longer exist, leaving height state stale (which made the
   * footer/header reserves wrong and gave the impression that the chat
   * "couldn't scroll").
   */
  useLayoutEffect(() => {
    const h = headerOverlayRef.current;
    const f = footerOverlayRef.current;
    const apply = () => {
      if (h) setHeaderOverlayH(h.offsetHeight);
      setFooterOverlayH(f ? f.offsetHeight : 0);
    };
    apply();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    if (ro) {
      if (h) ro.observe(h);
      if (f) ro.observe(f);
    }
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      if (ro) ro.disconnect();
    };
  }, [sessionsOpen, draft, expanded, isMd, panelWidth, isWorkspace]);

  useEffect(() => {
    return () => {
      replyGenerationRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!sessionsOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = sessionsPopoverRef.current;
      if (el && !el.contains(e.target as Node)) {
        setSessionsOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [sessionsOpen]);

  useEffect(() => {
    if (!sessionsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSessionsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sessionsOpen]);

  useEffect(() => {
    if (!sessionsOpen && !isWorkspace) return;
    setSessionListTimeTick((c) => c + 1);
    const t = window.setInterval(() => setSessionListTimeTick((c) => c + 1), 60_000);
    return () => window.clearInterval(t);
  }, [sessionsOpen, isWorkspace]);

  /**
   * Drive the sidebar-only active/inactive state.
   *
   *   - The panel goes "active" whenever the pointer enters the aside or the
   *     user clicks inside it (e.g. focusing the composer).
   *   - It goes "inactive" when the pointer leaves the aside or the user
   *     clicks anywhere outside it.
   *
   * The flag is read by `panelInactive` below and drives transparent
   * backgrounds, glass on/off, composer chrome, and the artifact-card muted
   * look. Workspace mode opts out (the panel is always considered active).
   *
   * `expanded` is in the deps so we re-attach to the new aside DOM node when
   * the dock/undock flight remounts the strip / panel.
   */
  useEffect(() => {
    if (isWorkspace) return;
    const el = asideRef.current;
    if (!el) return;
    const onPointerDown = (e: PointerEvent) => {
      setIsPanelActive(el.contains(e.target as Node));
    };
    const onMouseEnter = () => setIsPanelActive(true);
    const onMouseLeave = () => setIsPanelActive(false);
    document.addEventListener("pointerdown", onPointerDown, true);
    el.addEventListener("mouseenter", onMouseEnter);
    el.addEventListener("mouseleave", onMouseLeave);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      el.removeEventListener("mouseenter", onMouseEnter);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [isWorkspace, expanded]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? sessions[0]!,
    [sessions, activeSessionId],
  );

  const createNewSession = useCallback(() => {
    createSessionInContext();
    setBottomSpacerPx(0);
    setSessionsOpen(false);
  }, [createSessionInContext]);

  const send = useCallback(() => {
    const text = draft.trim();
    if (!text || loading) return;
    const sessionId = activeSessionId;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const generation = (replyGenerationRef.current += 1);
    /** Reserve a viewport-tall spacer so the new user bubble can scroll to the top. */
    const list = listRef.current;
    if (list) setBottomSpacerPx(list.clientHeight);
    pendingScrollToUserMessageIdRef.current = userMsg.id;
    setSessionMessages((m) => ({
      ...m,
      [sessionId]: [...(m[sessionId] ?? []), userMsg],
    }));
    setSessions((s) =>
      s.map((x) =>
        x.id === sessionId
          ? { ...x, lastActivityAt: Date.now() }
          : x,
      ),
    );
    setDraft("");
    dispatchReasoning({ type: "reset" });
    setLoading(true);

    const assistantContent = ASSISTANT_MOCK_REPLY;

    REASONING_SCRIPT.forEach((line, index) => {
      window.setTimeout(() => {
        if (replyGenerationRef.current !== generation) return;
        dispatchReasoning({ type: "append", text: line });
      }, index * REASONING_LINE_INTERVAL_MS);
    });

    window.setTimeout(() => {
      if (replyGenerationRef.current !== generation) return;
      dispatchReasoning({ type: "reset" });
      setLoading(false);

      const assistantId = crypto.randomUUID();
      const words = wordsForAssistantStream(assistantContent);

      setSessionMessages((m) => {
        const cur = m[sessionId] ?? [];
        return {
          ...m,
          [sessionId]: [
            ...cur,
            {
              id: assistantId,
              role: "assistant",
              content: "",
              isStreaming: true,
            },
          ],
        };
      });

      let wordIndex = 0;
      const pumpWord = () => {
        if (replyGenerationRef.current !== generation) return;
        wordIndex += 1;
        const done = wordIndex >= words.length;
        const content = done
          ? assistantContent
          : prefixThroughWordIndex(assistantContent, wordIndex);
        setSessionMessages((prev) => {
          const cur = prev[sessionId] ?? [];
          return {
            ...prev,
            [sessionId]: cur.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content, isStreaming: !done }
                : msg,
            ),
          };
        });
        if (!done) {
          window.setTimeout(pumpWord, ASSISTANT_STREAM_WORD_MS);
        }
      };
      window.setTimeout(pumpWord, 0);
    }, REASONING_TOTAL_MS);
  }, [activeSessionId, draft, loading, setSessions, setSessionMessages]);

  /**
   * Dock to the narrow strip. On md+ this commits inside a View
   * Transition (`kind="assistant-dock"`) so the browser snapshot-morphs
   * the aside panelWidth → 32 px and crossfades the chat panel out as
   * the box contracts. Mobile and reduced-motion users skip the VT and
   * snap state.
   */
  const collapse = useCallback(() => {
    if (!expanded) return;
    flipWithVT(() => setExpanded(false), {
      skip: !isMd || prefersWorkspaceReducedMotion,
      kind: "assistant-dock",
    });
  }, [expanded, isMd, prefersWorkspaceReducedMotion]);

  /**
   * Minimise from anywhere. From workspace we exit first (View Transition
   * crossfades the column back to sidebar layout); once that's settled we
   * kick off the dock flight so the two beats play sequentially.
   * Reduced motion just snaps state.
   */
  const minimizeAssistant = useCallback(() => {
    if (workspaceMode === "workspace") {
      if (prefersWorkspaceReducedMotion) {
        exitWorkspace();
        setExpanded(false);
        return;
      }
      exitWorkspace();
      window.setTimeout(collapse, WORKSPACE_FLIGHT_ENTER_MS);
      return;
    }
    collapse();
  }, [
    workspaceMode,
    prefersWorkspaceReducedMotion,
    exitWorkspace,
    collapse,
  ]);

  /**
   * Reverse the dock: commit `expanded=true` inside a View Transition so
   * the aside's snapshot morphs 32 → panelWidth and the chat panel
   * crossfades in. Mobile and reduced-motion users snap state.
   */
  const openPanel = useCallback(() => {
    if (expanded) return;
    flipWithVT(() => setExpanded(true), {
      skip: !isMd || prefersWorkspaceReducedMotion,
      kind: "assistant-dock",
    });
  }, [expanded, isMd, prefersWorkspaceReducedMotion]);

  /** Workspace artifact column drag handle. Pull rightward to shrink, leftward to grow. */
  const onArtifactResizePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const startW = artifactWidthRef.current;

      const onMove = (ev: PointerEvent) => {
        const next = clampWorkspaceArtifactWidth(
          startW - (ev.clientX - startX),
        );
        artifactWidthRef.current = next;
        setArtifactWidth(next);
      };
      const onEnd = (ev: PointerEvent) => {
        try {
          if (el.hasPointerCapture(ev.pointerId)) {
            el.releasePointerCapture(ev.pointerId);
          }
        } catch {
          /* noop */
        }
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onEnd);
        el.removeEventListener("pointercancel", onEnd);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onEnd);
      el.addEventListener("pointercancel", onEnd);
    },
    [setArtifactWidth],
  );

  /**
   * Open an artifact tab (or focus an existing tab with the same `id`). From
   * sidebar mode this also runs the enter-workspace transition.
   */
  const openArtifact = useCallback(
    (artifact: AssistantArtifact) => {
      setOpenArtifactTabs((prev) => {
        if (prev.some((a) => a.id === artifact.id)) {
          return prev;
        }
        return [...prev, artifact];
      });
      setActiveArtifactTabId(artifact.id);
      if (workspaceMode === "sidebar") {
        enterWorkspace();
      }
    },
    [workspaceMode, enterWorkspace, setOpenArtifactTabs, setActiveArtifactTabId],
  );

  /** Close a single tab; column hides when the last tab closes. */
  const closeArtifactTab = useCallback(
    (id: string) => {
      setOpenArtifactTabs((prev) => {
        const idx = prev.findIndex((a) => a.id === id);
        if (idx < 0) return prev;
        const next = prev.filter((a) => a.id !== id);
        setActiveArtifactTabId((cur) => {
          if (cur !== id) return cur;
          if (next.length === 0) return null;
          if (idx > 0) return next[idx - 1]!.id;
          return next[0]!.id;
        });
        return next;
      });
    },
    [setOpenArtifactTabs, setActiveArtifactTabId],
  );

  const selectArtifactTab = useCallback(
    (id: string) => {
      setActiveArtifactTabId(id);
    },
    [setActiveArtifactTabId],
  );

  /** If active id is missing (edge case), snap to the first open tab. */
  useEffect(() => {
    if (openArtifactTabs.length === 0) return;
    if (
      activeArtifactTabId &&
      openArtifactTabs.some((a) => a.id === activeArtifactTabId)
    ) {
      return;
    }
    setActiveArtifactTabId(openArtifactTabs[0]!.id);
  }, [openArtifactTabs, activeArtifactTabId, setActiveArtifactTabId]);

  /** Returning to the sidebar clears open tabs. */
  useEffect(() => {
    if (!isWorkspace) {
      setOpenArtifactTabs([]);
      setActiveArtifactTabId(null);
    }
  }, [isWorkspace, setOpenArtifactTabs, setActiveArtifactTabId]);

  /** When entering workspace mode the persistent sessions column replaces the overlay. */
  useEffect(() => {
    if (isWorkspace) setSessionsOpen(false);
  }, [isWorkspace]);

  const onResizePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isMd || e.button !== 0) return;
      e.preventDefault();
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const startW = panelWidthRef.current;
      let done = false;

      const onMove = (ev: PointerEvent) => {
        const next = clampSidebarWidth(startW - (ev.clientX - startX));
        panelWidthRef.current = next;
        setPanelWidth(next);
      };

      const onEnd = (ev: PointerEvent) => {
        if (done) return;
        done = true;
        try {
          if (el.hasPointerCapture(ev.pointerId)) {
            el.releasePointerCapture(ev.pointerId);
          }
        } catch {
          /* noop */
        }
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onEnd);
        el.removeEventListener("pointercancel", onEnd);
        persistSidebarWidth(panelWidthRef.current);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onEnd);
      el.addEventListener("pointercancel", onEnd);
    },
    [isMd],
  );

  /*
   * Dock expand/collapse used to do an inline JS width tween. With the
   * View Transitions migration the browser owns the visual morph
   * (snapshot of the expanded aside crossfades into the snapshot of the
   * 32 px strip and vice versa); React just commits the new `expanded`
   * value and lets the VT play out. No `inSidebarFlight` / `showFullPanel`
   * / `chatPanelOffset` derivations are needed anymore.
   */
  const collapsedStripHoverActive = !expanded && collapsedStripHover;
  const collapsedStripWidth = collapsedStripHoverActive
    ? SIDEBAR_COLLAPSED_HOVER_W
    : SIDEBAR_COLLAPSED_W;

  useEffect(() => {
    if (expanded || !isMd) setCollapsedStripHover(false);
  }, [expanded, isMd]);

  /*
   * No CSS width tween for the expanded ↔ collapsed dock — VT owns it
   * (see `collapse` / `openPanel`). The 32 → 36 px hover-widen keeps its
   * small CSS transition since it's an idle micro-interaction, not a
   * discrete commit.
   */
  const asideStyle: CSSProperties | undefined = !isMd
    ? undefined
    : isWorkspace
      ? undefined
      : expanded
        ? {
            width: panelWidth,
            minWidth: SIDEBAR_WIDTH_MIN,
            maxWidth: maxSidebarWidthForViewport(),
          }
        : {
            width: collapsedStripWidth,
            minWidth: 0,
            maxWidth: "none",
            transition: prefersWorkspaceReducedMotion
              ? undefined
              : `width 180ms ${WORKSPACE_FLIGHT_EASE_ENTER}`,
          };

  const outerWrapperClass = isWorkspace
    ? "flex h-full w-full min-h-0 min-w-0 flex-1 flex-row overflow-hidden"
    : "shrink-0 min-w-0 md:flex md:h-full md:flex-col";

  const sessionRelativeTimeNow = new Date();

  /**
   * Frosted-glass surface for the chat header/footer overlays. Blur is always
   * applied via utilities (Safari needs the explicit `-webkit-backdrop-filter`);
   * workspace mode only animates opacity on enter — never the blur amount.
   */
  const glassBlurClass =
    "backdrop-blur-md backdrop-saturate-150 [-webkit-backdrop-filter:blur(12px)_saturate(1.5)]";

  const glassPanelClass = [
    "bg-white/70",
    glassBlurClass,
    isWorkspace && !prefersWorkspaceReducedMotion
      ? "motion-safe:animate-workspace-glass-settle"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  /** Pixels the header glass extends below the bar, fading out via mask. */
  const headerGlassFeatherPx = 20;
  const headerGlassMask = `linear-gradient(to bottom, #000 0%, #000 calc(100% - ${headerGlassFeatherPx}px), transparent 100%)`;

  /**
   * Derived "calm" flag for the sidebar render path (see the `isPanelActive`
   * effect above). When true the panel sheds chrome (transparent
   * backgrounds, no glass header/footer, no composer shadow, muted artifact
   * cards) so it recedes into the surrounding page. Workspace mode is never
   * calm — there's no "outside" to click into.
   */
  const panelInactive = !isPanelActive && !isWorkspace;

  /**
   * Shared 150ms ease-out transition applied wherever the active↔inactive
   * flip changes colour, blur, border, shadow or opacity. Keeping the
   * timings in one place makes it easy to tweak the whole motion at once.
   */
  const panelTransition =
    "transition-[background-color,backdrop-filter,-webkit-backdrop-filter,border-color,box-shadow,opacity] duration-150 ease-out";

  const headerOverlayBg = panelInactive
    ? `bg-neutral-25 backdrop-blur-none [-webkit-backdrop-filter:none] ${panelTransition}`
    : "";

  const footerOverlayBg = panelInactive
    ? `bg-transparent ${panelTransition}`
    : `backdrop-saturate-150 ${glassPanelClass} ${panelTransition}`;

  /**
   * The chat panel JSX. Reused inside both the sidebar `<aside>` (compact
   * mode) and the workspace `<section>` (expanded mode). Because the parent
   * element type differs across modes, React unmounts/remounts the entire
   * subtree on flip — be careful when relying on DOM identity (refs reset,
   * scrollTop resets to 0, etc.). See the `useLayoutEffect` blocks above
   * for the compensating logic.
   */
  const chatPanel = (
    <div
      ref={sessionsPopoverRef}
      className="relative flex min-h-0 min-w-0 flex-1 flex-col"
    >
      {/* Glass header overlay (absolute) sized by a ResizeObserver. */}
      <div
        ref={headerOverlayRef}
        className={`absolute inset-x-0 top-0 z-30 w-full overflow-visible ${headerOverlayBg}`}
      >
        {!panelInactive && (
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 top-0 backdrop-saturate-150 ${glassPanelClass} ${panelTransition}`}
            style={{
              bottom: `-${headerGlassFeatherPx}px`,
              maskImage: headerGlassMask,
              WebkitMaskImage: headerGlassMask,
            }}
          />
        )}
        <ChatHeader
          panelId={panelId}
          headerMorphTarget={headerMorphTarget}
          prefersReducedMotion={prefersWorkspaceReducedMotion}
          sessionsOpen={sessionsOpen}
          setSessionsOpen={setSessionsOpen}
          isWorkspace={isWorkspace}
          activeSessionSummary={activeSession.summaryTitle}
          onToggleWorkspace={isWorkspace ? exitWorkspace : enterWorkspace}
          onMinimize={minimizeAssistant}
        />
      </div>

      {/* Sticky "new session" pencil under the header (sidebar mode only). */}
      <FloatingNewSessionButton
        hidden={headerMorphTarget === "workspace" || sessionsOpen}
        headerOverlayH={headerOverlayH}
        prefersReducedMotion={prefersWorkspaceReducedMotion}
        onCreate={createNewSession}
      />

      {/* Body: optional sessions overlay + scrollable chat list. */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {sessionsOpen && !isWorkspace && (
          <SessionsOverlay
            panelId={panelId}
            headerOverlayH={headerOverlayH}
            sessions={sessionsByRecent}
            activeSessionId={activeSessionId}
            sessionListTimeTick={sessionListTimeTick}
            now={sessionRelativeTimeNow}
            onPick={(id) => {
              setActiveSessionId(id);
              setSessionsOpen(false);
            }}
            onDismiss={() => setSessionsOpen(false)}
          />
        )}

        <div
          ref={listRef}
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain transition-[background-color] duration-150 ease-out ${
            panelInactive ? "bg-transparent" : "bg-white"
          } ${sessionsOpen ? "pointer-events-none" : ""}`}
          style={{
            paddingLeft: sidebarPadX + 12,
            paddingRight: sidebarPadX,
            /**
             * Reserve room for both the glass header AND the floating "new
             * session" button that sits sticky just below it. The button is
             * hidden in workspace mode and while the sessions list is open,
             * so we drop the 36px reservation there.
             */
            paddingTop:
              headerOverlayH +
              (headerMorphTarget === "workspace" || sessionsOpen ? 0 : 36) +
              6,
            paddingBottom: (sessionsOpen ? 0 : footerOverlayH) + 12,
          }}
          role="log"
          aria-live="polite"
          aria-hidden={sessionsOpen}
        >
          <div
            key={activeSessionId}
            className="mx-auto w-full max-w-[84ch] space-y-3 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:animate-none motion-safe:animate-session-surface-in"
          >
            {newSessionSuggestionChips.length > 0 && (
              <SuggestionChips
                chips={newSessionSuggestionChips}
                onPick={(text) => {
                  setDraft(text);
                  draftTextareaRef.current?.focus();
                }}
              />
            )}

            {messages.map((m, idx) => {
              /** Show the CB mark only at the start of an assistant "run". */
              const showAssistantMark =
                m.role === "assistant" &&
                (idx === 0 || messages[idx - 1]?.role !== "assistant");
              return (
                <div
                  key={m.id}
                  data-chat-message-id={m.id}
                  className={`flex min-w-0 scroll-mt-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={
                      m.role === "assistant"
                        ? "min-w-0 motion-reduce:opacity-100 motion-safe:animate-fade-in"
                        : "min-w-0"
                    }
                  >
                    <div
                      className={
                        m.role === "user" ? USER_MSG_BUBBLE : ASSISTANT_MSG_STACK
                      }
                      aria-busy={
                        m.role === "assistant" && m.isStreaming
                          ? true
                          : undefined
                      }
                    >
                      {m.role === "assistant" ? (
                        <>
                          {showAssistantMark && <AssistantMark />}
                          <div className={ASSISTANT_MSG_TEXT}>
                            {renderAssistantMarkdown(m.content)}
                          </div>
                          {m.artifact && (
                            <InlineArtifactCard
                              artifact={m.artifact}
                              onOpen={openArtifact}
                              isActive={
                                activeArtifactTabId !== null &&
                                m.artifact.id === activeArtifactTabId
                              }
                              muted={panelInactive}
                            />
                          )}
                          {!m.isStreaming && (
                            <AssistantMessageActions content={m.content} />
                          )}
                        </>
                      ) : (
                        <UserBubbleText content={m.content} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && <ReasoningStream state={reasoning} />}
          </div>

          {bottomSpacerPx > 0 && (
            <div aria-hidden style={{ height: bottomSpacerPx }} />
          )}
        </div>
      </div>

      {/* Glass footer overlay (absolute) holds the composer. */}
      {!sessionsOpen && (
        <footer
          ref={footerOverlayRef}
          className={`absolute inset-x-0 bottom-0 z-30 px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-3 ${footerOverlayBg}`}
        >
          <ChatComposer
            panelId={panelId}
            textareaRef={draftTextareaRef}
            attachmentInputRef={attachmentInputRef}
            draft={draft}
            setDraft={setDraft}
            onSend={send}
            loading={loading}
            panelInactive={panelInactive}
          />
          <p className="mt-1.5 text-center text-[10px] leading-snug text-slate-500 text-balance">
            By using Chargebee Copilot, you accept our third-party AI notice
            and disclaimer.
          </p>
        </footer>
      )}
    </div>
  );

  const chatHostClass = isWorkspace
    ? "relative flex min-h-0 min-w-0 flex-1 flex-col"
    : expanded
      ? ASIDE_EXPANDED
      : ASIDE_COLLAPSED;

  /**
   * Tags this wrapper as a "shared element" for the View Transitions API.
   * On mode flip the browser snapshots its bounding box before & after
   * the React commit and animates the named pseudo-elements
   * (`::view-transition-old/new(assistant-column)` in `src/index.css`).
   * Always-on is safe: the property is inert outside of an active VT.
   */
  const flightRootStyle: CSSProperties = {
    viewTransitionName: isMd ? "assistant-column" : undefined,
  };

  return (
    <div
      className={outerWrapperClass}
      style={flightRootStyle}
      aria-label={isWorkspace ? "Chargebee Assistant workspace" : undefined}
    >
      {/*
       * Sessions sub-rail. Belongs to the assistant workspace, not the
       * product nav. Visible only in workspace mode; collapses
       * independently of the product nav via `useSessionsRailCollapse`
       * (see `kind: "sessions-rail"` in the provider).
       *
       * `view-transition-name: sessions-rail` is gated on `isMd` so the
       * mobile (`display: none`) variant doesn't clash with the desktop
       * one for the name during a resize crossover.
       */}
      {isWorkspace && (
        <aside
          aria-label="Sessions"
          style={{
            width: sessionsRail.collapsed
              ? SESSIONS_RAIL_COLLAPSED_W
              : SESSIONS_RAIL_FULL_W,
            viewTransitionName: isMd ? "sessions-rail" : undefined,
          }}
          className="relative hidden h-full min-w-0 shrink-0 flex-col overflow-hidden rounded-tl-[24px] bg-grey-100 md:flex"
        >
          {sessionsRail.collapsed ? (
            <button
              type="button"
              className="group relative h-full w-full rounded-tl-[24px] border-r border-black/[0.06] bg-grey-100 outline-none transition-colors duration-150 ease-out hover:bg-grey-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/35"
              aria-label="Expand sessions panel"
              title="Expand sessions panel"
              onClick={sessionsRail.requestExpand}
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center pt-2.5">
                <AssistantMinimizeGlyph
                  mountCross="from-mirror"
                  className="h-3.5 w-3.5 text-neutral-500 transition-colors duration-150 ease-out group-hover:text-neutral-800"
                />
              </span>
            </button>
          ) : (
            <WorkspaceSessionsList
              panelId={`${panelId}-rail`}
              sessionListTimeTick={sessionListTimeTick}
              className="h-full min-h-0 w-full border-0"
            />
          )}
        </aside>
      )}

      <section
        ref={asideRef}
        id={panelId}
        aria-label="AI assistant"
        style={{
          ...asideStyle,
          backgroundColor: isWorkspace
            ? undefined
            : isPanelActive
              ? undefined
              : "transparent",
          transition: [
            asideStyle?.transition,
            isWorkspace ? undefined : "background-color 150ms ease-out",
          ]
            .filter(Boolean)
            .join(", "),
        }}
        className={chatHostClass}
      >
        {!isWorkspace && !expanded && (
          <CollapsedStrip
            width={collapsedStripWidth}
            headerOverlayH={headerOverlayH}
            showFullPanel={false}
            hoverActive={collapsedStripHoverActive}
            prefersReducedMotion={prefersWorkspaceReducedMotion}
            onOpen={openPanel}
            onHoverChange={setCollapsedStripHover}
          />
        )}
        {expanded && (
          <>
            {!isWorkspace && isMd && (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-valuemin={SIDEBAR_WIDTH_MIN}
                aria-valuemax={maxSidebarWidthForViewport()}
                aria-valuenow={panelWidth}
                aria-label="Resize AI assistant panel"
                onPointerDown={onResizePointerDown}
                className="group absolute bottom-0 left-0 top-0 z-30 hidden w-3 -translate-x-1/2 cursor-col-resize touch-none select-none flex-col items-center justify-center hover:bg-slate-200/25 active:bg-slate-200/40 md:flex"
              >
                <span className="squircle pointer-events-none my-auto h-14 w-1 shrink-0 rounded-full bg-slate-300/90 shadow-sm ring-1 ring-slate-200/80 transition group-hover:bg-slate-400/95 group-active:bg-slate-500/90" />
              </div>
            )}
            <div
              className={cn(
                "relative z-10 flex min-h-0 min-w-0 flex-1 flex-col",
                isWorkspace && "bg-white",
              )}
            >
              {chatPanel}
            </div>
          </>
        )}
      </section>

      {/*
       * Artifact column sits to the right of the chat in workspace mode.
       * Rendered AFTER the chat section so flex-row places it as the
       * rightmost column. Its `border-l` separator visually anchors it
       * against the chat panel on its left.
       */}
      {isWorkspace && openArtifactTabs.length > 0 && (
        <aside
          aria-label={
            openArtifactTabs.length === 1
              ? `Artifact: ${openArtifactTabs[0]!.title}`
              : `Artifacts (${openArtifactTabs.length} open)`
          }
          className="relative hidden h-full shrink-0 flex-col overflow-hidden border-l border-slate-200/80 bg-white md:flex"
          style={{ width: artifactWidth }}
        >
          <div
            role="separator"
            aria-orientation="vertical"
            aria-valuemin={WORKSPACE_ARTIFACT_WIDTH_MIN}
            aria-valuenow={artifactWidth}
            aria-label="Resize artifact panel"
            onPointerDown={onArtifactResizePointerDown}
            className="group absolute bottom-0 left-0 top-0 z-30 hidden w-3 -translate-x-1/2 cursor-col-resize touch-none select-none flex-col items-center justify-center hover:bg-slate-200/25 active:bg-slate-200/40 md:flex"
          >
            <span className="squircle pointer-events-none my-auto h-14 w-1 shrink-0 rounded-full bg-slate-300/90 shadow-sm ring-1 ring-slate-200/80 transition group-hover:bg-slate-400/95 group-active:bg-slate-500/90" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-0">
            <WorkspaceArtifactColumn
              openTabs={openArtifactTabs}
              activeId={activeArtifactTabId}
              onSelectTab={selectArtifactTab}
              onCloseTab={closeArtifactTab}
              activeArtifact={activeArtifact}
              prefersReducedMotion={prefersWorkspaceReducedMotion}
            />
          </div>
        </aside>
      )}
    </div>
  );
}
