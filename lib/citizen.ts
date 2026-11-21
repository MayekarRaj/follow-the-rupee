import { cleanName, FLAG_LABEL, inr } from "./format";
import { NORMAL_RANGE } from "./flagInfo";
import type { Flag, Ward } from "./data";

export type WorkOrder = {
  id: string;
  contractor: string;
  method: string;
  road: string;
  completed_at: string;
  billed_inr: number;
  rate_card_inr: number;
  cost_ratio: number;
  sla_hours: number;
  sla_met: boolean;
  held_up_30d: boolean;
  flags: string[];
};

export type Complaint = {
  status: string;
  received_at: string;
  ward: string | null;
  category: string;
  description: string;
  language: string;
  work_order?: WorkOrder;
  open_issue?: { road_id: string; city_risk_rank: number; of: number };
};

export type Issue = {
  road_id: string;
  road_name: string;
  ward_code: string;
  open_complaints: number;
  complaint_ids: string[];
  main_issue: string;
  risk_score: number;
  near_flood_hotspot: string | null;
};

export type Extracted = {
  road_or_locality: string | null;
  ward: string | null;
  issue_type: string | null;
};

export const ID_RE = /BMC25-\d{6}/i;

/** Language to show translated text in: the reader's choice, else the complaint's own. */
export function recordLang(c: Complaint): "en" | "mr" | "hi" {
  return c.language === "mr" ? "mr" : c.language.startsWith("hi") ? "hi" : "en";
}

/** lang attribute for the complaint's own words ("hi-en" is romanised Hinglish). */
export function textLang(c: Complaint): string {
  return c.language === "mr" ? "mr" : c.language === "hi" ? "hi" : "en";
}

export type StatusKind = "done" | "progress" | "open" | "dup" | "rejected" | "forwarded";

export function statusKind(status: string): StatusKind {
  if (status === "Resolved") return "done";
  if (status === "In Progress") return "progress";
  if (status === "Open") return "open";
  if (status.startsWith("Closed")) return "dup";
  if (status.startsWith("Rejected")) return "rejected";
  return "forwarded";
}

/** Plain-words status, honest about rejected / forwarded / duplicate. */
export function statusSentence(c: Complaint): string {
  const s = c.status;
  switch (statusKind(s)) {
    case "done":
      return "Resolved. A repair job was done.";
    case "progress":
      return "In progress. Work has not finished yet.";
    case "open":
      return "Open. No repair has been done yet.";
    case "dup":
      return "Closed as a duplicate of another complaint about the same problem. The repair job below is the one linked to it.";
    case "rejected":
      return s.includes("Not BMC road")
        ? "Rejected: BMC says this is not a BMC road. No BMC repair was done."
        : "Rejected: BMC says this is not a road issue. No road repair was done.";
    default: {
      const to = s.replace(/^Forwarded to\s*/i, "");
      return `Forwarded to ${to}. It is not a BMC road repair, so BMC did not do the job and there is no BMC bill.`;
    }
  }
}

/** Hours between "YYYY-MM-DD HH:mm" stamps (both local, so the difference is fine). */
export function hoursBetween(a: string, b: string): number | null {
  const p = (s: string) => Date.parse(s.replace(" ", "T") + "Z");
  const x = p(a);
  const y = p(b);
  return Number.isFinite(x) && Number.isFinite(y) ? Math.round((y - x) / 36e5) : null;
}

