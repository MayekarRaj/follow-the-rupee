> Original build spec (21 Nov, 12:00). Current behaviour: README.md and DECISIONS.md.

# Follow the Rupee: build spec (hand this to Claude Code)

Synthetic data only. Label it in the footer: "Synthetic dataset, Claude Impact Lab Mumbai. Flags are evidence for review, not verdicts."

## Stack (don't change it)
Next.js App Router + TypeScript + Tailwind. Mobile-first. Static JSON in `public/data/` (copy from `engine/out/`).
No auth, no database. One API route only: `app/api/explain/route.ts`. `ANTHROPIC_API_KEY` goes in `.env.local`, never committed.

## Layout
- Header: app name "Follow the Rupee", a **View as** select (`commissioner | ward | citizen`) stored in the URL `?role=`, and a ward select when role = ward (default `F/N`).
- Indian number formatting everywhere: `₹1,23,456` and `₹1.69 Cr` / `₹12.4 L` for large numbers.
- Every number that comes from a work order links to its evidence (see Flag drawer).

## Data files and the fields you use
- `summary.json`: total_spend_inr, work_orders, flag_counts{OVERBILLED,DUPLICATE_BILL,DLP_PAID,DLP_REVIEW}, flagged_excess_inr, flagged_work_orders, thresholds
- `wards.json` [24]: ward_code, ward_name, budget_inr, spend_inr, utilisation_pct, remaining_inr, jobs, low_lying_index, spend_by_contractor{}, spend_by_method{}, failed_fix_spend_inr, flagged_excess_inr, flags{}, sla_met_pct
- `contractors.json`: context_check{reopen_by_rain_quartile_pct[], reopen_by_low_lying_band_pct{}, note}, contractors[8]{contractor_id, name, jobs, billed_inr, sla_met_pct, reopen_pct, expected_reopen_pct_for_method_mix, median_cost_ratio, flags{}, flagged_excess_inr, failed_fix_spend_inr}
- `flags.json` [~640]: work_order_id, flag, severity, reason, excess_inr, ward, road, contractor, method, work_type, area_sqm, billed_inr, rate_card_inr, cost_ratio, completed_at, linked_complaints, original_work_order? (duplicates), road_resurfaced_on? (DLP)
- `next_rupee.json` {ward_code: {remaining_budget_inr, planned_spend_inr, queue[{road_id, road_name, risk_score, issue, method, est_cost_inr, funding, fundable_now}]}}
- `issues.json` [217]: road_id, road_name, ward_code, open_complaints, complaint_ids[], main_issue, risk_score, risk_components{severity,citizen_signal,flood,traffic,accidents,emergency_access,repeat_failure}, near_flood_hotspot, recommended_method, method_reopen_pct, est_cost_inr, funding
- `complaint_trail.json` {complaint_id: {status, received_at, ward, category, description, language, work_order?{id, contractor, method, road, completed_at, billed_inr, rate_card_inr, cost_ratio, sla_hours, sla_met, held_up_30d, flags[]}, open_issue?{road_id, city_risk_rank, of}}}. This file is 3.7 MB, so load it **only** on the citizen view, through a server route that returns one record, or with a client-side fetch on demand.

Flag labels (use these words, never "fraud" or "corruption"):
OVERBILLED = "Billed above rate card", DUPLICATE_BILL = "Possible double billing", DLP_PAID = "Paid during warranty (DLP)", DLP_REVIEW = "Check: drainage work on a warranty road".

