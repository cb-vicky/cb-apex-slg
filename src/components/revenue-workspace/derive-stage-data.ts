import type { Customer, Quote, Contract, Invoice } from "@/data/mock-data";
import { getInvoices } from "@/data/mock-data";
import {
  getCollectionCasesForCustomer,
  getCreditNotesForCustomer,
  getCustomerArSummary,
  getInvoiceEnrichment,
  getPaymentsForCustomer,
} from "@/data/billing-data";
import { getRevenueArrangement, type RevenueArrangement } from "@/data/revrec-data";
import { getTicketsForCustomer } from "@/data/support-data";
import type { Stage } from "./RevenueJourneyRail";
import { currency, shortDate } from "@/lib/utils";

// ---------------------------------------------------------------------------
// STAGE STATUS (journey rail labels)
// ---------------------------------------------------------------------------

export type StatusSeverity = "green" | "amber" | "red" | "blue";

export interface StageStatus {
  text: string;
  severity: StatusSeverity;
}

const severityToColor: Record<StatusSeverity, string> = {
  green: "text-emerald-600",
  amber: "text-amber-600",
  red: "text-red-600",
  blue: "text-blue-600",
};

export function severityColor(severity: StatusSeverity): string {
  return severityToColor[severity];
}

export function deriveCustomerStatus(customer: Customer): StageStatus {
  if (customer.riskBadges.length > 0) {
    const hasOverdue = customer.riskBadges.some((b) => b.toLowerCase().includes("overdue"));
    return {
      text: `${customer.riskBadges.length} risk flag${customer.riskBadges.length > 1 ? "s" : ""}`,
      severity: hasOverdue ? "red" : "amber",
    };
  }
  return { text: "Healthy", severity: "green" };
}

export function deriveQuoteStatus(quote: Quote): StageStatus {
  if (quote.approval.status === "pending") {
    return { text: `Pending Approval · ${quote.approval.currentApprover.split(",")[0]}`, severity: "amber" };
  }
  if (quote.approval.status === "rejected") {
    return { text: "Rejected", severity: "red" };
  }
  if (quote.status === "Draft") {
    return { text: "Draft", severity: "blue" };
  }
  if (quote.status === "Sent") {
    return { text: "Sent · awaiting response", severity: "amber" };
  }
  if (quote.status === "Accepted" || quote.approval.status === "approved") {
    return { text: `Approved · ${currency(quote.amount)}`, severity: "green" };
  }
  return { text: quote.status, severity: "blue" };
}

export function deriveContractStatus(contract: Contract): StageStatus {
  const parts: string[] = [];
  parts.push(contract.status);
  if (contract.amendments.length > 0) {
    parts.push(`${contract.amendments.length} amendment${contract.amendments.length > 1 ? "s" : ""}`);
  }
  const hasBlocking = contract.enforcement.blockingIssues.length > 0;
  const hasOverdueSchedule = contract.billingSchedule.some((s) => s.status === "Overdue");
  const severity: StatusSeverity = hasBlocking ? "red" : hasOverdueSchedule ? "amber" : "green";
  return { text: parts.join(" + "), severity };
}

export function deriveInvoicingStatus(customerId: string): StageStatus {
  const inv = getInvoices(customerId);
  const pendingReview = inv.filter((i) => i.status === "Pending Review").length;
  const overdue = inv.filter((i) => i.status === "Overdue").length;
  const held = inv.filter((i) => i.holdReason).length;

  const parts: string[] = [];
  if (overdue > 0) parts.push(`${overdue} overdue`);
  if (pendingReview > 0) parts.push(`${pendingReview} pending review`);
  if (held > 0) parts.push(`${held} held`);

  if (parts.length === 0) {
    return { text: "All clear", severity: "green" };
  }
  const severity: StatusSeverity = overdue > 0 ? "red" : "amber";
  return { text: parts.join(" · "), severity };
}

export function derivePaymentStatus(customerId: string): StageStatus {
  const summary = getCustomerArSummary(customerId);
  const payments = getPaymentsForCustomer(customerId);
  const unapplied = payments.filter((p) => p.matchStatus === "unapplied");

  const parts: string[] = [];
  if (summary.overdueCount > 0) parts.push(`${summary.overdueCount} overdue`);
  if (unapplied.length > 0) parts.push(`${currency(unapplied.reduce((s, p) => s + p.amount, 0))} unapplied`);
  if (summary.totalOpen > 0 && summary.overdueCount === 0) parts.push(`${currency(summary.totalOpen)} open`);

  if (parts.length === 0) {
    return { text: "No open AR", severity: "green" };
  }
  const severity: StatusSeverity = summary.overdueCount > 0 ? "red" : "amber";
  return { text: parts.join(" · "), severity };
}

