// Anchor — realistic dummy data.

const FAVI = {
  github: { bg: "#24292f", fg: "#fff", t: "GH" },
  vercel: { bg: "#000", fg: "#fff", t: "▲" },
  linear: { bg: "#5e6ad2", fg: "#fff", t: "L" },
  figma: { bg: "#2c2c2c", fg: "#ff7262", t: "F" },
  notion: { bg: "#fff", fg: "#000", t: "N" },
  stripe: { bg: "#635bff", fg: "#fff", t: "S" },
  chatgpt: { bg: "#10a37f", fg: "#fff", t: "AI" },
  mdn: { bg: "#000", fg: "#fff", t: "M" },
  amazon: { bg: "#232f3e", fg: "#ff9900", t: "a" },
  digitec: { bg: "#0f80c1", fg: "#fff", t: "d" },
  galaxus: { bg: "#1f2937", fg: "#4ade80", t: "G" },
  migros: { bg: "#ff6600", fg: "#fff", t: "M" },
  axa: { bg: "#00008f", fg: "#fff", t: "AXA" },
  swica: { bg: "#e2001a", fg: "#fff", t: "S" },
  ch: { bg: "#d8232a", fg: "#fff", t: "🇨🇭" },
  comparis: { bg: "#1a2e5a", fg: "#fff", t: "c" },
  gmail: { bg: "#fff", fg: "#ea4335", t: "M" },
  slack: { bg: "#4a154b", fg: "#fff", t: "#" },
  jira: { bg: "#0052cc", fg: "#fff", t: "J" },
  calendar: { bg: "#1a73e8", fg: "#fff", t: "31" },
};

const BUNDLES = [
  {
    id: "dev", name: "Daily Dev", color: "#2563eb", count: 6,
    links: [
      { id: "l1", label: "GitHub — anchor-app", url: "github.com/anchor/anchor-app", fav: "github" },
      { id: "l2", label: "Linear — Sprint 24", url: "linear.app/anchor/team/ENG", fav: "linear" },
      { id: "l3", label: "Vercel Dashboard", url: "vercel.com/anchor/anchor-app", fav: "vercel" },
      { id: "l4", label: "Figma — Anchor UI", url: "figma.com/file/anchor-ui", fav: "figma" },
      { id: "l5", label: "MDN Web Docs", url: "developer.mozilla.org", fav: "mdn" },
      { id: "l6", label: "ChatGPT", url: "chatgpt.com", fav: "chatgpt" },
    ],
  },
  {
    id: "shop", name: "Shopping", color: "#22c55e", count: 5,
    links: [
      { id: "s1", label: "Digitec", url: "digitec.ch", fav: "digitec" },
      { id: "s2", label: "Galaxus", url: "galaxus.ch", fav: "galaxus" },
      { id: "s3", label: "Amazon.de", url: "amazon.de", fav: "amazon" },
      { id: "s4", label: "Migros Online", url: "migros.ch", fav: "migros" },
      { id: "s5", label: "Comparis", url: "comparis.ch", fav: "comparis" },
    ],
  },
  {
    id: "ins", name: "Insurance Work", color: "#f59e0b", count: 4,
    links: [
      { id: "i1", label: "AXA Portal", url: "axa.ch/myaxa", fav: "axa" },
      { id: "i2", label: "SWICA Login", url: "swica.ch/login", fav: "swica" },
      { id: "i3", label: "ch.ch — Insurance", url: "ch.ch/en/insurance", fav: "ch" },
      { id: "i4", label: "Comparis Krankenkasse", url: "comparis.ch/krankenkassen", fav: "comparis" },
    ],
  },
  {
    id: "work", name: "Work Tools", color: "#a855f7", count: 5,
    links: [
      { id: "w1", label: "Gmail", url: "mail.google.com", fav: "gmail" },
      { id: "w2", label: "Slack — #design", url: "anchor.slack.com", fav: "slack" },
      { id: "w3", label: "Jira Board", url: "anchor.atlassian.net", fav: "jira" },
      { id: "w4", label: "Notion Wiki", url: "notion.so/anchor", fav: "notion" },
      { id: "w5", label: "Google Calendar", url: "calendar.google.com", fav: "calendar" },
    ],
  },
  {
    id: "fin", name: "Finance", color: "#ec4899", count: 3,
    links: [
      { id: "f1", label: "Stripe Dashboard", url: "dashboard.stripe.com", fav: "stripe" },
    ],
  },
];