## View 1: Ward officer (build first)
1. **KPI row** (4 cards): Budget, Spent (with utilisation %; red if over 100%), Flagged money (flagged_excess_inr for this ward), Failed fixes (failed_fix_spend_inr).
2. **Action queue: recover money.** This ward's flags, sorted by excess_inr descending, grouped by flag type, with a count and ₹ total per group. Each row shows the work order, road, contractor, ₹ excess and reason. The CTA text depends on type: "Raise recovery" (overbilled or duplicate) or "Send back to original contractor (DLP)". Tapping a row opens the Flag drawer.
3. **Next rupee.** next_rupee[ward].queue. Show "Remaining ₹X". Rows show road, issue, risk score (0 to 100 bar), method, est. cost, a funding badge (green "₹0 – DLP contractor" / blue "Ward budget"), and fundable_now (grey out rows that don't fit). If remaining is negative: a banner "Ward overspent by ₹X: only ₹0 DLP fixes possible; request reallocation".
4. **Contractors in this ward:** spend_by_contractor as a horizontal bar.

## View 2: Citizen ("Civic Issue Kundali")
- One input: "Complaint ID or describe your problem (English / मराठी / हिंदी)".
- If the input matches `BMC25-\d{6}`, look it up directly. Otherwise POST to `/api/explain` with `{mode:"find", text}`. Claude returns `{road_or_locality, ward, issue_type}`, and the client shows the matching issues for that ward and road plus recent complaint IDs.
- **Trail timeline** (vertical steps): Complaint received → Status → Repair job (work order id, contractor, method) → Cost (billed vs rate card, "x times") → Deadline (met / missed, sla_hours) → Held up 30 days? (yes / no) → Flags (if any). If there's no work order: show "Still open: ranked #N of 217 risky roads citywide". If rejected or forwarded: show it honestly.
- A "Explain in my language" button calls `/api/explain` `{mode:"citizen", record, lang}` and shows 2–3 plain sentences.

## View 3: Commissioner (city)
1. **KPI row:** total spend, flagged money and the number of flagged work orders, wards overspent (count), worst re-open contractor.
2. **Ward table** (sortable): ward, budget, spent, utilisation % (coloured bar), flagged ₹, failed-fix ₹, low_lying_index. Add a callout with the top 3 overspent and top 3 underspent wards: "Reallocate from R/N, H/E, T → E, R/C, L".
3. **Contractor scorecard** (8 rows): jobs, billed, SLA met %, re-open % vs expected (for example "37.6% vs 24.7% expected"), median cost ratio, flags, flagged ₹. Under it, the **Fairness check** box: re-open rate by rain quartile and by low-lying band (both roughly flat). Caption: "Re-open differences are not explained by heavy rain or flood-prone wards." "Explain" button → `/api/explain {mode:"scorecard", record}`.

## Flag drawer (shared)
Show all fields of the flag. For duplicates, show both work orders side by side (look up `original_work_order` in flags or show its id). For DLP, show "Road resurfaced on X; still in warranty". An "Explain" button calls `/api/explain {mode:"flag", record}`.

## `/api/explain`
- Model `claude-sonnet-5-5`, max_tokens 300, temperature 0.
- Cache in memory by `mode+JSON.stringify(record)+lang`.
- System prompt: "You explain Mumbai monsoon road-repair audit evidence to a ward officer or citizen. Use only the JSON given. Plain language, 2-3 sentences, mention the rupee amounts and the comparison (e.g. billed vs rate card). Never say fraud, corruption or theft; say 'needs review'. If lang is mr or hi, answer in that language and script."
- In `find` mode: "Extract the road or locality, ward code if mentioned and issue type from this complaint text (may be Marathi/Hindi/Hinglish). Return JSON only: {road_or_locality, ward, issue_type}."
- On API error, fall back to the `reason` text in the record. The demo must never break.

## Demo path (rehearse exactly this)
1. Commissioner: "₹1.69 Cr flagged across 621 work orders; E ward overspent 19%."
2. Switch to Ward officer F/N: the recovery queue, with one duplicate shown side by side; then next rupee, where the DLP roads are free.
3. Citizen: paste a Marathi complaint → Claude finds it → trail → "Explain in Marathi".
4. Close with the fairness check: "We don't blame contractors for rain; here's the proof."

## Definition of done
Deployed on Vercel, all three views load on a phone, no console errors, README lists data sources, thresholds and what's synthetic.