export function fmtDate(s: string): string {
  const d = new Date(s.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/* ---------- finding issues from free text ---------- */

const STOP = new Set([
  "road", "rd", "marg", "street", "st", "near", "the", "and", "link", "junction",
  "east", "west", "north", "south", "nagar", "naka", "ward", "issue", "problem",
]);

/** Common Devanagari spellings of localities -> the Latin names the data uses. */
const DEVA_PLACES: Record<string, string> = {
  "धारावी": "dharavi", "अंधेरी": "andheri", "अंधेरि": "andheri", "दादर": "dadar",
  "माहीम": "mahim", "माहिम": "mahim", "माटुंगा": "matunga", "सायन": "sion",
  "वडाळा": "wadala", "कुर्ला": "kurla", "घाटकोपर": "ghatkopar", "चेंबूर": "chembur",
  "बांद्रा": "bandra", "वांद्रे": "bandra", "खार": "khar", "जुहू": "juhu",
  "गोरेगाव": "goregaon", "मालाड": "malad", "कांदिवली": "kandivali",
  "बोरिवली": "borivali", "दहिसर": "dahisar", "मुलुंड": "mulund", "भांडुप": "bhandup",
  "पवई": "powai", "विक्रोळी": "vikhroli", "परळ": "parel", "लालबाग": "lalbaug",
  "वरळी": "worli", "कुलाबा": "colaba", "भायखळा": "byculla", "गोवंडी": "govandi",
  "मानखुर्द": "mankhurd", "देवनार": "deonar", "जोगेश्वरी": "jogeshwari",
  "सांताक्रूझ": "santacruz", "प्रभादेवी": "prabhadevi", "शिवडी": "sewri",
  "हिंदमाता": "hindmata", "विलेपार्ले": "vile parle",
};

/** Words in the complaint that point to an issue type (English / Marathi / Hindi). */
const ISSUE_WORDS: [RegExp, string][] = [
  [/pothole|खड्डा|खड्डे|गड्ढा|गड्ढे/i, "Pothole"],
  [/waterlog|water log|flood|पाणी साचले|पाणी साचल|पाणी भरले|पानी भर|जलभराव|साचलेले पाणी/i, "Waterlogging"],
  [/cave|sinkhole|धंस|खचला|खचले|धँस/i, "Road cave-in"],
  [/manhole|मॅनहोल|मैनहोल|ढक्कन|झाकण/i, "Open or broken manhole"],
  [/drain|nullah|nala\b|नाला|नाले|गटार|नाली/i, "Choked drain / nullah overflow"],
  [/paver|पेव्हर|पेवर/i, "Broken paver blocks"],
];

export function issueFromText(text: string): string | null {
  return ISSUE_WORDS.find(([re]) => re.test(text))?.[1] ?? null;
}

/** Lower-case Latin text with Devanagari place names transliterated and appended. */
function normalise(text: string): string {
  const out = [text.toLowerCase()];
  for (const [deva, latin] of Object.entries(DEVA_PLACES))
    if (text.includes(deva)) out.push(latin);
  return out.join(" ");
}

function words(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]{2,}/g) ?? []).filter((t) => !STOP.has(t));
}

function normWard(w: string | null): string | null {
  if (!w) return null;
  const x = w.toUpperCase().replace(/\bWARD\b/g, "").replace(/\s+/g, "").replace("\\", "/");
  return x || null;
}

/** "Andheri East, Vile Parle East" -> ["andheri", "vile parle"] */
function localities(ward: Ward): string[] {
  return ward.ward_name
    .split(",")
    .map((n) =>
      n
        .toLowerCase()
        .replace(/\b(east|west|north|south)\b/g, "")
        .trim(),
    )
    .filter((n) => n.length >= 4);
}

/** A short road name ("SV") has to match a whole word; longer ones may match inside one. */
function tokenHitsRoad(tok: string, roadWords: string[]): boolean {
  return tok.length <= 3
    ? roadWords.includes(tok)
    : roadWords.some((w) => w === tok || w.includes(tok));
}

/**
 * Top matches for a free-text complaint. Uses what Claude extracted, plus the
 * raw text itself (including Devanagari place names), so it still works when
 * the API is unavailable.
 */
export function findIssues(
  issues: Issue[],
  wards: Ward[],
  ex: Extracted,
  text: string,
): Issue[] {
  const hay = normalise(`${ex.road_or_locality ?? ""} ${text}`);

  // Every ward the text points to: the model's ward, a ward code, or a locality.
  const hitWards = new Set<string>();
  const w0 = normWard(ex.ward);
  if (w0 && wards.some((w) => w.ward_code === w0)) hitWards.add(w0);
  const code = hay.match(/\b([a-z])\s*\/\s*([nsewc])\b/);
  if (code) {
    const c = `${code[1]}/${code[2]}`.toUpperCase();
    if (wards.some((w) => w.ward_code === c)) hitWards.add(c);
  }
  for (const w of wards)
    if (localities(w).some((n) => hay.includes(n))) hitWards.add(w.ward_code);

  const place = words(hay);
  const issue = (ex.issue_type ?? issueFromText(text) ?? "").toLowerCase();

  return issues
    .map((i) => {
      const roadWords = words(i.road_name);
      const hits = new Set(place.filter((t) => tokenHitsRoad(t, roadWords))).size;
      const wardHit = hitWards.has(i.ward_code);
      const issueHit = issue !== "" && i.main_issue.toLowerCase() === issue;
      const score = (wardHit ? 3 : 0) + Math.min(hits, 2) * 2 + (issueHit ? 1 : 0);
      return { i, score, relevant: wardHit || hits > 0 };
    })
    .filter((x) => x.relevant)
    .sort((a, b) => b.score - a.score || b.i.risk_score - a.i.risk_score)
    .slice(0, 5)
    .map((x) => x.i);
}