export function deriveRevRecStatus(contractId: string): StageStatus {
  const arr = getRevenueArrangement(contractId);
  if (!arr) return { text: "No arrangement", severity: "blue" };
  const unresolvedBlockers = arr.closeBlockers.filter((b) => !b.resolved).length;
  const hasCritical = arr.closeBlockers.some((b) => !b.resolved && b.severity === "critical");
  if (unresolvedBlockers > 0) {
    return {
      text: `${unresolvedBlockers} blocker${unresolvedBlockers > 1 ? "s" : ""}`,
      severity: hasCritical ? "red" : "amber",
    };
  }
  return { text: arr.status === "Active" ? "Healthy" : arr.status, severity: "green" };
}

export function deriveAllStageStatuses(
  customer: Customer,
  quote: Quote,
  contract: Contract,
): Record<Stage, StageStatus> {
  return {
    customer: deriveCustomerStatus(customer),
    quote: deriveQuoteStatus(quote),
    contract: deriveContractStatus(contract),
    invoicing: deriveInvoicingStatus(customer.id),
    payment: derivePaymentStatus(customer.id),
    revrec: deriveRevRecStatus(contract.id),
  };
}

// ---------------------------------------------------------------------------
// AI INSIGHTS (dynamic per stage)
// ---------------------------------------------------------------------------

export interface InsightItem {
  severity: "warning" | "info" | "success";
  text: string;
}

export function getCustomerInsights(customer: Customer): InsightItem[] {
  const items: InsightItem[] = [];
  if (customer.prepaidCreditTotal > 0) {
    const pct = Math.round(((customer.prepaidCreditTotal - customer.prepaidCreditBalance) / customer.prepaidCreditTotal) * 100);
    if (pct > 70) items.push({ severity: "warning", text: `Prepaid credit ${pct}% consumed — ${currency(customer.prepaidCreditBalance)} remaining` });
  }
  if (customer.openAr > 0) items.push({ severity: "warning", text: `${currency(customer.openAr)} in open accounts receivable` });
  if (customer.riskBadges.some((b) => b.toLowerCase().includes("overdue"))) items.push({ severity: "warning", text: "Customer has overdue invoices requiring attention" });
  if (customer.riskBadges.some((b) => b.toLowerCase().includes("mismatch"))) items.push({ severity: "info", text: "Legal entity mismatch detected between billing and CRM" });
  if (customer.nextRenewalDate) {
    const days = Math.round((new Date(customer.nextRenewalDate).getTime() - Date.now()) / 86400000);
    if (days < 90 && days > 0) items.push({ severity: "info", text: `Contract renewal in ${days} days — start planning` });
  }
  if (customer.crmSyncStatus === "Stale") items.push({ severity: "info", text: "CRM sync is stale — last update was over 2 weeks ago" });
  if (items.length === 0) items.push({ severity: "success", text: "Account in healthy state — no immediate action required" });
  return items;
}

export function getQuoteInsights(quote: Quote, contract: Contract): InsightItem[] {
  const items: InsightItem[] = [];
  if (quote.discountPct > 15) {
    items.push({ severity: "warning", text: `Discount (${quote.discountPct}%) exceeds policy threshold — requires approval` });
  }
  if (quote.commercialTerms.paymentTerms !== contract.paymentTerms && contract.paymentTerms) {
    items.push({ severity: "warning", text: `Payment terms (${quote.commercialTerms.paymentTerms}) differ from prior contract (${contract.paymentTerms})` });
  }
  const creditProduct = quote.products.find((p) => p.prepaidCredits && p.prepaidCredits > 0);
  if (creditProduct) {
    items.push({ severity: "info", text: `Quote includes ${creditProduct.prepaidCredits?.toLocaleString()} prepaid credits — burn-down suggests customer may need more` });
  }
  if (quote.crmSyncStatus !== "Synced") {
    items.push({ severity: "warning", text: `CRM sync status: ${quote.crmSyncStatus} — opportunity data may be stale` });
  }
  if (quote.approval.status === "pending") {
    const days = quote.approval.pendingSince ? Math.round((Date.now() - new Date(quote.approval.pendingSince).getTime()) / 86400000) : 0;
    if (days > 3) items.push({ severity: "warning", text: `Approval pending for ${days} days with ${quote.approval.currentApprover}` });
  }
  if (quote.commercialTerms.contractTerm !== contract.term && contract.term) {
    items.push({ severity: "info", text: `Contract term (${quote.commercialTerms.contractTerm}) differs from current contract (${contract.term})` });
  }
  if (items.length === 0) items.push({ severity: "success", text: "Quote is in good standing — no issues detected" });
  return items;
}

