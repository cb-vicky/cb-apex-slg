import { Trash2 } from "lucide-react";
import {
  CUSTOMER_FILTER_PROPERTIES,
  createEmptyCondition,
  getCustomerFilterProperty,
  operatorsForCustomerProperty,
  type ReminderCondition,
} from "@/data/offline-invoice-reminders";
import { Select, Input } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

interface Props {
  conditions: ReminderCondition[];
  onChange: (conditions: ReminderCondition[]) => void;
}

export function ReminderConditionsBuilder({ conditions, onChange }: Props) {
  function updateCondition(id: string, patch: Partial<ReminderCondition>) {
    onChange(conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function updateProperty(id: string, property: string) {
    const def = getCustomerFilterProperty(property);
    const current = conditions.find((c) => c.id === id);
    const operatorValid =
      current?.operator && def?.operators.includes(current.operator);
    onChange(
      conditions.map((c) =>
        c.id === id
          ? {
              ...c,
              property,
              operator: operatorValid ? c.operator : (def?.operators[0] ?? ""),
              value: "",
            }
          : c,
      ),
    );
  }

  function removeCondition(id: string) {
    if (conditions.length <= 1) return;
    const next = conditions.filter((c) => c.id !== id);
    if (next[0]?.join !== "when") {
      next[0] = { ...next[0], join: "when" };
    }
    onChange(next);
  }

  function addCondition() {
    onChange([...conditions, createEmptyCondition("and")]);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border-default bg-gray-50">
      <div className="divide-y divide-border-default">
        {conditions.map((condition) => {
          const propertyDef = getCustomerFilterProperty(condition.property);
          const operators = operatorsForCustomerProperty(condition.property);

          return (
            <div key={condition.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <span className="w-10 shrink-0 pt-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  {condition.join === "when" ? "When" : "And"}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Select
                      value={condition.property}
                      onChange={(e) => updateProperty(condition.id, e.target.value)}
                      className={cn(!condition.property && "text-text-muted")}
                      aria-label="Filter property"
                    >
                      <option value="">Select property</option>
                      {CUSTOMER_FILTER_PROPERTIES.map((property) => (
                        <option key={property.name} value={property.name}>
                          {property.name}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={condition.operator}
                      onChange={(e) =>
                        updateCondition(condition.id, { operator: e.target.value })
                      }
                      disabled={!condition.property}
                      className={cn(!condition.operator && "text-text-muted")}
                      aria-label="Filter operator"
                    >
                      <option value="">Operator</option>
                      {operators.map((operator) => (
                        <option key={operator} value={operator}>
                          {operator}
                        </option>
                      ))}
                    </Select>
                    <Input
                      value={condition.value}
                      onChange={(e) =>
                        updateCondition(condition.id, { value: e.target.value })
                      }
                      disabled={!condition.property}
                      placeholder={
                        propertyDef
                          ? `e.g. ${propertyDef.sampleValues}`
                          : "Value"
                      }
                    />
                  </div>
                  {propertyDef ? (
                    <p className="text-[11px] leading-snug text-text-muted">
                      <span className="font-medium text-text-secondary">Sample values:</span>{" "}
                      {propertyDef.sampleValues}
                      <span className="mx-1.5 text-border-default">·</span>
                      <span className="font-medium text-text-secondary">Operators:</span>{" "}
                      {propertyDef.operators.join(", ")}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeCondition(condition.id)}
                  disabled={conditions.length <= 1}
                  className="mt-1.5 shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-white hover:text-red-600 disabled:opacity-30"
                  aria-label="Remove condition"
                >
                  <Trash2 size={15} strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-border-default px-4 py-3">
        <button
          type="button"
          onClick={addCondition}
          className="text-[13px] font-medium text-blue-600 transition-colors hover:text-blue-700"
        >
          + Add Condition
        </button>
        <button
          type="button"
          className="text-[13px] font-medium text-blue-600 transition-colors hover:text-blue-700"
        >
          Preview
        </button>
      </div>
    </div>
  );
}
