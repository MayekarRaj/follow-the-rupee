// Escalation note: shared by the sheet (client), the local fallback template
// and /api/explain (server). Pure functions only, no React, no fetch.
// Layout follows docs/templates/escalation.md (reconstructed, not an official form).
import type { Flag, FlagType } from "./data";
import { NEXT_STEP } from "./flagInfo";

export type NoteLang = "en" | "mr";

/** The only parts the model writes. Everything else is fixed or taken from the data. */
export type NoteText = {
  subject: string;
  ref: string[];
  intro: string;
  ground: string;
  action: string;
};

export type NoteWard = { ward_code: string; ward_name: string };

/** Flag plus the earlier bill (DUPLICATE_BILL only). */
export type NoteFlag = Flag & {
  original?: Pick<Flag, "work_order_id" | "billed_inr" | "completed_at"> | null;
};

/** Ground the flag falls under: exactly one is ticked. */
export const GROUND_OF: Record<FlagType, 2 | 4> = {
  OVERBILLED: 2,
  DUPLICATE_BILL: 2,
  DLP_REVIEW: 2,
  DLP_PAID: 4,
};

const GROUND_TITLES: Record<NoteLang, string[]> = {
  en: [
    "Contractor delay / non-performance",
    "Excess item & financial variation",
    "Inter-departmental / utility hindrance",
    "Risk & cost action under Defects Liability",
  ],
  mr: [
    "कंत्राटदाकडून विलंब / कामातील कमतरता",
    "अतिरिक्त बाब व आर्थिक तफावत",
    "आंतरविभागीय / सेवावाहिनी अडथळा",
    "दोष दायित्व कालावधीतील जोखीम व खर्च कारवाई",
  ],
};

const nf = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** Rs. 3,15,328/- (Indian grouping, the way office notes write it). */
export function rs(n: number): string {
  return `Rs. ${nf.format(Math.round(n))}/-`;
}

/** 2025-08-20 15:26 -> 20/08/2025. Anything unparseable becomes a bracket. */
export function dmy(s: string | null | undefined): string {
  const m = s?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "[DD/MM/YYYY]";
}

const contractor = (f: Flag) => f.contractor.replace(/\s*\(synthetic\)\s*$/i, "");
const complaints = (f: Flag) =>
  f.linked_complaints ? f.linked_complaints.split("|").join(", ") : null;

/** Amounts and dates in the exact strings the sheet prints. The model must reuse these. */
export function figures(f: NoteFlag) {
  return {
    billed: rs(f.billed_inr),
    rate_card: rs(f.rate_card_inr),
    ratio: `${f.cost_ratio.toFixed(2)}×`,
    excess: rs(f.excess_inr),
    completed: dmy(f.completed_at),
    resurfaced: dmy(f.road_resurfaced_on),
    original_billed: f.original ? rs(f.original.billed_inr) : null,
    original_date: f.original ? dmy(f.original.completed_at) : null,
    complaints: complaints(f),
  };
}

/** What the model is told the ground text must say, per flag. */
export function groundBrief(f: NoteFlag): string {
  const x = figures(f);
  return `${groundBriefCore(f, x)} Do not begin with the words "Ground ${GROUND_OF[f.flag]}"; the heading is printed separately.`;
}

function groundBriefCore(f: NoteFlag, x: ReturnType<typeof figures>): string {
  switch (f.flag) {
    case "OVERBILLED":
      return `State that ${f.work_order_id} was billed ${x.billed}, which is ${x.ratio} the rate card amount of ${x.rate_card}, an excess of ${x.excess}; put forward for verification and recovery if confirmed.`;
    case "DUPLICATE_BILL":
      return `State that the same road, method, contractor and area appear in the earlier work order ${f.original_work_order ?? "[original WO]"} (${x.original_billed ?? "[amount]"}, completed ${x.original_date ?? "[DD/MM/YYYY]"}) and again in ${f.work_order_id} (${x.billed}); the second bill of ${x.billed} is put forward for verification and recovery if confirmed. Cite both work orders and both amounts.`;
    case "DLP_PAID":
      return `State that the road was resurfaced on ${x.resurfaced} and is still within its Defects Liability Period, yet BMC paid ${x.billed} for surface repair under ${f.work_order_id}; propose risk and cost action against the original contractor and recovery of the amount if confirmed. Cite the resurfaced date.`;
    default:
      return `State that ${f.work_order_id} is drainage or utility work (${x.billed}) on a road resurfaced on ${x.resurfaced}; request verification whether this work is linked to the resurfacing. Do not allege anything.`;
  }
}

