import { Routes, Route, Navigate } from "react-router-dom";
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

export default function App() {
  return (
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

        {/* Canonical customer-centric detail shell */}
        <Route path="/customers/:customerId" element={<CustomerDetailPage />} />

        {/* Alias routes (render through same customer shell) */}
        <Route path="/quotes/:quoteId" element={<QuoteDetailPage />} />
        <Route path="/contracts/:contractId" element={<ContractDetailPage />} />
        <Route path="/invoices/:invoiceId" element={<InvoiceDetailPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
