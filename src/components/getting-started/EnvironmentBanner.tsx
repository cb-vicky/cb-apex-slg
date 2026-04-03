import { AlertTriangle } from "lucide-react";

export function EnvironmentBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-5 py-3.5">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
      <div>
        <p className="text-[13px] font-semibold text-amber-800">
          You're setting up this entity in Test Site
        </p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-amber-700">
          Use Test Site to validate quotes, contracts, invoices, collections, and payment
          workflows before switching to Live Site.
        </p>
      </div>
    </div>
  );
}