// ---------------------------------------------------------------------------
// Local template: the same sheet, filled from the flag's own fields. Used when
// the API is unavailable so the demo never breaks.
// ---------------------------------------------------------------------------

export function localNote(f: NoteFlag, w: NoteWard, lang: NoteLang): NoteText {
  const x = figures(f);
  const wo = f.work_order_id;
  const mr = lang === "mr";
  const refComplaints = x.complaints
    ? mr
      ? `संबंधित नागरिक तक्रारी: ${x.complaints}.`
      : `Linked citizen complaints: ${x.complaints}.`
    : mr
      ? "संबंधित नागरिक तक्रार नाही."
      : "No citizen complaint is linked to this work order.";

  const subject = mr
    ? `कार्यादेश ${wo} अंतर्गत, ${f.road}, ${w.ward_code} वॉर्ड येथील रस्ते दुरुस्ती कामाच्या देयकाची पडताळणी व पुष्टी झाल्यास वसुलीची विनंती.`
    : `Request for verification, and recovery if confirmed, in respect of the road-repair bill under work order ${wo} at ${f.road}, ${w.ward_code} Ward.`;
  const ref = mr
    ? [
        `कार्यादेश क्र. ${wo} दिनांक ${x.completed}, मे. ${contractor(f)} यांना दिलेला.`,
        refComplaints,
      ]
    : [
        `Work Order No. ${wo} dated ${x.completed}, issued to M/s. ${contractor(f)}.`,
        refComplaints,
      ];
  const intro = mr
    ? `वरील संदर्भानुसार, ${w.ward_name} (${w.ward_code} वॉर्ड) मधील ${f.road} येथील "${f.work_type}" हे काम मे. ${contractor(f)} यांनी केले. कामाचा संक्षिप्त तपशील खाली दिला आहे:`
    : `With reference to the subject cited above, the work of "${f.work_type}" at ${f.road} in ${w.ward_name} (${w.ward_code} Ward) was carried out by M/s. ${contractor(f)}. The brief particulars are summarised below for kind perusal:`;

  let ground: string;
  switch (f.flag) {
    case "OVERBILLED":
      ground = mr
        ? `कार्यादेश ${wo} साठी ${x.billed} इतके देयक आहे; हे दरपत्रकाच्या ${x.rate_card} पेक्षा ${x.ratio} पट असून ${x.excess} इतकी जादा रक्कम आहे. पडताळणीसाठी व पुष्टी झाल्यास वसुलीसाठी सादर.`
        : `Work order ${wo} was billed ${x.billed}, which is ${x.ratio} the rate card amount of ${x.rate_card}, an excess of ${x.excess}. Placed before you for verification and recovery if confirmed.`;
      break;
    case "DUPLICATE_BILL":
      ground = mr
        ? `त्याच रस्त्यावर, त्याच पद्धतीचे, त्याच कंत्राटदाराचे व तेवढ्याच क्षेत्राचे काम आधी कार्यादेश ${f.original_work_order ?? "[मूळ WO]"} (${x.original_billed ?? "[रक्कम]"}, पूर्ण दिनांक ${x.original_date ?? "[DD/MM/YYYY]"}) अंतर्गत व पुन्हा ${wo} (${x.billed}) अंतर्गत दिसते. दुसरे देयक ${x.billed} पडताळणीसाठी व पुष्टी झाल्यास वसुलीसाठी सादर.`
        : `The same road, method, contractor and area appear in the earlier work order ${f.original_work_order ?? "[original WO]"} (${x.original_billed ?? "[amount]"}, completed ${x.original_date ?? "[DD/MM/YYYY]"}) and again in ${wo} (${x.billed}). The second bill of ${x.billed} is placed for verification and recovery if confirmed.`;
      break;
    case "DLP_PAID":
      ground = mr
        ? `रस्त्याचे पुनर्पृष्ठीकरण ${x.resurfaced} रोजी झाले असून तो अद्याप दोष दायित्व कालावधीत आहे. तरीही ${wo} अंतर्गत पृष्ठभाग दुरुस्तीसाठी मनपाने ${x.billed} दिले. मूळ कंत्राटदारावर जोखीम व खर्च कारवाई आणि पुष्टी झाल्यास रकमेच्या वसुलीसाठी सादर.`
        : `The road was resurfaced on ${x.resurfaced} and is still within its Defects Liability Period, yet BMC paid ${x.billed} for surface repair under ${wo}. Placed for risk and cost action against the original contractor, and recovery if confirmed.`;
      break;
    default:
      ground = mr
        ? `${wo} हे ${x.resurfaced} रोजी पुनर्पृष्ठीकरण झालेल्या रस्त्यावरील निचरा/सेवावाहिनी काम (${x.billed}) आहे. हे काम पुनर्पृष्ठीकरणाशी संबंधित आहे का, याची पडताळणी करण्याची विनंती.`
        : `${wo} is drainage or utility work (${x.billed}) on a road resurfaced on ${x.resurfaced}. Kindly verify whether this work is linked to the resurfacing.`;
  }

  const step = NEXT_STEP[f.flag].action;
  const action = mr
    ? `वरील बाब पडताळणीसाठी सादर केली आहे. सुचवलेली कृती: ${localAction(f.flag)} पुष्टी झाल्यास वसुलीसाठी आपले निर्देश मिळावेत ही विनंती.`
    : `${step} Matter is escalated for verification and recovery if confirmed; your necessary directions are requested.`;

  return { subject, ref, intro, ground, action };
}

