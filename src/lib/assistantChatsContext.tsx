import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getDefaultWorkspaceArtifactWidthPx,
  proRiskArtifactForMessage,
  type AssistantArtifact,
} from "@/lib/assistantArtifacts";

const MS = 1;
const SEC = 1000 * MS;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export type ChatSession = {
  id: string;
  summaryTitle: string;
  lastActivityAt: number;
};

/**
 * A single message in a chat session. Lives in the context (rather than
 * `AIAgentSidebar` local state) so messages survive route changes —
 * the providers are mounted once above `<Routes>` and never unmount
 * as the user navigates.
 */
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Assistant only: plain-text stream; when false/undefined, markdown `**` is applied. */
  isStreaming?: boolean;
  /** Optional structured artifact rendered as a preview card under the message. */
  artifact?: AssistantArtifact;
};

function buildMockSessions(): ChatSession[] {
  const t = Date.now();
  return [
    {
      id: "s1",
      summaryTitle: "Churn Analysis: Q1 vs Q2",
      lastActivityAt: t - 12 * MIN,
    },
    { id: "s2", summaryTitle: "MRR Growth Breakdown", lastActivityAt: t - 2 * HOUR },
    { id: "s3", summaryTitle: "Coupon Performance Audit", lastActivityAt: t - 32 * HOUR },
    { id: "s4", summaryTitle: "Dunning Workflow Optimization", lastActivityAt: t - 5 * DAY },
    { id: "s5", summaryTitle: "Tax Configuration Check", lastActivityAt: t - 7 * DAY },
    { id: "s6", summaryTitle: "Subscription Migration Sync", lastActivityAt: t - 10 * DAY },
    { id: "s7", summaryTitle: "Pricing Sensitivity Simulation", lastActivityAt: t - 18 * DAY },
    { id: "s8", summaryTitle: "Expansion Revenue Opportunities", lastActivityAt: t - 45 * DAY },
    { id: "s9", summaryTitle: "Retention Playbook Draft", lastActivityAt: t - 400 * DAY },
    { id: "s10", summaryTitle: "Webhook Integration Debug", lastActivityAt: t - 1 * HOUR - 2 * MIN },
    { id: "s11", summaryTitle: "API Gateway Latency Report", lastActivityAt: t - 50 * MIN },
  ];
}

const MOCK: ChatSession[] = buildMockSessions();
export const MOCK_ASSISTANT_SESSIONS = MOCK;

/**
 * Seed messages for the first session (`s1`). All other sessions start
 * empty. Lives here (not in `AIAgentSidebar`) so the initial state of the
 * lifted context is fully self-contained.
 */
const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "Show me the churn rate for last month.",
  },
  {
    id: "2",
    role: "assistant",
    content:
      "For the last 30 days, voluntary churn was **2.3%** (down from 2.8% the prior month). Involuntary churn from failed payments added **0.6%**, for a blended **2.9%**.",
  },
  {
    id: "3",
    role: "user",
    content: "Which customers are at risk of downgrade on the Pro plan?",
  },
  {
    id: "4",
    role: "assistant",
    content:
      "I found **14 Pro** accounts with declining usage: 6 have reduced seat utilization below 40%, and 3 have disabled key integrations in the last 14 days. I can export a CSV or open them in Customers.",
    artifact: proRiskArtifactForMessage("4"),
  },
  {
    id: "5",
    role: "assistant",
    content:
      "You can also open the same list as a **saved view** in Reports; filters stay in sync with this workspace table.",
    artifact: proRiskArtifactForMessage(
      "5",
      "Pro customers (saved view)",
      "Synced from Reports",
    ),
  },
];

function buildInitialSessionMessages(): Record<string, ChatMessage[]> {
  const o: Record<string, ChatMessage[]> = {};
  for (const s of MOCK) {
    o[s.id] = s.id === "s1" ? MOCK_MESSAGES : [];
  }
  return o;
}

type AssistantChatsValue = {
  sessions: ChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  /** Returns the new session id. */
  createNewSession: () => string;
  sessionsByRecent: ChatSession[];

  /**
   * Per-session chat transcript. Lifted here (rather than into
   * `AIAgentSidebar`'s local state) so it survives route changes.
   */
  sessionMessages: Record<string, ChatMessage[]>;
  setSessionMessages: React.Dispatch<
    React.SetStateAction<Record<string, ChatMessage[]>>
  >;

  /** Stacked open artifacts (tabs) in the workspace's right column. */
  openArtifactTabs: AssistantArtifact[];
  setOpenArtifactTabs: React.Dispatch<React.SetStateAction<AssistantArtifact[]>>;
  /** Currently selected artifact tab's id (or `null` when no tabs). */
  activeArtifactTabId: string | null;
  setActiveArtifactTabId: React.Dispatch<React.SetStateAction<string | null>>;
  /** Artifact column width in pixels. */
  artifactWidth: number;
  setArtifactWidth: React.Dispatch<React.SetStateAction<number>>;
};

const Ctx = createContext<AssistantChatsValue | null>(null);

export function AssistantChatsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => [...MOCK]);
  const [activeSessionId, setActiveSessionId] = useState(MOCK[0]!.id);
  const [sessionMessages, setSessionMessages] = useState<
    Record<string, ChatMessage[]>
  >(() => buildInitialSessionMessages());
  const [openArtifactTabs, setOpenArtifactTabs] = useState<AssistantArtifact[]>(
    [],
  );
  const [activeArtifactTabId, setActiveArtifactTabId] = useState<string | null>(
    null,
  );
  const [artifactWidth, setArtifactWidth] = useState<number>(
    getDefaultWorkspaceArtifactWidthPx,
  );

  const createNewSession = useCallback((): string => {
    const id = crypto.randomUUID();
    const t = Date.now();
    setSessions((s) => [{ id, summaryTitle: "New session", lastActivityAt: t }, ...s]);
    setSessionMessages((m) => ({ ...m, [id]: [] }));
    setActiveSessionId(id);
    return id;
  }, []);

  const sessionsByRecent = useMemo(
    () => [...sessions].sort((a, b) => b.lastActivityAt - a.lastActivityAt),
    [sessions],
  );

  const v = useMemo(
    () => ({
      sessions,
      setSessions,
      activeSessionId,
      setActiveSessionId,
      createNewSession,
      sessionsByRecent,
      sessionMessages,
      setSessionMessages,
      openArtifactTabs,
      setOpenArtifactTabs,
      activeArtifactTabId,
      setActiveArtifactTabId,
      artifactWidth,
      setArtifactWidth,
    }),
    [
      sessions,
      activeSessionId,
      createNewSession,
      sessionsByRecent,
      sessionMessages,
      openArtifactTabs,
      activeArtifactTabId,
      artifactWidth,
    ],
  );

  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useAssistantChats(): AssistantChatsValue {
  const c = useContext(Ctx);
  if (!c) {
    throw new Error("useAssistantChats must be used inside <AssistantChatsProvider>");
  }
  return c;
}