export function getContractInsights(contract: Contract, customerInvoices: Invoice[]): InsightItem[] {
  const items: InsightItem[] = [];
  const overdueInvoices = customerInvoices.filter((i) => i.status === "Overdue" && i.contractId === contract.id);
  if (overdueInvoices.length > 0) {
    const oldest = overdueInvoices[0];
    const daysOverdue = Math.round((Date.now() - new Date(oldest.dueDate).getTime()) / 86400000);
    items.push({ severity: "warning", text: `Invoice ${oldest.id} is ${daysOverdue} days overdue (${currency(oldest.amount)})` });
  }
  if (contract.comparisonToQuote.length > 0) {
    items.push({ severity: "warning", text: `Signed contract differs from quote on ${contract.comparisonToQuote.length} field${contract.comparisonToQuote.length > 1 ? "s" : ""}: ${contract.comparisonToQuote.map((d) => d.field).join(", ")}` });
  }
  if (contract.prepaidCreditTotal > 0) {
    const burnDays = contract.prepaidCreditBalance > 0
      ? Math.round(contract.prepaidCreditBalance / ((contract.prepaidCreditTotal - contract.prepaidCreditBalance) / Math.max(1, Math.round((Date.now() - new Date(contract.effectiveDate).getTime()) / 86400000))))
      : 0;
    if (burnDays > 0 && burnDays < 60) items.push({ severity: "info", text: `Minimum commit will exhaust in ~${burnDays} days at current burn rate` });
  }
  if (contract.renewalDate) {
    const daysToRenewal = Math.round((new Date(contract.renewalDate).getTime() - Date.now()) / 86400000);
    if (daysToRenewal > 0 && daysToRenewal < 90) items.push({ severity: "info", text: `Renewal in ${daysToRenewal} days — start planning` });
  }
  if (contract.enforcement.productMappingIssues.length === 0 && contract.enforcement.enforcementStatus === "Enforced") {
    items.push({ severity: "success", text: "Product mapping complete — all SKUs matched" });
  }
  if (contract.enforcement.blockingIssues.length > 0) {
    items.push({ severity: "warning", text: `${contract.enforcement.blockingIssues.length} enforcement blocking issue${contract.enforcement.blockingIssues.length > 1 ? "s" : ""}` });
  }
  if (items.length === 0) items.push({ severity: "success", text: "Contract is healthy — no issues" });
  return items;
}

export function getInvoicingInsights(invoice: Invoice, contract: Contract): InsightItem[] {
  const items: InsightItem[] = [];
  const enrichment = getInvoiceEnrichment(invoice.id);
  if (enrichment && enrichment.paymentTerms !== contract.paymentTerms) {
    items.push({ severity: "warning", text: `Invoice payment terms (${enrichment.paymentTerms}) differ from contract (${contract.paymentTerms})` });
  }
  if (invoice.holdReason) {
    items.push({ severity: "warning", text: `Invoice on hold: ${invoice.holdReason}` });
  }
  if (invoice.disputeReason) {
    items.push({ severity: "warning", text: `Dispute active: ${invoice.disputeReason}` });
  }
  if (enrichment && enrichment.reviewChecklist.some((c) => c.status === "fail")) {
    const failCount = enrichment.reviewChecklist.filter((c) => c.status === "fail").length;
    items.push({ severity: "warning", text: `${failCount} validation check${failCount > 1 ? "s" : ""} failed — resolve before sending` });
  }
  const creditNotes = getCreditNotesForCustomer(invoice.customerId).filter((cn) => cn.invoiceId === invoice.id);
  if (creditNotes.length > 0) {
    const pending = creditNotes.filter((cn) => cn.status !== "Issued");
    if (pending.length > 0) items.push({ severity: "info", text: `${pending.length} credit note${pending.length > 1 ? "s" : ""} pending for this invoice` });
  }
  if (enrichment && enrichment.poNumber) {
    items.push({ severity: "success", text: "PO number available — ready for delivery" });
  } else if (enrichment && !enrichment.poNumber) {
    items.push({ severity: "warning", text: "PO number missing — invoice cannot be sent" });
  }
  if (contract.amendments.length > 0) {
    const recent = contract.amendments.filter((a) => a.status !== "Applied" && a.status !== "Completed");
    if (recent.length > 0) items.push({ severity: "info", text: `${recent.length} pending amendment${recent.length > 1 ? "s" : ""} may affect upcoming invoices` });
  }
  if (items.length === 0) items.push({ severity: "success", text: "Invoice is in good standing" });
  return items;
}

