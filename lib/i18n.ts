export type Lang = "en" | "mr" | "hi";
type Entry = { en: string; mr?: string; hi?: string };

/** Static labels only. Anything missing falls back to English. */
export const DICT = {
  skip: { en: "Skip to main content", mr: "मुख्य मजकुराकडे जा", hi: "मुख्य सामग्री पर जाएँ" },
  ledger: { en: "Monsoon road-repair ledger", mr: "पावसाळी रस्ते-दुरुस्ती खातेवही", hi: "मानसून सड़क-मरम्मत खाताबही" },
  viewAs: { en: "View as", mr: "असे पहा", hi: "इस रूप में देखें" },
  ward: { en: "Ward", mr: "वॉर्ड", hi: "वार्ड" },
  how: { en: "How we flag", mr: "आम्ही फ्लॅग कसे करतो", hi: "हम फ़्लैग कैसे करते हैं" },
  textSize: { en: "Text size", mr: "अक्षर आकार", hi: "अक्षर का आकार" },
  textSmaller: { en: "Smaller text", mr: "लहान अक्षरे", hi: "छोटे अक्षर" },
  textNormal: { en: "Normal text", mr: "सामान्य अक्षरे", hi: "सामान्य अक्षर" },
  textLarger: { en: "Larger text", mr: "मोठी अक्षरे", hi: "बड़े अक्षर" },
  language: { en: "Language", mr: "भाषा", hi: "भाषा" },
  "role.commissioner": { en: "Commissioner", mr: "आयुक्त", hi: "आयुक्त" },
  "role.ward": { en: "Ward officer", mr: "वॉर्ड अधिकारी", hi: "वार्ड अधिकारी" },
  "role.citizen": { en: "Citizen", mr: "नागरिक", hi: "नागरिक" },
  wardView: { en: "Ward officer view", mr: "वॉर्ड अधिकारी दृश्य", hi: "वार्ड अधिकारी दृश्य" },
  loading: { en: "Loading ward data…", mr: "वॉर्डची माहिती लोड होत आहे…", hi: "वार्ड का डेटा लोड हो रहा है…" },

  "head.a": { en: "{amount} needs review across {n} work orders.", mr: "{n} कामाच्या आदेशांमध्ये {amount} रकमेचा आढावा आवश्यक आहे.", hi: "{n} कार्य आदेशों में {amount} की समीक्षा आवश्यक है।" },
  "head.a1": { en: "{amount} needs review in 1 work order.", mr: "1 कामाच्या आदेशात {amount} रकमेचा आढावा आवश्यक आहे.", hi: "1 कार्य आदेश में {amount} की समीक्षा आवश्यक है।" },
  "head.start": { en: "Start with:", mr: "येथून सुरुवात करा:", hi: "यहाँ से शुरू करें:" },
  "head.twice": { en: "{k} bills possibly paid twice ({y})", mr: "{k} बिले कदाचित दोनदा दिली गेली ({y})", hi: "{k} बिल संभवतः दो बार चुकाए गए ({y})" },
  "head.twice1": { en: "1 bill possibly paid twice ({y})", mr: "1 बिल कदाचित दोनदा दिले गेले ({y})", hi: "1 बिल संभवतः दो बार चुकाया गया ({y})" },
  "head.other": { en: "{k} × {label} ({y})", mr: "{k} × {label} ({y})", hi: "{k} × {label} ({y})" },
  "head.none": { en: "Nothing in this ward needs review right now.", mr: "या वॉर्डात सध्या आढाव्यासाठी काही नाही.", hi: "इस वार्ड में अभी समीक्षा के लिए कुछ नहीं है।" },

  "kpi.budget": { en: "Budget", mr: "अंदाजपत्रक", hi: "बजट" },
  "kpi.spent": { en: "Spent", mr: "खर्च", hi: "खर्च" },
  "kpi.flagged": { en: "Flagged money", mr: "फ्लॅग केलेली रक्कम", hi: "फ़्लैग की गई राशि" },
  "kpi.failed": { en: "Failed fixes", mr: "अयशस्वी दुरुस्ती", hi: "विफल मरम्मत" },
  "kpi.spentSub": { en: "{p} of budget spent", mr: "अंदाजपत्रकाच्या {p} खर्च", hi: "बजट का {p} खर्च" },
  "kpi.over": { en: "over budget", mr: "अंदाजपत्रकापेक्षा जास्त", hi: "बजट से अधिक" },
  "kpi.flaggedSub": { en: "{n} work orders need review", mr: "{n} कामाचे आदेश आढाव्यासाठी", hi: "{n} कार्य आदेश समीक्षा के लिए" },
  "kpi.failedSub": { en: "Spent on repairs that re-opened", mr: "पुन्हा उघडलेल्या दुरुस्त्यांवर खर्च", hi: "दोबारा खुली मरम्मतों पर खर्च" },

  "sec.queue": { en: "Action queue: recover money", mr: "कृती यादी: रक्कम वसूल करा", hi: "कार्य सूची: राशि वसूलें" },
  "sec.next": { en: "Next rupee", mr: "पुढील रुपया", hi: "अगला रुपया" },
  "sec.contractors": { en: "Contractors in this ward", mr: "या वॉर्डातील कंत्राटदार", hi: "इस वार्ड के ठेकेदार" },
  remaining: { en: "Remaining", mr: "शिल्लक", hi: "शेष" },
  risk: { en: "Risk", mr: "जोखीम", hi: "जोखिम" },
  wardBudget: { en: "Ward budget", mr: "वॉर्ड अंदाजपत्रक", hi: "वार्ड बजट" },
  noFit: { en: "Doesn’t fit remaining budget", mr: "शिल्लक रकमेत बसत नाही", hi: "शेष राशि में नहीं बैठता" },
  overspent: { en: "Ward overspent by {x}: only ₹0 DLP fixes possible; request reallocation.", mr: "वॉर्डने {x} जास्त खर्च केले: फक्त ₹0 DLP दुरुस्त्या शक्य; निधी पुनर्वाटपाची विनंती करा.", hi: "वार्ड ने {x} अधिक खर्च किया: केवल ₹0 DLP मरम्मत संभव; पुनर्आवंटन का अनुरोध करें।" },

  "tab.DUPLICATE_BILL": { en: "Paid twice", mr: "दोनदा दिलेले", hi: "दो बार भुगतान" },
  "tab.OVERBILLED": { en: "Billed above rate card", mr: "दरपत्रकापेक्षा जास्त बिल", hi: "दर-सूची से अधिक बिल" },
  "tab.DLP_PAID": { en: "Paid during warranty", mr: "वॉरंटी काळात दिलेले", hi: "वारंटी अवधि में भुगतान" },
  "tab.DLP_REVIEW": { en: "Check: drainage on warranty road", mr: "तपासा: वॉरंटी रस्त्यावरील गटार काम", hi: "जाँचें: वारंटी वाली सड़क पर नाली का काम" },
  showAll: { en: "Show all {n}", mr: "सर्व {n} दाखवा", hi: "सभी {n} दिखाएँ" },
  showFewer: { en: "Show fewer", mr: "कमी दाखवा", hi: "कम दिखाएँ" },
  none: { en: "Nothing in this category.", mr: "या गटात काहीही नाही.", hi: "इस श्रेणी में कुछ नहीं है।" },

  "status.new": { en: "New", mr: "नवीन", hi: "नया" },
  "status.review": { en: "Under review", mr: "आढाव्यात", hi: "समीक्षा में" },
  "status.recovered": { en: "Recovered", mr: "वसूल", hi: "वसूल हुआ" },
  "status.dismissed": { en: "Dismissed", mr: "फेटाळले", hi: "खारिज" },
  statusLabel: { en: "Status", mr: "स्थिती", hi: "स्थिति" },
  startReview: { en: "Start review", mr: "आढावा सुरू करा", hi: "समीक्षा शुरू करें" },
  markRecovered: { en: "Mark recovered", mr: "वसूल म्हणून नोंदवा", hi: "वसूल हुआ चिह्नित करें" },
  dismiss: { en: "Dismiss…", mr: "फेटाळा…", hi: "खारिज करें…" },
  reopen: { en: "Reopen", mr: "पुन्हा उघडा", hi: "फिर से खोलें" },
  dismissReason: { en: "Reason for dismissing (required)", mr: "फेटाळण्याचे कारण (आवश्यक)", hi: "खारिज करने का कारण (आवश्यक)" },
  confirmDismiss: { en: "Confirm dismiss", mr: "फेटाळणे निश्चित करा", hi: "खारिज करना पक्का करें" },
  cancel: { en: "Cancel", mr: "रद्द करा", hi: "रद्द करें" },
  reasonShown: { en: "Reason", mr: "कारण", hi: "कारण" },

  "part.wrong": { en: "What’s wrong", mr: "काय चुकले आहे", hi: "क्या गड़बड़ है" },
  "part.why": { en: "Why it’s flagged", mr: "फ्लॅग का केला", hi: "फ़्लैग क्यों किया गया" },
  "part.next": { en: "What to do next", mr: "पुढे काय करावे", hi: "आगे क्या करें" },
  owner: { en: "Owner", mr: "जबाबदार", hi: "जिम्मेदार" },
  billed: { en: "Billed", mr: "बिल", hi: "बिल" },
  rateCard: { en: "Rate card", mr: "दरपत्रक", hi: "दर-सूची" },
  ratio: { en: "Billed vs rate card", mr: "बिल विरुद्ध दरपत्रक", hi: "बिल बनाम दर-सूची" },
  excess: { en: "Excess (needs review)", mr: "जादा रक्कम (आढावा आवश्यक)", hi: "अधिक राशि (समीक्षा आवश्यक)" },
  allFields: { en: "All fields", mr: "सर्व तपशील", hi: "सभी विवरण" },
  close: { en: "Close", mr: "बंद करा", hi: "बंद करें" },
  explain: { en: "Explain", mr: "स्पष्ट करा", hi: "समझाएँ" },
  explaining: { en: "Explaining…", mr: "स्पष्ट करत आहे…", hi: "समझा रहे हैं…" },

  "how.title": { en: "How we flag", mr: "आम्ही फ्लॅग कसे करतो", hi: "हम फ़्लैग कैसे करते हैं" },
  oneLine: { en: "A flag is a risk signal for review, not proof of wrongdoing.", mr: "फ्लॅग हा आढाव्यासाठीचा जोखीम-संकेत आहे, गैरव्यवहाराचा पुरावा नाही.", hi: "फ़्लैग समीक्षा के लिए एक जोखिम-संकेत है, गड़बड़ी का प्रमाण नहीं।" },
  "how.over": { en: "Billed above rate card", mr: "दरपत्रकापेक्षा जास्त बिल", hi: "दर-सूची से अधिक बिल" },
  "how.dup": { en: "Paid twice?", mr: "दोनदा दिले?", hi: "दो बार भुगतान?" },
  "how.dlp": { en: "Warranty (DLP) tiers", mr: "वॉरंटी (DLP) स्तर", hi: "वारंटी (DLP) स्तर" },
  "how.fair": { en: "Fairness check", mr: "निष्पक्षता तपासणी", hi: "निष्पक्षता जाँच" },
  "how.fairCaption": { en: "Re-open differences are not explained by heavy rain or flood-prone wards.", mr: "पुन्हा उघडण्यातील फरक जोरदार पाऊस किंवा पूरप्रवण वॉर्डांमुळे नाहीत.", hi: "दोबारा खुलने के अंतर का कारण भारी बारिश या बाढ़-प्रवण वार्ड नहीं हैं।" },

  footer: { en: "Synthetic dataset, Claude Impact Lab Mumbai. Flags are evidence for review, not verdicts.", mr: "सिंथेटिक डेटासेट, Claude Impact Lab मुंबई. फ्लॅग हे आढाव्यासाठीचे पुरावे आहेत, निवाडा नाही.", hi: "सिंथेटिक डेटासेट, Claude Impact Lab मुंबई। फ़्लैग समीक्षा के लिए साक्ष्य हैं, निर्णय नहीं।" },
} satisfies Record<string, Entry>;

export type Key = keyof typeof DICT;
export type Vars = Record<string, string | number>;

export function tr(lang: Lang, key: Key, vars?: Vars): string {
  const e: Entry = DICT[key];
  const s = e[lang] ?? e.en;
  return vars
    ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
    : s;
}
