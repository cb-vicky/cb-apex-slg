import { Routes, Route, Navigate } from "react-router-dom";
import { DemoPersonaProvider } from "@/context/DemoPersonaContext";
import { IngestProvider } from "@/context/IngestContext";
import { WorkspaceShellProvider } from "@/context/WorkspaceShellContext";
import { AssistantChatsProvider } from "@/lib/assistantChatsContext";
import { AssistantWorkspaceProvider } from "@/lib/assistantWorkspace";
import { ProductNavCollapseProvider } from "@/lib/productNavCollapse";
import { SessionsRailCollapseProvider } from "@/lib/sessionsRailCollapse";
import { SuiteProductProvider } from "@/lib/suiteNav";
import { SuiteLayoutRefreshProvider } from "@/lib/suiteLayoutRefresh";
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
import { ApprovalDetailPage } from "@/pages/ApprovalDetailPage";
import { ModuleStubPage } from "@/pages/ModuleStubPage";
import { EntityDrawer } from "@/components/common/EntityDrawer";
import { RootErrorBoundary } from "@/components/common/RootErrorBoundary";
import { LinkCustomerModal } from "@/components/ingestion/LinkCustomerModal";

export default function App() {
  return (
    <RootErrorBoundary>
    <AssistantWorkspaceProvider>
      <AssistantChatsProvider>
        <SuiteLayoutRefreshProvider>
          <SuiteProductProvider>
            <ProductNavCollapseProvider>
              <SessionsRailCollapseProvider>
    <IngestProvider>
      <DemoPersonaProvider>
        <WorkspaceShellProvider>
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
            <Route path="/collections" element={<ModuleStubPage title="Collections" />} />
            <Route path="/revrec" element={<ModuleStubPage title="RevRec" />} />
            <Route path="/communications" element={<ModuleStubPage title="Communications" />} />

            {/* Queue and Approvals index routes redirect to workbench tabs */}
            <Route path="/queue" element={<Navigate to="/?tab=queue" replace />} />
            <Route path="/queue/:queueItemId" element={<Navigate to="/?tab=queue" replace />} />
            <Route path="/approvals" element={<Navigate to="/?tab=approvals" replace />} />
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
          <LinkCustomerModal />
          </>
        </AppShell>
        </WorkspaceShellProvider>
        </DemoPersonaProvider>
      </IngestProvider>
              </SessionsRailCollapseProvider>
            </ProductNavCollapseProvider>
          </SuiteProductProvider>
        </SuiteLayoutRefreshProvider>
      </AssistantChatsProvider>
    </AssistantWorkspaceProvider>
    </RootErrorBoundary>
  );
}
