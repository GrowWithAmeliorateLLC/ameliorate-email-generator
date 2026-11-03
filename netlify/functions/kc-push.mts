// POST /api/kc/push — creates EMAIL / SMS / SOCIAL subtasks under the event (or group) card,
// assigned to Randi. An existing SOCIAL subtask is updated instead of duplicated.
// Week calendar mode sends `socials: [{ parentId, caption, imageUrl, due }]` — one SOCIAL per
// promoted event, each under that event's own card, while EMAIL + SMS go under `parentId`.
import {
  LOCATIONS, RANDI_ID, F_TEXT, F_CONTENT, TYPE_IDS, clickupToken, checkPass, cu, json,
} from "./_kc.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Noon US Central lands on the intended calendar day for every US time zone.
const dueMs = (d: string) => Date.parse(`${d}T17:00:00Z`);

type Job = { name: "EMAIL" | "SMS" | "SOCIAL"; text?: string; content: string; due: string };

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const denied = checkPass(req);
  if (denied) return denied;
  const token = clickupToken();
  if (!token) return json({ error: "No ClickUp token on this Netlify site yet." }, 503);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }
  const loc = LOCATIONS[b.loc];
  if (!loc) return json({ error: "Unknown location." }, 400);
  if (!b.parentId) return json({ error: "No event card picked." }, 400);

  // Every parent must live in this location's list — never write into another studio.
  const cards: Record<string, any> = {};
  async function card(id: string) {
    if (cards[id]) return cards[id];
    const t = await cu(`/task/${encodeURIComponent(id)}?include_subtasks=true`, token);
    if (String(t?.list?.id) !== loc.list) throw new Error(`"${t?.name || id}" isn't in ${loc.name}'s ClickUp list.`);
    cards[id] = t;
    return t;
  }

  const plan: { parentId: string; job: Job }[] = [];
  if (b.email?.html) plan.push({ parentId: b.parentId, job: { name: "EMAIL", text: b.email.subject || "", content: b.email.html, due: b.dueDates?.email } });
  if (b.sms?.text) plan.push({ parentId: b.parentId, job: { name: "SMS", content: b.sms.text, due: b.dueDates?.sms } });
  if (Array.isArray(b.socials)) {
    for (const s of b.socials) {
      if (s?.caption && s?.parentId) plan.push({ parentId: s.parentId, job: { name: "SOCIAL", text: s.caption, content: s.imageUrl || "", due: s.due } });
    }
  } else if (b.social?.caption) {
    plan.push({ parentId: b.parentId, job: { name: "SOCIAL", text: b.social.caption, content: b.social.imageUrl || "", due: b.dueDates?.social } });
  }
  if (!plan.length) return json({ error: "Nothing to push." }, 400);
  for (const p of plan) {
    if (!DATE_RE.test(p.job.due || "")) return json({ error: `Missing due date for ${p.job.name}.` }, 400);
  }

  // Check every parent up front so nothing is half-pushed into the wrong studio.
  try {
    for (const id of new Set(plan.map((p) => p.parentId))) await card(id);
  } catch (e: any) {
    return json({ error: `Couldn't use that event card: ${e.message || e}` }, 400);
  }

  const results: any[] = [];
  for (const { parentId, job: j } of plan) {
    const parent = cards[parentId];
    const where = { parentName: parent.name, parentUrl: parent.url || `https://app.clickup.com/t/${parent.id}` };
    const fields = [{ id: F_CONTENT, value: j.content }];
    if (j.text) fields.push({ id: F_TEXT, value: j.text });
    try {
      const prior = j.name === "SOCIAL"
        ? (parent.subtasks || []).find((s: any) => String(s.name || "").trim().toUpperCase() === "SOCIAL")
        : null;
      if (prior) {
        await cu(`/task/${prior.id}`, token, {
          method: "PUT",
          body: JSON.stringify({ due_date: dueMs(j.due), due_date_time: false, assignees: { add: [RANDI_ID] } }),
        });
        for (const f of fields) {
          await cu(`/task/${prior.id}/field/${f.id}`, token, { method: "POST", body: JSON.stringify({ value: f.value }) });
        }
        results.push({ name: j.name, action: "updated", id: prior.id, url: prior.url || `https://app.clickup.com/t/${prior.id}`, ...where });
      } else {
        const t = await cu(`/list/${loc.list}/task`, token, {
          method: "POST",
          body: JSON.stringify({
            name: j.name,
            parent: parent.id,
            assignees: [RANDI_ID],
            due_date: dueMs(j.due),
            due_date_time: false,
            custom_item_id: TYPE_IDS[j.name],
            custom_fields: fields,
          }),
        });
        // Remember it so a second SOCIAL for the same card updates instead of duplicating.
        if (j.name === "SOCIAL") (parent.subtasks ||= []).push({ id: t.id, name: "SOCIAL", url: t.url });
        results.push({ name: j.name, action: "created", id: t.id, url: t.url, ...where });
      }
    } catch (e: any) {
      results.push({ name: j.name, action: "failed", error: String(e.message || e), ...where });
    }
  }

  const main = cards[b.parentId];
  return json({ ok: results.every((r) => r.action !== "failed"), parent: { id: main.id, name: main.name, url: main.url }, results });
};

export const config = { path: "/api/kc/push" };
