import { useCallback, useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ZenithSnippetVariant = "line-items" | "billing" | "addresses";

// Torn paper effect only on top and bottom edges (straight vertical sides)
const TORN_PAPER_CLIP_PATH =
  "polygon(0% 4%, 4% 0%, 8% 3%, 12% 0%, 16% 4%, 20% 1%, 24% 3%, 28% 0%, 32% 4%, 36% 1%, 40% 3%, 44% 0%, 48% 4%, 52% 1%, 56% 3%, 60% 0%, 64% 4%, 68% 1%, 72% 3%, 76% 0%, 80% 4%, 84% 1%, 88% 3%, 92% 0%, 96% 3%, 100% 0%, 100% 96%, 96% 100%, 92% 97%, 88% 100%, 84% 96%, 80% 99%, 76% 96%, 72% 100%, 68% 97%, 64% 100%, 60% 96%, 56% 99%, 52% 96%, 48% 100%, 44% 97%, 40% 100%, 36% 96%, 32% 99%, 28% 96%, 24% 100%, 20% 97%, 16% 100%, 12% 96%, 8% 99%, 4% 96%, 0% 100%)";

const SNIPPET_SECTION_TITLE: Record<ZenithSnippetVariant, string> = {
  "line-items": "Subscription items (contract excerpt)",
  billing: "Billing & payment terms (contract excerpt)",
  addresses: "Addresses (contract excerpt)",
};

type SnippetScale = "thumb" | "large";

function snippetTypography(scale: SnippetScale) {
  return scale === "thumb"
    ? {
        wrap: "space-y-2",
        heading: "text-[11px] font-bold",
        body: "text-[10px] leading-snug",
        table: "text-[9px]",
        pad: "px-3 py-3",
      }
    : {
        wrap: "space-y-3",
        heading: "text-[15px] font-bold",
        body: "text-[13px] leading-relaxed",
        table: "text-[12px]",
        pad: "px-5 py-5",
      };
}

function ContractSnippetPaper({
  variant,
  scale,
  className,
}: {
  variant: ZenithSnippetVariant;
  scale: SnippetScale;
  className?: string;
}) {
  const t = snippetTypography(scale);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[#f4f1ea] shadow-sm",
        t.pad,
        className,
      )}
      style={{ clipPath: TORN_PAPER_CLIP_PATH }}
    >
      {variant === "line-items" && <LineItemsSnippetBody typography={t} />}
      {variant === "billing" && <BillingSnippetBody typography={t} />}
      {variant === "addresses" && <AddressesSnippetBody typography={t} />}
    </div>
  );
}

type Typography = ReturnType<typeof snippetTypography>;

function LineItemsSnippetBody({ typography: t }: { typography: Typography }) {
  return (
    <div className={cn("font-serif text-gray-800", t.wrap, t.body)}>
      <p className={t.heading}>2. Subscription Items</p>
      <table className={cn("w-full border-collapse", t.table)}>
        <thead>
          <tr className="border-b border-gray-400">
            <th className="pr-1 text-left font-semibold">#</th>
            <th className="pr-1 text-left font-semibold">Subscription Item / Service</th>
            <th className="text-right font-semibold">Qty</th>
            <th className="text-right font-semibold">Term</th>
            <th className="text-right font-semibold">Unit Price (USD)</th>
            <th className="text-right font-semibold">Total Price (USD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-0.5">1</td>
            <td>Growth CRM</td>
            <td className="text-right">25</td>
            <td className="text-right">Yearly</td>
            <td className="text-right">1,200.00</td>
            <td className="text-right">30,000.00</td>
          </tr>
          <tr>
            <td className="py-0.5">2</td>
            <td>Onboarding &amp; Training</td>
            <td className="text-right">1</td>
            <td className="text-right">One-time</td>
            <td className="text-right">2,500.00</td>
            <td className="text-right">2,500.00</td>
          </tr>
          <tr>
            <td className="py-0.5">3</td>
            <td>Premium Support Add-on</td>
            <td className="text-right">1</td>
            <td className="text-right">Monthly</td>
            <td className="text-right">4,200.00</td>
            <td className="text-right">4,200.00</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function BillingSnippetBody({ typography: t }: { typography: Typography }) {
  return (
    <div className={cn("font-serif text-gray-800", t.wrap, t.body)}>
      <p className={t.heading}>3. Billing &amp; Payment Terms</p>
      <p className="text-gray-600">
        Subscription fees are invoiced annually in advance. Payment is due Net 30 days from the
        invoice date. Late payments accrue interest at 1.5% per month.
      </p>
    </div>
  );
}

function AddressesSnippetBody({ typography: t }: { typography: Typography }) {
  return (
    <div className={cn("font-serif text-gray-800", t.wrap, t.body)}>
      <p className={t.heading}>4. Addresses</p>
      <table className={cn("w-full border-collapse border border-gray-400", t.table)}>
        <thead>
          <tr className="bg-gray-200/80">
            <th className="border border-gray-400 px-1 py-1 text-left font-semibold">
              For Veloxa Systems Pvt. Ltd.
            </th>
            <th className="border border-gray-400 px-1 py-1 text-left font-semibold">
              For Acme Innovations Inc.
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-400 px-1 py-1 align-top">
              4th Floor, Lattice Tower, MG Road, Bengaluru, KA 560001, India
            </td>
            <td className="border border-gray-400 px-1 py-1 align-top">Same as billing address</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SnippetCaption({ enlarge = false }: { enlarge?: boolean }) {
  return (
    <p
      className={cn(
        "mt-1.5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-[11px] text-text-muted",
        enlarge && "group-hover:text-text-secondary",
      )}
    >
      <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider">
        <FileText size={12} strokeWidth={2} className="shrink-0" aria-hidden />
        From contract
      </span>
      {enlarge ? (
        <>
          <span className="text-text-muted/60" aria-hidden>
            ·
          </span>
          <span>Click to enlarge</span>
        </>
      ) : null}
    </p>
  );
}

function ContractSnippetLightbox({
  variant,
  onClose,
}: {
  variant: ZenithSnippetVariant;
  onClose: () => void;
}) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="zenith-snippet-dialog-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(90vh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border-default bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <p id="zenith-snippet-dialog-title" className="text-[14px] font-semibold text-text-primary">
            {SNIPPET_SECTION_TITLE[variant]}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary"
            aria-label="Close preview"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <ContractSnippetPaper variant={variant} scale="large" className="mx-auto w-full max-w-xl" />
          <SnippetCaption />
        </div>
      </div>
    </div>
  );
}

export function ZenithContractSourceSnippet({
  variant,
  fillContainer = false,
}: {
  variant: ZenithSnippetVariant;
  fillContainer?: boolean;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div className={cn(fillContainer ? "w-full" : "w-[300px] shrink-0")}>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className={cn(
            "group relative w-full rounded-md text-left",
            "cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          )}
          aria-label={`View larger contract excerpt: ${SNIPPET_SECTION_TITLE[variant]}`}
        >
          <div className="relative">
            <ContractSnippetPaper
              variant={variant}
              scale="thumb"
              className="transition-[transform,box-shadow] duration-200 group-hover:scale-[1.02] group-hover:shadow-lg"
            />
            <span
              className="pointer-events-none absolute inset-0 rounded-sm bg-black/0 transition-colors group-hover:bg-black/5"
              aria-hidden
            />
          </div>
          <SnippetCaption enlarge />
        </button>
      </div>

      {lightboxOpen ? (
        <ContractSnippetLightbox variant={variant} onClose={() => setLightboxOpen(false)} />
      ) : null}
    </>
  );
}
