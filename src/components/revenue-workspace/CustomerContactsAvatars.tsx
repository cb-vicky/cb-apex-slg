import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Pencil, Plus, X } from "lucide-react";
import type { Customer } from "@/data/mock-data";
import {
  getCustomerArProfile,
  type ArInternalContact,
  type ArPerson,
} from "@/data/collections-ar-profile";
import { cn } from "@/lib/utils";
import { ArContactAvatar } from "./payment/ArContactAvatar";
import { ArAnchoredPanel, ArPopoverShell } from "./payment/ArAnchoredPanel";

function emailFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z.]/g, "");
  return `${slug || "contact"}@chargebee.com`;
}

interface HeaderContact {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
}

const MAX_VISIBLE_AVATARS = 4;

interface Props {
  customer: Customer;
  collapsed?: boolean;
}

export function CustomerContactsAvatars({ customer, collapsed }: Props) {
  const seed = getCustomerArProfile(customer.id, customer.billingOwner);
  const [ownerId, setOwnerId] = useState(seed.collectionOwnerId);
  const [additionalContacts, setAdditionalContacts] = useState<ArInternalContact[]>(
    seed.internalContacts,
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<ArInternalContact[]>([]);
  const [editOwnerId, setEditOwnerId] = useState(seed.collectionOwnerId);
  const anchorRef = useRef<HTMLDivElement>(null);
  const editModalTitleId = useId();

  useEffect(() => {
    const next = getCustomerArProfile(customer.id, customer.billingOwner);
    setOwnerId(next.collectionOwnerId);
    setAdditionalContacts(next.internalContacts);
    setEditOwnerId(next.collectionOwnerId);
    setPanelOpen(false);
  }, [customer.id, customer.billingOwner]);

  const owner =
    seed.collectionOwnerOptions.find((o) => o.id === ownerId) ??
    seed.collectionOwnerOptions[0]!;

  const accountTeamContacts = useMemo<HeaderContact[]>(
    () => [
      {
        id: "role_ae",
        name: customer.ae,
        email: emailFromName(customer.ae),
        roleLabel: "Account executive",
      },
      {
        id: "role_csm",
        name: customer.csm,
        email: emailFromName(customer.csm),
        roleLabel: "Customer success",
      },
      {
        id: "role_billing",
        name: customer.billingOwner,
        email: emailFromName(customer.billingOwner),
        roleLabel: "Billing",
      },
    ],
    [customer.ae, customer.csm, customer.billingOwner],
  );

  const collectionOwnerContact = useMemo<HeaderContact>(
    () => ({
      id: owner.id,
      name: owner.name,
      email: owner.email,
      roleLabel: "Collection owner",
    }),
    [owner],
  );

  const additionalHeaderContacts = useMemo<HeaderContact[]>(
    () =>
      additionalContacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        roleLabel: contact.roleLabel,
      })),
    [additionalContacts],
  );

  const coreContacts = useMemo<HeaderContact[]>(
    () => [...accountTeamContacts, collectionOwnerContact],
    [accountTeamContacts, collectionOwnerContact],
  );

  const allHeaderContacts = useMemo(
    () => [...accountTeamContacts, collectionOwnerContact, ...additionalHeaderContacts],
    [accountTeamContacts, collectionOwnerContact, additionalHeaderContacts],
  );

  const visibleHeaderContacts = useMemo(
    () => allHeaderContacts.slice(0, MAX_VISIBLE_AVATARS),
    [allHeaderContacts],
  );

  const overflowCount = Math.max(0, allHeaderContacts.length - MAX_VISIBLE_AVATARS);

  const visibleAccountTeam = useMemo(
    () =>
      visibleHeaderContacts.filter((contact) =>
        accountTeamContacts.some((member) => member.id === contact.id),
      ),
    [visibleHeaderContacts, accountTeamContacts],
  );

  const visibleCollectionOwner = useMemo(
    () =>
      visibleHeaderContacts.find((contact) => contact.id === collectionOwnerContact.id) ??
      null,
    [visibleHeaderContacts, collectionOwnerContact.id],
  );

  const visibleAdditionalContacts = useMemo(
    () =>
      visibleHeaderContacts.filter((contact) =>
        additionalHeaderContacts.some((member) => member.id === contact.id),
      ),
    [visibleHeaderContacts, additionalHeaderContacts],
  );

  const closePanel = useCallback(() => setPanelOpen(false), []);

  const openEditModal = useCallback(() => {
    setEditDraft(additionalContacts.map((c) => ({ ...c })));
    setEditOwnerId(ownerId);
    setEditOpen(true);
    setPanelOpen(false);
  }, [additionalContacts, ownerId]);

  const saveEdit = useCallback(() => {
    setAdditionalContacts(editDraft);
    setOwnerId(editOwnerId);
    setEditOpen(false);
  }, [editDraft, editOwnerId]);

  const addContact = useCallback(() => {
    setEditDraft((prev) => [
      ...prev,
      {
        id: `int_new_${Date.now()}`,
        role: "additional",
        roleLabel: "Additional contact",
        name: "",
        email: "",
      },
    ]);
  }, [editDraft.length]);

  return (
    <>
      <div
        ref={anchorRef}
        className={cn(
          "flex items-center gap-2 pt-1.5 transition-all duration-300 ease-out",
          collapsed && "pointer-events-none h-0 overflow-hidden pt-0 opacity-0",
        )}
      >
        <span className="shrink-0 text-[12px] font-medium text-text-muted">Team:</span>
        <div className="flex items-center gap-2">
          {visibleAccountTeam.length > 0 ? (
            <AvatarStack
              contacts={visibleAccountTeam}
              panelOpen={panelOpen}
              onOpenPanel={() => setPanelOpen(true)}
            />
          ) : null}
          {visibleCollectionOwner ? (
            <AvatarStack
              contacts={[visibleCollectionOwner]}
              panelOpen={panelOpen}
              onOpenPanel={() => setPanelOpen(true)}
            />
          ) : null}
          {visibleAdditionalContacts.length > 0 ? (
            <AvatarStack
              contacts={visibleAdditionalContacts}
              panelOpen={panelOpen}
              onOpenPanel={() => setPanelOpen(true)}
            />
          ) : null}
          {overflowCount > 0 ? (
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              aria-expanded={panelOpen}
              aria-haspopup="dialog"
              aria-label={`${overflowCount} more contacts`}
              title={`${overflowCount} more contacts`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-text-secondary ring-2 ring-gray-100 transition hover:bg-gray-200 hover:text-text-primary"
            >
              +{overflowCount}
            </button>
          ) : null}
        </div>
      </div>

      <ArAnchoredPanel
        open={panelOpen}
        anchorRef={anchorRef}
        onClose={closePanel}
        width={340}
        align="start"
      >
        <ContactsPopoverContent
          coreContacts={coreContacts}
          additionalContacts={additionalContacts}
          onEdit={openEditModal}
          onClose={closePanel}
        />
      </ArAnchoredPanel>

      {editOpen && (
        <EditContactsModal
          titleId={editModalTitleId}
          ownerId={editOwnerId}
          ownerOptions={seed.collectionOwnerOptions}
          onOwnerChange={setEditOwnerId}
          draft={editDraft}
          onChange={setEditDraft}
          onAdd={addContact}
          onClose={() => setEditOpen(false)}
          onSave={saveEdit}
        />
      )}
    </>
  );
}