export function getPaymentInsights(customerId: string): InsightItem[] {
  const items: InsightItem[] = [];
  const summary = getCustomerArSummary(customerId);
  const payments = getPaymentsForCustomer(customerId);
  const cases = getCollectionCasesForCustomer(customerId);

  if (summary.avgDaysToPay > 15) {
    items.push({ severity: "warning", text: `Customer typically pays ${summary.avgDaysToPay} days after due date` });
  }
  const unapplied = payments.filter((p) => p.matchStatus === "unapplied");
  if (unapplied.length > 0) {
    items.push({ severity: "info", text: `${currency(unapplied.reduce((s, p) => s + p.amount, 0))} unapplied cash — review bank references for match` });
  }
  const partial = payments.filter((p) => p.matchStatus === "partial");
  if (partial.length > 0) {
    items.push({ severity: "info", text: `Partial payment on ${partial[0].allocations[0]?.invoiceId ?? "unknown"} — ${currency(partial[0].amount)} received` });
  }
  if (cases.some((c) => c.disputeReason)) {
    const disputeCase = cases.find((c) => c.disputeReason);
    items.push({ severity: "warning", text: `Active dispute: ${disputeCase?.disputeReason}` });
  }
  if (summary.totalOverdue > 0 && summary.overdueCount > 0) {
    items.push({ severity: "warning", text: `${currency(summary.totalOverdue)} overdue across ${summary.overdueCount} invoice${summary.overdueCount > 1 ? "s" : ""} — may impact renewal` });
  }
  const ptpCases = cases.filter((c) => c.ptpDate);
  if (ptpCases.length > 0) {
    items.push({ severity: "info", text: `Customer committed to pay by ${ptpCases[0].ptpDate}` });
  }
  if (items.length === 0) items.push({ severity: "success", text: "No outstanding collection issues" });
  return items;
}

export function getRevRecInsights(arrangement: RevenueArrangement | undefined): InsightItem[] {
  if (!arrangement) return [{ severity: "info", text: "No revenue arrangement found — will be created on contract enforcement" }];
  const items: InsightItem[] = [];
  const unresolvedBlockers = arrangement.closeBlockers.filter((b) => !b.resolved);
  if (unresolvedBlockers.length > 0) {
    const critical = unresolvedBlockers.filter((b) => b.severity === "critical");
    if (critical.length > 0) items.push({ severity: "warning", text: `${critical.length} critical blocker${critical.length > 1 ? "s" : ""} preventing period close` });
    const warnings = unresolvedBlockers.filter((b) => b.severity === "warning");
    if (warnings.length > 0) items.push({ severity: "info", text: `${warnings.length} warning${warnings.length > 1 ? "s" : ""} to review before close` });
  }
  const pendingAmendments = arrangement.amendmentImpacts.filter((ai) => ai.scheduleUpdateState.toLowerCase().includes("pending"));
  if (pendingAmendments.length > 0) {
    items.push({ severity: "warning", text: `Amendment ${pendingAmendments[0].amendmentId} has not updated the recognition schedule` });
  }
  const pendingAdj = arrangement.adjustments.filter((a) => a.status === "pending_approval");
  if (pendingAdj.length > 0) {
    items.push({ severity: "info", text: `${pendingAdj.length} manual adjustment${pendingAdj.length > 1 ? "s" : ""} awaiting approval` });
  }
  const failedExports = arrangement.journalExports.filter((je) => je.status === "failed" || (je.status === "pending" && je.failReason));
  if (failedExports.length > 0) {
    items.push({ severity: "warning", text: `Journal export blocked for ${failedExports[0].period}: ${failedExports[0].failReason || "pending resolution"}` });
  }
  const usageBased = arrangement.obligations.filter((o) => o.obligationType === "usage-based");
  if (usageBased.length > 0) {
    items.push({ severity: "info", text: `${usageBased.length} obligation${usageBased.length > 1 ? "s" : ""} using usage-based recognition — variable consideration applies` });
  }
  if (items.length === 0) items.push({ severity: "success", text: "Revenue arrangement is healthy — ready for close" });
  return items;
}

