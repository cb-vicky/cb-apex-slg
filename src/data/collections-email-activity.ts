export type EmailActivityStatus = "scheduled" | "not_seen" | "seen" | "bounced";

export interface EmailActivityItem {
  id: string;
  customerId: string;
  date: string;
  status: EmailActivityStatus;
}

const byCustomer: Record<string, EmailActivityItem[]> = {
  cust_echo_001: [
    { id: "em-echo-1", customerId: "cust_echo_001", date: "2026-05-30", status: "scheduled" },
    { id: "em-echo-2", customerId: "cust_echo_001", date: "2026-05-29", status: "scheduled" },
    { id: "em-echo-3", customerId: "cust_echo_001", date: "2026-03-28", status: "not_seen" },
    { id: "em-echo-4", customerId: "cust_echo_001", date: "2026-03-15", status: "seen" },
    { id: "em-echo-5", customerId: "cust_echo_001", date: "2026-03-09", status: "seen" },
    { id: "em-echo-6", customerId: "cust_echo_001", date: "2026-03-02", status: "bounced" },
    { id: "em-echo-7", customerId: "cust_echo_001", date: "2026-02-24", status: "bounced" },
  ],
  cust_northlane_003: [
    { id: "em-nl-1", customerId: "cust_northlane_003", date: "2026-05-28", status: "scheduled" },
    { id: "em-nl-2", customerId: "cust_northlane_003", date: "2026-04-02", status: "not_seen" },
    { id: "em-nl-3", customerId: "cust_northlane_003", date: "2026-03-22", status: "seen" },
    { id: "em-nl-4", customerId: "cust_northlane_003", date: "2026-03-10", status: "bounced" },
  ],
  cust_lumina_002: [
    { id: "em-lum-1", customerId: "cust_lumina_002", date: "2026-05-25", status: "scheduled" },
    { id: "em-lum-2", customerId: "cust_lumina_002", date: "2026-04-18", status: "seen" },
    { id: "em-lum-3", customerId: "cust_lumina_002", date: "2026-04-05", status: "not_seen" },
  ],
  cust_verdant_005: [
    { id: "em-ver-1", customerId: "cust_verdant_005", date: "2026-05-20", status: "seen" },
    { id: "em-ver-2", customerId: "cust_verdant_005", date: "2026-03-14", status: "bounced" },
  ],
};

export function getEmailActivityForCustomer(customerId: string): EmailActivityItem[] {
  return byCustomer[customerId] ?? [];
}