function AvatarStack({
  contacts,
  panelOpen,
  onOpenPanel,
}: {
  contacts: HeaderContact[];
  panelOpen: boolean;
  onOpenPanel: () => void;
}) {
  if (contacts.length === 0) return null;

  return (
    <div className="flex items-center">
      {contacts.map((contact, index) => (
        <AvatarWithTooltip
          key={contact.id}
          contact={contact}
          panelOpen={panelOpen}
          onOpenPanel={onOpenPanel}
          stacked={index > 0}
        />
      ))}
    </div>
  );
}

function AvatarWithTooltip({
  contact,
  panelOpen,
  onOpenPanel,
  stacked,
}: {
  contact: HeaderContact;
  panelOpen: boolean;
  onOpenPanel: () => void;
  stacked: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpenPanel}
      aria-expanded={panelOpen}
      aria-haspopup="dialog"
      aria-label={`${contact.roleLabel}: ${contact.name}`}
      className={cn(
        "group/avatar relative rounded-full ring-2 ring-gray-100 transition hover:z-20 hover:ring-blue-200/90",
        stacked && "-ml-2",
      )}
    >
      <ArContactAvatar name={contact.name} size="md" />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium leading-none text-white opacity-0 shadow-md transition-opacity group-hover/avatar:opacity-100"
      >
        {contact.name}
      </span>
    </button>
  );
}

