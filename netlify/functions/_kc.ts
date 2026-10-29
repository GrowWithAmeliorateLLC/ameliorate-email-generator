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
export function parseMyStudio(link: string): { company: string; event: string } | null {
  const m = /cp\.mystudio\.io\/e\/\?=[^/]+\/(\d+)\/(\d+)\//i.exec(link || "");
  return m ? { company: m[1], event: m[2] } : null;
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
async function msCall(company: string, eventId: string): Promise<any> {
  const qs = new URLSearchParams({ companyid: company, page_from: "E", event_id: eventId });
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

export async function mystudioEvents(company: string): Promise<Record<string, { start: string; end: string; price: string; date: string }>> {
  const top = await msCall(company, "");
  if (top?.status !== "Success" || !Array.isArray(top.msg)) throw new Error(`MyStudio said ${top?.status || "no data"}`);
  const ids = [...new Set(top.msg.map((e: any) => String(e.event_id || "")).filter(Boolean))].slice(0, 25) as string[];
  const groups = await Promise.allSettled(ids.map((id) => msCall(company, id)));
  const out: Record<string, any> = {};
  const walk = (o: any) => {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (o.event_id && /^\d{4}-\d{2}-\d{2} /.test(o.event_begin_dt || "") && !String(o.event_begin_dt).startsWith("0000")) {
      out[String(o.event_id)] = {
        start: clock(o.event_begin_dt),
        end: clock(o.event_end_dt),
        price: money(o.event_cost),
        date: String(o.event_begin_dt).slice(0, 10),
      };
    }
    for (const k of Object.keys(o)) if (o[k] && typeof o[k] === "object") walk(o[k]);
  };
  for (const g of groups) if (g.status === "fulfilled" && g.value?.status === "Success") walk(g.value.msg);
  return out;
}
