export type ReminderConditionJoin = "when" | "and";

export interface ReminderCondition {
  id: string;
  join: ReminderConditionJoin;
  property: string;
  operator: string;
  value: string;
}

export type ReminderEmailTiming = "before-due" | "on-due" | "after-due";

export interface ReminderEmailAction {
  id: string;
  title: string;
  timing: ReminderEmailTiming;
  /** Days before due (before-due) or after due (after-due); 0 for on-due. */
  daysOffset: number;
  from: string;
  sendTo: string[];
  subject: string;
  language: string;
  attachInvoice: boolean;
}

export interface OfflineReminderSequence {
  id: string;
  name: string;
  /** Display string for matching criteria (e.g. country, amount, plan). */
  criteriaLabel: string;
  conditions: ReminderCondition[];
  emails: ReminderEmailAction[];
  firstEmailDaysBeforeDue: number;
  lastEmailDaysAfterDue: number;
  enabled: boolean;
}

export {
  CUSTOMER_FILTER_PROPERTIES,
  getCustomerFilterProperty,
  operatorsForCustomerProperty,
  type CustomerFilterPropertyDef,
} from "@/data/customer-filter-properties";

export function cloneReminderEmail(email: ReminderEmailAction): ReminderEmailAction {
  const copySuffix = email.title.endsWith(" (copy)") ? "" : " (copy)";
  return {
    ...email,
    id: createEmailActionId(),
    title: `${email.title}${copySuffix}`,
  };
}

export function createEmailActionId(): string {
  return `email_${Math.random().toString(36).slice(2, 9)}`;
}

export const DEFAULT_EMAIL_FROM = "Alex Morgan (you) <alex.morgan@chargebee.com>";

export const REMINDER_EMAIL_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
] as const;

export function createDefaultDueDateEmail(): ReminderEmailAction {
  return {
    id: createEmailActionId(),
    title: "Payment Reminder for your invoice",
    timing: "on-due",
    daysOffset: 0,
    from: DEFAULT_EMAIL_FROM,
    sendTo: ["Customer's primary contact"],
    subject: "Invoice {{invoice.number}} from {{company_name}}",
    language: "English",
    attachInvoice: true,
  };
}

export function createEmailActionDraft(
  timing: ReminderEmailTiming,
  daysOffset = timing === "before-due" ? 3 : timing === "after-due" ? 3 : 0,
): ReminderEmailAction {
  return {
    id: createEmailActionId(),
    title: timing === "on-due" ? "Payment Reminder for your invoice" : "Payment reminder",
    timing,
    daysOffset,
    from: DEFAULT_EMAIL_FROM,
    sendTo: ["Customer's primary contact"],
    subject: "Invoice {{invoice.number}} from {{company_name}}",
    language: "English",
    attachInvoice: true,
  };
}

export function deriveEmailBounds(emails: ReminderEmailAction[]): {
  firstEmailDaysBeforeDue: number;
  lastEmailDaysAfterDue: number;
} {
  const before = emails.filter((e) => e.timing === "before-due").map((e) => e.daysOffset);
  const after = emails.filter((e) => e.timing === "after-due").map((e) => e.daysOffset);
  return {
    firstEmailDaysBeforeDue: before.length > 0 ? Math.max(...before) : 7,
    lastEmailDaysAfterDue: after.length > 0 ? Math.max(...after) : 21,
  };
}

export function formatEmailScheduleLabel(email: ReminderEmailAction): string {
  if (email.timing === "on-due") return "on due date";
  if (email.timing === "before-due") {
    return email.daysOffset === 1
      ? "1 day before due date"
      : `${email.daysOffset} days before due date`;
  }
  return email.daysOffset === 1
    ? "1 day after due date"
    : `${email.daysOffset} days after due date`;
}

export function drawerTitleForEmail(email: ReminderEmailAction): string {
  if (email.timing === "on-due") return "Email on Due date";
  if (email.timing === "before-due") return "Email before Due date";
  return "Email after Due date";
}

