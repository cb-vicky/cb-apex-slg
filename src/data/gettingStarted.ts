import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Banknote,
  Building,
  FileText,
  Gauge,
  Inbox,
  Landmark,
  Package,
  Receipt,
  RefreshCw,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Role = "admin" | "operator";

export type MilestoneStatus = "Complete" | "In progress" | "Not started" | "Blocked";

export interface SummaryCard {
  label: string;
  value: string;
  helper: string;
}

export interface Milestone {
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  description: string;
  status: MilestoneStatus;
  cta: string;
  completeWhen: string;
}

export interface CalloutConfig {
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta?: string;
}

export interface RoleConfig {
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  summaryCards: SummaryCard[];
  milestones: Milestone[];
  footerCallout: CalloutConfig;
  progress: { done: number; total: number };
}

export interface OperatorRailCard {
  title: string;
  body?: string;
  items?: string[];
  links?: { title: string; subtext: string }[];
}

// ---------------------------------------------------------------------------
// Admin config
// ---------------------------------------------------------------------------

export const adminConfig: RoleConfig = {
  subtitle:
    "Set up Chargebee APEX for this entity and validate your quote-to-cash workflow before go-live.",
  primaryCta: "Continue setup",
  secondaryCta: "View go-live checklist",
  progress: { done: 3, total: 8 },
  summaryCards: [
    { label: "Milestones completed", value: "3 of 8", helper: "Setup in progress" },
    { label: "Current Entity", value: "Echo Corp Germany", helper: "Entity scoped" },
    { label: "Current Site", value: "Test Site", helper: "Safe to experiment" },
    { label: "Next step", value: "Configure AI commitments", helper: "Usages + Entitlements" },
  ],
  milestones: [
    {
      eyebrow: "FOUNDATION",
      icon: Settings,
      title: "Set up Site and Entity",
      description:
        "Choose the entity, base currency, timezone, invoice numbering, and finance defaults for this workspace.",
      status: "Complete",
      cta: "Review Site settings",
      completeWhen: "Entity, currency, timezone, and invoice defaults are saved.",
    },
    {
      eyebrow: "TEAM & ACCESS",
      icon: Users,
      title: "Invite your revenue team",
      description:
        "Add Billing, Finance Ops, Rev Ops, Support, Customer Success, and CFO users. Assign approvers and entity-level access before work begins.",
      status: "In progress",
      cta: "Manage roles and permissions",
      completeWhen:
        "At least one admin, one operator, and one finance user are active for this entity.",
    },
    {
      eyebrow: "PRODUCT CATALOG",
      icon: Package,
      title: "Create products, plans, and pricing",
      description:
        "Model seat-based, usage-based, and hybrid pricing. Add contract terms, renewal periods, discount rules, and AI commitment products.",
      status: "In progress",
      cta: "Open Product Catalog",
      completeWhen: "At least one sellable product with pricing is active.",
    },
    {
      eyebrow: "USAGES + ENTITLEMENTS",
      icon: Activity,
      title: "Configure AI commitments and access",
      description:
        "Set up prepaid credits, burn-down rules, usage meters, overages, and entitlement mappings that trigger provisioning after contract enforcement.",
      status: "Not started",
      cta: "Configure usage and entitlements",
      completeWhen: "Active offers are linked to usage logic or entitlement rules.",
    },
    {
      eyebrow: "QUOTES + APPROVALS",
      icon: FileText,
      title: "Connect CRM and approval routing",
      description:
        "Sync deal values with Salesforce or HubSpot and automatically route non-standard quotes to Finance, Legal, or CFO based on discount or TCV thresholds.",
      status: "Not started",
      cta: "Open Quotes and Approvals",
      completeWhen: "CRM sync is connected and at least one approval rule is enabled.",
    },
    {
      eyebrow: "CONTRACTS",
      icon: ScrollText,
      title: "Enable contract ingestion and enforcement",
      description:
        "Match signed contracts to the right quote, capture terms like amendments and co-termination, and enforce them into billable orders.",
      status: "Not started",
      cta: "Set up contract ingestion",
      completeWhen: "A signed test contract can be ingested and enforced successfully.",
    },
    {
      eyebrow: "INVOICES + WORKBENCH",
      icon: Receipt,
      title: "Validate invoice review and collections flow",
      description:
        "Generate a test invoice from an enforced contract, review it in Pending state, send it, and confirm that follow-up work appears in Workbench.",
      status: "Blocked",
      cta: "Run invoice review flow",
      completeWhen:
        "A test invoice is reviewed, sent, and visible in downstream work queues.",
    },
    {
      eyebrow: "PAYMENTS + REVENUESTORY",
      icon: Landmark,
      title: "Run your first end-to-end dry run",
      description:
        "Record a payment, confirm reconciliation behavior, and verify receivables, commitment usage, and revenue visibility in RevenueStory.",
      status: "Blocked",
      cta: "Run dry run",
      completeWhen:
        "The full Test Site flow succeeds from quote or contract to paid invoice.",
    },
  ],
  footerCallout: {
    title: "Ready to move this entity to Live Site?",
    description:
      "Once all required milestones are complete, switch to Live Site to start processing production quotes, contracts, invoices, and payments.",
    primaryCta: "Move to Live Site",
    secondaryCta: "Review completed milestones",
  },
};

