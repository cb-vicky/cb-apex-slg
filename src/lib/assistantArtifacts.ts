/**
 * Structured artifacts the assistant can attach to a chat message and open
 * in the workspace's right-hand artifact column.
 *
 * Today there's a single concrete type (`pro-risk-customers`) used by the
 * seeded mock conversation; the discriminated union is set up so future
 * artifact kinds can render their own bodies without changing call sites.
 */

export type RiskReason =
  | "low_utilization"
  | "integrations_disabled"
  | "support_volume"
  | "payment_failures";

export const RISK_REASON_LABEL: Record<RiskReason, string> = {
  low_utilization: "Seat utilization < 40%",
  integrations_disabled: "Key integrations disabled",
  support_volume: "Support tickets up",
  payment_failures: "Payment failures",
};

/** Tailwind background-color class for the small leading status dot. */
export const RISK_REASON_DOT_CLASS: Record<RiskReason, string> = {
  low_utilization: "bg-rose-500",
  integrations_disabled: "bg-amber-500",
  support_volume: "bg-sky-500",
  payment_failures: "bg-violet-500",
};

export type ProRiskCustomer = {
  id: string;
  name: string;
  /** Seat utilization, percent (0–100). */
  seatUtilizationPct: number;
  integrationsDisabled: number;
  mrrUsd: number;
  lastActiveDaysAgo: number;
  reason: RiskReason;
};

export const PRO_RISK_CUSTOMERS: ProRiskCustomer[] = [
  {
    id: "c01",
    name: "Acme Corp",
    seatUtilizationPct: 32,
    integrationsDisabled: 0,
    mrrUsd: 4800,
    lastActiveDaysAgo: 9,
    reason: "low_utilization",
  },
  {
    id: "c02",
    name: "Northwind Logistics",
    seatUtilizationPct: 28,
    integrationsDisabled: 0,
    mrrUsd: 3200,
    lastActiveDaysAgo: 12,
    reason: "low_utilization",
  },
  {
    id: "c03",
    name: "Globex Media",
    seatUtilizationPct: 36,
    integrationsDisabled: 0,
    mrrUsd: 5500,
    lastActiveDaysAgo: 7,
    reason: "low_utilization",
  },
  {
    id: "c04",
    name: "Hooli Cloud",
    seatUtilizationPct: 38,
    integrationsDisabled: 0,
    mrrUsd: 6900,
    lastActiveDaysAgo: 4,
    reason: "low_utilization",
  },
  {
    id: "c05",
    name: "Stark Industries",
    seatUtilizationPct: 31,
    integrationsDisabled: 0,
    mrrUsd: 8400,
    lastActiveDaysAgo: 6,
    reason: "low_utilization",
  },
  {
    id: "c06",
    name: "Aperture Science",
    seatUtilizationPct: 39,
    integrationsDisabled: 0,
    mrrUsd: 5100,
    lastActiveDaysAgo: 5,
    reason: "low_utilization",
  },
  {
    id: "c07",
    name: "Wayne Enterprises",
    seatUtilizationPct: 62,
    integrationsDisabled: 2,
    mrrUsd: 9800,
    lastActiveDaysAgo: 3,
    reason: "integrations_disabled",
  },
  {
    id: "c08",
    name: "Soylent Foods",
    seatUtilizationPct: 55,
    integrationsDisabled: 1,
    mrrUsd: 4400,
    lastActiveDaysAgo: 8,
    reason: "integrations_disabled",
  },
  {
    id: "c09",
    name: "Vandelay Imports",
    seatUtilizationPct: 70,
    integrationsDisabled: 1,
    mrrUsd: 3000,
    lastActiveDaysAgo: 11,
    reason: "integrations_disabled",
  },
  {
    id: "c10",
    name: "Initech",
    seatUtilizationPct: 48,
    integrationsDisabled: 0,
    mrrUsd: 2100,
    lastActiveDaysAgo: 14,
    reason: "support_volume",
  },
  {
    id: "c11",
    name: "Pied Piper",
    seatUtilizationPct: 51,
    integrationsDisabled: 0,
    mrrUsd: 2800,
    lastActiveDaysAgo: 13,
    reason: "support_volume",
  },
  {
    id: "c12",
    name: "Cyberdyne Systems",
    seatUtilizationPct: 45,
    integrationsDisabled: 0,
    mrrUsd: 4000,
    lastActiveDaysAgo: 10,
    reason: "support_volume",
  },
  {
    id: "c13",
    name: "Tyrell Corp",
    seatUtilizationPct: 58,
    integrationsDisabled: 0,
    mrrUsd: 7500,
    lastActiveDaysAgo: 5,
    reason: "payment_failures",
  },
  {
    id: "c14",
    name: "Massive Dynamic",
    seatUtilizationPct: 49,
    integrationsDisabled: 0,
    mrrUsd: 6200,
    lastActiveDaysAgo: 6,
    reason: "payment_failures",
  },
];

