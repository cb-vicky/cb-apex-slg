import { Routes, Route, Navigate } from "react-router-dom";
import { WorkbenchRoleProvider } from "@/context/WorkbenchRoleContext";
import { IngestProvider } from "@/context/IngestContext";
import { AppShell } from "@/components/layout/AppShell";
import { WorkbenchHome } from "@/pages/workbench/WorkbenchHome";
import { CustomersIndex } from "@/pages/CustomersIndex";
import { QuotesIndex } from "@/pages/QuotesIndex";
import { ContractsIndex } from "@/pages/ContractsIndex";
import { InvoicesIndex } from "@/pages/InvoicesIndex";
import { CustomerDetailPage } from "@/pages/CustomerDetailPage";
import { QuoteDetailPage } from "@/pages/QuoteDetailPage";
import { ContractDetailPage } from "@/pages/ContractDetailPage";
import { InvoiceDetailPage } from "@/pages/InvoiceDetailPage";
import { IngestContractPage } from "@/pages/IngestContractPage";
import { ApprovalsIndex } from "@/pages/ApprovalsIndex";
import { ApprovalDetailPage } from "@/pages/ApprovalDetailPage";

export default function App() {
  return (
    <WorkbenchRoleProvider>
      <IngestProvider>
        <AppShell>
          <Routes>
            {/* Workbench home */}
            <Route path="/" element={<WorkbenchHome />} />
            <Route path="/workbench" element={<WorkbenchHome />} />

            {/* Resource index pages (grouped landing + filtered list) */}
            <Route path="/customers" element={<CustomersIndex />} />
            <Route path="/quotes" element={<QuotesIndex />} />
            <Route path="/contracts" element={<ContractsIndex />} />
            <Route path="/invoices" element={<InvoicesIndex />} />

            {/* Contract ingestion — must be before /contracts/:contractId */}
            <Route path="/contracts/ingest" element={<IngestContractPage />} />

            {/* Approvals module */}
            <Route path="/approvals" element={<ApprovalsIndex />} />
            <Route path="/approvals/invoices/:invoiceId" element={<ApprovalDetailPage />} />

            {/* Canonical customer-centric detail shell */}
            <Route path="/customers/:customerId" element={<CustomerDetailPage />} />

            {/* Alias routes (render through same customer shell) */}
            <Route path="/quotes/:quoteId" element={<QuoteDetailPage />} />
            <Route path="/contracts/:contractId" element={<ContractDetailPage />} />
            <Route path="/invoices/:invoiceId" element={<InvoiceDetailPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </IngestProvider>
    </WorkbenchRoleProvider>
  );
}