function ContactsPopoverContent({
  coreContacts,
  additionalContacts,
  onEdit,
  onClose,
}: {
  coreContacts: HeaderContact[];
  additionalContacts: ArInternalContact[];
  onEdit: () => void;
  onClose: () => void;
}) {
  const nonOwnerCore = coreContacts.filter((c) => c.roleLabel !== "Collection owner");
  const ownerContact = coreContacts.find((c) => c.roleLabel === "Collection owner");

  return (
    <ArPopoverShell
      title="Contacts"
      onClose={onClose}
      showClose={false}
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
      <ContactPopoverSection title="Account team">
        {nonOwnerCore.map((contact) => (
          <ContactPopoverRow key={contact.id} contact={contact} />
        ))}
      </ContactPopoverSection>

      {additionalContacts.length > 0 && (
        <ContactPopoverSection
          title="Additional contacts"
          className="mt-3 border-t border-border-default pt-3"
        >
          {additionalContacts.map((contact) => (
            <ContactPopoverRow
              key={contact.id}
              contact={{
                id: contact.id,
                name: contact.name,
                email: contact.email,
                roleLabel: contact.roleLabel,
              }}
            />
          ))}
        </ContactPopoverSection>
      )}

      {ownerContact ? (
        <ContactPopoverSection
          title="Collection owner"
          className="mt-3 border-t border-border-default pt-3"
        >
          <ContactPopoverRow contact={ownerContact} />
        </ContactPopoverSection>
      ) : null}
    </ArPopoverShell>
  );
}

function ContactPopoverSection({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{title}</p>
      <div className="mt-2 space-y-2.5">{children}</div>
    </div>
  );
}

function ContactPopoverRow({ contact }: { contact: HeaderContact }) {
  return (
    <div className="flex items-start gap-2">
      <ArContactAvatar name={contact.name} size="sm" />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-text-primary">{contact.name}</p>
        <p className="text-[11px] text-text-muted">{contact.roleLabel}</p>
        <p className="truncate text-[12px] text-text-muted">{contact.email}</p>
      </div>
    </div>
  );
}

function EditContactsModal({
  titleId,
  ownerId,
  ownerOptions,
  onOwnerChange,
  draft,
  onChange,
  onAdd,
  onClose,
  onSave,
}: {
  titleId: string;
  ownerId: string;
  ownerOptions: ArPerson[];
  onOwnerChange: (id: string) => void;
  draft: ArInternalContact[];
  onChange: (next: ArInternalContact[]) => void;
  onAdd: () => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const updateContact = (id: string, patch: Partial<Pick<ArInternalContact, "name" | "email" | "roleLabel">>) => {
    onChange(draft.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="presentation">
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
        className="relative z-10 flex max-h-[min(85vh,32rem)] w-full max-w-md flex-col rounded-2xl border border-border-default bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border-default px-4 py-3">
          <h2 id={titleId} className="font-heading text-[16px] font-semibold text-text-primary">
            Edit contacts
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

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <fieldset>
            <legend className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Collection owner
            </legend>
            <select
              value={ownerId}
              onChange={(e) => onOwnerChange(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border-default px-2.5 py-1.5 text-[13px] text-text-primary outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {ownerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} · {option.email}
                </option>
              ))}
            </select>
          </fieldset>

          <div className="mt-5 border-t border-border-default pt-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Additional contacts
              </p>
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-blue-600 transition-colors hover:bg-blue-50"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add
              </button>
            </div>
            {draft.length === 0 ? (
              <p className="mt-3 text-[13px] text-text-muted">No additional contacts yet.</p>
            ) : (
              <div className="mt-3 space-y-4">
                {draft.map((person) => (
                  <div key={person.id} className="flex items-start gap-2">
                    <ArContactAvatar name={person.name || "?"} size="md" className="mt-1" />
                    <div className="grid min-w-0 flex-1 gap-2">
                      <label className="block">
                        <span className="text-[11px] font-medium text-text-muted">Role</span>
                        <input
                          type="text"
                          value={person.roleLabel}
                          onChange={(e) =>
                            updateContact(person.id, { roleLabel: e.target.value })
                          }
                          className="mt-1 w-full rounded-lg border border-border-default px-2.5 py-1.5 text-[13px] text-text-primary outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
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
            )}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border-default px-4 py-3">
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
