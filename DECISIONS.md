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


## Ward officer view
**D18. The headline says "possibly paid twice", not "paid twice".**
*Why:* The audit flag is "possible double billing": same road, method, contractor and area billed again within 10 days, with no citizen complaint linked. Citywide, only 6 of the 45 original bills appear in the flagged list, so we often can't see the earlier bill to confirm. The rubber stamp keeps the question mark ("PAID TWICE?"). The short labels on the queue tab and drawer title still read "Paid twice", but the headline and stamp carry the uncertainty. This follows D11.

**D19. The headline and the "Flagged money" card use the ward's de-duplicated ₹ total, and count distinct work orders.**
*Why:* One work order can carry two flags (for example overbilled and on a warranty road), and the engine counts its money once. For ward F/N the per-flag excess adds up to ₹14,45,571, but the de-duplicated total is ₹14,20,916 (₹14.2 L), across 44 work orders (the 46 flags include two work orders flagged twice). The per-tab ₹ totals are per flag type, so they can add up to more than the headline. We show the de-duplicated figure so we never overstate the money at stake.

**D20. Only static labels are translated (English, मराठी, हिंदी). Data text stays in English and is marked `lang="en"`.**
*Why:* The dictionary covers header and menu labels, KPI names, tab names, status names, buttons, drawer headings, the "How we flag" headings, the one-line disclaimer, the footer and the headline template. We do not translate road and contractor names, the engine's reason text, or the rule, threshold and next-step sentences, because a dictionary can't safely rewrite sentences about money. Marking the English text lets screen readers pronounce it correctly. Free-text translation belongs to the Claude "Explain" route (citizen view). The Marathi and Hindi wording was written by us and needs a native-speaker review before real use.

**D21. Each flag's "What to do next" names an owner chain: the sub-engineer checks, then the Executive Engineer (EE) acts.**
*Why:* The chains are: possibly paid twice, "Sub-engineer verifies on site → EE raises recovery"; billed above rate card, "Sub-engineer re-measures → EE raises recovery"; paid during warranty, "Sub-engineer confirms → EE sends back to original contractor"; drainage on a warranty road, "Sub-engineer checks on site → EE decides". *Basis:* BMC's Pothole Tracking System has the sub-engineer take the closing photo and reopen failed fixes (BMC tender document), so field verification by the sub-engineer is grounded in BMC's own process. *Assumption:* that the EE approves and raises recovery, sends work back to the original contractor, or makes the final call is ours, not sourced. Confirm both with BMC before presenting the chains as BMC's process. This follows D11's advice to define the next action for each flag.

## Citizen view
**D22. The complaint trail comes from a server route that returns one record; the 3.7 MB file never reaches the browser.**
*Why:* `/api/complaint/[id]` fetches `/data/complaint_trail.json` from its own origin once, keeps it in module memory, and returns only the requested record (about 350 bytes to 1 KB). It rejects anything that isn't `BMC25-` plus six digits (400), and unknown IDs return 404 with a plain message.

**D23. An ID typed anywhere in the text counts as an ID.**
*Why:* People paste "my complaint BMC25-000726 is still open". SPEC says the input *matches* `BMC25-\d{6}`; we search for it inside the text, case-insensitively, so one paste works either way. Anything else goes to Claude's "find" mode.

**D24. "Held up 30 days?" is worded as "Did the repair hold for 30 days?"**
*Why:* In the engine, `held_up_30d` means the repair was *not* re-opened. A "yes" is good news, so we show Yes with a green tick and a sentence ("the road did not fail again within 30 days"). "No" shows a red cross and "the road failed again within 30 days". Icon and word, never colour alone.

**D25. Rejected, forwarded, duplicate and no-work-order cases are stated plainly.**
*Why:* "Forwarded to MMRDA/PWD" says it went there, is not a BMC repair and has no BMC bill. "Rejected" says whether BMC called it not a BMC road or not a road issue. "Closed - Duplicate" says it was closed as a duplicate of another complaint (the data doesn't say which one, so we don't guess) and that the repair job shown is the one linked to it. Open or in-progress complaints with a ranked road show "Still open: ranked #N of 217 risky roads citywide" plus the road name. The few open complaints with no road in the ranking say that instead.

**D26. Free-text search: Claude extracts, the browser matches, and it still works if the API is down.**
*Why:* We scored every issue on three things: ward match (3 points), road-name words found in Claude's locality or the raw text (2 points each, up to 2), and issue type (1 point), then showed the top 3 with their complaint IDs as tappable chips (first 4 each, "+N more"). Two additions to SPEC's find prompt: it lists the 24 ward codes with their areas so a locality like "Dharavi" resolves to G/N, and it asks for `issue_type` from our six fixed types so matching is exact. Because the raw text is matched too, an API failure only loses the ward guess.

**D27. "Explain in my language" uses the app's language if it isn't English, otherwise the complaint's own language.**
*Why:* A Marathi complaint opened in an English app still gets a Marathi explanation (the spec says "the record's/selected language"). Hinglish (`hi-en`) is explained in Hindi. If the AI is unavailable, the fallback is a plain English summary built from the record (billed vs rate card, flags), marked "the AI explanation was not available".

**D28. `/api/explain` leaves out `temperature`, and allows 900 tokens for Marathi and Hindi.**
*Why:* SPEC says temperature 0 and max_tokens 300. The installed `@anthropic-ai/sdk` no longer accepts `temperature` for `claude-sonnet-5-5` (TypeScript rejects it), so we don't send it; the in-memory cache keeps repeated answers identical. At 300 tokens a Marathi answer was cut off mid-word, since Devanagari costs roughly three times the tokens of English, so Marathi and Hindi get 900 and English stays at 300. Only successful answers are cached; any error returns the record's own text with `fallback: true`. Find mode, on error, returns empty fields so the client matches the raw text.

