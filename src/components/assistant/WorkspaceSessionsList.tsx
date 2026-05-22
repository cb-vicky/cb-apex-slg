import { Plus } from "lucide-react";
import { AssistantMinimizeGlyph } from "@/components/assistant/AssistantMinimizeGlyph";
import { useAssistantChats } from "@/lib/assistantChatsContext";
import { formatSessionRelativeTime } from "@/lib/sessionRelativeTime";
import { useSessionsRailCollapse } from "@/lib/sessionsRailCollapse";

type Props = {
  panelId: string;
  sessionListTimeTick: number;
  /** Renders the “New” control in the header (shared with workspace / rail morph). */
  showNewButton?: boolean;
  className?: string;
};

export function WorkspaceSessionsList({
  panelId,
  sessionListTimeTick,
  showNewButton = true,
  className = "",
}: Props) {
  const {
    sessionsByRecent,
    activeSessionId,
    setActiveSessionId,
    createNewSession,
  } = useAssistantChats();
  const sessionsRail = useSessionsRailCollapse();
  const sessionRelativeTimeNow = new Date();

  return (
    <div
      className={[
        "flex h-full min-h-0 min-w-0 flex-col",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex shrink-0 items-center gap-1.5 px-3 pb-1.5 pt-3">
        <h3
          id={`${panelId}-workspace-sessions-title`}
          className="shrink-0 truncate text-[11px] font-semibold uppercase tracking-wider text-slate-500"
        >
          Sessions
        </h3>
        {showNewButton && (
          <button
            type="button"
            onClick={createNewSession}
            className="squircle inline-flex shrink-0 cursor-pointer items-center gap-0.5 rounded-xl py-0.5 pl-1 pr-1.5 text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-700"
            title="New session"
            aria-label="New session"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span className="text-[11px] font-medium uppercase leading-none">New</span>
          </button>
        )}
        <div className="min-w-0 flex-1" />
        <button
          type="button"
          onClick={sessionsRail.requestCollapse}
          aria-label="Collapse sessions panel"
          title="Collapse sessions panel"
          className="squircle shrink-0 rounded-xl p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-500/35"
        >
          <AssistantMinimizeGlyph
            flipHorizontal
            mountCross="to-mirror"
            className="h-3.5 w-3.5"
          />
        </button>
      </div>
      <ul
        data-refresh-tick={sessionListTimeTick}
        className="min-h-0 flex-1 list-none overflow-y-auto overscroll-contain px-2.5 pb-3 [scrollbar-gutter:stable]"
        role="listbox"
        aria-label="Session list"
        aria-labelledby={`${panelId}-workspace-sessions-title`}
      >
        {sessionsByRecent.map((s) => {
          const selected = s.id === activeSessionId;
          return (
            <li key={s.id} className="min-w-0 w-full">
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => setActiveSessionId(s.id)}
                className={[
                  "squircle group flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-2xl px-2 py-2.5 text-left transition-colors",
                  selected
                    ? "bg-primary-100/60 text-slate-900"
                    : "text-slate-800 hover:bg-white",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex w-full min-w-0 items-baseline justify-between gap-2">
                    <span
                      className={[
                        "min-w-0 max-w-full flex-1 truncate text-left text-[12px] leading-tight",
                        selected
                          ? "font-semibold text-slate-900"
                          : "font-normal",
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
                        sessionRelativeTimeNow,
                      )}
                    </time>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
