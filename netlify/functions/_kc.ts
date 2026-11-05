// Shared config + helpers for the KC Event Campaigns tool (/kc).
// No secrets live in this file. Keys come from Netlify env vars:
//   ANTHROPIC_API_KEY  — already used by generate-email
//   CLICKUP_API_TOKEN  — (CLICKUP_TOKEN / CLICKUP_API_KEY also accepted)
//   KC_APP_PASSCODE    — optional; if set, the KC functions require it
//   KC_MODEL           — optional model override
//
// Studio links below were read from each studio's kidcreate.com location page on 10/29/2026.
// The MyStudio company id is NOT stored here: kc-cards works it out from the studio's own
// event links, so a new studio only needs a row in LOCATIONS.

export const RANDI_ID = 82087506;
export const F_TEXT = "93af8cc2-fa4a-4b54-b482-8451264eb4a2"; // subject line / caption / MyStudio link on event cards
export const F_CONTENT = "354e29f0-fa22-471c-a538-00028bd41447"; // HTML / SMS body / image URL / event description
// ClickUp workspace task types (custom_item_id): read off existing EMAIL/SOCIAL/SMS subtasks.
export const TYPE_IDS: Record<string, number> = { EMAIL: 1003, SOCIAL: 1004, SMS: 1006 };

export interface Location {
  id: string;
  name: string; // studio name used in copy
  short: string; // dropdown label
  list: string; // ClickUp list id
  page: string;
  facebook: string;
  instagram: string;
  email: string;
  hashtags: string;
  notes: string; // rules Claude must follow for this studio
  socialOnly?: boolean; // Amy's rule: no email/SMS for this studio
  cadence?: { email: number; social: number; sms: number }; // days before the event, when the studio asked for its own schedule
}

const L = (
  id: string, name: string, short: string, list: string, slug: string,
  fb: string, ig: string, email: string, hashtags: string, notes = "", socialOnly = false,
): Location => ({
  id, name, short, list,
  page: `https://www.kidcreate.com/locations/${slug}`,
  facebook: `https://www.facebook.com/${fb}`,
  instagram: `https://www.instagram.com/${ig}`,
  email, hashtags, notes, socialOnly,
});