/** Marathi rendering of the drawer's next step (used only by the local template). */
function localAction(flag: FlagType): string {
  switch (flag) {
    case "DUPLICATE_BILL":
      return "प्रत्यक्ष जागेवर फक्त एकच काम झाले याची खात्री करणे; तसे असल्यास दुसऱ्या देयकाची वसुली करणे.";
    case "OVERBILLED":
      return "दरपत्रकानुसार कामाची पुनर्मोजणी करणे व दरपत्रकापेक्षा जादा रकमेची वसुली करणे.";
    case "DLP_PAID":
      return "दोष हा हमी कालावधीतील रस्त्यावरच आहे याची खात्री करणे, काम मूळ कंत्राटदाराकडे परत पाठवणे व मनपाने दिलेल्या रकमेची वसुली करणे.";
    default:
      return "निचऱ्याचे काम पुनर्पृष्ठीकरणामुळे झाले का ते तपासणे; होय असल्यास हमी दावा म्हणून हाताळणे, नसल्यास बंद करणे.";
  }
}

// ---------------------------------------------------------------------------
// Sheet model: one plain structure that both the JSX sheet and the copied
// text are built from, so they can never differ.
// ---------------------------------------------------------------------------

export type Sheet = {
  topNote: string;
  header: string[];
  outward: string;
  date: string;
  to: string[];
  title: string;
  subLabel: string;
  sub: string;
  refLabel: string;
  ref: string[];
  salutation: string;
  intro: string;
  particulars: [string, string][];
  groundsLabel: string;
  grounds: { n: number; title: string; ticked: boolean; text: string | null }[];
  actionLabel: string;
  action: string;
  closing: string;
  yours: string;
  sign: string[];
  encl: string;
  copyLabel: string;
  copies: string[];
};

