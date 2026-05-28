import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";
import { ChevronDown, Pencil, X } from "lucide-react";
import { SectionCard } from "@/components/ui/primitives";
import { currency, cn } from "@/lib/utils";
import {
  getCustomerArProfile,
  type ArInternalContact,
  type ArPerson,
  type SubscriptionDetailGroup,
  type SubscriptionStatusItem,
} from "@/data/collections-ar-profile";
import { getEmailSequenceForCustomer } from "@/data/collections-email-sequence";
import { ArContactAvatar } from "./ArContactAvatar";
import { ArAnchoredPanel, ArPopoverShell } from "./ArAnchoredPanel";
import { EmailSequenceMetricTile } from "./EmailSequenceCard";

interface ArSummary {
  totalOpen: number;
  totalOverdue: number;
  overdueCount: number;
  unappliedCash: number;
  avgDaysToPay: number;
  oldestOutstandingDays: number;
}

interface Props {
  customerId: string;
  summary: ArSummary;
  fallbackOwnerName?: string;
}

type OpenPanel = "owner" | "contacts" | "subscriptions" | null;

const SUBSCRIPTION_DOT: Record<SubscriptionStatusItem["tone"], string> = {
  active: "bg-emerald-500",
  paused: "bg-amber-500",
  past_due: "bg-red-500",
  scheduled: "bg-blue-500",
};

export function ArOverviewSection({
  customerId,
  summary,
  fallbackOwnerName,
}: Props) {
  const seed = getCustomerArProfile(customerId, fallbackOwnerName);
  const [ownerId, setOwnerId] = useState(seed.collectionOwnerId);
  const [contacts, setContacts] = useState<ArInternalContact[]>(seed.internalContacts);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<ArInternalContact[]>([]);

  const ownerAnchorRef = useRef<HTMLDivElement>(null);
  const contactsAnchorRef = useRef<HTMLDivElement>(null);
  const subscriptionsAnchorRef = useRef<HTMLDivElement>(null);
  const editModalTitleId = useId();

  const owner =
    seed.collectionOwnerOptions.find((o) => o.id === ownerId) ??
    seed.collectionOwnerOptions[0]!;

  const primaryContact = contacts.find((c) => c.role === "primary") ?? contacts[0];
  const overflowCount = Math.max(0, contacts.length - 1);

  const closePanels = useCallback(() => setOpenPanel(null), []);

  useEffect(() => {
    const next = getCustomerArProfile(customerId, fallbackOwnerName);
    setOwnerId(next.collectionOwnerId);
    setContacts(next.internalContacts);
    setOpenPanel(null);
  }, [customerId, fallbackOwnerName]);

  const openEditModal = useCallback(() => {
    setEditDraft(contacts.map((c) => ({ ...c })));
    setEditOpen(true);
    setOpenPanel(null);
  }, [contacts]);

  const saveEdit = useCallback(() => {
    setContacts(editDraft);
    setEditOpen(false);
  }, [editDraft]);

  const emailSequence = getEmailSequenceForCustomer(customerId);

  const metricCards = [
    {
      label: "Total Open",
      value: currency(summary.totalOpen),
      variant: summary.totalOpen > 0 ? ("warning" as const) : ("default" as const),
    },
    {
      label: "Overdue",
      value: currency(summary.totalOverdue),
      variant: summary.totalOverdue > 0 ? ("danger" as const) : ("default" as const),
    },
    {
      label: "Available balance",
      value: currency(summary.unappliedCash),
      variant: summary.unappliedCash > 0 ? ("warning" as const) : ("default" as const),
    },
    {
      label: "Oldest Outstanding",
      value: summary.oldestOutstandingDays > 0 ? `${summary.oldestOutstandingDays}d` : "—",
      variant: summary.oldestOutstandingDays > 30 ? ("danger" as const) : ("default" as const),
    },
  ];

  const variantClasses = {
    default: "text-text-primary",
    danger: "text-red-600",
    warning: "text-amber-600",
    success: "text-emerald-600",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border-default bg-white px-3 py-2.5"
          >
            <p className="text-[10px] uppercase tracking-wider text-text-muted">{card.label}</p>
            <p
              className={`mt-1 text-sm font-semibold tabular-nums ${variantClasses[card.variant]}`}
            >
              {card.value}
            </p>
          </div>
        ))}
        {emailSequence ? <EmailSequenceMetricTile sequence={emailSequence} popoverAlign="right" /> : null}
      </div>

      <SectionCard
        title="AR Overview"
        className="overflow-visible"
        bodyClassName="overflow-visible"
      >
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <CollectionOwnerField
            owner={owner}
            open={openPanel === "owner"}
            anchorRef={ownerAnchorRef}
            onToggle={() =>
              setOpenPanel((p) => (p === "owner" ? null : "owner"))
            }
          />
          <InternalContactsField
            primary={primaryContact}
            overflowCount={overflowCount}
            open={openPanel === "contacts"}
            anchorRef={contactsAnchorRef}
            onToggle={() =>
              setOpenPanel((p) => (p === "contacts" ? null : "contacts"))
            }
          />
          <SubscriptionField
            className="col-span-2"
            items={seed.subscriptions}
            open={openPanel === "subscriptions"}
            anchorRef={subscriptionsAnchorRef}
            onToggle={() =>
              setOpenPanel((p) => (p === "subscriptions" ? null : "subscriptions"))
            }
          />
        </div>
      </SectionCard>

      <ArAnchoredPanel
        open={openPanel === "owner"}
        anchorRef={ownerAnchorRef}
        onClose={closePanels}
        width={320}
      >
        <OwnerPickerPanel
          owner={owner}
          options={seed.collectionOwnerOptions}
          onSelect={(id) => {
            setOwnerId(id);
            closePanels();
          }}
          onClose={closePanels}
        />
      </ArAnchoredPanel>

      <ArAnchoredPanel
        open={openPanel === "contacts"}
        anchorRef={contactsAnchorRef}
        onClose={closePanels}
        width={320}
      >
        <ContactsPanelContent
          contacts={contacts}
          onEdit={openEditModal}
          onClose={closePanels}
        />
      </ArAnchoredPanel>

      <ArAnchoredPanel
        open={openPanel === "subscriptions"}
        anchorRef={subscriptionsAnchorRef}
        onClose={closePanels}
        width={360}
        align="start"
      >
        <SubscriptionsPanelContent
          groups={seed.subscriptionDetails}
          onClose={closePanels}
        />
      </ArAnchoredPanel>

      {editOpen && (
        <EditContactsModal
          titleId={editModalTitleId}
          draft={editDraft}
          onChange={setEditDraft}
          onClose={() => setEditOpen(false)}
          onSave={saveEdit}
        />
      )}
    </div>
  );
}