// ---------------------------------------------------------------------------
// Operator config
// ---------------------------------------------------------------------------

export const operatorConfig: RoleConfig = {
  subtitle:
    "Learn the billing workflows you'll use every day in Workbench, Invoices, Customers, and Collections.",
  primaryCta: "Start training flow",
  secondaryCta: "Open Workbench",
  progress: { done: 1, total: 6 },
  summaryCards: [
    { label: "Tasks completed", value: "1 of 6", helper: "Training in progress" },
    { label: "My role", value: "Billing Operator", helper: "Operational access" },
    { label: "Current queue", value: "Pending Invoice Review", helper: "Workbench task type" },
    { label: "Next step", value: "Review and send invoice", helper: "Invoices workflow" },
  ],
  milestones: [
    {
      eyebrow: "WORKSPACE",
      icon: Building,
      title: "Confirm your Site and Entity",
      description:
        "Before reviewing invoices or recording payments, make sure you're working in the correct Test or Live Site and the correct entity.",
      status: "Complete",
      cta: "Check current workspace",
      completeWhen: "Site and entity are confirmed.",
    },
    {
      eyebrow: "WORKBENCH",
      icon: Inbox,
      title: "Understand your task queues",
      description:
        "Learn where Pending Invoice Reviews, Collections handoffs, and assigned billing tasks appear, and how work moves between teams.",
      status: "In progress",
      cta: "Open Workbench",
      completeWhen: "At least one task is opened from Workbench.",
    },
    {
      eyebrow: "CONTRACTS + INVOICES",
      icon: Receipt,
      title: "Review and send a pending invoice",
      description:
        "See how an enforced contract creates an invoice in Pending state. Validate customer details, dates, terms, taxes, and line items before sending it.",
      status: "Not started",
      cta: "Open Pending Invoices",
      completeWhen: "A test invoice is reviewed and sent.",
    },
    {
      eyebrow: "INVOICES",
      icon: Banknote,
      title: "Record a payment",
      description:
        "Mark an invoice as paid using Bank Transfer, Check, Cash, or Other, and capture the payment reference for reconciliation.",
      status: "Blocked",
      cta: "Record test payment",
      completeWhen: "A payment is recorded against a test invoice.",
    },
    {
      eyebrow: "WORKBENCH + INVOICES",
      icon: RefreshCw,
      title: "Resolve a billing issue from Collections",
      description:
        "Pick up a task raised by AR, fix the invoice issue, regenerate or resend the invoice, and hand it back for follow-up.",
      status: "Blocked",
      cta: "Work a billing handoff",
      completeWhen: "One billing issue is resolved from Workbench.",
    },
    {
      eyebrow: "CUSTOMERS + USAGES",
      icon: Gauge,
      title: "Check commitment burn-down before it becomes a dispute",
      description:
        "Review a customer's prepaid balance, usage drawdown, and overage exposure so you can answer billing questions with confidence.",
      status: "Not started",
      cta: "Open Customer details",
      completeWhen: "A customer burn-down view is reviewed.",
    },
  ],
  footerCallout: {
    title: "Need full customer context?",
    description:
      "Open Customers to view contract status, outstanding invoices, credit balance burn-down, and current entitlements in one place.",
    primaryCta: "Open Customers",
  },
};

// ---------------------------------------------------------------------------
// Admin (Billing Manager) right rail cards
// ---------------------------------------------------------------------------

export const adminRailCards: OperatorRailCard[] = [
  {
    title: "Your role",
    body: "As a Billing Manager, you're responsible for configuring Chargebee APEX end-to-end — setting up entities, building the product catalog, enabling contract enforcement, and validating the full quote-to-cash flow before your team goes live.",
  },
  {
    title: "What you'll learn",
    items: [
      "Configure entity, currency, and finance defaults",
      "Build products, plans, and pricing",
      "Set up CRM sync and approval routing",
      "Enable contract ingestion and enforcement",
      "Validate the end-to-end billing flow",
    ],
  },
  {
    title: "Recommended next",
    links: [
      {
        title: "Invite your Billing Operator",
        subtext:
          "Once your entity is configured, add an operator so they can start reviewing invoices and recording payments.",
      },
      {
        title: "Review your go-live checklist",
        subtext:
          "Verify all required milestones are complete and your Test Site is ready before switching to Live Site.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Operator right rail cards
// ---------------------------------------------------------------------------

export const operatorRailCards: OperatorRailCard[] = [
  {
    title: "Your role",
    body: "As a Billing Operator, your focus is reviewing pending invoices, recording payments, resolving billing issues, and coordinating handoffs from Collections.",
  },
  {
    title: "What you'll learn",
    items: [
      "Review and send invoices",
      "Record customer payments",
      "Resolve AR billing issues",
      "Check customer commitment burn-down",
    ],
  },
  {
    title: "Recommended next",
    links: [
      {
        title: "Practice a contract amendment",
        subtext:
          "Create a seat addition or tier upgrade that co-terminates with the original contract.",
      },
      {
        title: "See how your work impacts revenue",
        subtext:
          "Understand how sent invoices, paid invoices, and open receivables appear in RevenueStory.",
      },
    ],
  },
];
