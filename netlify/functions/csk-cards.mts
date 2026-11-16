// GET /api/csk/cards?loc=charlotte-south — upcoming camp cards from the location's ClickUp list.
// A camp card is any task whose Text field holds a /summer-camps/ page link. Its Content field holds
// the description plus "Dates / Location / Ages / Price / Register" lines (cards built 11/16/2026).
// Each card is then checked against ACTIVE (the registration system) for live price and spots.
// Also returns the date of the newest EMAIL task, so the page can keep one email every 5 days.
import { CSK_LOCATIONS } from "./_csk.js";
import { F_TEXT, F_CONTENT, clickupToken, checkPass, cu, fieldValue, json } from "./_kc.js";

const norm = (s: string) => s.toLowerCase().replace(/pok[eé]mon/g, "pokemon").replace(/[^a-z0-9]/g, "");
const pad = (n: number) => String(n).padStart(2, "0");

function parseContent(c: string) {
  const out: Record<string, string> = { description: "", dates: "", location: "", ages: "", price: "", register: "" };
  const [desc, ...rest] = (c || "").split(/\n\s*\n/);
  out.description = (desc || "").trim();
  for (const line of rest.join("\n").split("\n")) {
    const m = /^\s*(Dates|Location|Ages|Price|Register)\s*:\s*(.+)$/i.exec(line);
    if (m) out[m[1].toLowerCase()] = m[2].trim();
  }
  return out;
}

// ACTIVE's public session list for a season (the same call its registration page makes), 10 per page.
async function activeSessions(season: string) {
  const all: any[] = [];
  for (let page = 1; page <= 10; page++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    try {
      const res = await fetch(`https://campscui.active.com/external/json/seasons/${season}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ sessionId: null, locationIds: [], ages: [], instructorIds: [], endDate: "", startDate: "", gender: [], grades: [], endTime: null, startTime: null, types: [], subTypes: [], sessionMode: [], page }),
        signal: ctrl.signal,
      });
      const j: any = await res.json();
      const batch = Array.isArray(j?.sessions) ? j.sessions : [];
      all.push(...batch);
      if (!batch.length || all.length >= (j.count || 0)) break;
    } finally { clearTimeout(t); }
  }
  return all.map((s) => {
    const t = (s.tuitions || [])[0] || {};
    const eb = t.earlyBirdDateTime;
    const ages = (s.restrictions || []).filter((r: any) => r.type === "AGE").map((r: any) => `${r.min}-${r.max}`).join(", ");
    return {
      id: String(s.id), name: String(s.name || ""),
      start: `${s.startDate.year}-${pad(s.startDate.month)}-${pad(s.startDate.day)}`,
      location: s.location?.name || "", ages,
      price: t.price ?? null, earlyBird: t.earlyBirdPrice ?? null,
      earlyBirdEnds: eb ? `${eb.year}-${pad(eb.month)}-${pad(eb.day)}` : "",
      spotsLeft: s.enableRemainCapacityVisibility ? (s.remainCapacity ?? null) : null,
      open: s.registrationEnabled !== false,
    };
  });
}

export default async (req: Request) => {
  const denied = checkPass(req);
  if (denied) return denied;
  const token = clickupToken();
  if (!token) return json({ error: "No ClickUp token on this Netlify site yet." }, 503);
  const loc = CSK_LOCATIONS[new URL(req.url).searchParams.get("loc") || ""];
  if (!loc) return json({ error: "Unknown location." }, 400);

  const now = Date.now();
  const tasks: any[] = [];
  try {
    const q = new URLSearchParams({ subtasks: "true", include_closed: "true", order_by: "due_date", reverse: "true" });
    for (let page = 0; page < 6; page++) {
      q.set("page", String(page));
      const j = await cu(`/list/${loc.list}/task?${q}`, token);
      const batch = Array.isArray(j?.tasks) ? j.tasks : [];
      tasks.push(...batch);
      if (batch.length < 100) break;
    }
  } catch (e: any) {
    return json({ error: String(e.message || e) }, 502);
  }

  // Newest EMAIL task (sent or scheduled), for the 5-day cadence.
  const emailDues = tasks.filter((t) => String(t.name || "").trim().toUpperCase() === "EMAIL" && t.due_date).map((t) => Number(t.due_date));
  const recent = emailDues.filter((d) => d <= now + 60 * 86400e3);
  const lastEmail = recent.length ? Math.max(...recent) : null;

  const camps = tasks
    .filter((t) => !t.parent && t.due_date && Number(t.due_date) > now - 2 * 86400e3 && t.status?.type !== "closed")
    .map((t) => ({ t, link: fieldValue(t, F_TEXT).trim() }))
    .filter(({ link }) => /clubscikidz\.com\/summer-camps\//i.test(link))
    .map(({ t, link }) => {
      const p = parseContent(fieldValue(t, F_CONTENT));
      return { id: t.id, name: t.name, due: Number(t.due_date), url: t.url, link, ...p };
    })
    .sort((a, b) => a.due - b.due);

  // Live check against ACTIVE. If ACTIVE can't be reached, the page shows the card values as-is.
  let active: { ok: boolean; error?: string } = { ok: false };
  let sessions: any[] = [];
  try { sessions = await activeSessions(loc.season); active = { ok: sessions.length > 0 }; }
  catch (e: any) { active = { ok: false, error: String(e.message || e) }; }

  const out = camps.map((c) => {
    // Card due dates are stored at midnight ET; ET is behind UTC, so add 12h before reading the date.
    const dd = new Date(c.due + 12 * 3600e3);
    const ymd = `${dd.getUTCFullYear()}-${pad(dd.getUTCMonth() + 1)}-${pad(dd.getUTCDate())}`;
    const base = norm(c.name.replace(/^\d+\/\d+:\s*/, "").replace(/\s*\(.*$/, ""));
    const venue = /cross/i.test(c.name) ? "cross" : /john/i.test(c.name) ? "john" : "";
    const hit = sessions.find((s) => s.start === ymd && (norm(s.name) === base || norm(s.name).includes(base) || base.includes(norm(s.name)) ||
      norm(s.name).replace("vet", "veterinary") === base) && (!venue || norm(s.location).includes(venue)));
    return { ...c, start: ymd, active: hit || null };
  });

  return json({ location: loc.id, list: loc.list, camps: out, active, lastEmail, register: loc.register });
};

export const config = { path: "/api/csk/cards" };