function CollectionOwnerField({
  owner,
  open,
  anchorRef,
  onToggle,
}: {
  owner: ArPerson;
  open: boolean;
  anchorRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
}) {
  return (
    <div ref={anchorRef} className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        Collection Owner
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="flex min-w-0 items-center gap-2 rounded-lg py-0.5 text-left transition-colors hover:bg-gray-50"
        >
          <ArContactAvatar name={owner.name} size="sm" />
          <span className="truncate text-[14px] font-semibold text-text-primary">
            {owner.name}
          </span>
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="rounded-md p-1 text-text-muted transition-colors hover:bg-gray-50 hover:text-text-primary"
          aria-label="Change collection owner"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </button>
      </div>
    </div>
  );
}

function OwnerPickerPanel({
  owner,
  options,
  onSelect,
  onClose,
}: {
  owner: ArPerson;
  options: ArPerson[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <ArPopoverShell title="Collection owner" onClose={onClose}>
      <ul role="listbox" aria-label="Collection owner" className="space-y-0.5">
        {options.map((option) => (
          <li key={option.id} role="option" aria-selected={option.id === owner.id}>
            <button
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-1 py-2 text-left transition-colors hover:bg-gray-50",
                option.id === owner.id && "bg-gray-50",
              )}
            >
              <ArContactAvatar name={option.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-text-primary">
                  {option.name}
                </span>
                <span className="block truncate text-[11px] text-text-muted">
                  {option.email}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </ArPopoverShell>
  );
}

function InternalContactsField({
  primary,
  overflowCount,
  open,
  anchorRef,
  onToggle,
}: {
  primary?: ArInternalContact;
  overflowCount: number;
  open: boolean;
  anchorRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
}) {
  if (!primary) {
    return (
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
          Internal Contacts
        </p>
        <p className="mt-1 text-[14px] text-text-muted">—</p>
      </div>
    );
  }

  return (
    <div ref={anchorRef} className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        Internal Contacts
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 items-center gap-2 rounded-lg py-0.5 text-left transition-colors hover:bg-gray-50"
        >
          <ArContactAvatar name={primary.name} size="sm" />
          <span className="truncate text-[14px] font-semibold text-text-primary">
            {primary.name}
          </span>
        </button>
        {overflowCount > 0 ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className="rounded-md border border-border-default bg-white px-2 py-0.5 text-[12px] font-semibold text-text-primary transition-colors hover:bg-gray-50"
          >
            +{overflowCount}
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-gray-50 hover:text-text-primary"
            aria-label="View internal contacts"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            />
          </button>
        )}
      </div>
    </div>
  );
}

function ContactsPanelContent({
  contacts,
  onEdit,
  onClose,
}: {
  contacts: ArInternalContact[];
  onEdit: () => void;
  onClose: () => void;
}) {
  const grouped = contacts.reduce<Record<string, ArInternalContact[]>>((acc, c) => {
    if (!acc[c.roleLabel]) acc[c.roleLabel] = [];
    acc[c.roleLabel].push(c);
    return acc;
  }, {});

  return (
    <ArPopoverShell
      title="Internal contacts"
      onClose={onClose}
      headerAction={
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-blue-600 transition-colors hover:bg-blue-50"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit
        </button>
      }
    >
      {Object.entries(grouped).map(([roleLabel, people], groupIdx) => (
        <div
          key={roleLabel}
          className={groupIdx > 0 ? "mt-3 border-t border-border-default pt-3" : ""}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            {roleLabel}
          </p>
          <ul className="mt-2 space-y-2.5">
            {people.map((person) => (
              <li key={person.id} className="flex items-start gap-2">
                <ArContactAvatar name={person.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-text-primary">{person.name}</p>
                  <p className="truncate text-[12px] text-text-muted">{person.email}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </ArPopoverShell>
  );
}

function SubscriptionsPanelContent({
  groups,
  onClose,
}: {
  groups: SubscriptionDetailGroup[];
  onClose: () => void;
}) {
  return (
    <ArPopoverShell title="Subscriptions" onClose={onClose}>
      {groups.map((group, groupIdx) => (
        <div
          key={group.groupLabel}
          className={groupIdx > 0 ? "mt-3 border-t border-border-default pt-3" : ""}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            {group.groupLabel}
          </p>
          <ul className="mt-2 space-y-2.5">
            {group.items.map((sub) => (
              <li key={sub.id} className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    SUBSCRIPTION_DOT[sub.tone],
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-text-primary">{sub.name}</p>
                  <p className="text-[12px] text-text-muted">{sub.plan}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-text-primary">
                    {sub.id} · {sub.statusLabel}
                  </p>
                  {sub.meta && (
                    <p className="mt-0.5 text-[11px] text-text-muted">{sub.meta}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </ArPopoverShell>
  );
}

function SubscriptionField({
  items,
  open,
  anchorRef,
  onToggle,
  className,
}: {
  items: SubscriptionStatusItem[];
  open: boolean;
  anchorRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <div ref={anchorRef} className={cn("min-w-0", className)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        Subscription
      </p>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="mt-1.5 flex w-full max-w-lg flex-wrap items-center gap-x-4 gap-y-1 rounded-lg py-0.5 text-left transition-colors hover:bg-gray-50"
      >
        {items.map((item) => (
          <span
            key={`${item.tone}-${item.label}-${item.count}`}
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-text-primary"
          >
            <span
              className={cn("h-2 w-2 shrink-0 rounded-full", SUBSCRIPTION_DOT[item.tone])}
              aria-hidden
            />
            <span>
              {item.count} {item.label}
              {item.detail ? <span> {item.detail}</span> : null}
            </span>
          </span>
        ))}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-muted transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
    </div>
  );
}

function EditContactsModal({
  titleId,
  draft,
  onChange,
  onClose,
  onSave,
}: {
  titleId: string;
  draft: ArInternalContact[];
  onChange: (next: ArInternalContact[]) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const updateContact = (id: string, patch: Partial<Pick<ArInternalContact, "name" | "email">>) => {
    onChange(draft.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const sections = draft.reduce<Record<string, ArInternalContact[]>>((acc, c) => {
    if (!acc[c.roleLabel]) acc[c.roleLabel] = [];
    acc[c.roleLabel].push(c);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border-default bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <h2 id={titleId} className="font-heading text-[16px] font-semibold text-text-primary">
            Edit internal contacts
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[min(70vh,28rem)] overflow-y-auto px-4 py-4">
          {Object.entries(sections).map(([roleLabel, people], idx) => (
            <fieldset
              key={roleLabel}
              className={cn(idx > 0 && "mt-5 border-t border-border-default pt-5")}
            >
              <legend className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                {roleLabel}
              </legend>
              <div className="mt-3 space-y-4">
                {people.map((person) => (
                  <div key={person.id} className="flex items-start gap-2">
                    <ArContactAvatar name={person.name} size="md" className="mt-1" />
                    <div className="grid min-w-0 flex-1 gap-2">
                      <label className="block">
                        <span className="text-[11px] font-medium text-text-muted">Name</span>
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) => updateContact(person.id, { name: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-border-default px-2.5 py-1.5 text-[13px] text-text-primary outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-medium text-text-muted">Email</span>
                        <input
                          type="email"
                          value={person.email}
                          onChange={(e) => updateContact(person.id, { email: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-border-default px-2.5 py-1.5 text-[13px] text-text-primary outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-border-default px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-default px-3 py-1.5 text-[13px] font-medium text-text-primary transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-primary-500 px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
