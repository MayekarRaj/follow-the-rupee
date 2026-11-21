# Design: "The audit ledger" (Mumbai monsoon x auditor's ledger)
Use the frontend-design skill. Distinctive, not a generic dashboard.
- Palette: paper #F6F1E7 bg, ink #1B2A41 text, road-yellow #F2B705, hazard-orange #E4572E, stamp-red #B3261E, ok-green #2E7D32. No other accents.
- Type: headings + all ₹ figures in a serif (Fraunces via next/font); body Inter; Devanagari: Noto Sans Devanagari.
- Signature: flags render as rotated rubber-stamp badges (border 2px, uppercase, letter-spacing, -3deg): "NEEDS REVIEW", "PAID TWICE?", "DLP · ₹0 TO BMC".
- Numbers are the hero: big serif ₹ amounts, tabular-nums.
- Citizen view: vertical "money trail" timeline, rupee flowing down step by step.
- Cards = ledger entries: thin ruled lines, no heavy shadows, no gradients, no purple.
- A11y: WCAG AA contrast, never colour-only (icon + label), 44px targets, visible focus rings, keyboard nav, chart text equivalents, lang="mr"/"hi" on translated text, prefers-reduced-motion respected.
- Motion: one subtle stamp "thud" on flag reveal; nothing else animates.