/* ---------- plain-English summaries ---------- */

/** Deterministic summary sent along as the API fallback. */
export function plainSummary(id: string, c: Complaint, roadName?: string): string {
  const w = c.work_order;
  if (!w) {
    if (c.open_issue)
      return `Complaint ${id} is still open. ${roadName ?? "Its road"} is ranked #${c.open_issue.city_risk_rank} of ${c.open_issue.of} risky roads citywide.`;
    return `Complaint ${id}: ${statusSentence(c)}`;
  }
  const flags = w.flags.map((f) => FLAG_LABEL[f] ?? f);
  return (
    `Work order ${w.id} (${cleanName(w.contractor)}, ${w.method}) billed ${inr(w.billed_inr)} against a rate card of ${inr(w.rate_card_inr)}, which is ${w.cost_ratio.toFixed(2)}× the rate card. ` +
    (flags.length ? `It needs review: ${flags.join("; ")}.` : "It has no flags.")
  );
}

/** A copyable complaint text for the ward office: facts and amounts, no accusations. */
export function buildComplaintText(
  id: string,
  c: Complaint,
  opts: { wards: Ward[] | null; flags: Flag[] | null; roadName?: string },
): string {
  const w = c.work_order;
  const ward = opts.wards?.find((x) => x.ward_code === c.ward);
  const to = c.ward
    ? `The Ward Officer, ${c.ward} Ward${ward ? ` (${ward.ward_name})` : ""}, Brihanmumbai Municipal Corporation`
    : "The Ward Officer, Brihanmumbai Municipal Corporation";
  const lines: string[] = [
    `To: ${to}`,
    `Subject: Request for review of complaint ${id}`,
    "",
    "Respected Sir/Madam,",
    "",
    `I am writing about my road complaint ${id}, received on ${fmtDate(c.received_at)} (${c.category}). Current status in the records: ${c.status}.`,
    "",
  ];

  if (w) {
    lines.push(
      "What the records show:",
      `- Work order ${w.id}: ${w.method} by ${cleanName(w.contractor)}, ${w.road}, finished ${fmtDate(w.completed_at)}.`,
      `- Billed ${inr(w.billed_inr)} against a rate card of ${inr(w.rate_card_inr)} (${w.cost_ratio.toFixed(2)}× the rate card; normal range ${NORMAL_RANGE}).`,
      `- Deadline of ${w.sla_hours} hours: ${w.sla_met ? "met" : "missed"}.`,
      `- ${w.held_up_30d ? "The repair held for 30 days." : "The road failed again within 30 days of the repair."}`,
    );
    if (w.flags.length) {
      lines.push("", "Items marked “needs review”:");
      for (const code of w.flags) {
        const f = opts.flags?.find(
          (x) => x.work_order_id === w.id && x.flag === code,
        );
        lines.push(
          `- ${FLAG_LABEL[code] ?? code}${f ? `: ${f.reason} Amount to review: ${inr(f.excess_inr)}.` : "."}`,
        );
      }
    }
    lines.push(
      "",
      w.flags.length
        ? "Please review work order " +
            w.id +
            " and the items above, and tell me what was found and what action is being taken."
        : `Please confirm that the repair under work order ${w.id} was inspected, and tell me who to contact if the problem returns.`,
    );
  } else if (c.open_issue) {
    lines.push(
      "What the records show:",
      `- No repair job is linked to this complaint yet.`,
      `- ${opts.roadName ?? "The road"} is ranked #${c.open_issue.city_risk_rank} of ${c.open_issue.of} risky roads citywide.`,
      "",
      "Please tell me when this road will be repaired.",
    );
  } else {
    lines.push(
      "What the records show:",
      `- ${statusSentence(c)}`,
      "",
      "Please tell me which office is now responsible for this problem and when I can expect action.",
    );
  }
  lines.push("", "Thank you.", "", "Date: ____________   Name / contact: ____________");
  return lines.join("\n");
}
