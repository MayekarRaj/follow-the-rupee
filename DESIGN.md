# Design: "The audit ledger" (Mumbai monsoon x auditor's ledger)
Use the frontend-design skill. Distinctive, not a generic dashboard.
- Palette: paper #F6F1E7 bg, ink #1B2A41 text, road-yellow #F2B705, hazard-orange #E4572E, stamp-red #B3261E, ok-green #2E7D32. No other accents.
- Type (next/font): IBM Plex Sans for UI + headings; IBM Plex Sans Devanagari for mr/hi; IBM Plex Serif only for large ₹ figures and KPI numbers (one exception: the escalation note heading, see below).
- Signature: flags render as rotated rubber-stamp badges (border 2px, uppercase, letter-spacing, -3deg): "NEEDS REVIEW", "PAID TWICE?", "DLP · ₹0 TO BMC".
- Numbers are the hero: big serif ₹ amounts, tabular-nums.
- Citizen view: vertical "money trail" timeline, rupee flowing down step by step.
- Cards = ledger entries: thin ruled lines, no heavy shadows, no gradients, no purple.
- A11y: WCAG AA contrast, never colour-only (icon + label), 44px targets, visible focus rings, keyboard nav, chart text equivalents, lang="mr"/"hi" on translated text, prefers-reduced-motion respected.
- Motion: one subtle stamp "thud" on flag reveal; nothing else animates.

The rules above are the original brief. The sections below describe what is built now. Reasons for each choice are in DECISIONS.md (D58–D61, D69–D70, D74, D77, D80–D88, D100).

## The shell
Every page sits in the same frame: a left sidebar, and to its right a top bar, the page, and a footer. A skip link comes first in tab order. A hazard-stripe band (road-yellow and ink) runs along the top of the sidebar and the top bar.

### Sidebar (`components/NavPanel.tsx`)
- **Expanded (240 px, large screens only):** brand block, then navigation, then the colour key pinned to the bottom. The brand reads "Follow the Rupee · रुपयाचा मागोवा" with the line "Proposed audit layer for BMC's Roads Department · Prototype on synthetic data · Not an official BMC service" under it. No BMC logo or emblem anywhere.
- **Navigation items**, each with an icon and a one-line description: Commissioner, Ward officer, Citizen (these three set `?role=`; the Ward link keeps the current `ward`), then "Fits BMC" (its own page, `/fits-bmc`, not a role) and "How we flag" (opens the explainer panel). The active item has a stamp-red left edge, a tinted fill and `aria-current="page"`. On `/fits-bmc` no role is highlighted.
- **Collapsed (64 px icon rail):** a button at the top of the sidebar toggles it (`aria-expanded`, "Collapse sidebar" / "Expand sidebar"). In the rail each item shows only its icon; the name sits in `aria-label` and `title`. The brand block is hidden and the colour key shows swatches only (names stay for screen readers and as tooltips). The choice is remembered in localStorage (`ftr.sidebar.v1`).
- **Below the `lg` breakpoint** the sidebar is gone. A menu button in the top bar opens the same panel, always full width and with the colour key, as a left drawer (focus trap, Esc closes, focus returns to the button).

### Top bar (`components/TopBar.tsx`)
- **Left:** the menu button (small screens only) and the page title: the role name, or "Fits BMC".
- **Ward picker:** only in the Ward officer view. A native select of the 24 ward codes, with the arrow replaced by an inset icon. Changing it updates `?ward=` in the URL.
- **Right, two segmented controls:** text size (A− / A / A+, scales the page to 90 / 100 / 120%) and language (EN · मर · हि). Every segment is at least 44 px, has a full accessible name ("English", "मराठी", "हिंदी") and `aria-pressed`; the selected one is filled ink. On phones the controls wrap onto their own row under the title.
- It sticks to the top on large screens. Its height is published as `--header-h` so sticky columns inside views sit below it.
- Only static labels are translated (D20). Data text stays English and is marked `lang="en"`.

## Colour key
The palette carries meaning in every view. A key at the bottom of the sidebar (and of the mobile drawer) teaches it once. Each entry is a swatch plus a text label, translated into Marathi and Hindi.

| Colour | Key label | Where it appears |
|---|---|---|
| **Red** (stamp-red #B3261E) | Needs review | Flag stamps, "▲ over budget" markers, headline totals of flagged money |
| **Yellow** (road-yellow #F2B705) | Budget / under-used | Under-used budget ("▼ under 80%"), the "possible other cause" box, hover and selected tints |
| **Green** (ok-green #2E7D32) | DLP · ₹0 to BMC / held up | Warranty roads sent back at ₹0 to BMC, "Held 30 days" ticks |
| **Orange** (hazard-orange #E4572E) | Risk level | Risk bars and ranks in the next-rupee plan, the "Contested by contractor" tag border |
| **Ink** (#1B2A41) | Neutral data | Everything else: text, ruled lines, ordinary figures, flagged ₹ values inside tables |

Rules for using it:
- Colour is never the only signal. Every coloured mark also has an icon (▲ ▼ ✓ ✕ ⚑ ⚠) and a word, and printed numbers sit beside every bar.
- Red is for things that need action, so it is kept off ordinary table cells. A flagged ₹ value in a table is ink.
- Orange or yellow text on paper fails AA contrast. Where those colours mark text (for example the contested tag), the border carries the colour and the words are ink.
- No other accent colours are added.

## The escalation sheet (`components/EscalationSheet.tsx`)
A "Draft escalation note" button at the bottom of part 3, "What to do next", in the flag drawer opens a modal sheet. It looks like a printed BMC office note, not like the rest of the app.
- **Frame:** a dark overlay, a white sheet up to 48 rem wide, in a portal over the drawer. Focus moves in, Tab stays inside, Esc closes only the sheet (the drawer underneath stays open), and focus returns to the button.
- **Toolbar (screen only):** an EN / मराठी toggle (independent of the app language), Copy text, Print, Close. All at least 44 px.
- **Sheet, top to bottom:** a dashed line "Draft for officer review · format modelled on BMC office notes · synthetic data" (it prints too); office header in serif capitals with a double rule; Outward No. and date; To:; title; Sub: and Ref: lines; salutation and intro; a ruled particulars table (work order, contractor, method, area, billed, rate card, ratio, completed date); the four grounds for escalation; "Action requested"; closing; signature block; Encl. and copy list.
- **Grounds:** all four headings are printed and exactly one is ticked, shown as "[x]" / "[ ]" with a screen-reader "Ticked:" label, so it is not colour-only. Only the ticked ground has text. The ground is chosen in code, not by the model (D82, D100).
- **Typography:** the sheet heading uses IBM Plex Serif, the one place outside ₹ figures where it is allowed, because the sheet imitates a printed note (D87). Body is Plex Sans, or Plex Sans Devanagari for Marathi.
- **Brackets** mark what the data cannot supply (Outward No., date, address, officer name). The officer fills them in.
- **Fallback:** if the AI draft fails, the same sheet is filled from the flag's own fields, and a screen-only line says "AI drafting unavailable. Filled from the flag's own fields."
- **Print:** `@media print` hides everything except the sheet, drops the toolbar, the border and the overlay, and sets 16 mm margins. Rows and list items avoid page breaks.
- **Wording:** "for verification and recovery if confirmed"; never fraud, corruption or theft (D84). No BMC logo or emblem.