const L = {
  en: {
    topNote:
      "Draft for officer review · format modelled on BMC office notes · synthetic data",
    corp: "BRIHANMUMBAI MUNICIPAL CORPORATION",
    office: (w: string) =>
      `Office of the [Sub-Engineer] (Roads Department), ${w} Ward`,
    addr: (w: string) => `${w} Ward Office Building, [Address], Mumbai – [PIN Code]`,
    outward: "Outward No.: [Dept/Ward/SE/____/2026-27]",
    date: "Date: [DD/MM/YYYY]",
    to: (w: string) => [
      "To,",
      "The [Executive Engineer] (Roads Department),",
      `[Zone / Central Office Address] for ${w} Ward,`,
      "Brihanmumbai Municipal Corporation, Mumbai – [PIN Code].",
    ],
    title: "SUBMISSION / ESCALATION NOTE",
    sub: "Sub:",
    ref: "Ref:",
    salutation: "Respected Sir / Madam,",
    rows: [
      "Work Order No.",
      "Contractor",
      "Method of repair",
      "Area",
      "Billed amount",
      "Rate card amount",
      "Billed ÷ rate card",
      "Completed on",
    ],
    grounds: "Grounds for Escalation (applicable ground ticked):",
    action: "Action Requested from Higher Authority:",
    closing: "Submitted for kind consideration and further orders, please.",
    yours: "Yours faithfully,",
    sign: (w: string) => [
      "Sd/-",
      "[Name of Forwarding Officer]",
      "[Sub-Engineer] (Roads Department), " + w + " Ward",
      "Brihanmumbai Municipal Corporation",
    ],
    encl: "Encl.: (1) Copy of Work Order (2) Audit flag evidence extract",
    copy: "Copy submitted for information to:",
    copies: (w: string) => [
      `1. Assistant Commissioner (${w} Ward), for kind information.`,
      "2. Office Copy / Work Order Master File.",
    ],
  },
  mr: {
    topNote:
      "अधिकाऱ्यांच्या आढाव्यासाठी मसुदा · मनपा कार्यालयीन टिपणीच्या धर्तीवर · कृत्रिम (synthetic) माहिती",
    corp: "बृहन्मुंबई महानगरपालिका",
    office: (w: string) => `[उप अभियंता] (रस्ते विभाग) यांचे कार्यालय, ${w} वॉर्ड`,
    addr: (w: string) =>
      `${w} वॉर्ड कार्यालय इमारत, [पत्ता], मुंबई – [पिन कोड]`,
    outward: "जावक क्र.: [विभाग/वॉर्ड/उअ/____/2026-27]",
    date: "दिनांक: [DD/MM/YYYY]",
    to: (w: string) => [
      "प्रति,",
      "[कार्यकारी अभियंता] (रस्ते विभाग),",
      `${w} वॉर्डसाठी [परिमंडळ / मध्यवर्ती कार्यालयाचा पत्ता],`,
      "बृहन्मुंबई महानगरपालिका, मुंबई – [पिन कोड].",
    ],
    title: "सादरीकरण / वरिष्ठांकडे पाठवण्याची टिपणी",
    sub: "विषय:",
    ref: "संदर्भ:",
    salutation: "महोदय / महोदया,",
    rows: [
      "कार्यादेश क्र.",
      "कंत्राटदार",
      "दुरुस्तीची पद्धत",
      "क्षेत्रफळ",
      "देयक रक्कम",
      "दरपत्रक रक्कम",
      "देयक ÷ दरपत्रक",
      "पूर्ण झाल्याचा दिनांक",
    ],
    grounds: "वरिष्ठांकडे पाठवण्याची कारणे (लागू कारण खुणावले आहे):",
    action: "वरिष्ठ प्राधिकाऱ्यांकडून अपेक्षित कृती:",
    closing: "कृपया विचारार्थ व पुढील आदेशांसाठी सादर.",
    yours: "आपला विश्वासू,",
    sign: (w: string) => [
      "सही/-",
      "[अग्रेषित करणाऱ्या अधिकाऱ्याचे नाव]",
      "[उप अभियंता] (रस्ते विभाग), " + w + " वॉर्ड",
      "बृहन्मुंबई महानगरपालिका",
    ],
    encl: "सोबत: (1) कार्यादेशाची प्रत (2) ऑडिट फ्लॅग पुराव्याचा उतारा",
    copy: "माहितीसाठी प्रत सादर:",
    copies: (w: string) => [
      `1. सहायक आयुक्त (${w} वॉर्ड), कृपया माहितीसाठी.`,
      "2. कार्यालयीन प्रत / कार्यादेश मुख्य संचिका.",
    ],
  },
} as const;