**D29. "Complain with evidence" is a draft in English, with a copy button. Nothing is sent.**
*Why:* Ward offices work in English paperwork, and a correct Marathi or Hindi complaint about money needs native review (see D20). The draft is addressed to the ward officer (with the ward's areas), states the complaint ID, work order, contractor, billed vs rate card with the ×, deadline and 30-day result, quotes each flag's reason and amount, and asks for a review. It says "needs review", never fraud (D11). A forwarded complaint has no ward, so it goes to "the Ward Officer, BMC". Rejected or forwarded complaints ask which office is now responsible.

**D30. Flag stamps and the cost step open the same evidence drawer as the Ward view; `flags.json` loads only when the complaint has a flag.**
*Why:* SPEC says every work-order number links to its evidence. Reusing `FlagDrawer` keeps one source of truth. Most complaints have no flags, so most lookups never download the 455 KB file.

**D31. The citizen page's static labels are translated into Marathi and Hindi; the complaint text, status, contractor and road names stay as recorded.**
*Why:* Same rule as D20. The complaint is shown in its own language with `lang` set (`mr`, `hi`, or `en` for Hinglish). The new Marathi and Hindi labels were written by us and need native-speaker review. The spec'd input label is kept as written, with "(English / मराठी / हिंदी)".

## Commissioner view
**D32. The headline names the contractor with the highest re-open rate: Western Coast Asphalt Co (38.8% vs 24.6% expected), not Mahalaxmi (37.6%).**
*Why:* The headline is computed from `contractors.json` (highest `reopen_pct`, ties broken by the ratio to expected). The "37.6% vs 24.7%" in SPEC was only an example of the format. Western Coast is also the highest by ratio (1.58×), so both ways of ranking agree.

**D33. The review mark for a contractor is "re-open rate above 1.3× expected" (3 of 8: Western Coast 1.58×, Mahalaxmi 1.52×, Arabian Sea 1.31×). It shows a "▲ 1.58× expected" line and a "Needs review" stamp.**
*Why:* The threshold comes from the request. Arabian Sea is only just over (1.31×), so the ratio is always printed next to the percentages and the reader can judge. Wording stays "needs review" (D11). The scorecard is sorted by this ratio, worst first, so the marked rows sit together at the top.

**D34. The reallocation callout ranks wards by utilisation %, then shows ₹ amounts: E, R/C, L (over budget by ₹10.2 L, ₹4.1 L, ₹11.4 L = ₹25.8 L) and R/N, H/E, T (unspent ₹12.7 L, ₹20.5 L, ₹11.5 L = ₹44.7 L).**
*Why:* Ranking by % reproduces the SPEC's example ("R/N, H/E, T → E, R/C, L"). By ₹ alone, L would outrank E. The callout is titled "Suggestion for review" and says the data can't show which unspent money is already committed, so it can't read as an instruction. Whether the unspent total covers the overspend is computed, not assumed.

**D35. Wards are "overspent" above 100% utilisation (6 wards, R/S included at 100.6%) and "under-utilised" below 80% (6 wards).**
*Why:* Both follow the request. Boundaries are strict (> 100, < 80), using the engine's `utilisation_pct`. No ward sits on either boundary (nearest: 100.6% and 79.5%), so rounding doesn't change the counts.

**D36. Ward-table utilisation bars run 0–125% with a tick at 100%. Over 100% is stamp-red with "▲ over budget"; under 80% is road-yellow with "▼ under 80%".**
*Why:* A 100% scale would clip E (119.3%). The percentage is always printed beside the bar and the bar itself is hidden from screen readers, so colour is never the only signal. The "under 80%" note was added so the KPI count can be found in the table; the request only asked for the over-budget text.

**D37. The table is a real `<table>`. Column headers are buttons with `aria-sort`. The ward code is a link, and the whole row is also clickable.**
*Why:* A link in the first cell makes the row reachable by keyboard (Tab, Enter), and the row click is a mouse convenience that goes to the same address (`/?role=ward&ward=X`). Default sort is utilisation, highest first, so over-budget wards open the table. A totals row (double rule) closes it, like a ledger.

**D38. On phones both tables scroll sideways inside their own box (keyboard-focusable, labelled), with the ward or contractor name pinned on the left. The page itself never scrolls sideways.**
*Why:* Seven or nine numeric columns can't fit in 390 px, and hiding columns would hide data. The first KPI cards stack: flagged money first, then total spend, then the two ward counts side by side. *Found while testing:* screen-reader-only text inside a scroll box widened the whole page until the box was made `position: relative`.
*Test note:* Chrome's smallest window is 614 px wide, so I checked at 614 (same layout rules as 390, below the 640 px breakpoint), not at exactly 390.

**D39. The fairness box shows each group as a pair of bars: the group's re-open rate (ink) and the all-jobs average (yellow, 24.4%). Both charts share one 0–40% scale starting at zero.**
*Why:* "Bar pairs" is read as group vs. citywide average, which makes "roughly flat" visible. The average is the jobs-weighted mean of the contractors' re-open rates (2,499 jobs, matching `summary.json`). One scale and a zero baseline keep the flatness honest. Text equivalents: every row prints its percentage and difference in points, and each chart ends with a "Text version" sentence (range and spread). A short list adds the contractor spread (29.7 pts) next to rain (2.4 pts) and low-lying (3.7 pts).

**D40. The fairness caption is only shown if both spreads are within 5 percentage points; otherwise a more cautious sentence replaces it.**
*Why:* The caption "Re-open differences are not explained by heavy rain or flood-prone wards" is a claim about the data, so it's tied to the data. With today's numbers it shows, as in SPEC.

**D41. Per-contractor "Explain" posts the contractor record plus the ratio, the threshold and the rain / low-lying context to `/api/explain` (mode `scorecard`). The answer appears in one panel under the table. If the call fails, a summary built from the same numbers is shown, marked as such.**
*Why:* The route is unchanged. It falls back to `record.note`, so the client sends a plain-language `note` it also uses when the request itself fails. A single panel (rather than a row inside the table) stays visible when the table is scrolled sideways on a phone. The contractor name is sent without "(synthetic)" so the answer reads naturally.

**D42. The view's labels are English only for now; the view is marked `lang="en"`. `lib/i18n.ts` is untouched.**
*Why:* The new wording (headline, callout, fairness text) would need Marathi and Hindi that a native speaker reviews (see D20). Marking the view as English keeps screen readers correct when the app language is set to Marathi or Hindi. The header's "Commissioner" label is already translated.

**D43. `CommissionerView` has its own small Section and KPI card instead of sharing WardView's.**
*Why:* Those helpers live inside WardView.tsx, and the request was not to change the Ward or Citizen views. They can be moved to a shared file later. `lib/data.ts` only gained a `Contractor` type, and `app/page.tsx` now renders the Commissioner view where the placeholder was.

**D44. With no `?role=` in the address, the app opens on the Commissioner view.**
*Why:* SPEC's demo path starts at the Commissioner. The default lives in `useRole()` (`components/Header.tsx`), so the View-as select shows "Commissioner" too. Links that carry `?role=` are unaffected.

**D45. The Citizen view's title is "Track a road complaint" with "Civic Issue Kundali" as a small outlined tag above it. The old "Citizen" eyebrow was dropped.**
*Why:* The request asked for plain wording with the old name kept only as a tag. The role is already shown in the header's View-as select, so the eyebrow repeated it. Marathi and Hindi versions of the title, subtitle and new search messages are my own and need a native speaker's review (see D20).

**D46. Three example chips sit under the search box and run the search when tapped: BMC25-000726 (Marathi · still open), BMC25-000009 (billed 2.2×) and the Marathi sentence. Each chip has a small second line saying what it shows.**
*Why:* They give a first-time visitor three different demo paths with one tap. The second line uses the wording from the request. The chip text is the exact search text, so what runs matches what is shown.

**D47. "My ward" shows when there is no result on screen: a ward picker (default F/N), a plain-language report card, the top 5 open problems by risk, and the 5 latest fixes. Opening a trail or a search result hides it, and a "Back to my ward" button returns to it. The chosen ward is kept in the parent so it survives going back.**
*Why:* It fills the empty state without competing with a result. Keeping it visible under a long trail would push the trail far down a phone screen. The section is marked `lang="en"` and its text is English only for now, as in D42.

**D48. The report card says three things in sentences with a big serif ₹ figure each: spent against the budget (with "▲ ₹N over budget" only when over), "Needs review" (`flagged_excess_inr`, with the flag count and "These are items to check, not findings"), and "On failed repairs" (`failed_fix_spend_inr`, "road failed again within 30 days").**
*Why:* Plain language for a citizen, with the project's wording rule ("needs review", never fraud or theft). Over-budget is shown with an icon, text and colour, never colour alone (D36).

**D49. "Open problems near you" are `issues.json` rows for the ward, sorted by `risk_score`, top 5. Each has the road, the issue, a risk bar with "NN/100" printed beside it, and up to 3 complaint-ID chips plus "+N more". Chips open the trail.**
*Why:* The printed score makes the bar usable without seeing colour. Three chips fit a 390 px row better than four. "+N more" is plain text because the trail view shows one complaint at a time.

**D50. New route `GET /api/complaints?ward=F/N&limit=5` returns the latest resolved complaints in a ward, newest repair first (by `completed_at`). It sends only id, category, road, contractor, method, date, billed ₹, cost ratio, held-up flag and flag codes. The ward is a query parameter because ward codes contain a slash. Bad ward codes get a 400; limit is capped at 20.**
*Why:* The 3.7 MB trail file stays on the server (CLAUDE.md). "Resolved" means status "Resolved" only, not "Closed - Duplicate", whose linked job belongs to another complaint. All 3,934 resolved complaints have a work order.

**D51. The trail loader moved to `lib/trailServer.ts` and is shared by `/api/complaint/[id]` and `/api/complaints`. Behaviour of the old route is unchanged.**
*Why:* Two routes would otherwise each download and parse the 3.7 MB file. The load happens once per server process and is retried after a failure.

**D52. Each recent fix shows "Held 30 days" (green ✓) or "Failed within 30 days" (red ✕), the road, the repair date and the billed ₹, plus "⚑ Needs review" if the job has any flag.**
*Why:* The held/failed status was requested. Icon and words together keep it readable without colour. The road code "(RD0077)" is hidden because it means nothing to a citizen.

**D53. Search: Enter submits (Shift+Enter adds a line, and Enter is ignored while a Marathi/Hindi keyboard is composing text). The same code path serves the button, Enter and every chip. While a search runs the button reads "Finding…" and a status box appears under the form.**
*Why:* Pressing Enter to confirm a Devanagari word on a phone keyboard must not submit half a sentence. One `run()` function means all entry points behave the same.

**D54. If `/api/explain` fails (network error, non-200, or the route's own `fallback: true` answer), a visible amber notice says AI search is unavailable and results may be less exact. The search still runs on the raw text.**
*Why:* The route answers 200 with `fallback: true` when the model call fails, so checking only the HTTP status would hide the failure. I tested by forcing the route to return 500: all three test searches still found sensible roads.

**D55. Local matching was rewritten so it works without the model: it keeps 2-letter road names such as "SV" (matched as whole words), finds every ward whose locality appears in the text ("Andheri" gives both K/E and K/W), reads a ward code like "F/N", transliterates about 40 common Devanagari place names (धारावी → Dharavi), and picks the issue type from English, Marathi and Hindi words. It returns up to 5 matches, up from 3.**
*Why:* The old code dropped words under 3 letters ("SV Road" matched nothing useful) and ignored Devanagari entirely, so the Marathi example had no offline fallback. The place list is short and hand-written, so unusual spellings still need the model.

**D56. A search with no match, or a complaint ID that is not in the dataset, shows what was searched, a plain explanation and four tappable suggestions (SV Road, Andheri pothole, Eastern Express Highway, BMC25-000726).**
*Why:* A dead end on a phone is worse than a wrong guess. The suggestions are real queries that return results.

**D57. Checked at 390 px with a 390 px-wide frame of the page (Chrome would not shrink the window itself): no sideways scroll, chips wrap, report card and trail fit. Free-text tests on localhost: "Andheri pothole" (K/W and K/E Andheri roads), "SV Road" (only SV Road segments), and the Marathi example (G/N Dharavi roads), each both with the model and with `/api/explain` forced to fail.**
*Why:* Records what was actually tested. Ports 3000 and 3001 were used by other projects on this machine, so this app was tested on 3002.

**D58. App shell: a 240 px left sidebar on lg+ (brand "Follow the Rupee / Monsoon road-repair ledger", then Commissioner, Ward officer, Citizen, each with an icon and a one-line description, then "How we flag"). Below lg the same panel opens as a left drawer from a menu button. The active role is highlighted and set with `aria-current="page"`. The role is still the `?role=` URL parameter; the Ward link keeps the current `ward`. The old "View as" dropdown and the `Header` component were removed. `useRole` moved to `lib/role.ts`.**
*Why:* Three roles with a one-line "what is this for" each are easier to choose from a list than from a dropdown. Plain links keep the URL shareable and work without JavaScript state. The drawer reuses the existing `Drawer` (focus trap, Esc, focus return) with a `side="left"` option.

**D59. A compact top bar carries the page title on the left, a ward picker (Ward officer only) and two segmented controls on the right: text size (A− A A+) and language (EN · मर · हि). Every segment is at least 44 px, has a full accessible name ("English", "मराठी", "हिंदी") and `aria-pressed`. The ward picker is a native select with the arrow replaced by an inset icon. On phones the controls wrap under the title row.**
*Why:* A native language select had its arrow touching the border and hid the options. Segments show all choices at once, in their own script. Keeping the ward picker was necessary because the ward view had no other way to change ward.

**D60. Colour key at the bottom of the sidebar and inside the mobile drawer: stamp-red = needs review, road-yellow = budget / spend, ok-green = DLP · ₹0 to BMC / held up, ink = neutral data. Each has a swatch and a text label, translated into Marathi and Hindi.**
*Why:* The palette carries meaning across all views. A permanent key teaches it once. The labels follow the wording rule (D-series: "needs review", never "fraud").

**D61. Fonts: IBM Plex Sans for UI and headings, IBM Plex Sans Devanagari for Marathi and Hindi, IBM Plex Serif (600, 700) only for large ₹ figures and KPI numbers. Fraunces and Inter were removed. Headings, headline sentences, road names, ward codes and status text that used the serif were switched to Plex Sans.**
*Why:* Following the brief. One family for reading text looks calmer, and the serif now signals "this is a money figure". Plex Sans Devanagari also includes Latin, so mixed text stays in one family. DESIGN.md's type line was updated to match.

**D62. No chatbot. Explanations stay as a button on a specific record (scorecard row, flag, complaint) that sends only that record to `/api/explain`.**
*Why:* A generic chat box invites questions the data cannot answer, and a model asked for numbers without a record in front of it can invent them. A button tied to one record means every ₹ figure in the answer comes from the JSON that was sent.

**D63. Scorecard "Explain" opens the answer inline in a row directly under that contractor. The button has `aria-expanded` and `aria-controls`, reads "Hide" while open, and only one row is open at a time. Answers already fetched are kept, so reopening is instant. The text block stays pinned to the left edge while the wide table scrolls sideways. The button cell and rows got more vertical padding so the button clears the row border.**
*Why:* The old panel appeared below the whole table, far from the row that was clicked. Pinning the text keeps it readable on a 390 px screen.

**D64. `/api/explain`: `max_tokens` is 600 for English and 900 for Marathi/Hindi. The system prompt now says "complete sentences, at most 3, always finish the last sentence". If the model still stops at the token limit, the reply is cut back to its last full sentence (. ! ? । ॥) before it is returned.**
*Why:* A sentence cut off mid-word in front of a commissioner is worse than a shorter answer. The server-side trim is a safety net for the rare case the model ignores the length hint.

**D65. Checked with one screenshot per view at 1440 px, and at 390 px in a 390 px-wide frame (Chrome would not shrink the window, as in D57): Commissioner, Ward officer, Citizen, plus the mobile drawer. No sideways scroll (page width 388 of 388 px). The scorecard was tested at 1440 px by opening two rows in turn: only the second stayed open and its answer was three full sentences.**
*Why:* Records what was actually tested. The Next dev server on port 3002 was already running for this project, so it was reused. Marathi and Hindi pages were not re-checked after the font change.

**D66. Flag drawer, DUPLICATE_BILL: the "Original" card is built from `flag.original` (the full evidence object in flags.json). Only if that is missing does it fall back to looking the work order up in the flag list. Both cards now show the same seven fields (date, road, contractor, method, area, complaints, billed). A new `WorkOrderEvidence` type in `lib/data.ts` describes them.**
*Why:* The original bill is usually not flagged, so the lookup found nothing and the "Original" card showed the copy's data. Identical fields side by side make the copy obvious: same road, method and area, different date and complaints (original has them, copy has "None").

**D67. Citizen ward card, "Needs review" text now reads "flagged for review: billed above rate card, possibly paid twice, or paid during warranty (N flags)". A second line gives the count per type from `wards.json`: above rate card · possibly paid twice · paid in warranty · warranty to check. Checked on ward F/N: 6 + 3 + 20 + 17 = 46.**
*Why:* "Paid above the rate card or possibly paid twice" left out the warranty flags, which are most of the count, so the number did not match the sentence. The extra line lets a citizen see where the total comes from. "Needs review" stays as the heading, and the "items to check, not findings" note stays.

**D68. Commissioner Explain row: the cell spans every column (`SCORECARD_COLS`, next to the header it must match), and the text block is at most 80 characters wide with a 4 px road-yellow rule on its left edge. It still sticks to the left edge when the table scrolls sideways.**
*Why:* 80 characters is a comfortable line length. Putting the rule on the text block instead of the full-width cell keeps it beside the words rather than the whole row.

**D69. Sidebar can collapse to a 64 px icon rail with a button at the top (`aria-expanded`, label "Collapse sidebar" / "Expand sidebar", translated). In the rail every item shows only its icon, with `aria-label` and `title` carrying the name, and the colour key shows swatches only (names remain for screen readers and as titles). The state is kept in localStorage (`ftr.sidebar.v1`). The mobile drawer always stays full width.**
*Why:* Wide tables and the two-column citizen view need the space. Native `title` tooltips were used because the sidebar scrolls and would clip a custom tooltip.

**D70. Colour key: added hazard-orange = "Risk level", and renamed road-yellow from "Budget / spend" to "Budget / under-used" (EN, MR, HI). In tables, flagged ₹ values are ink. The ward table's flagged-₹ column was the one that was red. Red stays for stamps, over-budget markers (▲) and headline totals.**
*Why:* Orange is already used for risk bars and ranks, so it needed a key entry. Yellow marks under-used budget, not spend in general. Red on every flagged cell made the table shout; it now means only the things that need action.

**D71. Ward view: "Contractors in this ward" moved under the action queue in the left column. "Next rupee" is alone in the right column with no sticky position and no inner scroll; the page scrolls as a whole.**
*Why:* The bars explain the flags in the queue, so they belong next to it. A scroll area inside a scrolling page traps the mouse wheel and hides the cards from keyboard users.

**D72. Citizen on lg+: two columns. Title, search and money trail on the left (40 rem), "My ward" on the right with a ruled left edge. My ward is always visible on desktop, but on phones it is still hidden once a result is showing. For Open and In Progress complaints the status step has an "Open for N days" label, counted in whole days from `received_at` to today's date in the browser (BMC25-000010: 537 days).**
*Why:* The ward card is useful next to a trail, and a long scroll past the trail was wasted space on a wide screen. The day count turns "still open" into something a citizen can quote when escalating. Counting to the browser's date means the number grows over time; the data has no fixed "as of" date.

**D73. Checked with one screenshot per change at 1440 px: the Commissioner Explain row, the collapsed rail (width 64 px, persisted after reload of another view), the Ward view, the duplicate-bill drawer (original WO25-01977 against copy WO25-02462) and Citizen with a trail. Marathi and Hindi, 390 px and the Ward view's lower half were not re-checked. `tsc --noEmit` is clean.**
*Why:* Records what was actually tested, per the "one screenshot per change" instruction.

**D74. Brand block in the sidebar now reads "Follow the Rupee · रुपयाचा मागोवा" (Marathi part in `lang="mr"`), with "Proposed audit layer for BMC's Roads Department · Prototype on synthetic data · Not an official BMC service" under it. The title dropped from 20 px to 18 px so "Follow the Rupee ·" stays on one line beside the collapse button. The line is translated into Marathi and Hindi (`brand.line`). No BMC logo or emblem is used anywhere. The old "Monsoon road-repair ledger" line is no longer shown.**
*Why:* The product must read as a proposal from outside BMC, not as something BMC runs. Using BMC's name only in words, with no logo, avoids looking official.

**D75. The footer now ends "Not an official BMC service." (EN, MR, HI).**
*Why:* The sidebar brand block is hidden when the sidebar is collapsed to the icon rail and on phones until the menu is opened. The footer is always on the page, so the disclaimer is never out of sight. This was not asked for; it is one sentence.

**D76. "Source:" tags (`components/SourceTag.tsx`, names in `lib/sources.ts`): complaints = "CCRS / MyBMC", work orders = "SAP work order", rates = "Rate schedule (USOR)", fixes = "Pothole Tracking System". Citizen trail: Complaint received and Status today → complaints; Repair job → work order; What BMC paid → "SAP work order + Rate schedule (USOR)" (the billed amount comes from the work order, the rate card from USOR); Deadline and Did the repair hold → fixes. Flag drawer: Billed → work order, Rate card → rates, DUPLICATE_BILL cards → work order plus complaints on the Complaints row, "Road resurfaced on" → fixes, and in All fields the work order, linked complaints and resurfaced rows. Not tagged: ratio, excess, the flag stamps and "why flagged" text, because the engine computes them. The label "Source:" is translated; the system names stay in English with `lang="en"`.**
*Why:* Shows a BMC officer which of their own systems each number would come from. Deadline is tagged "fixes" because it depends on when the repair was finished; that mapping is my reading, since the instruction named only four categories. In this prototype all four are synthetic stand-ins.

**D77. New sidebar item "Fits BMC" → static page `/fits-bmc` (own route, not a `?role=` view). On that page no role item is highlighted and the top bar shows "Fits BMC" with no ward picker. The sidebar label and sub-label are translated; the page body is English only (`lang="en"`, like the data text in the other views).**
*Why:* It is not a role, so it should not borrow the Commissioner highlight. A long static explainer in three languages was more than this pass called for. This is a gap for Marathi and Hindi readers.

**D78. The diagram is plain HTML (cards in a grid), not an image: BMC systems today (Complaints in: CCRS · MyBMC app · 1916 · MyBMC Assist WhatsApp; Pothole Tracking System; SAP work orders; USOR) → the audit layer (deterministic engine + Claude explanations) → four outputs. Arrows are decorative SVG (`aria-hidden`) and turn downward on narrow screens. Columns are named in words ("BMC systems today · unchanged", "New · the audit layer", "Outputs · back to BMC channels") so meaning does not rest on colour. An "In words:" caption repeats the whole flow as a paragraph. Below it, three numbered lines: "We don't replace any BMC system", "Reads exports BMC already has", "Answers flow back through existing channels". The page also says it is a proposal, not a live connection.**
*Why:* Real text is readable by screen readers in order, scales with the text-size control, and needs no alt text. The page states the limit plainly: there is no live BMC integration, and the "complaint status API" is the existing `/api/complaint/[id]` route.

**D79. Checked in Chrome on the dev server at port 3002, 1440 px wide, one screenshot per change: sidebar brand, `/fits-bmc`, the citizen trail for BMC25-004490 (tags on steps 1, 2, 3, 4 and 6), and the DLP flag drawer for WO25-01723. `tsc --noEmit` is clean and the console had no errors on a fresh load. Not checked: 390 px width, Marathi/Hindi on the new page, the DUPLICATE_BILL drawer with tags, and the collapsed rail with the new icon.**
*Why:* Records what was actually tested. One hydration warning appeared right after a hot-reload edit to the brand block; it was gone after reload.

**D80. "Draft escalation note" button added at the bottom of part 3 "What to do next" in the flag drawer. It opens a modal sheet (`components/EscalationSheet.tsx`, rendered in a portal) with EN / मराठी toggle, Copy text, Print and Close. Esc closes only the sheet, not the drawer under it. No data files changed.**
*Why:* The next step in part 3 ends with someone writing a note upstairs; the draft sits right where that step is described. The portal keeps the print CSS simple.

**D81. The model writes only five pieces (Sub:, two Ref: lines, the intro sentence, the ground text, "Action requested"), returned as JSON. Everything else is fixed or computed in code (`lib/escalation.ts`): the office header, To:, the particulars table (WO, contractor, method, area, billed, rate card, ratio, completed date), the four ground headings, signature block, Encl. and copy list. Amounts, ratios and dates are pre-formatted in code ("Rs. 3,15,328/-", dd/mm/yyyy) and the model is told to copy them.**
*Why:* A table of rupee figures must not depend on the model getting arithmetic or formatting right. The prose still reads like a drafted note.

**D82. Which ground is ticked is decided in code, not by the model: OVERBILLED, DUPLICATE_BILL and DLP_REVIEW → Ground 2 "Excess item & financial variation"; DLP_PAID → Ground 4 "Risk & cost action under Defects Liability". Exactly one box is ticked; all four headings are printed, only the ticked one has text. Ground 2 for DLP_REVIEW is worded "verify whether linked to resurfacing". Duplicates cite both WOs and both amounts; DLP_PAID cites the resurfaced date. The marker is "[x]" / "[ ]" plus a screen-reader "Ticked:" label, so it is not colour-only.**
*Why:* Follows the instruction literally and makes "exactly one" impossible to break. Grounds 1 and 3 (delay, utility hindrance) cannot be shown from this data, so they are never ticked.

**D83. Brackets kept where the data has nothing: Outward No., Date, office address, PIN, zone/central office, officer name. Forwarding officer is "[Sub-Engineer] (Roads Department)", with a copy to the Assistant Commissioner of the ward. "Roads Department" is my assumption for the department line. The template's "Sub-Engineer / Assistant Engineer" copy line is replaced by "Office Copy / Work Order Master File". Encl. lists the work order copy and an "audit flag evidence extract", not the template's hindrance register, notices and site photographs (the data has none).**
*Why:* Brackets make it obvious what the officer must fill in. Listing enclosures we cannot produce would be false.

**D84. Wording guard: the prompt forbids fraud / corruption / theft and requires "for verification and recovery if confirmed". The server also rejects any reply that contains those words (English or Marathi equivalents), is not valid JSON, or lacks the work order id. A rejected reply returns 502 and the client uses the local template.**
*Why:* The wording rule in CLAUDE.md should hold even if the model slips. Checking the WO id catches a reply written for the wrong record.

**D85. Language: `lang` is "en" or "mr" only (Hindi is not offered on the sheet). Marathi is written by the model, keeping ids, names, numbers and dates in Latin characters. The sheet language is independent of the app language. Cached by WO id + lang on the server (in memory) and in the browser for the session. max_tokens 1500 for this mode, no sentence trimming (JSON must not be cut).**
*Why:* Matches the requested EN / मराठी toggle. A Marathi reply that runs past 1500 tokens fails the JSON check and falls back to the template, which is the safe outcome.

**D86. Fallback: on any API error, bad reply or missing key, the browser fills the same sheet from `localNote()` using the flag's own fields (EN and Marathi). The sheet then shows "AI drafting unavailable. Filled from the flag's own fields." (screen only, not printed). The Marathi template text is hand-written and has not been reviewed by a Marathi speaker.**
*Why:* The demo must never break. The fallback is plain but correct since every figure comes from the record.

**D87. The sheet heading uses the serif face (IBM Plex Serif), which DESIGN.md reserves for ₹ figures and KPIs. Exception made because the request asked for a serif heading and the sheet imitates a printed office note. Body text stays Plex Sans / Devanagari. Ruled lines: double rule under the masthead, ruled particulars table, hairline between grounds. The top line "Draft for officer review · format modelled on BMC office notes · synthetic data" is part of the sheet, so it prints too (translated for Marathi). No BMC logo or emblem.**
*Why:* A printed copy must not be mistaken for an official note once it leaves the screen.

**D88. Print: `@media print` in `globals.css` hides everything in `body` except the sheet root (`.esc-root`), drops the toolbar (`.no-print`), the page border and the dark overlay, and sets 16 mm page margins. List items and table rows avoid page breaks.**
*Why:* Matches "print shows only the sheet". The print dialog itself was not opened in this check.

**D89. Checked in Chrome at 1440 px, one screenshot: F/N ward, first duplicate flag (WO25-02479 against WO25-02032) → live Claude draft (header, To:, Sub:, Ref:, intro and the start of the particulars table visible). Also called the API directly for a duplicate in S ward (worked; found "(synthetic)" in the contractor and a "Ground 2:" prefix, both fixed by cleaning the contractor name in the prompt and stripping the prefix). `tsc --noEmit` and eslint are clean. Not checked: the lower half of the sheet (grounds, signature), Marathi, the local fallback, Copy, the actual print preview, 390 px width, the other three flag types.**
*Why:* Records what was actually tested, per the "one screenshot" instruction.

**D90. Flag drawer part 1 now shows "Engineer remark: …" under the four figures on every flag type. When the record has no remark it says "none recorded" instead of hiding the line.**
*Why:* 96 flags have no remark. Saying so tells the officer the field was looked at and was empty.

**D91. If `possible_other_cause` is set, part 1 shows a "Possible other cause" box with that text, in the road-yellow family (2px border, tinted fill, ⚠ icon, uppercase label). No new colour was added.**
*Why:* DESIGN.md allows no other accents, and "amber" maps to road-yellow. Icon and label mean it is not colour-only. The box applies to both DLP_PAID (37) and DLP_REVIEW (31), since both carry the field.

**D92. When `possible_other_cause` is set, part 3 is replaced by "Check trench permit; recover reinstatement from the utility agency", owner "Sub-engineer → AE (with utility agency)" (`UTILITY_NEXT_STEP` in `lib/flagInfo.ts`). The escalation-note ground logic (D82) is unchanged.**
*Why:* Follows the instruction literally. Not done: the escalation note still reads as a contractor warranty claim for these flags. Worth a follow-up, since the drawer and the note now disagree for 68 flags.

**D93. The evidence checklist ("Resurfaced date ✓", "Road under warranty ✓", "Cause confirmed on site ☐") is shown on both DLP flag types. It is read-only, not tickable. The first item is ✓ only if `road_resurfaced_on` is set (and shows the date). "Road under warranty" is always ✓ because the engine flags only roads inside the DLP. Each row also says "In the data" or "To check" in words.**
*Why:* The request gave fixed states. Ticks that do not persist could mislead, so the third box is deliberately a to-do. The older green "Road resurfaced on …" note is kept for DLP_PAID, so the date now appears twice.

**D94. New status "Contested by contractor" (`contested`), reached from "Under review" via a "Contested by contractor…" button. It requires the contractor's reason (200 chars) and takes an optional evidence note (200 chars). The reason and note show in the drawer's status panel. Stored in the same localStorage map; a `note` field was added to the record and the key stays `ftr.flagStatus.v1`.**
*Why:* Old saved records stay valid, so no migration is needed.

**D95. From Contested the officer can Mark recovered, Dismiss… (reason required, replaces the contractor's reason on the record) or "Back to review". "Contested by contractor…" is not offered again while already contested.**
*Why:* "Between Under review and Recovered/Dismissed" implies a step in the middle, not a dead end. Back to review covers a contest that turns out to be withdrawn. Dismissing replaces the stored contractor reason; that history is not kept.

**D96. The tag uses a ⚑ icon, a hazard-orange border and ink text on a pale fill. It is the longest tag, so it makes the status column in the action queue wider on narrow rows. No counts or filters by status exist yet.**
*Why:* Hazard-orange text on paper would fail AA contrast; the border carries the colour and the words carry the meaning.

**D97. "How we flag" gets a new last section, "Robustness checks", from `summary.robustness`. It holds: a table of bills flagged at 1.3×–2.0× with the 1.5× row marked "rule used"; a table of the duplicate rule (10 days / 10% cost; widened to 30 days / 25%; widened and also counting jobs with a linked complaint = 46) plus the 45 unlinked work orders; re-open % by road type next to each contractor's share of jobs on that road type (lowest–highest across 8 contractors); the count of warranty flags with a utility remark ("37 of 270", 270 from `flag_counts.DLP_PAID`); then the four `robustness.notes` as a plain-words list.**
*Why:* All values come from the data, none are typed in. The row with 46 is shown, not left out, because it is in the data and a reader may ask what happens if linked jobs count. The "10% cost" wording is read from `_dup_count` in the engine (cost within `tol`). The per-contractor re-open table is not shown, only its summary via the notes, because the note's claim that the contractor ranking holds within road types is the engine's, not re-checked in the UI.

**D98. Section heading translated (mr/hi); table text and notes are English only, like the rest of the section.**
*Why:* Consistent with the other How-we-flag sections, which also render data-driven English text.

**D99. Checked in Chrome at 1440 px on port 3002, one screenshot per change: (1) WO25-02366 in P/N, parts 1 and 3 (remark, amber box, checklist, new next step); (2) the same flag moved Start review → Contested with a reason and a note, tag showing in the queue and the drawer; (3) How we flag, Robustness section (threshold and duplicate tables, start of road-type table). `tsc --noEmit` and eslint are clean; no console errors. Test status was cleared from localStorage afterwards. Not checked: 390 px, Marathi/Hindi, a DLP flag without a utility cause, a non-DLP drawer, the lower half of the Robustness section, keyboard use of the contest form.**
*Why:* Records what was actually tested.

**D100. Escalation note: when a DLP_PAID flag has `possible_other_cause` set (utility trench, MTNL/MGL), Ground 3 "Inter-departmental / utility hindrance" is ticked instead of Ground 4, and Action requested starts with "Verify trench permit; recover reinstatement charges from the utility agency". The ground text says the damage "may come from the utility cut and not from the resurfacing" and asks for verification. The same applies in the local fallback template (English and Marathi). The rule lives in `groundFor()` and `stepFor()` in `lib/escalation.ts`; the sheet, the model brief, the local template and `/api/explain` all use them. On the API path, if the model's English action does not contain the exact sentence, the server puts it first.**
*Why:* The engine already marks these as a possible utility cut, so blaming the resurfacing contractor under Ground 4 would contradict the flag's own remark. The exact sentence is enforced in code because the model paraphrases. The drawer's "next step" for these flags keeps its own wording (`UTILITY_NEXT_STEP`, "Check trench permit…"); only the note uses the requested sentence. The Marathi action is my own translation and needs native review (see D20).

**D101. "Ward office: <assistant_commissioner_office>" with an "Accountable" tag is added next to the contractor in the citizen trail (job step) and the flag drawer (the duplicate-bill cards and "All fields"). It reads `assistant_commissioner_office` from wards.json by ward code and shows nothing when the field is missing. Labels are translated (en/mr/hi); the office name is shown as it appears in the data.**
*Why:* **wards.json has no `assistant_commissioner_office` field today (checked: wards.json and the rest of public/data and engine/engine.py contain none).** The brief said no data edits and the JSON is generated by the engine, so I added the optional field to the `Ward` type and left the line hidden. Nothing is invented. The line will appear once engine.py emits the field. Not seen in a browser.

**D102. Checked in Chrome on port 3002: one screenshot of change 1 (WO25-02366, P/N, escalation note, Ground 3 ticked and the new action). No screenshot for change 2, as the data has no office field. `tsc --noEmit` and eslint are clean. Not checked: the local fallback template, the Marathi note, a DLP_PAID flag without a utility cause after this change, 390 px.**
*Why:* Records what was actually tested.

**D103. Writes are now visible across roles through the existing localStorage store. `lib/store.ts` fires a window custom event (`ftr:store`, with the key) on every write, and each subscriber listens to it as well as to the browser's `storage` event. Before this, only subscribers created through the same store instance were told.**
*Why:* The brief asked for a window event so open views refresh. The `storage` event only reaches other tabs; the custom event covers the same tab. No new package.

**D104. `lib/status.ts` gets `getStatus(woId)`, `listStatuses()`, `statusForWo()`, `addFollowUp()`, `listFollowUps()` and `useFollowUps()`. Every status record now also has `updatedAt` (same value as `at`, kept so old saved records still read). A work order's status is the most recently changed flag status that is not "new", because statuses are saved per flag (`WO|FLAG`) and one work order can carry several.**
*Why:* The brief asks for a status per work order, but the store keys by flag. "Most recent" is the simplest rule that shows the officer's latest action. Two flags on one job with different statuses show only the newer one in the citizen trail.

**D105. Follow-ups live under their own key, `ftr.followUps.v1` (a list). A ref is "FU-" plus 4 characters from A–Z and 2–9 without 0, O, 1, I, so it can be read out or copied without mix-ups; a ref already in use is never reused. A follow-up stores complaint id, work-order id (or null), text, `at` and `updatedAt`.**
*Why:* Keeping them apart from flag statuses means neither can overwrite the other.

**D106. Citizen trail: after the last job step, a step "Ward office action: <status> · <relative time>" appears when the work order has a status past "new". Dismissed shows "Reason: …", Contested shows "Contractor's reason: …"; the other statuses repeat the status word as the body. Each follow-up for the complaint then adds "Your follow-up: <ref>" with its text and time. A one-line demo note closes the list. Relative time is "just now / N min ago / N h ago / N days ago" (English only, from `timeAgo`).**
*Why:* The status and the follow-up are both things that happened after the repair, so they come last. The body for statuses without a reason repeats the title; that is plain but nothing else is in the data. The step is hidden when there is no linked work order.

**D107. "Submit follow-up" sits inside the "Complain with evidence" panel, under an optional 300-character note. If the note is empty the saved text is "Please review complaint <id> (work order <id>) and tell me what action is being taken." After saving, the panel says "Follow-up recorded · ref FU-xxxx" and the note box clears. The draft text itself is not saved.**
*Why:* The draft is a long letter to copy; the ward drawer needs a short line to list. The note keeps the citizen in control of what is sent.

**D108. Ward drawer: a "Citizen follow-ups (N)" box (always shown, "No follow-ups yet." at 0) lists each follow-up's text, ref, complaint id and time. It matches on the work-order id only. Queue rows show a small bordered "N follow-ups" badge ("1 follow-up" for one) next to the contractor name. The same drawer opens in the citizen view, so a citizen sees follow-ups there too.**
*Why:* Always showing the box makes the feature findable before anyone has used it. Matching on work order only means a follow-up on a complaint with no work order never reaches a ward drawer (it still counts for the commissioner).

**D109. Commissioner "Actions taken" card under the KPI row: Under review, Contested, Recovered, Dismissed, "₹ recovered" and "Citizen follow-ups". The four counts are per flag, not per work order, and the card says so. ₹ recovered sums `excess_inr` from flags.json for each flag marked Recovered; it shows "…" until flags.json has loaded and 0 for a status that matches no flag. English only, like the rest of this view.**
*Why:* The saved status is per flag, so counting per work order would need a rule from D104 that hides data. Showing "per flag" is more honest.

**D110. The note "Demo: saved in this browser. In production: written to BMC's system." (`demoNote`) is shown in the citizen trail and the follow-up panel, the ward queue, the drawer's follow-up box and the commissioner card. Marathi and Hindi versions are my own translation and need native review (see D20).**
*Why:* Asked for in each place. The ward queue got its own copy as well as the drawer, so the badges are not read as live data.

**D111. Checked in Chrome on port 3002, one pass per step: set WO25-00003 (M/W) to Under review in the drawer; its trail for BMC25-000009 showed "Ward office action: Under review · just now"; submitted a follow-up (ref shown, "Your follow-up" step appeared); the queue row showed "1 follow-up" and the drawer listed it; after Mark recovered the commissioner card showed Recovered 1, ₹12,675, follow-ups 1. `tsc --noEmit` and eslint are clean; no console errors. The two storage keys were cleared afterwards. Not checked: 390 px, Marathi/Hindi, Dismissed and Contested in the trail, two flags with different statuses on one work order, a second browser tab, storage blocked.**
*Why:* Records what was actually tested.

**D112. Docs pass, no code. DESIGN.md keeps the original brief at the top and gains three sections describing what is built: the shell (collapsible sidebar, top bar controls), the colour key (red, yellow, green, orange, ink with meanings and usage rules) and the escalation sheet. SPEC.md gets one line at the top: "Original build spec (21 Nov, 12:00). Current behaviour: README.md and DECISIONS.md." The rest of SPEC.md is unchanged.**
*Why:* DESIGN.md described only the original brief, so it no longer matched the app. Keeping the brief and adding the built behaviour below it avoids losing the original intent. SPEC.md stays as the historical spec, and the line points readers to the files that now describe current behaviour. The colour-key meanings come from D60 and D70, and the sheet details from D80–D88 and D100, checked against `NavPanel.tsx`, `TopBar.tsx`, `EscalationSheet.tsx` and `lib/i18n.ts`. Where the key says what a colour is used for beyond the labels (for example the yellow "possible other cause" box, the orange contested-tag border), that comes from D91 and D96. README.md still says "D1–D111" and was not touched, since it has uncommitted changes of yours.
