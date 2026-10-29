// Shared config + helpers for the KC Event Campaigns tool (/kc).
// No secrets live in this file. Keys come from Netlify env vars:
//   ANTHROPIC_API_KEY  — already used by generate-email
//   CLICKUP_API_TOKEN  — (CLICKUP_TOKEN / CLICKUP_API_KEY also accepted)
//   KC_APP_PASSCODE    — shared passcode Randi types in; the KC functions fail closed without it
//   KC_MODEL           — optional model override

export const RANDI_ID = 82087506;
export const F_TEXT = "93af8cc2-fa4a-4b54-b482-8451264eb4a2"; // subject line / caption
export const F_CONTENT = "354e29f0-fa22-471c-a538-00028bd41447"; // HTML / SMS body / image URL
// ClickUp workspace task types (custom_item_id): read off existing EMAIL/SOCIAL/SMS subtasks.
export const TYPE_IDS: Record<string, number> = { EMAIL: 1003, SOCIAL: 1004, SMS: 1006 };

export interface Location {
  id: string;
  name: string; // used in copy
  short: string;
  list: string; // ClickUp list id
  companyId: string; // MyStudio company id (in event links)
  page: string;
  facebook: string;
  instagram: string;
  email: string;
  hashtags: string;
  notes: string;
}

export const LOCATIONS: Record<string, Location> = {
  cypress: {
    id: "cypress",
    name: "Kidcreate Studio Cypress",
    short: "Cypress, TX",
    list: "901328357370",
    companyId: "17113",
    page: "https://www.kidcreate.com/locations/cypress",
    facebook: "https://www.facebook.com/KidcreateStudioCypressTX",
    instagram: "https://www.instagram.com/kidcreatestudio_cypresstx/",
    email: "cypresstx@kidcreatestudio.com",
    hashtags: "#KidcreateCypress #CypressTX #CypressKids #KidsArt #ThingsToDoCypress",
    notes: "Workshops, Kids Night Out and similar one-offs are drop-in activities.",
  },
  broomfield: {
    id: "broomfield",
    name: "Kidcreate Studio Broomfield",
    short: "Broomfield, CO",
    list: "901328279850",
    companyId: "17110",
    page: "https://www.kidcreate.com/locations/broomfield",
    facebook: "https://www.facebook.com/kidcreatestudiobroomfieldco/",
    instagram: "https://www.instagram.com/kidcreatestudio_broomfield/",
    email: "broomfieldco@kidcreatestudio.com",
    hashtags: "#KidcreateBroomfield #BroomfieldCO #DenverKids #KidsArt #ThingsToDoDenver",
    notes: "Competitive market; lean on local warmth.",
  },
  denver: {
    id: "denver",
    name: "Kidcreate Studio Denver South",
    short: "Denver South, CO",
    list: "901328259968",
    companyId: "17115",
    page: "https://www.kidcreate.com/locations/denver",
    facebook: "https://www.facebook.com/KidcreateStudioDenverCO",
    instagram: "https://www.instagram.com/kidcreatestudio_denverco",
    email: "denversouthco@kidcreatestudio.com",
    hashtags: "#KidcreateDenver #DenverKids #DenverMoms #KidsArt #ThingsToDoDenver",
    notes: 'Studio name in copy is "Kidcreate Studio Denver South".',
  },
};

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

// Fails closed: no passcode configured = nobody gets in.
export function checkPass(req: Request): Response | null {
  const pass = env("KC_APP_PASSCODE");
  if (!pass) return json({ error: "KC_APP_PASSCODE is not set on this Netlify site yet." }, 503);
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
