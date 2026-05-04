import type { ReactNode } from "react";
import { useState } from "react";
import type { ExtractedProduct } from "@/data/ingest-data";
import { SectionCard } from "@/components/ui/primitives";
import { WorkspaceTableShell, WTable, WThead, WTh, WTbody, WTr, WTd } from "@/components/ui/data-table";
import { formInputClass, formLabelClass } from "@/components/ui/form-field";
import { currency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { DrawerRailIndent } from "../DrawerSelectShell";

const drawerActionLinkClass =
  "text-[12px] font-semibold text-[color:var(--color-info)] hover:text-blue-700 hover:underline";
const drawerActionLinkClass12 =
  "text-[13px] font-semibold text-[color:var(--color-info)] hover:text-blue-700 hover:underline";
const drawerPrimaryPillClass =
  "rounded-md border border-blue-200 bg-white px-3 py-2 text-[13px] font-semibold text-[color:var(--color-info)] shadow-sm transition-colors hover:bg-blue-50/60";

interface Props {
  products: ExtractedProduct[];
  /** Provisional catalog map for demo (clears blocking mismatch when SKU recorded). */
  onMarkMapped?: (extractedSku: string) => void;
  className?: string;
  /** `drawer` = compact rows + expandable detail card per line (queue ingest). */
  layout?: "table" | "drawer";
  /** Shown in drawer when extraction still has unresolved product lines vs session map. */
  catalogMappingIssue?: { message: string; detail?: string } | null;
  /** SKUs the operator has marked mapped this session (clears per-line validation before seed `matched` updates). */
  sessionMappedSkus?: readonly string[];
}

/** Coarse line-type for display (extracted rows don’t carry contract `type`). */
function displayLineType(p: ExtractedProduct): string {
  const b = p.billingModel.toLowerCase();
  if (b.includes("usage") || b.includes("meter") || b.includes("overage")) return "Usage";
  if (b.includes("one-time") || b.includes("one time") || b.includes("prepaid block")) return "One-time";
  return "Recurring";
}

type LineKind = "Recurring" | "Usage" | "One-time";

function lineKindFromProduct(p: ExtractedProduct): LineKind {
  const t = displayLineType(p);
  if (t === "Usage") return "Usage";
  if (t === "One-time") return "One-time";
  return "Recurring";
}

function defaultBillingForLine(kind: LineKind): string {
  switch (kind) {
    case "Usage":
      return "Per unit / metered";
    case "One-time":
      return "One-time";
    default:
      return "Per seat / month";
  }
}

function DrawerStackedField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={formLabelClass}>{label}</span>
      {children}
    </div>
  );
}

