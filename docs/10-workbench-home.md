# Workbench Home / Getting Started Page

Role-aware "Getting Started" landing page inside the existing shell content area.

**Key files:**
- `src/pages/workbench/WorkbenchHome.tsx`
- `src/components/getting-started/*` — `GettingStartedHeader`, `SummaryStrip`, `EnvironmentBanner`, `MilestoneCard`, `MilestoneGrid`, `OperatorRail`, `FooterCallout`
- `src/data/gettingStarted.ts`
- `src/context/WorkbenchRoleContext.tsx`

## Personas (with in-page role switcher)

1. **Billing Manager (Admin)**
2. **Billing Operator**

Page title: **"Welcome back, John."**

## Layout

1. **HERO ROW** — title + badges + CTAs (`GettingStartedHeader`)
2. **PROGRESS / SUMMARY STRIP** — 4 compact cards (`SummaryStrip`)
3. **ENVIRONMENT BANNER** — amber info bar (`EnvironmentBanner`)
4. **MAIN MILESTONE CONTENT** — role-specific
5. **FOOTER CALLOUT** (`FooterCallout`)

### Admin layout

Full-width 2-column milestone grid (`MilestoneGrid`) with 8 milestones.

### Operator layout

Left 8-col checklist (6 milestones) + right 4-col sticky side panel (`OperatorRail`).

## Admin milestones (8)

1. Set up Site and Entity — **Complete**
2. Invite your revenue team — **In progress**
3. Create products, plans, and pricing — **In progress**
4. Configure AI commitments and access — **Not started**
5. Connect CRM and approval routing — **Not started**
6. Enable contract ingestion and enforcement — **Not started**
7. Validate invoice review and collections flow — **Blocked**
8. Run your first end-to-end dry run — **Blocked**

## Operator milestones (6)

1. Confirm your Site and Entity — **Complete**
2. Understand your task queues — **In progress**
3. Review and send a pending invoice — **Not started**
4. Record a payment — **Blocked**
5. Resolve a billing issue from Collections — **Blocked**
6. Check commitment burn-down before dispute — **Not started**

## Visual spec

- Enterprise, restrained, clean
- Cards with 16px radius, 20–24px padding
- Orange accents for primary actions
- Status pills:
  - **green** = Complete
  - **amber** = In progress
  - **gray** = Not started
  - **red** = Blocked

## Acceptance

- Fits naturally inside existing white content frame
- Uses available width well
- Clear admin vs operator differentiation
- Clean spacing and readable hierarchy
- Matches Chargebee APEX tone