// ---------------------------------------------------------------------------
// LINKED RECORDS (dynamic per stage)
// ---------------------------------------------------------------------------

export interface LinkedRecord {
  label: string;
  id: string;
}

export function getQuoteLinkedRecords(quote: Quote): LinkedRecord[] {
  const records: LinkedRecord[] = [];
  if (quote.relatedContractId) records.push({ label: "Active Contract", id: quote.relatedContractId });
  if (quote.crmOpportunityLink) records.push({ label: "CRM Opportunity", id: quote.crmOpportunityLink.split("/").pop() ?? "—" });
  return records;
}

export function getContractLinkedRecords(contract: Contract, customerQuotes: Quote[], customerInvoices: Invoice[]): LinkedRecord[] {
  const records: LinkedRecord[] = [];
  if (contract.sourceQuoteId) records.push({ label: "Source Quote", id: contract.sourceQuoteId });
  const pendingQuotes = customerQuotes.filter((q) => q.status !== "Accepted" && q.relatedContractId === contract.id);
  for (const q of pendingQuotes.slice(0, 2)) records.push({ label: `Quote (${q.status.toLowerCase()})`, id: q.id });
  const overdueInv = customerInvoices.filter((i) => i.status === "Overdue" && i.contractId === contract.id);
  for (const inv of overdueInv.slice(0, 2)) records.push({ label: "Overdue Invoice", id: inv.id });
  return records;
}

export function getInvoicingLinkedRecords(invoice: Invoice, customerId: string): LinkedRecord[] {
  const records: LinkedRecord[] = [];
  if (invoice.contractId) records.push({ label: "Source Contract", id: invoice.contractId });
  const cns = getCreditNotesForCustomer(customerId).filter((cn) => cn.invoiceId === invoice.id);
  for (const cn of cns) records.push({ label: "Credit Note", id: cn.id });
  const cases = getCollectionCasesForCustomer(customerId).filter((c) => c.invoiceId === invoice.id);
  for (const c of cases) records.push({ label: "Collection Case", id: c.id });
  return records;
}

export function getPaymentLinkedRecords(customerId: string): LinkedRecord[] {
  const records: LinkedRecord[] = [];
  const inv = getInvoices(customerId);
  const overdue = inv.filter((i) => i.status === "Overdue");
  for (const i of overdue.slice(0, 2)) records.push({ label: "Overdue Invoice", id: i.id });
  const held = inv.filter((i) => i.holdReason);
  for (const i of held.slice(0, 2)) records.push({ label: "Held Invoice", id: i.id });
  const cns = getCreditNotesForCustomer(customerId);
  for (const cn of cns.slice(0, 2)) records.push({ label: "Credit Note", id: cn.id });
  const tickets = getTicketsForCustomer(customerId).filter((t) => t.status !== "Resolved");
  for (const t of tickets.slice(0, 1)) records.push({ label: "Support Ticket", id: t.id });
  return records;
}

export function getRevRecLinkedRecords(arrangement: RevenueArrangement | undefined): LinkedRecord[] {
  if (!arrangement) return [];
  const records: LinkedRecord[] = [];
  records.push({ label: "Source Contract", id: arrangement.contractId });
  const pendingAmendments = arrangement.amendmentImpacts.filter((ai) => ai.scheduleUpdateState.toLowerCase().includes("pending"));
  for (const ai of pendingAmendments) records.push({ label: `Amendment (${ai.scheduleUpdateState.toLowerCase()})`, id: ai.amendmentId });
  const blockedExports = arrangement.journalExports.filter((je) => je.status === "pending" || je.status === "failed");
  for (const je of blockedExports.slice(0, 1)) records.push({ label: `Journal (${je.status})`, id: je.id });
  return records;
}