const LIST: Location[] = [
  L("aliso-viejo", "Kidcreate Studio Aliso Viejo", "Aliso Viejo, CA", "901328166478", "aliso-viejo",
    "KidcreateStudioAlisoViejoCA", "kidcreatestudio_alisoviejo/", "alisoviejoca@kidcreatestudio.com",
    "#KidcreateAlisoViejo #AlisoViejo #OrangeCountyKids #KidsArt #ThingsToDoOC"),
  L("austin", "Kidcreate Studio Northwest Austin", "Northwest Austin, TX", "901328353087", "austin",
    "KidcreateStudioNorthwestAustin", "kidcreatestudionorthwestaustin/", "northwestaustintx@kidcreatestudio.com",
    "#KidcreateAustin #AustinKids #AustinMoms #KidsArt #ThingsToDoAustin",
    "Lean into real skills and finished projects over vague 'fun' or 'confidence' language."),
  L("bethesda", "Kidcreate Studio Bethesda", "Bethesda, MD", "901328111069", "bethesda",
    "KidcreateStudioBethesdaMD", "kidcreatestudio_bethesda", "bethesdamd@kidcreatestudio.com",
    "#KidcreateBethesda #BethesdaMD #BethesdaMoms #KidsArt #ThingsToDoBethesda",
    "PRE-OPEN for weekly Kidcreate Academy classes, but in-studio events have live registration. Say 'registration is open' for the event; never say the studio is fully open or that weekly classes can be booked now. Warm, anticipation-toned."),
  L("bloomfield", "Kidcreate Studio Bloomfield", "Bloomfield, MI", "901328364730", "bloomfield",
    "KidcreateStudioBloomfieldMI", "kidcreate_bloomfield/", "bloomfieldmi@kidcreatestudio.com",
    "#KidcreateBloomfield #BloomfieldMI #MetroDetroitKids #KidsArt #DetroitMoms"),
  L("broomfield", "Kidcreate Studio Broomfield", "Broomfield, CO", "901328279850", "broomfield",
    "kidcreatestudiobroomfieldco/", "kidcreatestudio_broomfield/", "broomfieldco@kidcreatestudio.com",
    "#KidcreateBroomfield #BroomfieldCO #DenverKids #KidsArt #ThingsToDoDenver",
    "Competitive market; lean on local warmth."),
  L("brownsville", "Kidcreate Studio Brownsville", "Brownsville, TX", "901328289985", "brownsville",
    "KidcreateStudioBrownsvilleTX", "kidcreatestudio_brownsvilletx/", "brownsvilletx@kidcreatestudio.com",
    "#KidcreateBrownsville #BrownsvilleTX #RGVKids #KidsArt #ThingsToDoRGV"),
  L("cumming", "Kidcreate Studio Cumming", "Cumming, GA", "901328028350", "cumming",
    "KidcreateStudioCummingGA", "kidcreatestudio_cummingga/", "cummingga@kidcreatestudio.com",
    "#KidcreateCumming #CummingGA #ForsythCounty #KidsArt #HomeschoolGA",
    "Forsyth County families: affluent, big homeschool and enrichment crowd. Enrichment angle lands well."),
  L("cypress", "Kidcreate Studio Cypress", "Cypress, TX", "901328357370", "cypress",
    "KidcreateStudioCypressTX", "kidcreatestudio_cypresstx/", "cypresstx@kidcreatestudio.com",
    "#KidcreateCypress #CypressTX #CypressKids #KidsArt #ThingsToDoCypress",
    "Workshops, Kids Night Out and similar one-offs are drop-in activities."),
  L("dana-point", "Kidcreate Studio Dana Point", "Dana Point, CA", "901328166386", "dana-point",
    "KidcreateStudioDanaPointCA/", "kidcreatestudio_danapoint/", "danapointca@kidcreatestudio.com",
    "#KidcreateDanaPoint #DanaPoint #OrangeCountyKids #KidsArt #ThingsToDoOC"),
  L("denver", "Kidcreate Studio Denver South", "Denver South, CO", "901328259968", "denver",
    "KidcreateStudioDenverCO", "kidcreatestudio_denverco", "denversouthco@kidcreatestudio.com",
    "#KidcreateDenver #DenverKids #DenverMoms #KidsArt #ThingsToDoDenver",
    'Studio name in copy is "Kidcreate Studio Denver South".'),
  L("eden-prairie", "Kidcreate Studio Eden Prairie", "Eden Prairie, MN", "901328214448", "eden-prairie",
    "KidcreateStudioEdenPrairieMN/", "kidcreatestudio_edenprairiemn/", "edenprairiemn@kidcreatestudio.com",
    "#KidcreateEdenPrairie #EdenPrairie #TwinCitiesMoms #KidsArt #ThingsToDoMN",
    "Flagship studio, open about 19 years, with two dedicated Extreme Art rooms. Proof over hype."),
  L("frederick", "Kidcreate Studio Frederick", "Frederick, MD", "901328105462", "frederick",
    "KidcreateStudioFrederickMD/", "kidcreatestudio_frederickmd/", "frederickmd@kidcreatestudio.com",
    "#KidcreateFrederick #FrederickMD #FrederickMoms #KidsArt #ThingsToDoFrederick",
    "HARD RULE: no mention of Halloween or any holiday, ever (no Christmas, Thanksgiving, costumes, spooky, Santa). Describe seasonal events by their activity only (fall leaves, winter, cozy). If the event itself is holiday-themed, add a flag. No me-time angle; kindness-first, wholesome voice."),
  L("fresno", "Kidcreate Studio Fresno", "Fresno, CA", "901328249885", "fresno",
    "KidcreateStudioFresnoCA/", "kidcreatestudio_fresno", "fresnoca@kidcreatestudio.com",
    "#KidcreateFresno #FresnoCA #FresnoKids #KidsArt #ThingsToDoFresno",
    "", true),
  L("lakeview", "Kidcreate Studio Lakeview", "Lakeview (Chicago), IL", "901328249567", "lakeview",
    "KidcreateStudioLakeviewIL/", "kidcreatestudio_chicago/", "lakeviewil@kidcreatestudio.com",
    "#KidcreateLakeview #LakeviewChicago #ChicagoKids #KidsArt #ThingsToDoChicago"),
  L("miami", "Kidcreate Studio Miami", "Miami, FL", "901328168793", "miami",
    "KidcreateStudioMiamiFL", "kidcreatestudio_miami/", "northmiamifl@kidcreatestudio.com",
    "#KidcreateMiami #MiamiKids #MiamiMoms #KidsArt #ThingsToDoMiami",
    "Mobile-first studio. Only promote events that register through its MyStudio link."),
  L("newport-news", "Kidcreate Studio Newport News", "Newport News, VA", "901328254016", "newport-news",
    "KidcreateStudioNewportNewsVA/", "kidcreatestudio_newportnews/", "newportnewsva@kidcreatestudio.com",
    "#KidcreateNewportNews #NewportNews #HamptonRoadsKids #KidsArt #757Kids"),
  L("oak-park", "Kidcreate Studio Oak Park", "Oak Park, IL", "901328252707", "oak-park",
    "KidcreateStudioOakParkIL/", "kidcreatestudio_oakpark/", "oakparkil@kidcreatestudio.com",
    "#KidcreateOakPark #OakParkIL #ChicagoKids #KidsArt #ThingsToDoChicago"),
  L("san-antonio", "Kidcreate Studio San Antonio", "San Antonio, TX", "901328176414", "san-antonio",
    "KidcreateStudioSanAntonioTX/", "kidcreatestudio_sanantoniotx/", "sanantoniotx@kidcreatestudio.com",
    "#KidcreateSanAntonio #SanAntonioMoms #SATX #KidsArt #ThingsToDoSA",
    "Audience wants the kids, not the classes: real faces and real projects. Natural, never AI-sounding."),
  L("walnut-creek", "Kidcreate Studio Walnut Creek", "Walnut Creek, CA", "901329190031", "walnut-creek",
    "KidcreateStudioWalnutCreek", "kidcreatestudio_walnutcreekca/", "walnutcreekca@kidcreatestudio.com",
    "#KidcreateWalnutCreek #WalnutCreek #EastBayKids #KidsArt #ThingsToDoEastBay"),
  L("wixom", "Kidcreate Studio Wixom", "Wixom, MI", "901328195869", "wixom",
    "KidcreateStudioWixomMI", "Kidcreate_Studio_Wixom", "wixommi@kidcreatestudio.com",
    "#KidcreateWixom #WixomMI #DetroitMoms #MetroDetroitKids #KidsArt",
    "Fun, high-energy, personality-forward. The Extreme Art room is the studio's standout. Spell the brand 'Kidcreate' (never 'Kid Create')."),
  L("woodbury", "Kidcreate Studio Woodbury", "Woodbury, MN", "901328168294", "woodbury",
    "KidcreateStudioWoodburyMN/", "kidcreatestudio_woodburymn/", "woodburymn@kidcreatestudio.com",
    "#KidcreateWoodbury #WoodburyMN #TwinCitiesMoms #KidsArt #ThingsToDoWoodbury",
    "East-metro community voice. Never borrow Eden Prairie's language; different owner."),
];