const FOLDERS = [
  {
    id: "work", name: "Work", open: true, children: [
      { id: "meetings", name: "Meetings", open: false, notes: 4 },
      { id: "specs", name: "Specs", open: false, notes: 7 },
    ],
    notes: ["n1", "n2", "n3"],
  },
  { id: "personal", name: "Personal", open: false, notes: ["n4"] },
  { id: "ideas", name: "Ideas", open: false, notes: ["n5", "n6"] },
];

const NOTES = [
  { id: "n1", title: "Q3 Roadmap Planning", preview: "Priorities: embedded browser GA, snippet sync, profile-level encryption. Ship calc widget by…", date: "2:14 PM", pinned: true, folder: "Work" },
  { id: "n2", title: "Sync architecture notes", preview: "Supabase realtime channels keyed per-profile. Conflict resolution uses last-write-wins with a…", date: "Yesterday", pinned: false, folder: "Work" },
  { id: "n3", title: "1:1 with Mara", preview: "Talked through the snippet manager UX. She wants multi-field addresses to copy individually…", date: "Mon", pinned: false, folder: "Work" },
  { id: "n4", title: "Apartment checklist", preview: "Notice period 3 months. Handover photos. Cancel internet (Init7). Update address at post.ch…", date: "May 24", pinned: false, folder: "Personal" },
  { id: "n5", title: "App name ideas", preview: "Anchor, Harbor, Tether, Keel, Mooring. Anchor wins — calm, grounded, single syllable…", date: "May 20", pinned: false, folder: "Ideas" },
  { id: "n6", title: "Reading list", preview: "Shape Up (Basecamp), The Design of Everyday Things, Refactoring UI, A Philosophy of Software…", date: "May 12", pinned: false, folder: "Ideas" },
];

const ACTIVE_NOTE_BODY = {
  title: "Q3 Roadmap Planning",
  paragraphs: [
    { type: "h2", text: "Themes for Q3" },
    { type: "p", text: "Three big bets this quarter. Everything else is maintenance or bug-fix. We keep the surface area small and ship things that feel finished." },
    { type: "bullets", items: [
      "Embedded browser → general availability with per-bundle session isolation",
      "Snippet sync across devices via Supabase realtime channels",
      "Profile-level encryption so Work and Private never share a keychain",
    ]},
    { type: "h2", text: "Open questions" },
    { type: "p", text: "Do we gate the calculator history behind a profile, or keep it global? Leaning global — it's stateless math, no privacy concern. Need Mara's call on the DeepL quota before we expose Improve in the editor toolbar by default." },
  ],
  words: 187,
};

const SNIPPETS = [
  {
    id: "addr1", type: "address", label: "Home Address", uses: 42,
    fields: [
      { k: "Name", v: "Lena Hofmann" },
      { k: "Street", v: "Bahnhofstrasse 42" },
      { k: "City", v: "8001 Zürich" },
      { k: "Country", v: "Switzerland" },
    ],
  },
  {
    id: "addr2", type: "address", label: "Work — AXA Office", uses: 11,
    fields: [
      { k: "Name", v: "Lena Hofmann" },
      { k: "Street", v: "General-Guisan-Strasse 40" },
      { k: "City", v: "8400 Winterthur" },
      { k: "Country", v: "Switzerland" },
    ],
  },
  { id: "c1", type: "custom", label: "IBAN — Personal", content: "CH93 0076 2011 6238 5295 7", uses: 28 },
  { id: "c2", type: "custom", label: "Support email signature", content: "Best regards,\nLena Hofmann\nAnchor — Product", uses: 6 },
  { id: "c3", type: "custom", label: "AHV Number", content: "756.1234.5678.97", uses: 19 },
  { id: "c4", type: "custom", label: "Wifi password — Home", content: "k9!Falcon-Ridge-2024", uses: 3 },
];

const SHORTCUTS = [
  { keys: ["⌘", "K"], label: "Command palette" },
  { keys: ["⌘", "1–6"], label: "Switch screen" },
  { keys: ["⌘", "N"], label: "New note" },
  { keys: ["⌘", "B"], label: "Bold (in editor)" },
  { keys: ["⌘", "⇧", "C"], label: "Copy snippet" },
  { keys: ["⌘", "O"], label: "Open all in bundle" },
  { keys: ["Esc"], label: "Close overlay" },
];

const PROFILES = [
  { id: "private", name: "Private", color: "#2563eb" },
  { id: "work", name: "Work", color: "#f59e0b" },
];

Object.assign(window, {
  FAVI, BUNDLES, FOLDERS, NOTES, ACTIVE_NOTE_BODY, SNIPPETS, SHORTCUTS, PROFILES,
});
