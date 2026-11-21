# Decisions log: Follow the Rupee

Every significant decision, with the reason for it. Format: **Decision**, then *why*, then the evidence behind it.

## Product
**D1. One narrow tool: a repair auditor for ward officers, with three role views (Commissioner, Ward officer, Citizen).**
*Why:* The judges said "a narrow tool that works beats a half-built platform." Audit accuracy is the biggest criterion (25%), and the audit engine also feeds the budget plan (20%), the complaint trail (15%) and usability (20%). The three views come from mentor advice: the same data seen by each person in the chain of command.

**D2. Role switcher ("View as"), not real logins or access control.**
*Why:* Access control earns no points today and costs hours. Production access control through BMC sign-in is on the vision slide. A switcher still shows each role what it needs.

**D3. No WhatsApp bot.**
*Why:* BMC already runs MyBMC Assist on WhatsApp (launched January 2022, with complaint registration) and a "Hello A Ward" AI WhatsApp assistant (October 2026). Building another would duplicate BMC, and our goal is to strengthen BMC's systems, not compete with them. Instead, our complaint trail can power MyBMC Assist's status replies.

**D4. No complaint-form digitiser. We position ourselves on BMC's existing Pothole Tracking System and Measurement Book.**
*Why:* Complaint intake is already digital (portal, app, WhatsApp, 1916 helpline). The paperwork that decides where money goes is the Measurement Book, which is the basis of contractor bills, and the Pothole Tracking System, where a sub-engineer reopens failed fixes and contractors are fined. We add an audit layer on top of these rather than replacing them. The dataset has no form data, so a form tool couldn't be scored anyway.

**D5. No 360° or Street View imagery.**
*Why:* The dataset is synthetic, so there's no real imagery to show. Google's terms ban caching it, and it adds nothing to any judging criterion. A simple ward and road map from the provided GeoJSON is enough.

## Audit method (accuracy and fairness)
**D6. Code finds the problems; Claude explains them and reads messy text.**
*Why:* Over-billing and duplicate checks are arithmetic. Code is exact, repeatable and costs nothing. Claude is used where it adds value: plain-language explanations in English, Marathi and Hindi, and parsing multilingual complaints. The full logic is in `engine/engine.py`, so anyone can inspect and re-run it.

**D7. Over-billing threshold: 1.5× the rate card. Jobs between 1.30× and 1.50× go on a watch list instead.**
*Why:* The README says normal jobs vary 20–30% around the rate. In the data, normal jobs sit between 0.75× and 1.30×, there's a near-empty gap up to 1.5×, and then 109 jobs bill 1.5–3.1×. Flagging at the gap catches real problems, not normal variation (Audit accuracy criterion).

**D8. Duplicate billing means: a job with no linked complaint, on the same road, method and contractor as an earlier job, with the same area, cost within 10%, within 10 days.**
*Why:* All 45 matches are near-exact copies billed 1–4 days apart. Requiring no linked complaint avoids flagging genuine repeat repairs.

**D9. Warranty (DLP) flags come in two tiers. A road-surface repair BMC paid for on a road still in warranty is "Paid during warranty". Drainage work on a warranty road is only "Check".**
*Why:* A pothole on a road under warranty is the original contractor's liability. Drainage work usually isn't a pavement defect, so we don't blame without context (Fair accountability criterion).

**D10. Contractor scores are checked against context before any conclusion.**
*Why:* We tested whether re-open rates are explained by heavy rain or flood-prone wards. They aren't (about 23–26% in every rain level and ward band). We also compare each contractor with the re-open rate expected for its mix of repair methods. Differences between contractors are therefore evidence-based.

**D11. Wording: a flag is "needs review", never "fraud" or "corruption".**
*Why:* The Open Contracting Partnership's red-flags guide (2024) says a flag "signals a risk – it is not evidence that illicit behavior is present." It also recommends being transparent about methodology and defining the next action for each flag. So every flag shows what's wrong, why it's flagged, and what to do next, and the app has a "How we flag" panel.

**D12. The next-rupee plan ranks open issues by risk, chooses the repair method by cost per lasting fix, and sends warranty roads back to the original contractor at ₹0 to BMC.**
*Why:* Risk combines severity, flooding (hotspots and tides), traffic, accidents, hospital and school access, and repeat failures (the judges' brief). Choosing by the cheapest patch ignores re-open rates. Sending warranty repairs back frees up the ward's budget.

## Design and accessibility
**D13. We follow UX4G and GIGW 3.0 rules in our own design rather than installing the UX4G package.** (Confirmed with a mentor.)
*Why:* The official package (`ux4g-web-components`) is a global stylesheet that restyles standard page elements. It would clash with our styling, and out of the box it gives the generic government-portal look. We implement UX4G's rules ourselves: WCAG 2.1 AA contrast, never relying on colour alone, readable at 200% zoom, a declared page language, a visible focus ring, a skip link, and A−/A/A+ text-size buttons. The production path is the official UX4G package.

**D14. The "audit ledger" visual design: paper, ink, rubber-stamp flags and a "money trail" view.**
*Why:* It's distinctive and fits the subject (it reads as an audit at a glance) without breaking any accessibility rule.

## Engineering
**D15. Static JSON, no database, no auth. One Claude API route, with cached answers and a fallback.**
*Why:* It's the smallest thing that works, the demo can never break, and it's easy for BMC to host.

**D16. Next.js 16 with `cacheComponents` turned off.**
*Why:* With it on, reading the URL's role parameter needs extra Suspense and caching setup. That's a time sink with no benefit for a static-data app.

**D17. Claude Code on Sonnet at medium effort, switching to Opus only if the same bug fails twice.**
*Why:* SPEC.md already makes the design decisions, so building is clear implementation work. Sonnet is faster and stretches usage limits further.