// Studio-requested send schedules (days before the event). Everyone else uses the default rules on the page.
const CADENCE: Record<string, { email: number; social: number; sms: number }> = {
  lakeview: { email: 20, social: 14, sms: 6 }, // owner request, 11/2/2026
  "oak-park": { email: 20, social: 14, sms: 6 }, // owner request, 11/2/2026
};
for (const l of LIST) if (CADENCE[l.id]) l.cadence = CADENCE[l.id];

export const LOCATIONS: Record<string, Location> = Object.fromEntries(LIST.map((l) => [l.id, l]));

export function env(name: string): string | undefined {
  const g = (globalThis as any).Netlify?.env?.get?.(name);
  return g ?? process.env[name];
}

export function clickupToken(): string | undefined {
  return env("CLICKUP_API_TOKEN") || env("CLICKUP_TOKEN") || env("CLICKUP_API_KEY");
}

export const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

// Optional passcode: open by default (Amy's call, Oct 2026). If KC_APP_PASSCODE is ever set,
// every KC function starts requiring it.
export function checkPass(req: Request): Response | null {
  const pass = env("KC_APP_PASSCODE");
  if (!pass) return null;
  const got = req.headers.get("x-kc-pass") || "";
  if (got !== pass) return json({ error: "Wrong passcode." }, 401);
  return null;
}