// ---------------------------------------------------------------------------
// NEXT BEST ACTIONS (dynamic per stage)
// ---------------------------------------------------------------------------

export interface NextAction {
  label: string;
  description: string;
}

export function getQuoteActions(quote: Quote): NextAction[] {
  const actions: NextAction[] = [];
  if (quote.approval.status === "pending") {
    actions.push({ label: "Follow up on approval", description: `Pending with ${quote.approval.currentApprover} since ${shortDate(quote.approval.pendingSince)}` });
  }
  if (quote.status === "Sent" && !quote.customerAcceptedAt) {
    actions.push({ label: "Follow up with customer", description: `Quote sent — no response yet` });
  }
  if (quote.status === "Draft") {
    actions.push({ label: "Complete and send quote", description: `Draft quote needs finalization` });
  }
  if (quote.discountPct > 15) {
    actions.push({ label: "Review discount level", description: `${quote.discountPct}% discount — verify margin impact` });
  }
  return actions;
}

export function getContractActions(contract: Contract, customerInvoices: Invoice[]): NextAction[] {
  const actions: NextAction[] = [];
  const overdue = customerInvoices.filter((i) => i.status === "Overdue" && i.contractId === contract.id);
  if (overdue.length > 0) {
    actions.push({ label: `Resolve overdue invoice`, description: `${overdue[0].id} is past due (${currency(overdue[0].amount)})` });
  }
  const held = customerInvoices.filter((i) => i.holdReason && i.contractId === contract.id);
  if (held.length > 0) {
    actions.push({ label: `Collect PO for held invoice`, description: `${held[0].id} on hold: ${held[0].holdReason}` });
  }
  if (contract.renewalDate) {
    const days = Math.round((new Date(contract.renewalDate).getTime() - Date.now()) / 86400000);
    if (days > 0 && days < 90) actions.push({ label: "Start renewal planning", description: `Contract ends ${shortDate(contract.renewalDate)}` });
  }
  if (contract.enforcement.blockingIssues.length > 0) {
    actions.push({ label: "Resolve enforcement blockers", description: contract.enforcement.blockingIssues[0] });
  }
  return actions;
}

export function getInvoicingActions(invoice: Invoice): NextAction[] {
  const actions: NextAction[] = [];
  if (invoice.holdReason) {
    actions.push({ label: `Release hold on ${invoice.id}`, description: `Held: ${invoice.holdReason}` });
  }
  if (invoice.status === "Overdue") {
    const days = Math.round((Date.now() - new Date(invoice.dueDate).getTime()) / 86400000);
    actions.push({ label: `Send overdue reminder`, description: `${invoice.id} is ${days} days past due` });
  }
  if (invoice.status === "Pending Review") {
    actions.push({ label: `Review and approve ${invoice.id}`, description: `${currency(invoice.amount)} pending review` });
  }
  const cns = getCreditNotesForCustomer(invoice.customerId).filter((cn) => cn.invoiceId === invoice.id && cn.status !== "Issued");
  if (cns.length > 0) {
    actions.push({ label: `Process credit note ${cns[0].id}`, description: `${currency(cns[0].amount)} pending — ${cns[0].reason.substring(0, 50)}` });
  }
  return actions;
}

export function getPaymentActions(customerId: string): NextAction[] {
  const actions: NextAction[] = [];
  const payments = getPaymentsForCustomer(customerId);
  const cases = getCollectionCasesForCustomer(customerId);
  const summary = getCustomerArSummary(customerId);

  const unapplied = payments.filter((p) => p.matchStatus === "unapplied");
  if (unapplied.length > 0) {
    actions.push({ label: `Match unapplied ${currency(unapplied[0].amount)}`, description: `${unapplied[0].method} — Ref: ${unapplied[0].bankReference}` });
  }
  const partial = payments.filter((p) => p.matchStatus === "partial");
  if (partial.length > 0) {
    actions.push({ label: `Resolve partial payment`, description: `${currency(partial[0].amount)} received against ${partial[0].allocations[0]?.invoiceId ?? "unknown"}` });
  }
  const ptpCases = cases.filter((c) => c.ptpDate);
  if (ptpCases.length > 0) {
    actions.push({ label: "Follow up on promised payment", description: `Customer committed to pay by ${ptpCases[0].ptpDate}` });
  }
  const noResponse = cases.filter((c) => c.stage === "No Response");
  if (noResponse.length > 0) {
    actions.push({ label: `Escalate ${noResponse[0].invoiceId}`, description: `No response after ${noResponse[0].followUpHistory.length} attempts` });
  }
  if (summary.overdueCount > 0 && actions.length === 0) {
    actions.push({ label: "Record payment", description: `${currency(summary.totalOverdue)} overdue` });
  }
  return actions;
}