function CatalogDrawerRows({
  products,
  onMarkMapped,
  catalogLineIssueMessage,
  sessionMappedSkus,
}: {
  products: ExtractedProduct[];
  onMarkMapped?: (extractedSku: string) => void;
  /** When set (blocking catalog validation), shown in red under each line that is still unmatched. */
  catalogLineIssueMessage?: string | null;
  sessionMappedSkus?: readonly string[];
}) {
  const [openSku, setOpenSku] = useState<string | null>(null);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<Record<string, Partial<ExtractedProduct>>>({});
  const [editForm, setEditForm] = useState<{
    extractedName: string;
    catalogSku: string;
    lineKind: LineKind;
    quantity: number;
    unitPrice: number;
    discount: number;
    billingModel: string;
  } | null>(null);

  function effective(p: ExtractedProduct): ExtractedProduct {
    const d = savedDrafts[p.extractedSku];
    return d ? { ...p, ...d } : p;
  }

  const inputClass = formInputClass;

  function closePanel() {
    setOpenSku(null);
    setEditingSku(null);
    setEditForm(null);
  }

  function startEdit(p: ExtractedProduct) {
    const e = effective(p);
    setEditForm({
      extractedName: e.extractedName,
      catalogSku: e.catalogSku ?? "",
      lineKind: lineKindFromProduct(e),
      quantity: e.quantity,
      unitPrice: e.unitPrice,
      discount: e.discount,
      billingModel: e.billingModel,
    });
    setEditingSku(p.extractedSku);
  }

  function saveEdit(sku: string) {
    if (!editForm) return;
    setSavedDrafts((prev) => ({
      ...prev,
      [sku]: {
        ...prev[sku],
        extractedName: editForm.extractedName,
        catalogSku: editForm.catalogSku || undefined,
        quantity: editForm.quantity,
        unitPrice: editForm.unitPrice,
        discount: editForm.discount,
        billingModel: editForm.billingModel,
        matched: true,
      },
    }));
    onMarkMapped?.(sku);
    setEditingSku(null);
    setEditForm(null);
  }

  function cancelEdit() {
    setEditingSku(null);
    setEditForm(null);
  }

  if (products.length === 0) {
    return <p className="text-[13px] text-text-muted">No line items extracted.</p>;
  }

  return (
    <div className="flex flex-col gap-0">
      {products.map((p) => {
        const e = effective(p);
        const open = openSku === p.extractedSku;
        const editing = editingSku === p.extractedSku && editForm !== null;
        const lineCatalogResolved =
          e.matched || (sessionMappedSkus ? sessionMappedSkus.includes(p.extractedSku) : false);

        return (
          <div key={p.extractedSku} className="border-b border-border-subtle py-3 last:border-b-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-text-primary">{e.extractedName}</p>
                <p className="truncate text-[11px] text-text-muted">{p.extractedSku}</p>
                {catalogLineIssueMessage && !lineCatalogResolved ? (
                  <p className="mt-1 text-[11px] font-medium leading-snug text-red-600">{catalogLineIssueMessage}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {onMarkMapped && (
                  <button
                    type="button"
                    title="Mark mapped (demo)"
                    onClick={() => onMarkMapped(p.extractedSku)}
                    className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
                    aria-label="Mark mapped"
                  >
                    <Plus size={16} strokeWidth={2} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (open) closePanel();
                    else {
                      setOpenSku(p.extractedSku);
                      setEditingSku(null);
                      setEditForm(null);
                    }
                  }}
                  className={drawerActionLinkClass}
                >
                  {open ? "Hide details" : "View details"}
                </button>
              </div>
            </div>
            {open && !editing && (
              <DrawerRailIndent className="mt-3">
                <div className="flex flex-col gap-3 text-[14px]">
                  <DrawerStackedField label="Catalog SKU">
                    <span className="text-text-primary">{e.catalogSku ?? "—"}</span>
                  </DrawerStackedField>
                  <DrawerStackedField label="Type">
                    <span className="capitalize text-text-primary">{displayLineType(e)}</span>
                  </DrawerStackedField>
                  <DrawerStackedField label="Quantity">
                    <span className="tabular-nums text-text-primary">
                      {e.quantity > 0 ? e.quantity.toLocaleString() : "—"}
                    </span>
                  </DrawerStackedField>
                  <DrawerStackedField label="Unit price">
                    <span className="tabular-nums text-text-primary">
                      {e.unitPrice >= 1 ? currency(e.unitPrice) : `$${e.unitPrice.toFixed(3)}`}
                    </span>
                  </DrawerStackedField>
                  <DrawerStackedField label="Discount">
                    <span className="text-text-primary">{e.discount > 0 ? `${e.discount}%` : "—"}</span>
                  </DrawerStackedField>
                  <DrawerStackedField label="Billing">
                    <span className="text-text-primary">{e.billingModel}</span>
                  </DrawerStackedField>
                </div>
                <div className="mt-3 flex items-center gap-3 border-t border-border-subtle pt-3">
                  <button type="button" onClick={() => startEdit(p)} className={cn("self-start", drawerPrimaryPillClass)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={closePanel}
                    className="text-[12px] font-semibold text-text-secondary hover:text-text-primary"
                  >
                    Cancel
                  </button>
                </div>
              </DrawerRailIndent>
            )}
            {open && editing && editForm && (
              <DrawerRailIndent className="mt-3">
                <div className="flex flex-col gap-4 text-[14px]">
                  <DrawerStackedField label="Product name">
                    <input
                      type="text"
                      value={editForm.extractedName}
                      onChange={(ev) => setEditForm((f) => (f ? { ...f, extractedName: ev.target.value } : f))}
                      className={inputClass}
                    />
                  </DrawerStackedField>
                  <DrawerStackedField label="Catalog SKU">
                    <input
                      type="text"
                      value={editForm.catalogSku}
                      onChange={(ev) => setEditForm((f) => (f ? { ...f, catalogSku: ev.target.value } : f))}
                      className={inputClass}
                    />
                  </DrawerStackedField>
                  <DrawerStackedField label="Type">
                    <select
                      value={editForm.lineKind}
                      onChange={(ev) => {
                        const k = ev.target.value as LineKind;
                        setEditForm((f) =>
                          f ? { ...f, lineKind: k, billingModel: defaultBillingForLine(k) } : f,
                        );
                      }}
                      className={inputClass}
                    >
                      <option value="Recurring">Recurring</option>
                      <option value="Usage">Usage</option>
                      <option value="One-time">One-time</option>
                    </select>
                  </DrawerStackedField>
                  <DrawerStackedField label="Quantity">
                    <input
                      type="number"
                      min={0}
                      value={editForm.quantity}
                      onChange={(ev) =>
                        setEditForm((f) => (f ? { ...f, quantity: Number(ev.target.value) } : f))
                      }
                      className={inputClass}
                    />
                  </DrawerStackedField>
                  <DrawerStackedField label="Unit price">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={editForm.unitPrice}
                      onChange={(ev) =>
                        setEditForm((f) => (f ? { ...f, unitPrice: Number(ev.target.value) } : f))
                      }
                      className={inputClass}
                    />
                  </DrawerStackedField>
                  <DrawerStackedField label="Discount (%)">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editForm.discount}
                      onChange={(ev) =>
                        setEditForm((f) => (f ? { ...f, discount: Number(ev.target.value) } : f))
                      }
                      className={inputClass}
                    />
                  </DrawerStackedField>
                  <DrawerStackedField label="Billing">
                    <input
                      type="text"
                      value={editForm.billingModel}
                      onChange={(ev) =>
                        setEditForm((f) => (f ? { ...f, billingModel: ev.target.value } : f))
                      }
                      className={inputClass}
                    />
                  </DrawerStackedField>
                </div>
                <div className="mt-3 flex items-center gap-3 border-t border-border-subtle pt-3">
                  <button type="button" onClick={() => saveEdit(p.extractedSku)} className={drawerActionLinkClass12}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-[12px] font-semibold text-text-secondary hover:text-text-primary"
                  >
                    Cancel
                  </button>
                </div>
              </DrawerRailIndent>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CatalogMappingSection({
  products,
  onMarkMapped,
  className,
  layout = "table",
  catalogMappingIssue,
  sessionMappedSkus,
}: Props) {
  if (layout === "drawer") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <p className={formLabelClass}>Catalog mapping</p>
        <DrawerRailIndent>
          <CatalogDrawerRows
            products={products}
            onMarkMapped={onMarkMapped}
            catalogLineIssueMessage={catalogMappingIssue?.message ?? null}
            sessionMappedSkus={sessionMappedSkus}
          />
        </DrawerRailIndent>
      </div>
    );
  }

  return (
    <SectionCard title="Catalog mapping" className={cn(className)} bodyClassName="p-0">
      {products.length === 0 ? (
        <p className="px-4 py-4 text-[14px] text-text-muted">No line items extracted.</p>
      ) : (
        <WorkspaceTableShell className="rounded-none border-0 shadow-none">
          <WTable className="min-w-[720px] text-[14px] leading-snug">
            <WThead className="text-[12px] [&_th]:px-3.5 [&_th]:py-3">
              <WTh className="font-semibold">Product</WTh>
              <WTh className="font-semibold">Catalog SKU</WTh>
              <WTh className="font-semibold">Type</WTh>
              <WTh align="right" sortable className="font-semibold">
                Qty
              </WTh>
              <WTh align="right" sortable className="font-semibold">
                Unit price
              </WTh>
              <WTh align="right" sortable className="font-semibold">
                Discount
              </WTh>
              <WTh align="right" sortable className="font-semibold">
                Min commit
              </WTh>
              <WTh className="font-semibold">Billing</WTh>
              <WTh className="w-[100px] font-semibold">Status</WTh>
            </WThead>
            <WTbody striped={false}>
              {products.map((p, i) => (
                <WTr key={i} className={cn(!p.matched && "bg-amber-50/50 hover:bg-amber-50/80")}>
                  <WTd truncate={false} className="px-3.5 py-3 font-semibold text-text-primary">
                    <div className="min-w-0 truncate">
                      <span className="font-semibold">{p.extractedName}</span>
                      <span className="font-normal text-text-muted"> · {p.extractedSku}</span>
                    </div>
                  </WTd>
                  <WTd className="px-3.5 py-3 text-[13px] text-text-secondary">{p.catalogSku ?? "—"}</WTd>
                  <WTd className="px-3.5 py-3 capitalize text-[13px] text-text-secondary">
                    {displayLineType(p)}
                  </WTd>
                  <WTd align="right" className="px-3.5 py-3 tabular-nums">
                    {p.quantity > 0 ? p.quantity.toLocaleString() : "—"}
                  </WTd>
                  <WTd align="right" className="px-3.5 py-3 tabular-nums">
                    {p.unitPrice >= 1 ? currency(p.unitPrice) : `$${p.unitPrice.toFixed(3)}`}
                  </WTd>
                  <WTd align="right" className="px-3.5 py-3 tabular-nums">
                    {p.discount > 0 ? `${p.discount}%` : "—"}
                  </WTd>
                  <WTd align="right" className="px-3.5 py-3 tabular-nums text-text-muted">
                    —
                  </WTd>
                  <WTd className="px-3.5 py-3 text-[13px] text-text-secondary">{p.billingModel}</WTd>
                  <WTd truncate={false} className="px-3.5 py-3">
                    <div className="flex flex-col items-start gap-1.5">
                      <span
                        className={cn(
                          "inline-flex rounded-md border px-2 py-0.5 text-[12px] font-medium",
                          p.matched
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-amber-200 bg-amber-50 text-amber-900",
                        )}
                      >
                        {p.matched ? "Matched" : "Map"}
                      </span>
                      {!p.matched && onMarkMapped && (
                        <button
                          type="button"
                          onClick={() => onMarkMapped(p.extractedSku)}
                          className="text-[11px] font-semibold text-[color:var(--color-info)] hover:text-blue-700 hover:underline"
                        >
                          Mark mapped (demo)
                        </button>
                      )}
                    </div>
                  </WTd>
                </WTr>
              ))}
            </WTbody>
          </WTable>
        </WorkspaceTableShell>
      )}
    </SectionCard>
  );
}