export function sortEmailsForTimeline(emails: ReminderEmailAction[]): ReminderEmailAction[] {
  const order: Record<ReminderEmailTiming, number> = {
    "before-due": 0,
    "on-due": 1,
    "after-due": 2,
  };
  return [...emails].sort((a, b) => {
    if (order[a.timing] !== order[b.timing]) return order[a.timing] - order[b.timing];
    if (a.timing === "before-due") return b.daysOffset - a.daysOffset;
    if (a.timing === "after-due") return a.daysOffset - b.daysOffset;
    return 0;
  });
}

export function createConditionId(): string {
  return `cond_${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyCondition(join: ReminderConditionJoin = "and"): ReminderCondition {
  return {
    id: createConditionId(),
    join,
    property: "",
    operator: "",
    value: "",
  };
}

export function deriveCriteriaLabel(conditions: ReminderCondition[]): string {
  const filled = conditions.filter((c) => c.property && c.operator);
  if (filled.length === 0) return "No conditions set";
  return filled
    .map((c) => `${c.property}: ${c.operator} ${c.value || "—"}`)
    .join(" | ");
}

export function createNewReminderSequence(): OfflineReminderSequence {
  return {
    id: `seq_${Date.now()}`,
    name: "Untitled Reminder Sequence",
    criteriaLabel: "",
    conditions: [
      {
        id: createConditionId(),
        join: "when",
        property: "Auto-collection",
        operator: "is",
        value: "Off",
      },
      {
        id: createConditionId(),
        join: "and",
        property: "Outstanding Amount",
        operator: "is greater than",
        value: "0",
      },
      createEmptyCondition("and"),
    ],
    firstEmailDaysBeforeDue: 7,
    lastEmailDaysAfterDue: 21,
    enabled: true,
    emails: [createDefaultDueDateEmail()],
  };
}

export const OFFLINE_REMINDER_SEQUENCES: OfflineReminderSequence[] = [
  {
    id: "seq_enterprise_us",
    name: "Enterprise US Accounts",
    criteriaLabel: "Country: US | Outstanding Amount is greater than 5000",
    conditions: [
      {
        id: "cond_us_country",
        join: "when",
        property: "Country",
        operator: "is any of",
        value: "US",
      },
      {
        id: "cond_us_amount",
        join: "and",
        property: "Outstanding Amount",
        operator: "is greater than",
        value: "5000",
      },
    ],
    firstEmailDaysBeforeDue: 7,
    lastEmailDaysAfterDue: 21,
    enabled: false,
    emails: [
      createEmailActionDraft("before-due", 7),
      createDefaultDueDateEmail(),
      createEmailActionDraft("after-due", 21),
    ],
  },
  {
    id: "seq_emea_midmarket",
    name: "EMEA Mid-Market",
    criteriaLabel: "Country: UK, DE, FR, NL | Currency: EUR, GBP",
    conditions: [
      {
        id: "cond_emea_country",
        join: "when",
        property: "Country",
        operator: "is any of",
        value: "UK, DE, FR, NL",
      },
      {
        id: "cond_emea_plan",
        join: "and",
        property: "Currency",
        operator: "is any of",
        value: "EUR, GBP",
      },
    ],
    firstEmailDaysBeforeDue: 6,
    lastEmailDaysAfterDue: 32,
    enabled: false,
    emails: [
      createEmailActionDraft("before-due", 6),
      createDefaultDueDateEmail(),
      createEmailActionDraft("after-due", 32),
    ],
  },
];

export const DEFAULT_OFFLINE_REMINDER: OfflineReminderSequence = {
  id: "seq_default",
  name: "Default Offline Reminder",
  criteriaLabel: "",
  conditions: [],
  firstEmailDaysBeforeDue: 7,
  lastEmailDaysAfterDue: 21,
  enabled: true,
  emails: [createDefaultDueDateEmail()],
};

export type ReminderSequenceStepId = "segment" | "email-sequence" | "settings";

export const REMINDER_SEQUENCE_STEPS: { id: ReminderSequenceStepId; label: string; short: string }[] = [
  { id: "segment", label: "Segment", short: "1" },
  { id: "email-sequence", label: "Email Sequence", short: "2" },
  { id: "settings", label: "Settings", short: "3" },
];
