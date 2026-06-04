import { useScrolled } from "@/hooks/useScrolled";
import { OfflineInvoiceRemindersSection } from "@/components/automation/OfflineInvoiceRemindersSection";
import { PageHeader } from "@/components/index-page/PageHeader";
import { IndexPageFrame } from "@/components/index-page/IndexPageFrame";

export function AutomationIndex() {
  const { ref: scrollRef, isScrolled } = useScrolled();

  return (
    <IndexPageFrame
      headerRef={scrollRef}
      headerScrolled={isScrolled}
      header={<PageHeader title="Automation" />}
    >
      <OfflineInvoiceRemindersSection />
    </IndexPageFrame>
  );
}
