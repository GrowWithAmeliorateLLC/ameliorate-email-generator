// Shared config + helpers for the CN Event Campaigns tool (/cn).
// Same engine as /kc (env, ClickUp helpers, field ids and task types come from _kc.ts).
// Center footer details were collected from codeninjas.com and each center's Facebook page on 10/30/2026.
// Blank fields were not confirmable; the email footer simply leaves them out.

export { env, json, checkPass, cu, fieldValue, clickupToken, RANDI_ID, F_TEXT, F_CONTENT, TYPE_IDS } from "./_kc.js";

export interface CnLocation {
  id: string; name: string; short: string; list: string; country: string;
  page: string; address: string; phone: string; email: string; facebook: string; instagram: string;
  notes: string;
}

const LIST: CnLocation[] = [
  {"id": "AlisoViejo", "name": "Code Ninjas Aliso Viejo", "short": "Aliso Viejo, CA", "list": "901305652685", "country": "US", "page": "https://www.codeninjas.com/ca-aliso-viejo", "address": "27792 Aliso Creek Rd, Ste. B180, Aliso Viejo, CA 92656", "phone": "(949) 391-3855", "email": "alisoviejoca@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasAlisoViejo", "instagram": "https://www.instagram.com/codeninjasalisoviejo/", "notes": ""},
  {"id": "Barrhaven", "name": "Code Ninjas Barrhaven", "short": "Barrhaven, ON", "list": "901303339399", "country": "CA", "page": "https://www.codeninjas.com/barrhaven-on-ca", "address": "34 Highbury Park Drive, Unit 9C, Ottawa, ON K2J 5C6", "phone": "343-843-2033", "email": "barrhavenonca@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasBarrhaven", "instagram": "https://www.instagram.com/codeninjasbarrhaven/", "notes": "Canadian center: keep local terms from the card (e.g. PD Day, Pro-D Day) and the price exactly as given."},
  {"id": "BramptonWest", "name": "Code Ninjas Brampton West", "short": "Brampton West, ON", "list": "901306431330", "country": "CA", "page": "https://www.codeninjas.com/brampton-west-on-ca", "address": "665 Remembrance Rd, Unit E101-E102, Brampton, ON L7A 3W3", "phone": "(437) 244-5252", "email": "bramptonwestonca@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasBramptonWest", "instagram": "https://www.instagram.com/codeninjasbramptonwest/", "notes": "Canadian center: keep local terms from the card (e.g. PD Day, Pro-D Day) and the price exactly as given."},
  {"id": "Brookfield", "name": "Code Ninjas Brookfield", "short": "Brookfield, WI", "list": "901305436790", "country": "US", "page": "https://www.codeninjas.com/wi-brookfield", "address": "3815 N. Brookfield Rd, Suite 101, Brookfield, WI 53045", "phone": "(262) 649-3027", "email": "brookfieldwi@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasBrookfield", "instagram": "https://www.instagram.com/codeninjasbrookfield/", "notes": ""},
  {"id": "Broomfield", "name": "Code Ninjas Broomfield", "short": "Broomfield, CO", "list": "901326961049", "country": "US", "page": "https://www.codeninjas.com/co-broomfield", "address": "12920 Lowell Blvd, Unit A, Broomfield, CO 80020", "phone": "(303) 536-1318", "email": "broomfieldco@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasBroomfield", "instagram": "https://www.instagram.com/codeninjasbroomfield/", "notes": ""},
  {"id": "Burke", "name": "Code Ninjas Burke", "short": "Burke, VA", "list": "901305161289", "country": "US", "page": "https://www.codeninjas.com/va-burke", "address": "9249 Old Keene Mill Rd, Suite A, Burke, VA 22015", "phone": "(571) 310-1143", "email": "burkeva@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasBurke", "instagram": "https://www.instagram.com/codeninjasburke/", "notes": ""},
  {"id": "Clairemont", "name": "Code Ninjas Clairemont", "short": "Clairemont, CA", "list": "901327022604", "country": "US", "page": "https://www.codeninjas.com/ca-clairemont", "address": "4340 Genesee Ave., #105, San Diego, CA", "phone": "619-333-5543", "email": "", "facebook": "", "instagram": "", "notes": ""},
  {"id": "Draper", "name": "Code Ninjas Draper", "short": "Draper, UT", "list": "901306668363", "country": "US", "page": "https://www.codeninjas.com/ut-draper", "address": "153 West 12300 South, Units #5-6, Draper, UT 84020", "phone": "801-601-1908", "email": "draperut@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasDraper", "instagram": "", "notes": ""},
  {"id": "ElSegundo", "name": "Code Ninjas El Segundo", "short": "El Segundo, CA", "list": "901305775500", "country": "US", "page": "https://www.codeninjas.com/ca-elsegundo", "address": "710-B S. Allied Way, El Segundo, CA 90245", "phone": "(310) 616-3225", "email": "elsegundoca@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasElSegundo", "instagram": "https://www.instagram.com/codeninjas_es/", "notes": ""},
  {"id": "Evans", "name": "Code Ninjas Evans", "short": "Evans, GA", "list": "901305743437", "country": "US", "page": "https://www.codeninjas.com/ga-evans", "address": "1200 Town Park Lane, Suite 102, Evans, GA 30809", "phone": "706-842-6795", "email": "evansga@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasEvans", "instagram": "https://www.instagram.com/codeninjasevans/", "notes": ""},
  {"id": "FranklinWI", "name": "Code Ninjas Franklin", "short": "Franklin, WI", "list": "901327769108", "country": "US", "page": "https://www.codeninjas.com/wi-franklin", "address": "6528 South Lovers Lane Rd, Franklin, WI 53132", "phone": "(414) 436-4673", "email": "", "facebook": "https://www.facebook.com/CodeNinjasFranklinWI", "instagram": "https://www.instagram.com/codeninjasfranklinwi/", "notes": "PRE-OPEN center (codeninjas.com shows 'coming soon / join the waitlist'). Promote the event's own registration, but never say the center is open for weekly programs; waitlist framing for anything beyond this event."},
  {"id": "Glendale", "name": "Code Ninjas Glendale", "short": "Glendale, AZ", "list": "901303398165", "country": "US", "page": "https://www.codeninjas.com/az-glendale", "address": "20329 N. 59th Ave, Suite 6A, Glendale, AZ 85308", "phone": "(602) 935-1423", "email": "", "facebook": "https://www.facebook.com/CodeNinjasGlendale", "instagram": "https://www.instagram.com/codeninjasglendale/", "notes": ""},
  {"id": "Halifax", "name": "Code Ninjas Halifax", "short": "Halifax, NS", "list": "901305519353", "country": "CA", "page": "https://www.codeninjas.com/halifax-ns-ca", "address": "998 Parkland Drive, Unit 1B, Halifax, NS B3M 0A6", "phone": "(902) 406-1908", "email": "halifaxnsca@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasHalifax", "instagram": "https://www.instagram.com/codeninjashalifax/", "notes": "Canadian center: keep local terms from the card (e.g. PD Day, Pro-D Day) and the price exactly as given."},
  {"id": "Holladay", "name": "Code Ninjas Holladay", "short": "Holladay, UT", "list": "901301905079", "country": "US", "page": "https://www.codeninjas.com/ut-holladay", "address": "1957 East Murray Holladay Road, Holladay, UT 84117", "phone": "(385) 463-4443", "email": "holladayut@codeninjas.com", "facebook": "https://www.facebook.com/codeninjasholladay", "instagram": "https://www.instagram.com/codeninjasholladay/", "notes": ""},
  {"id": "LaderaRanch", "name": "Code Ninjas Ladera Ranch", "short": "Ladera Ranch, CA", "list": "901305936192", "country": "US", "page": "https://www.codeninjas.com/ca-ladera-ranch", "address": "25652 Crown Valley Parkway, Suite F-1, Ladera Ranch, CA 92694", "phone": "(949) 229-2853", "email": "laderaranchca@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasLaderaRanch", "instagram": "https://www.instagram.com/codeninjasladeraranch/", "notes": ""},
  {"id": "Medfield", "name": "Code Ninjas Medfield", "short": "Medfield, MA", "list": "901315099194", "country": "US", "page": "https://www.codeninjas.com/ma-medfield", "address": "18 North Meadow Road, Medfield, MA 02052", "phone": "(508) 233-3528", "email": "medfieldma@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasMedfield", "instagram": "", "notes": ""},
  {"id": "MiraMesa", "name": "Code Ninjas Mira Mesa", "short": "Mira Mesa, CA", "list": "901309734932", "country": "US", "page": "https://www.codeninjas.com/ca-mira-mesa", "address": "9420 Mira Mesa Blvd, Suite E, San Diego, CA 92126", "phone": "(858) 879-9200", "email": "miramesaca@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasMiraMesa", "instagram": "", "notes": ""},
  {"id": "Newcastle", "name": "Code Ninjas Newcastle", "short": "Newcastle, WA", "list": "901326876061", "country": "US", "page": "https://www.codeninjas.com/wa-newcastle", "address": "13316 Newcastle Commons Dr, Newcastle, WA 98059", "phone": "(425) 659-2633", "email": "newcastlewa@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasNewcastle", "instagram": "https://www.instagram.com/codeninjasnewcastle/", "notes": ""},
  {"id": "NewportBeach", "name": "Code Ninjas Newport Beach", "short": "Newport Beach, CA", "list": "901302049407", "country": "US", "page": "https://www.codeninjas.com/ca-newport-beach", "address": "1835 Newport Blvd, Suite D-252, Costa Mesa, CA 92627", "phone": "(949) 287-6433", "email": "newportbeachca@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasNewportBeach", "instagram": "https://www.instagram.com/codeninjasnewportbeach/", "notes": ""},
  {"id": "Oviedo", "name": "Code Ninjas Oviedo", "short": "Oviedo, FL", "list": "901308855437", "country": "US", "page": "https://www.codeninjas.com/fl-oviedo", "address": "44 Lawton Ave, Oviedo, FL 32765", "phone": "407-542-9616", "email": "", "facebook": "https://www.facebook.com/code.ninjas.oviedo", "instagram": "https://www.instagram.com/codeninjasoviedo/", "notes": ""},
  {"id": "PalmHarbor", "name": "Code Ninjas Palm Harbor", "short": "Palm Harbor, FL", "list": "1400720000002080", "country": "US", "page": "https://www.codeninjas.com/fl-palmharbor", "address": "33659 US Hwy 19 N, Palm Harbor, FL 34684", "phone": "", "email": "", "facebook": "", "instagram": "https://www.instagram.com/codeninjaspalmharbor/", "notes": "PRE-OPEN center (codeninjas.com shows 'coming soon / join the waitlist'). Promote the event's own registration, but never say the center is open for weekly programs; waitlist framing for anything beyond this event."},
  {"id": "PalosVerdes", "name": "Code Ninjas Palos Verdes", "short": "Palos Verdes, CA", "list": "901305828126", "country": "US", "page": "https://www.codeninjas.com/ca-palos-verdes", "address": "60 Peninsula Center, Rolling Hills Estates, CA 90274", "phone": "(424) 903-0355", "email": "palosverdesca@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasPalosVerdes", "instagram": "https://www.instagram.com/codeninjaspalosverdes/", "notes": ""},
  {"id": "PortCredit", "name": "Code Ninjas Port Credit", "short": "Port Credit, ON", "list": "901305763446", "country": "CA", "page": "https://www.codeninjas.com/port-credit-on-ca", "address": "2090 Hurontario Street, Suite 200, Mississauga, ON L5B 1M8", "phone": "905-232-3040", "email": "portcreditonca@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasPortCredit", "instagram": "https://www.instagram.com/codeninjasportcredit/", "notes": "Canadian center: keep local terms from the card (e.g. PD Day, Pro-D Day) and the price exactly as given."},
  {"id": "Reno", "name": "Code Ninjas Reno", "short": "Reno, NV", "list": "901305677747", "country": "US", "page": "https://www.codeninjas.com/nv-reno", "address": "7111 S. Virginia Street, Suite A-13, Reno, NV 89511", "phone": "(775) 200-7000", "email": "renonv@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasReno", "instagram": "", "notes": ""},
  {"id": "RichmondHill", "name": "Code Ninjas Richmond Hill", "short": "Richmond Hill, ON", "list": "901303273176", "country": "CA", "page": "https://www.codeninjas.com/richmond-hill-on-ca", "address": "20 Vogell Rd, Suite A1, Richmond Hill, ON L4B 3L1", "phone": "(647) 693-9683", "email": "richmondhillonca@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasRichmondHill", "instagram": "https://www.instagram.com/codeninjasrichmondhill/", "notes": "Canadian center: keep local terms from the card (e.g. PD Day, Pro-D Day) and the price exactly as given."},
  {"id": "Riverstone", "name": "Code Ninjas Riverstone", "short": "Riverstone, TX", "list": "901306309910", "country": "US", "page": "https://www.codeninjas.com/tx-sugarland-riverstone", "address": "18318 University Blvd, Ste 100, Sugar Land, TX 77479", "phone": "(281) 456-3010", "email": "riverstonesugarlandtx@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasSugarLand", "instagram": "https://www.instagram.com/codeninjasriverstone/", "notes": ""},
  {"id": "TegaCay", "name": "Code Ninjas Tega Cay/Fort Mill", "short": "Tega Cay/Fort Mill, SC", "list": "901000966924", "country": "US", "page": "https://www.codeninjas.com/sc-fort-mill", "address": "1135 Stonecrest Blvd., Suite 105, Tega Cay, SC 29708", "phone": "(803) 620-3994", "email": "fortmillsc@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasFortMill", "instagram": "https://www.instagram.com/codeninjasfortmill/", "notes": ""},
  {"id": "Tucson", "name": "Code Ninjas Tucson", "short": "Tucson, AZ", "list": "901305468664", "country": "US", "page": "https://www.codeninjas.com/az-tucson", "address": "228 S. Tucson Blvd, Tucson, AZ 85716", "phone": "(520) 222-8196", "email": "tucsonaz@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasTucson", "instagram": "https://www.instagram.com/codeninjastucson/", "notes": ""},
  {"id": "WalthamNewton", "name": "Code Ninjas Waltham-Newton", "short": "Waltham-Newton, MA", "list": "901002229674", "country": "US", "page": "https://www.codeninjas.com/waltham-newton-ma", "address": "3 Crescent St, Waltham, MA 02453", "phone": "781-661-8250", "email": "walthamnewtonma@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasWalthamNewton", "instagram": "https://www.instagram.com/codeninjaswalthamnewton/", "notes": ""},
  {"id": "WaterfordLakes", "name": "Code Ninjas Waterford Lakes", "short": "Waterford Lakes, FL", "list": "901306061276", "country": "US", "page": "https://www.codeninjas.com/fl-orlando-waterford-lakes", "address": "12484 Lake Underhill Road, Orlando, FL 32828", "phone": "855-563-2633", "email": "waterfordlakesfl@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasWaterfordLakes", "instagram": "https://www.instagram.com/codeninjasorlando/", "notes": ""},
  {"id": "Westshore", "name": "Code Ninjas Westshore", "short": "Westshore, BC", "list": "901314456241", "country": "CA", "page": "https://www.codeninjas.com/westshore-bc-ca", "address": "890 Goldstream Avenue, Westshore, BC V9B 2X9", "phone": "(778) 265-2633", "email": "westshorebcca@codeninjas.com", "facebook": "https://www.facebook.com/CodeNinjasWestshore", "instagram": "https://www.instagram.com/codeninjaswestshore/", "notes": "Canadian center: keep local terms from the card (e.g. PD Day, Pro-D Day) and the price exactly as given."},
  {"id": "Woodbury", "name": "Code Ninjas Woodbury", "short": "Woodbury, MN", "list": "901327932904", "country": "US", "page": "https://www.codeninjas.com/mn-woodbury", "address": "Woodbury, MN", "phone": "", "email": "", "facebook": "", "instagram": "https://www.instagram.com/codeninjaswoodbury/", "notes": "PRE-OPEN center (codeninjas.com shows 'coming soon / join the waitlist'). Promote the event's own registration, but never say the center is open for weekly programs; waitlist framing for anything beyond this event."}
];