export function buildSheet(
  f: NoteFlag,
  w: NoteWard,
  note: NoteText,
  lang: NoteLang,
): Sheet {
  const l = L[lang];
  const x = figures(f);
  const g = GROUND_OF[f.flag];
  const area = lang === "mr" ? "चौ. मी." : "sq m";
  const vals = [
    f.work_order_id,
    contractor(f),
    f.method,
    `${f.area_sqm} ${area}`,
    x.billed,
    x.rate_card,
    x.ratio,
    x.completed,
  ];
  return {
    topNote: l.topNote,
    header: [l.corp, l.office(w.ward_code), l.addr(w.ward_code)],
    outward: l.outward,
    date: l.date,
    to: l.to(w.ward_code),
    title: l.title,
    subLabel: l.sub,
    sub: note.subject,
    refLabel: l.ref,
    ref: note.ref,
    salutation: l.salutation,
    intro: note.intro,
    particulars: l.rows.map((k, i) => [k, vals[i]] as [string, string]),
    groundsLabel: l.grounds,
    grounds: GROUND_TITLES[lang].map((title, i) => ({
      n: i + 1,
      title,
      ticked: i + 1 === g,
      text: i + 1 === g ? note.ground : null,
    })),
    actionLabel: l.action,
    action: note.action,
    closing: l.closing,
    yours: l.yours,
    sign: l.sign(w.ward_code),
    encl: l.encl,
    copyLabel: l.copy,
    copies: l.copies(w.ward_code),
  };
}

/** Plain-text version for "Copy text". */
export function sheetToText(s: Sheet): string {
  const pad = (a: string, n: number) => a + " ".repeat(Math.max(1, n - a.length));
  const wide = Math.max(...s.particulars.map(([k]) => k.length)) + 2;
  const lines = [
    s.topNote,
    "",
    ...s.header,
    "",
    `${s.outward}    ${s.date}`,
    "",
    ...s.to,
    "",
    s.title,
    "",
    `${s.subLabel} ${s.sub}`,
    `${s.refLabel} ${s.ref.map((r, i) => `${i + 1}. ${r}`).join("\n     ")}`,
    "",
    s.salutation,
    "",
    s.intro,
    "",
    ...s.particulars.map(([k, v]) => `  ${pad(k, wide)}${v}`),
    "",
    s.groundsLabel,
    ...s.grounds.map(
      (g) => `${g.ticked ? "[x]" : "[ ]"} ${g.n}. ${g.title}${g.text ? `: ${g.text}` : ""}`,
    ),
    "",
    s.actionLabel,
    s.action,
    "",
    s.closing,
    "",
    s.yours,
    "",
    ...s.sign,
    "",
    s.encl,
    s.copyLabel,
    ...s.copies,
  ];
  return lines.join("\n");
}

/** Words the note must never contain, in any language (see CLAUDE.md wording rule). */
export const BANNED = /fraud|corrupt|theft|steal|भ्रष्टाचार|घोटाळा|चोरी|फसवणूक|धोकाधडी/i;

export function validNote(n: unknown, woId: string): n is NoteText {
  if (!n || typeof n !== "object") return false;
  const o = n as Record<string, unknown>;
  const s = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  if (!s(o.subject) || !s(o.intro) || !s(o.ground) || !s(o.action)) return false;
  if (!Array.isArray(o.ref) || o.ref.length < 1 || !o.ref.every(s)) return false;
  const all = [o.subject, o.intro, o.ground, o.action, ...o.ref].join(" ");
  return all.includes(woId) && !BANNED.test(all);
}
