import type { Stage } from "./stage";

/** Stages that support list-then-detail with record tabs */
export const LIST_DETAIL_STAGES = ["quote", "contract", "invoicing"] as const;
export type ListDetailStage = (typeof LIST_DETAIL_STAGES)[number];

/** Stages that support closable record tabs in the context bar (includes payment / comments flows). */
export const RECORD_TAB_STAGES = ["quote", "contract", "invoicing", "payment", "comments"] as const;
export type RecordTabStage = (typeof RECORD_TAB_STAGES)[number];

/** Record tab id for the Add Promise to pay flow (payment stage). */
export const ADD_PROMISE_TO_PAY_RECORD_ID = "add-promise-to-pay";

/** Record tab id for the Add comment flow (comments stage). */
export const ADD_COLLECTION_COMMENT_RECORD_ID = "add-collection-comment";

export const EDIT_PROMISE_TO_PAY_RECORD_PREFIX = "edit-promise-to-pay:";

export function buildEditPromiseToPayRecordId(promiseId: string, logId: string): string {
  return `${EDIT_PROMISE_TO_PAY_RECORD_PREFIX}${encodeURIComponent(promiseId)}|${encodeURIComponent(logId)}`;
}

export function parseEditPromiseToPayRecordId(
  recordId: string,
): { promiseId: string; logId: string } | null {
  if (!recordId.startsWith(EDIT_PROMISE_TO_PAY_RECORD_PREFIX)) return null;
  const rest = recordId.slice(EDIT_PROMISE_TO_PAY_RECORD_PREFIX.length);
  const sep = rest.indexOf("|");
  if (sep < 0) return null;
  const promiseId = decodeURIComponent(rest.slice(0, sep));
  const logId = decodeURIComponent(rest.slice(sep + 1));
  if (!promiseId || !logId) return null;
  return { promiseId, logId };
}

export function isEditPromiseToPayRecordId(recordId: string): boolean {
  return recordId.startsWith(EDIT_PROMISE_TO_PAY_RECORD_PREFIX);
}

export const STAGE_ORDER: Stage[] = [
  "customer",
  "tasks",
  "threads",
  "quote",
  "contract",
  "invoicing",
  "payment",
  "comments",
  "revrec",
];

export type WorkspaceTab =
  | { kind: "parent"; stage: Stage }
  | { kind: "record"; stage: RecordTabStage; recordId: string };

export type OpenRecordTab = { stage: RecordTabStage; recordId: string };

export function tabKey(tab: WorkspaceTab): string {
  return tab.kind === "parent" ? `parent:${tab.stage}` : `record:${tab.stage}:${tab.recordId}`;
}

export function isListDetailStage(stage: Stage): stage is ListDetailStage {
  return (LIST_DETAIL_STAGES as readonly Stage[]).includes(stage);
}

export function isRecordTabStage(stage: Stage): stage is RecordTabStage {
  return (RECORD_TAB_STAGES as readonly Stage[]).includes(stage);
}

export function recordTabDisplayLabel(stage: RecordTabStage, recordId: string): string {
  if (stage === "payment" && recordId === ADD_PROMISE_TO_PAY_RECORD_ID) {
    return "Add Promise to pay";
  }
  if (stage === "comments" && recordId === ADD_COLLECTION_COMMENT_RECORD_ID) {
    return "Add comment";
  }
  if (stage === "payment" && isEditPromiseToPayRecordId(recordId)) {
    return "Edit Promise to pay";
  }
  return recordId;
}

export function tabsEqual(a: WorkspaceTab, b: WorkspaceTab): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "parent") return b.kind === "parent" && a.stage === b.stage;
  return b.kind === "record" && a.stage === b.stage && a.recordId === b.recordId;
}

/** Fixed-order strip: parent (if visible) then its record tabs at each stage slot. */
export function buildTabStrip(
  hiddenParents: Set<Stage>,
  openRecords: OpenRecordTab[],
  disabledStages: Set<Stage>,
): WorkspaceTab[] {
  const items: WorkspaceTab[] = [];
  for (const stage of STAGE_ORDER) {
    const showParent = !disabledStages.has(stage) && !hiddenParents.has(stage);
    if (showParent) {
      items.push({ kind: "parent", stage });
    }
    for (const rec of openRecords) {
      if (rec.stage === stage) {
        items.push({ kind: "record", stage: rec.stage, recordId: rec.recordId });
      }
    }
  }
  return items;
}

export function tabLabel(tab: WorkspaceTab, stageDisplay: Record<Stage, { tab: string }>): string {
  if (tab.kind === "record") return recordTabDisplayLabel(tab.stage, tab.recordId);
  return stageDisplay[tab.stage].tab;
}

export function stageFromActiveTab(tab: WorkspaceTab): Stage {
  return tab.kind === "parent" ? tab.stage : tab.stage;
}

export function isListMode(tab: WorkspaceTab): boolean {
  return tab.kind === "parent" && isListDetailStage(tab.stage);
}

export function isRecordDetail(tab: WorkspaceTab): boolean {
  return tab.kind === "record";
}

/** Overview is pinned — no close control. */
export function isTabClosable(tab: WorkspaceTab): boolean {
  return !(tab.kind === "parent" && tab.stage === "customer");
}

export interface VisibilityOverrides {
  promotedToVisible: ReadonlySet<string>;
  demotedToOverflow: ReadonlySet<string>;
}

export const EMPTY_VISIBILITY_OVERRIDES: VisibilityOverrides = {
  promotedToVisible: new Set(),
  demotedToOverflow: new Set(),
};

/** Apply measured overflow plus swap overrides from More-menu selection. */
export function resolveTabVisibility(
  strip: WorkspaceTab[],
  measuredOverflowKeys: readonly string[],
  overrides: VisibilityOverrides,
): { visible: WorkspaceTab[]; overflow: WorkspaceTab[] } {
  const measured = new Set(measuredOverflowKeys);
  const visible: WorkspaceTab[] = [];
  const overflow: WorkspaceTab[] = [];

  for (const tab of strip) {
    const key = tabKey(tab);
    if (overrides.promotedToVisible.has(key)) {
      visible.push(tab);
    } else if (overrides.demotedToOverflow.has(key)) {
      overflow.push(tab);
    } else if (measured.has(key)) {
      overflow.push(tab);
    } else {
      visible.push(tab);
    }
  }

  return { visible, overflow };
}

/** Last visible tab in strip order that is not the tab being opened from More. */
export function findLastUnselectedVisibleTab(
  strip: WorkspaceTab[],
  visible: WorkspaceTab[],
  incoming: WorkspaceTab,
): WorkspaceTab | undefined {
  const visibleKeys = new Set(visible.map(tabKey));
  let last: WorkspaceTab | undefined;
  for (const tab of strip) {
    if (visibleKeys.has(tabKey(tab)) && !tabsEqual(tab, incoming)) {
      last = tab;
    }
  }
  return last;
}