export const CN_LOCATIONS: Record<string, CnLocation> = Object.fromEntries(LIST.map((l) => [l.id, l]));

// CN registration runs on MyStudio too: https://cn.mystudio.io/e/?=SLUG/COMPANYID/EVENTID//STAMP
export function parseMyStudio(link: string): { host: string; company: string; event: string } | null {
  const m = /(cn|cp|members)\.(mystudio\.io|codeninjas\.com)\/e\/\?=[^/]+\/(\d+)\/(\d+)\//i.exec(link || "");
  if (!m) return null;
  const host = m[2].toLowerCase() === "mystudio.io" ? `${m[1].toLowerCase()}.mystudio.io` : "cn.mystudio.io";
  return { host, company: m[3], event: m[4] };
}

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

async function msCall(host: string, company: string, eventId: string): Promise<any> {
  const qs = new URLSearchParams({ companyid: company, page_from: "E", event_id: eventId });
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`https://${host}/e/Api/eventList?${qs}`, { headers: { Accept: "application/json" }, signal: ctrl.signal });
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// List the center's top-level events/groups, then fetch each group for its dated sessions.
export async function mystudioEvents(host: string, company: string): Promise<Record<string, { start: string; end: string; price: string; date: string }>> {
  const top = await msCall(host, company, "");
  if (top?.status !== "Success" || !Array.isArray(top.msg)) throw new Error(`MyStudio said ${top?.status || "no data"}`);
  const ids = [...new Set(top.msg.map((e: any) => String(e.event_id || "")).filter(Boolean))].slice(0, 25) as string[];
  const groups = await Promise.allSettled(ids.map((id) => msCall(host, company, id)));
  const out: Record<string, any> = {};
  const walk = (o: any) => {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (o.event_id && /^\d{4}-\d{2}-\d{2} /.test(o.event_begin_dt || "") && !String(o.event_begin_dt).startsWith("0000")) {
      out[String(o.event_id)] = { start: clock(o.event_begin_dt), end: clock(o.event_end_dt), price: money(o.event_cost), date: String(o.event_begin_dt).slice(0, 10) };
    }
    for (const k of Object.keys(o)) if (o[k] && typeof o[k] === "object") walk(o[k]);
  };
  for (const g of groups) if (g.status === "fulfilled" && g.value?.status === "Success") walk(g.value.msg);
  return out;
}
