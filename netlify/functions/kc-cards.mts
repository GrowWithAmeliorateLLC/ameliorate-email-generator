// GET /api/kc/cards?loc=cypress — upcoming event cards from the location's ClickUp list.
// Returns every task due in the next ~75 days that carries a MyStudio link in its Text field,
// plus the parent cards they sit under (e.g. "NOV 3 CAMPS"), so the page can group them.
// Each card also gets start/end time and price from the studio's public MyStudio event feed.
import {
  LOCATIONS, F_TEXT, F_CONTENT, clickupToken, checkPass, cu, fieldValue, json, parseMyStudio, mystudioEvents,
} from "./_kc.js";

export default async (req: Request) => {
  const denied = checkPass(req);
  if (denied) return denied;
  const token = clickupToken();
  if (!token) return json({ error: "No ClickUp token on this Netlify site yet." }, 503);

  const loc = LOCATIONS[new URL(req.url).searchParams.get("loc") || ""];
  if (!loc) return json({ error: "Unknown location." }, 400);

  const now = Date.now();
  const base = new URLSearchParams({
    subtasks: "true",
    include_closed: "false",
    due_date_gt: String(now - 2 * 86400e3),
    due_date_lt: String(now + 75 * 86400e3),
    order_by: "due_date",
    reverse: "true",
  });

  const tasks: any[] = [];
  try {
    for (let page = 0; page < 4; page++) {
      base.set("page", String(page));
      const j = await cu(`/list/${loc.list}/task?${base}`, token);
      const batch = Array.isArray(j?.tasks) ? j.tasks : [];
      tasks.push(...batch);
      if (batch.length < 100) break;
    }
  } catch (e: any) {
    return json({ error: String(e.message || e) }, 502);
  }

  const byId = new Map(tasks.map((t) => [t.id, t]));
  const events = tasks
    .map((t) => ({
      id: t.id,
      name: t.name,
      parent: t.parent || null,
      due: t.due_date ? Number(t.due_date) : null,
      link: fieldValue(t, F_TEXT).trim(),
      content: fieldValue(t, F_CONTENT),
      status: t.status?.status || "",
      url: t.url,
    }))
    .filter((e) => !!parseMyStudio(e.link));

  // The studio's MyStudio company id = the one most of its own event links use.
  // Cards pointing at a different company (copy/paste slips) are dropped.
  const counts: Record<string, number> = {};
  for (const e of events) { const c = parseMyStudio(e.link)!.company; counts[c] = (counts[c] || 0) + 1; }
  const company = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const mine = events.filter((e) => parseMyStudio(e.link)!.company === company);

  // Times + price from MyStudio. If MyStudio is unreachable, the page falls back to manual entry.
  let ms: Record<string, any> = {};
  let mystudio: { ok: boolean; error?: string; company: string | null } = { ok: false, company };
  if (company) {
    try { ms = await mystudioEvents(company); mystudio = { ok: true, company }; }
    catch (e: any) { mystudio = { ok: false, company, error: String(e.message || e) }; }
  }
  const withTimes = mine.map((e) => ({ ...e, ms: ms[parseMyStudio(e.link)!.event] || null }));

  // Parent cards the events sit under (looked up if they fell outside the date window).
  const parentIds = [...new Set(withTimes.map((e) => e.parent).filter(Boolean))] as string[];
  const parents: Record<string, { id: string; name: string; url: string }> = {};
  for (const pid of parentIds.slice(0, 20)) {
    let p = byId.get(pid);
    if (!p) {
      try { p = await cu(`/task/${pid}`, token); } catch { p = null; }
    }
    if (p) parents[pid] = { id: p.id, name: p.name, url: p.url };
  }

  withTimes.sort((a, b) => (a.due || 0) - (b.due || 0));
  return json({ location: loc.id, list: loc.list, events: withTimes, parents, mystudio });
};

export const config = { path: "/api/kc/cards" };
