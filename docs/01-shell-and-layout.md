# Outer Shell & Page Layout

The outer shell is already built in `src/components/layout/` (`AppShell.tsx`, `TopNav.tsx`, `Sidebar.tsx`). **Do NOT redesign or replace it.** Work inside the existing white content canvas.

## Shell anatomy (from Chargebee product UI)

### A. Top Header Bar (dark)

- Dark background (#1a1d21 or similar charcoal)
- **Left side:** Chargebee logo icon (orange on dark), then site/entity selector "Echo-corp echocorp.test.charge..." with green dot, then entity/timezone selector "Germany Europe/Berlin (CET)"
- **Right side:** notification bell, "Configure Chargebee" button, developer console icon, lightbulb/tips, star/favorites, help/question mark, user avatar (orange circle)
- Spans full width

### B. Search Row

- Directly below the dark header
- White/light background row
- Contains a search input: "Search anything... ⌘K"
- Sits above the sidebar + content area

### C. Left Sidebar

- White background, no border-right (or very subtle)
- **Desk** group: **My Workbench** → `/`, **Queue** → `/queue`, **Approvals** → `/approvals` (each row uses a chevron; active state uses orange gradient accent)
- Small **orange dot** on the trailing edge of **My Workbench** when session state has pending approvals or in-flight Early Renewal closure ingestions; **Approvals** gets a dot when any approval is **Pending Approval** (see `docs/10-workbench-home.md`)
- Further groups (Records, Catalog, Insights) follow the same row pattern
- Compact text-only style, ~180px wide in the prototype

### D. Content Area Background

- Light gray background behind the content frame
- Content frame: large rounded white card with subtle shadow
- Generous padding around the white frame

## Layout rules inside the white canvas

Use the existing rounded white canvas as the main page surface. Do **not** nest another full-page wrapper card inside it.

### Recommended internal page spacing

- Horizontal padding: 24px to 32px
- Top padding: 24px
- Vertical gap between major sections: 16px to 20px

### Section card usage

Use section cards inside the page, but do **not** nest giant cards inside giant cards. Content should feel like structured sections on a page, not cards floating inside another card soup.

Use shadcn cards sparingly and consistently. Prefer:

- Subtle border
- White or slightly tinted surface
- Modest rounding
- Compact spacing
- Clear section titles

### Tailwind structure for detail pages

```
- page root:     h-full w-full overflow-auto
- inner wrapper: flex flex-col gap-4 px-6 py-6
- body:          centered column (max-w-860 detail, max-w-1020 list)
```

### Standard detail-page structure

```
- customer header (CustomerContextBar)
- journey rail
- optional record slot (RecordHeader glass card, portaled)
- centered main column with stacked content sections
- floating insight rail (see docs/03-customer-workspace.md)
```

The insight rail is no longer a fixed column. Instead it floats as an icon stack on the right (xl: breakpoint and above), expanding to a 340px panel on click. The panel pushes main content via dynamic padding. See `docs/03-customer-workspace.md` for full InsightRail spec.
