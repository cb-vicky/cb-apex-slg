import { useMemo, useState, type ReactNode } from "react";
import {
  cloneReminderEmail,
  createEmailActionDraft,
  sortEmailsForTimeline,
  type ReminderEmailAction,
  type ReminderEmailTiming,
} from "@/data/offline-invoice-reminders";
import { ReminderEmailActionDrawer } from "@/components/automation/ReminderEmailActionDrawer";
import { ReminderEmailTimelineCard } from "@/components/automation/ReminderEmailTimelineCard";
import { cn } from "@/lib/utils";

/** Dot center x-position; stage pills hug text (8px horizontal padding) with right edge here. */
const TIMELINE_AXIS = "left-[118px]";
const TIMELINE_RAIL_W = "w-[118px]";

interface Props {
  emails: ReminderEmailAction[];
  onChange: (emails: ReminderEmailAction[]) => void;
}

type DrawerState =
  | { mode: "closed" }
  | { mode: "edit"; email: ReminderEmailAction }
  | { mode: "create"; draft: ReminderEmailAction };

function emailsByTiming(emails: ReminderEmailAction[], timing: ReminderEmailTiming) {
  return sortEmailsForTimeline(emails).filter((e) => e.timing === timing);
}

export function ReminderEmailActionsSection({ emails, onChange }: Props) {
  const [drawer, setDrawer] = useState<DrawerState>({ mode: "closed" });
  const [selectedId, setSelectedId] = useState<string | null>(
    () => emails.find((e) => e.timing === "on-due")?.id ?? emails[0]?.id ?? null,
  );

  const beforeEmails = useMemo(() => emailsByTiming(emails, "before-due"), [emails]);
  const onDueEmails = useMemo(() => emailsByTiming(emails, "on-due"), [emails]);
  const afterEmails = useMemo(() => emailsByTiming(emails, "after-due"), [emails]);

  const drawerInitial =
    drawer.mode === "edit"
      ? drawer.email
      : drawer.mode === "create"
        ? drawer.draft
        : createEmailActionDraft("before-due");

  function openCreate(timing: ReminderEmailTiming) {
    setDrawer({ mode: "create", draft: createEmailActionDraft(timing) });
  }

  function openEdit(email: ReminderEmailAction) {
    setSelectedId(email.id);
    setDrawer({ mode: "edit", email });
  }

  function openAddAdjacent(email: ReminderEmailAction, position: "before" | "after") {
    const timing: ReminderEmailTiming =
      position === "before"
        ? email.timing === "after-due"
          ? "on-due"
          : email.timing === "on-due"
            ? "before-due"
            : "before-due"
        : email.timing === "before-due"
          ? "on-due"
          : email.timing === "on-due"
            ? "after-due"
            : "after-due";
    setDrawer({ mode: "create", draft: createEmailActionDraft(timing) });
  }

  function saveEmail(saved: ReminderEmailAction) {
    if (drawer.mode === "create") {
      onChange([...emails, saved]);
      setSelectedId(saved.id);
    } else {
      onChange(emails.map((e) => (e.id === saved.id ? saved : e)));
      setSelectedId(saved.id);
    }
    setDrawer({ mode: "closed" });
  }

  function cloneEmail(email: ReminderEmailAction) {
    const copy = cloneReminderEmail(email);
    onChange([...emails, copy]);
    setSelectedId(copy.id);
  }

  function deleteEmail(email: ReminderEmailAction) {
    if (emails.length <= 1) return;
    const next = emails.filter((e) => e.id !== email.id);
    onChange(next);
    if (selectedId === email.id) {
      setSelectedId(next[0]?.id ?? null);
    }
    if (drawer.mode === "edit" && drawer.email.id === email.id) {
      setDrawer({ mode: "closed" });
    }
  }

  const canDeleteEmail = emails.length > 1;

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-border-default bg-white px-6 py-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-sora text-[15px] font-bold text-text-primary">Email actions</h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-snug text-text-muted">
              Choose what reminder email should be sent when conditions are met (e.g., Email 3 days
              before due date, 3 days after due date)
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCreate("before-due")}
            className="shrink-0 rounded-md border border-border-default bg-white px-3 py-1.5 text-[13px] font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            + Add Email
          </button>
        </div>

        <div className="rounded-2xl border border-border-default bg-gray-50/80 px-6 py-6">
          <div className="relative mx-auto max-w-[720px]">
            <div
              className={cn(
                "absolute bottom-6 top-6 w-0.5 bg-gradient-to-b from-amber-300 via-red-400 to-rose-300",
                TIMELINE_AXIS,
              )}
              aria-hidden
            />

            <div className="relative space-y-1 pb-2">
              {beforeEmails.length === 0 ? (
                <TimelineContentRow
                  className="items-center py-2"
                  rail={
                    <TimelineAnchor
                      label="Before Due date"
                      pillClass="bg-amber-100 text-amber-800 border-amber-200"
                      nodeClass="border-amber-400"
                      inline
                    />
                  }
                >
                  <AddSlot
                    label="+ Add Email before Due date"
                    onClick={() => openCreate("before-due")}
                  />
                </TimelineContentRow>
              ) : (
                beforeEmails.map((email, index) => (
                  <TimelineContentRow
                    key={email.id}
                    rail={
                      index === 0 ? (
                        <TimelineAnchor
                          label="Before Due date"
                          pillClass="bg-amber-100 text-amber-800 border-amber-200"
                          nodeClass="border-amber-400"
                          inline
                        />
                      ) : undefined
                    }
                  >
                    <ReminderEmailTimelineCard
                      email={email}
                      selected={selectedId === email.id}
                      onSelect={() => openEdit(email)}
                      onAddBefore={() => openAddAdjacent(email, "before")}
                      onAddAfter={() => openAddAdjacent(email, "after")}
                      onClone={() => cloneEmail(email)}
                      onDelete={() => deleteEmail(email)}
                      canDelete={canDeleteEmail}
                    />
                  </TimelineContentRow>
                ))
              )}
            </div>

            <div className="relative space-y-1 py-2">
              <TimelineContentRow
                rail={
                  <TimelineAnchor
                    label="Due date"
                    pillClass="bg-red-100 text-red-800 border-red-200"
                    nodeClass="border-red-400"
                    inline
                  />
                }
              >
                {onDueEmails.length > 0 ? (
                  <div className="min-w-0 space-y-1">
                    {onDueEmails.map((email) => (
                      <ReminderEmailTimelineCard
                        key={email.id}
                        email={email}
                        selected={selectedId === email.id}
                        onSelect={() => openEdit(email)}
                        onAddBefore={() => openAddAdjacent(email, "before")}
                        onAddAfter={() => openAddAdjacent(email, "after")}
                        onClone={() => cloneEmail(email)}
                        onDelete={() => deleteEmail(email)}
                        canDelete={canDeleteEmail}
                      />
                    ))}
                  </div>
                ) : null}
              </TimelineContentRow>
            </div>

            <div className="relative space-y-1 pt-2">
              {afterEmails.length === 0 ? (
                <TimelineContentRow
                  className="items-center py-2"
                  rail={
                    <TimelineAnchor
                      label="After Due date"
                      pillClass="bg-rose-100 text-rose-800 border-rose-200"
                      nodeClass="border-rose-400"
                      inline
                    />
                  }
                >
                  <AddSlot
                    label="+ Add Email after Due date"
                    onClick={() => openCreate("after-due")}
                  />
                </TimelineContentRow>
              ) : (
                afterEmails.map((email, index) => (
                  <TimelineContentRow
                    key={email.id}
                    rail={
                      index === 0 ? (
                        <TimelineAnchor
                          label="After Due date"
                          pillClass="bg-rose-100 text-rose-800 border-rose-200"
                          nodeClass="border-rose-400"
                          inline
                        />
                      ) : undefined
                    }
                  >
                    <ReminderEmailTimelineCard
                      email={email}
                      selected={selectedId === email.id}
                      onSelect={() => openEdit(email)}
                      onAddBefore={() => openAddAdjacent(email, "before")}
                      onAddAfter={() => openAddAdjacent(email, "after")}
                      onClone={() => cloneEmail(email)}
                      onDelete={() => deleteEmail(email)}
                      canDelete={canDeleteEmail}
                    />
                  </TimelineContentRow>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <ReminderEmailActionDrawer
        open={drawer.mode !== "closed"}
        initial={drawerInitial}
        onClose={() => setDrawer({ mode: "closed" })}
        onSave={saveEmail}
      />
    </>
  );
}

/** Two-column timeline: fixed rail (pills / dots) + shared content width for cards and links. */
function TimelineContentRow({
  children,
  rail,
  className,
}: {
  children: ReactNode;
  rail?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-stretch gap-4", className)}>
      <div className={cn("relative shrink-0", TIMELINE_RAIL_W)}>{rail}</div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function TimelineAnchor({
  label,
  pillClass,
  nodeClass,
  inline = false,
}: {
  label: string;
  pillClass: string;
  nodeClass: string;
  inline?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0",
        TIMELINE_RAIL_W,
        inline && "h-full self-stretch",
        inline ? "min-h-[28px] py-0" : "min-h-[28px] py-2",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 -translate-x-full -translate-y-1/2 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-tight",
          TIMELINE_AXIS,
          pillClass,
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "absolute top-1/2 z-[1] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white",
          TIMELINE_AXIS,
          nodeClass,
        )}
        aria-hidden
      />
    </div>
  );
}

function AddSlot({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mr-0 py-1 text-left text-[13px] font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
    >
      {label}
    </button>
  );
}