export async function cu(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.clickup.com/api/v2${path}`, {
    ...init,
    headers: { Authorization: token, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) throw new Error(`ClickUp ${res.status}: ${String(text).slice(0, 300)}`);
  return body;
}

export function fieldValue(task: any, id: string): string {
  const f = (task.custom_fields || []).find((x: any) => x.id === id);
  return typeof f?.value === "string" ? f.value : "";
}

// MyStudio event links look like https://cp.mystudio.io/e/?=TOKEN/COMPANYID/EVENTID//STAMP
export function parseMyStudio(link: string): { company: string; event: string; token: string } | null {
  const m = /cp\.mystudio\.io\/e\/\?=([^/]+)\/(\d+)\/(\d+)\//i.exec(link || "");
  return m ? { token: m[1], company: m[2], event: m[3] } : null;
}

// "2026-11-03 13:00:00" -> "1:00 PM"
function clock(dt: string): string {
  const m = /\s(\d{2}):(\d{2})/.exec(dt || "");
  if (!m) return "";
  let h = +m[1];
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ap}`;
}
function money(cost: string): string {
  const n = Number(cost);
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "Free";
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

// Public MyStudio event feed (the same calls the studio's own event pages make).
// The list call returns only top-level events/groups; calling it again with a group's id returns
// that group's dated sessions. So: list, then fetch every top-level id in parallel.
// Returns event_id -> { start, end, price, date } for every dated event the studio has published.
async function msCall(company: string, eventId: string, token = ""): Promise<any> {
  const qs = new URLSearchParams({ companyid: company, page_from: "E", event_id: eventId });
  // With the link's token + detail flag, MyStudio also returns events hidden from the public list
  // (event_show_status "N"), which is what the event's own registration page does.
  if (token) { qs.set("company_uuid", token); qs.set("detail_url_flag", "Y"); }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`https://cp.mystudio.io/e/Api/eventList?${qs}`, {
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    });
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function mystudioEvents(company: string): Promise<Record<string, { start: string; end: string; price: string; date: string; group: string }>> {
  const top = await msCall(company, "");
  if (top?.status !== "Success" || !Array.isArray(top.msg)) throw new Error(`MyStudio said ${top?.status || "no data"}`);
  const ids = [...new Set(top.msg.map((e: any) => String(e.event_id || "")).filter(Boolean))].slice(0, 25) as string[];
  // MyStudio group titles are standard (e.g. "No School Day Camps & Classes", "Other Classes"); the page uses them to rank events.
  const titles: Record<string, string> = Object.fromEntries(top.msg.map((e: any) => [String(e.event_id || ""), String(e.event_title || "")]));
  const groups = await Promise.allSettled(ids.map((id) => msCall(company, id)));
  const out: Record<string, any> = {};
  let group = "";
  const walk = (o: any) => {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (o.event_id && /^\d{4}-\d{2}-\d{2} /.test(o.event_begin_dt || "") && !String(o.event_begin_dt).startsWith("0000")) {
      out[String(o.event_id)] = {
        start: clock(o.event_begin_dt),
        end: clock(o.event_end_dt),
        price: money(o.event_cost),
        date: String(o.event_begin_dt).slice(0, 10),
        group,
      };
    }
    for (const k of Object.keys(o)) if (o[k] && typeof o[k] === "object") walk(o[k]);
  };
  groups.forEach((g, i) => {
    if (g.status === "fulfilled" && g.value?.status === "Success") { group = titles[ids[i]] || ""; walk(g.value.msg); }
  });
  return out;
}


// Fallback for a card whose event isn't in the public feed (hidden in MyStudio, e.g. Lakeview's
// Gingerbread House party on 11/27/2026): look it up the way its own registration page does.
export async function mystudioLookup(company: string, token: string, eventId: string) {
  const j = await msCall(company, eventId, token);
  let hit: any = null;
  const walk = (o: any) => {
    if (hit || !o || typeof o !== "object") return;
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (String(o.event_id) === eventId && /^\d{4}-\d{2}-\d{2} /.test(o.event_begin_dt || "") && !String(o.event_begin_dt).startsWith("0000")) {
      hit = { start: clock(o.event_begin_dt), end: clock(o.event_end_dt), price: money(o.event_cost), date: String(o.event_begin_dt).slice(0, 10), group: "", hidden: o.event_show_status === "N" };
      return;
    }
    for (const k of Object.keys(o)) if (o[k] && typeof o[k] === "object") walk(o[k]);
  };
  walk(j?.msg);
  return hit;
}

// ---------- image suggestions from the kid-create bucket ----------
// Kidcreate's branded event graphics live in gs://kid-create/branded images/, named like
// "1134- Canvas   Clay Unit.png" or "3401-KC-Gabby s Dollhouse.png". The bucket listing is public.
let BUCKET: { at: number; names: string[] } | null = null;
async function brandedImages(): Promise<string[]> {
  if (BUCKET && Date.now() - BUCKET.at < 30 * 60e3) return BUCKET.names;
  const names: string[] = [];
  // Event graphics live in "branded images/"; a few newer ones (e.g. Cat in the Hat) are in "Graphics/".
  // "projects/" holds real project photos named by unit ("Bag Charms_TrendTastic - Studio Photo.JPG"), used as extra images.
  for (const prefix of ["branded images/", "Graphics/", "projects/"]) {
    let tok = "";
    for (let i = 0; i < 5; i++) {
      const u = `https://storage.googleapis.com/storage/v1/b/kid-create/o?prefix=${encodeURIComponent(prefix)}&maxResults=1000&fields=nextPageToken,items(name)${tok ? `&pageToken=${tok}` : ""}`;
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 5000);
      try {
        const j: any = await (await fetch(u, { signal: ctrl.signal })).json();
        names.push(...(j.items || []).map((x: any) => x.name));
        tok = j.nextPageToken || "";
      } finally { clearTimeout(t); }
      if (!tok) break;
    }
  }
  BUCKET = { at: Date.now(), names };
  return names;
}
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
// Program prefixes that the graphic's file name often leaves off ("Kids Night Out: Cat in the Hat" → "Cat in the Hat").
const PRE = /^(parentstimeoff|kidsextremenightout|kidsnightout|homeschool|parentandme|parentme|familyfunnight)/;
function fileKey(n: string) {
  let b = n.split("/").pop() || "";
  b = b.replace(/\.(png|jpe?g|webp)$/i, "");
  b = b.replace(/^(\d\s+\d\s+)?(\d+|tbd)\s*-\s*(kc-|ks-|eas\s*-\s*)?/i, "");
  b = b.replace(/\b(unit|branded image|instagram|\(\d\))\b/gi, "");
  return norm(b);
}
const bucketUrl = (n: string) => `https://storage.googleapis.com/kid-create/${n.split("/").map(encodeURIComponent).join("/")}`;
// Best-guess branded graphic for each event name ("" when nothing fits). Randi can still change it.
export async function suggestImages(eventNames: string[]): Promise<Record<string, string>> {
  const sets = await suggestImageSets(eventNames);
  return Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, v[0] || ""]));
}
// Every bucket graphic that matches each event name, best first (max 6). The week calendar uses
// the extras so a camp that shows up on more than one card doesn't repeat the same picture.
export async function suggestImageSets(eventNames: string[]): Promise<Record<string, string[]>> {
  let files: string[] = [];
  try { files = (await brandedImages()).filter((f) => /\.(png|jpe?g)$/i.test(f)); } catch { return {}; }
  const isPhoto = (f: string) => f.startsWith("projects/");
  const keyed = files.filter((f) => !isPhoto(f)).map((f) => ({ f, k: fileKey(f) })).filter((x) => x.k.length >= 4);
  const photos = files.filter(isPhoto).map((f) => ({ f, k: norm(f.slice(9).replace(/\.(png|jpe?g)$/i, "")) }));
  const out: Record<string, string[]> = {};
  for (const name of eventNames) {
    const c = name.replace(/^\([^)]*\)\s*/, "").replace(/\s+copy$/i, "").trim();
    const base = [norm(c), norm(c.replace(/\band\b/gi, ""))];
    const alts = [...new Set([...base, ...base.map((a) => a.replace(PRE, ""))])].filter((a) => a.length >= 5);
    const hits: { score: number[]; f: string }[] = [];
    for (const { f, k } of keyed) {
      let sc = 0;
      // Exact name match, or the file name contains the whole (long enough) event name,
      // e.g. "3293 - Kidscientific - Fizzy Fairy Potions". Short names must match exactly, so
      // "Slime Lab" doesn't grab the Tie Dye Slime Lab graphic.
      for (const kk of new Set([k, k.replace(PRE, "")])) for (const a of alts) {
        if (kk === a) sc = Math.max(sc, 3);
        else if (a.length >= 10 && kk.includes(a)) sc = Math.max(sc, 2);
      }
      if (!sc) continue;
      const pen = (/instagram/i.test(f) ? 2 : 0) + (/^branded images\/\d\s+\d\s/.test(f) ? 1 : 0) + (f.includes("(") ? 1 : 0);
      hits.push({ score: [sc, -pen, -f.length], f });
    }
    hits.sort((a, b) => (b.score[0] - a.score[0]) || (b.score[1] - a.score[1]) || (b.score[2] - a.score[2]));
    // The best branded graphic, then real project photos of that unit (other branded files are the same design re-cropped).
    // Photos need a long-enough name inside the file name, so "Clay" alone doesn't pull every clay photo.
    const pics = photos.filter((p) => alts.some((a) => a.length >= 8 && p.k.includes(a)))
      .sort((a, b) => (/supply|material|detail/i.test(a.f) ? 1 : 0) - (/supply|material|detail/i.test(b.f) ? 1 : 0) || a.f.length - b.f.length);
    out[name] = [...new Set([...hits.slice(0, 1), ...pics].map((h) => bucketUrl(h.f)))].slice(0, 6);
  }
  return out;
}