/**
 * Discriminated union; the workspace's right column branches on `type` to
 * pick the appropriate body renderer. New artifact kinds add a new variant
 * and a corresponding renderer; call sites only handle `id` + `title`.
 */
export type AssistantArtifact = {
  id: string;
  type: "pro-risk-customers";
  title: string;
  subtitle?: string;
};

export const PRO_RISK_CUSTOMERS_ARTIFACT: AssistantArtifact = {
  id: "art_pro_risk_q1",
  type: "pro-risk-customers",
  title: "14 Pro customers",
  subtitle: "At risk of downgrade",
};

/**
 * Unique id per message so the artifact column can keep multiple tabs open
 * (one click = one tab; same data source, different instances).
 */
export function proRiskArtifactForMessage(
  messageId: string,
  title: string = PRO_RISK_CUSTOMERS_ARTIFACT.title,
  subtitle: string = PRO_RISK_CUSTOMERS_ARTIFACT.subtitle ?? "",
): AssistantArtifact {
  return {
    id: `art_pro_risk_msg_${messageId}`,
    type: "pro-risk-customers",
    title,
    subtitle: subtitle || undefined,
  };
}

/** How many rows the inline preview card shows before "+N more". */
export const INLINE_ARTIFACT_PREVIEW_ROWS = 4;

// ─── Artifact column geometry (shared so the width can live in context) ───

export const WORKSPACE_ARTIFACT_WIDTH_MIN = 280;
/** Minimum chat column width when artifact is shown alongside the 260px sessions column. */
export const WORKSPACE_CHAT_MIN_WIDTH = 360;
/** App shell left rail; keep in sync with `LeftRailTransition` (`w-[272px]`). */
export const LEFT_RAIL_PX = 272;

/**
 * Default split before the user drags the resize handle: **chat : artifact = 1 : 1.616**,
 * i.e. artifact width = 1.616× chat width within the workspace row
 * (viewport minus the left rail).
 */
export const CHAT_TO_ARTIFACT_WIDTH_RATIO = 1.616;

/**
 * Pixels for the workspace row (session rail + main + copilot) minus the
 * 272px product nav / sessions column — i.e. the flex row that contains
 * expanded chat + artifact.
 */
export function workspaceRowInnerWidthPx(): number {
  if (typeof window === "undefined") return 0;
  return Math.max(0, window.innerWidth - LEFT_RAIL_PX);
}

export function clampWorkspaceArtifactWidth(w: number): number {
  if (typeof window === "undefined") {
    return Math.max(WORKSPACE_ARTIFACT_WIDTH_MIN, Math.round(w));
  }
  const cap = Math.max(
    WORKSPACE_ARTIFACT_WIDTH_MIN,
    window.innerWidth - 260 - WORKSPACE_CHAT_MIN_WIDTH,
  );
  return Math.max(WORKSPACE_ARTIFACT_WIDTH_MIN, Math.min(cap, Math.round(w)));
}

/**
 * `artifact = 1.616 * chat` and `chat + artifact = rowW` →
 * `artifact = rowW * 1.616 / (1 + 1.616)`.
 */
export function getDefaultWorkspaceArtifactWidthPx(): number {
  if (typeof window === "undefined") {
    return 640;
  }
  const rowW = workspaceRowInnerWidthPx();
  const raw =
    (rowW * CHAT_TO_ARTIFACT_WIDTH_RATIO) / (1 + CHAT_TO_ARTIFACT_WIDTH_RATIO);
  return clampWorkspaceArtifactWidth(raw);
}
