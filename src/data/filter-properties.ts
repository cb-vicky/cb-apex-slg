export interface FilterPropertyDef {
  name: string;
  sampleValues: string;
  operators: readonly string[];
  /** Discrete values shown in the add-filter picker when applicable */
  valueOptions?: readonly string[];
}

const NO_VALUE_OPERATORS = new Set(["is empty", "is not empty"]);

export function operatorRequiresValue(operator: string): boolean {
  return !NO_VALUE_OPERATORS.has(operator);
}
