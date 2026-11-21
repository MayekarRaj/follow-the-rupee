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
