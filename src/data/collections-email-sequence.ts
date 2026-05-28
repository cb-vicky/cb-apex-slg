export type EmailSequenceStepStatus = "sent" | "scheduled";

export interface EmailSequenceStep {
  step: number;
  subject: string;
  status: EmailSequenceStepStatus;
  at: string;
}

export interface CollectionEmailSequence {
  customerId: string;
  name: string;
  steps: EmailSequenceStep[];
}

const sequences: Record<string, CollectionEmailSequence> = {
  cust_echo_001: {
    customerId: "cust_echo_001",
    name: "Enterprise US Accounts",
    steps: [
      {
        step: 1,
        subject: "Upcoming Payment Reminder",
        status: "sent",
        at: "2026-05-06T09:00:00",
      },
      {
        step: 2,
        subject: "Payment Due Soon",
        status: "sent",
        at: "2026-05-16T09:00:00",
      },
      {
        step: 3,
        subject: "Overdue Payment Notice",
        status: "scheduled",
        at: "2026-06-02T09:00:00",
      },
      {
        step: 4,
        subject: "Final Payment Notice",
        status: "scheduled",
        at: "2026-06-25T09:00:00",
      },
    ],
  },
  cust_northlane_003: {
    customerId: "cust_northlane_003",
    name: "Northlane collections",
    steps: [
      {
        step: 1,
        subject: "Upcoming Payment Reminder",
        status: "sent",
        at: "2026-04-10T09:00:00",
      },
      {
        step: 2,
        subject: "Payment Due Soon",
        status: "sent",
        at: "2026-04-20T09:00:00",
      },
      {
        step: 3,
        subject: "Overdue Payment Notice",
        status: "scheduled",
        at: "2026-05-30T09:00:00",
      },
      {
        step: 4,
        subject: "Final Payment Notice",
        status: "scheduled",
        at: "2026-06-15T09:00:00",
      },
    ],
  },
  cust_lumina_002: {
    customerId: "cust_lumina_002",
    name: "Lumina AR sequence",
    steps: [
      {
        step: 1,
        subject: "Upcoming Payment Reminder",
        status: "sent",
        at: "2026-05-01T09:00:00",
      },
      {
        step: 2,
        subject: "Payment Due Soon",
        status: "scheduled",
        at: "2026-05-28T09:00:00",
      },
      {
        step: 3,
        subject: "Overdue Payment Notice",
        status: "scheduled",
        at: "2026-06-10T09:00:00",
      },
    ],
  },
};

export function getEmailSequenceForCustomer(customerId: string): CollectionEmailSequence | null {
  return sequences[customerId] ?? null;
}