export function getRevRecActions(arrangement: RevenueArrangement | undefined): NextAction[] {
  if (!arrangement) return [];
  const actions: NextAction[] = [];
  const pendingAmendments = arrangement.amendmentImpacts.filter((ai) => ai.scheduleUpdateState.toLowerCase().includes("pending"));
  if (pendingAmendments.length > 0) {
    actions.push({ label: `Rerun schedule for ${pendingAmendments[0].amendmentId}`, description: pendingAmendments[0].description });
  }
  const pendingAdj = arrangement.adjustments.filter((a) => a.status === "pending_approval");
  if (pendingAdj.length > 0) {
    actions.push({ label: `Approve adjustment ${pendingAdj[0].id}`, description: `${pendingAdj[0].reason}` });
  }
  const unresolvedBlockers = arrangement.closeBlockers.filter((b) => !b.resolved);
  if (unresolvedBlockers.length > 0) {
    actions.push({ label: "Resolve close blockers", description: `${unresolvedBlockers.length} blocker${unresolvedBlockers.length > 1 ? "s" : ""} preventing period close` });
  }
  const failedExports = arrangement.journalExports.filter((je) => je.status === "failed");
  if (failedExports.length > 0) {
    actions.push({ label: "Re-export failed journal entries", description: `${failedExports[0].period}: ${failedExports[0].failReason}` });
  }
  return actions;
}

// ---------------------------------------------------------------------------
// CUSTOMER HEALTH (dynamic from support data)
// ---------------------------------------------------------------------------

export interface CustomerHealthData {
  nps: number;
  supportTickets30d: number;
  openEscalations: number;
  productAdoption: "High" | "Medium" | "Low";
  adoptionColor: string;
  churnRisk: "High" | "Medium" | "Low";
  churnColor: string;
}

export function deriveCustomerHealth(customer: Customer): CustomerHealthData {
  const tickets = getTicketsForCustomer(customer.id);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recent = tickets.filter((t) => new Date(t.lastUpdatedAt) >= thirtyDaysAgo);
  const escalations = tickets.filter((t) => t.status === "Escalated");

  const hasOverdue = customer.riskBadges.some((b) => b.toLowerCase().includes("overdue"));
  const hasEscalation = customer.riskBadges.some((b) => b.toLowerCase().includes("escalation"));
  const hasBurn = customer.riskBadges.some((b) => b.toLowerCase().includes("burn"));

  const riskScore = (hasOverdue ? 2 : 0) + (hasEscalation ? 2 : 0) + (hasBurn ? 1 : 0) + (escalations.length > 0 ? 1 : 0);
  const churnRisk: "High" | "Medium" | "Low" = riskScore >= 4 ? "High" : riskScore >= 2 ? "Medium" : "Low";
  const churnColor = churnRisk === "High" ? "text-red-600" : churnRisk === "Medium" ? "text-amber-600" : "text-emerald-600";

  const creditPct = customer.prepaidCreditTotal > 0 ? ((customer.prepaidCreditTotal - customer.prepaidCreditBalance) / customer.prepaidCreditTotal) : 0;
  const productAdoption: "High" | "Medium" | "Low" = creditPct > 0.5 ? "High" : creditPct > 0.2 ? "Medium" : "Low";
  const adoptionColor = productAdoption === "High" ? "text-emerald-600" : productAdoption === "Medium" ? "text-amber-600" : "text-red-600";

  const nps = riskScore >= 4 ? 32 : riskScore >= 2 ? 52 : 72;

  return {
    nps,
    supportTickets30d: recent.length,
    openEscalations: escalations.length,
    productAdoption,
    adoptionColor,
    churnRisk,
    churnColor,
  };
}
