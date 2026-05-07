import { Routes, Route, Navigate } from "react-router-dom";
import { DemoPersonaProvider } from "@/context/DemoPersonaContext";
import { IngestProvider } from "@/context/IngestContext";
import { AppShell } from "@/components/layout/AppShell";
import { WorkbenchHome } from "@/pages/workbench/WorkbenchHome";
import { CustomersIndex } from "@/pages/CustomersIndex";
import { ProspectsIndex } from "@/pages/ProspectsIndex";
import { QuotesIndex } from "@/pages/QuotesIndex";
import { ContractsIndex } from "@/pages/ContractsIndex";
import { InvoicesIndex } from "@/pages/InvoicesIndex";
import { CustomerDetailPage } from "@/pages/CustomerDetailPage";
import { QuoteDetailPage } from "@/pages/QuoteDetailPage";
import { ContractDetailPage } from "@/pages/ContractDetailPage";
import { InvoiceDetailPage } from "@/pages/InvoiceDetailPage";
import { QueueIngestPage } from "@/pages/QueueIngestPage";
import { ApprovalDetailPage } from "@/pages/ApprovalDetailPage";
import { EntityDrawer } from "@/components/common/EntityDrawer";

export default function App() {
  return (
    <IngestProvider>
      <DemoPersonaProvider>
        <AppShell>
          <>
          <Routes>
            {/* Workbench home (includes My Tasks, Queue, Approvals tabs) */}
            <Route path="/" element={<WorkbenchHome />} />
            <Route path="/workbench" element={<WorkbenchHome />} />

            {/* Resource index pages (grouped landing + filtered list) */}
            <Route path="/customers" element={<CustomersIndex />} />
            <Route path="/prospects" element={<ProspectsIndex />} />
            <Route path="/quotes" element={<QuotesIndex />} />
            <Route path="/contracts" element={<ContractsIndex />} />
            <Route path="/invoices" element={<InvoicesIndex />} />

            {/* Queue and Approvals index routes redirect to workbench tabs */}
            <Route path="/queue" element={<Navigate to="/?tab=queue" replace />} />
            <Route path="/approvals" element={<Navigate to="/?tab=approvals" replace />} />

            {/* Queue and Approvals detail routes still work */}
            <Route path="/queue/:queueItemId" element={<QueueIngestPage />} />
            <Route path="/approvals/invoices/:invoiceId" element={<ApprovalDetailPage />} />

            {/* Canonical customer-centric detail shell */}
            <Route path="/customers/:customerId" element={<CustomerDetailPage />} />

            {/* Alias routes (render through same customer shell) */}
            <Route path="/quotes/:quoteId" element={<QuoteDetailPage />} />
            <Route path="/contracts/:contractId" element={<ContractDetailPage />} />
            <Route path="/invoices/:invoiceId" element={<InvoiceDetailPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <EntityDrawer />
          </>
        </AppShell>
        </DemoPersonaProvider>
      </IngestProvider>
  );
}
