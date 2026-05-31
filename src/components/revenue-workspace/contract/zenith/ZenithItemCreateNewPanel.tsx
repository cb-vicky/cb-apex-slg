import { cn } from "@/lib/utils";
import { CreateCatalogItemForm } from "./CreateCatalogItemForm";
import {
  isCreateCatalogItemFormComplete,
  toCreateCatalogItemPayload,
  type CreateCatalogItemFormState,
  type ZenithCreateItemPayload,
} from "./create-catalog-item-form";

export type { ZenithCreateItemPayload } from "./create-catalog-item-form";

export const CREATE_CATALOG_ITEM_FORM_ID = "zenith-create-catalog-item-form";

interface Props {
  embedded?: boolean;
  value: CreateCatalogItemFormState;
  onChange: (next: CreateCatalogItemFormState) => void;
  onCreate?: (payload: ZenithCreateItemPayload) => void;
}

export function ZenithItemCreateNewPanel({
  embedded = false,
  value,
  onChange,
  onCreate,
}: Props) {
  const complete = isCreateCatalogItemFormComplete(value);

  return (
    <form
      id={CREATE_CATALOG_ITEM_FORM_ID}
      className={cn(embedded ? "py-0" : "bg-gray-50/80 px-3 py-3")}
      onSubmit={(event) => {
        event.preventDefault();
        if (!complete) return;
        onCreate?.(toCreateCatalogItemPayload(value));
      }}
    >
      <CreateCatalogItemForm value={value} onChange={onChange} />
    </form>
  );
}
