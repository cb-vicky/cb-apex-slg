import { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { ExtractedContract } from "@/data/ingest-data";
import type { IngestionSectionState } from "@/context/ingest-context-core";

interface Props {
  extracted: ExtractedContract;
  sectionState: IngestionSectionState;
  onMarkDone: () => void;
}

export function IngestionAddressesSection({ extracted, sectionState, onMarkDone }: Props) {
  const { addresses } = extracted;
  const [sameAsBilling, setSameAsBilling] = useState(addresses.sameAsBilling);

  return (
    <div className="space-y-6">
      {/* Section header */}
      {sectionState === "issues" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertCircle size={16} className="text-amber-600" />
            <span className="font-medium">Review required</span>
            <span className="text-amber-700">— confirm addresses, then mark done.</span>
          </div>
          <button
            onClick={onMarkDone}
            className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
          >
            Mark as done
          </button>
        </div>
      )}

      {sectionState === "review" && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <CheckCircle2 size={16} className="text-blue-600" />
            <span>Review addresses and confirm</span>
          </div>
          <button
            onClick={onMarkDone}
            className="rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
          >
            Mark as done
          </button>
        </div>
      )}

      {sectionState === "done" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Addresses confirmed</span>
        </div>
      )}

      {/* Billing address */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <h3 className="text-[15px] font-semibold text-text-primary">Billing address</h3>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
              Address line 1
            </label>
            <input
              type="text"
              defaultValue={addresses.billing.line1}
              className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {addresses.billing.line2 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
                Address line 2
              </label>
              <input
                type="text"
                defaultValue={addresses.billing.line2}
                className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
                City
              </label>
              <input
                type="text"
                defaultValue={addresses.billing.city}
                className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
                State / Province
              </label>
              <input
                type="text"
                defaultValue={addresses.billing.state}
                className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
                Postal code
              </label>
              <input
                type="text"
                defaultValue={addresses.billing.postalCode}
                className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
                Country
              </label>
              <input
                type="text"
                defaultValue={addresses.billing.country}
                className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <h3 className="text-[15px] font-semibold text-text-primary">Shipping address</h3>

        <div className="mt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sameAsBilling}
              onChange={(e) => setSameAsBilling(e.target.checked)}
              className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-text-secondary">Same as billing address</span>
          </label>
        </div>

        {!sameAsBilling && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
                Address line 1
              </label>
              <input
                type="text"
                defaultValue={addresses.shipping.line1}
                className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {addresses.shipping.line2 && (
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
                  Address line 2
                </label>
                <input
                  type="text"
                  defaultValue={addresses.shipping.line2}
                  className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
                  City
                </label>
                <input
                  type="text"
                  defaultValue={addresses.shipping.city}
                  className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
                  State / Province
                </label>
                <input
                  type="text"
                  defaultValue={addresses.shipping.state}
                  className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
                  Postal code
                </label>
                <input
                  type="text"
                  defaultValue={addresses.shipping.postalCode}
                  className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
                  Country
                </label>
                <input
                  type="text"
                  defaultValue={addresses.shipping.country}
                  className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
