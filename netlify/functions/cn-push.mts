// POST /api/cn/push — puts EMAIL / SMS / SOCIAL content under the event card, assigned to Randi.
// If the card already has a subtask of that type (EMAILS / SMS / SOCIAL task type), it's filled in
// and kept under its own name. Otherwise a new one is created, named the way this center already names
// them (e.g. "CRM EMAIL", "MC EMAIL", "LL SMS"), falling back to EMAIL / SMS / SOCIAL.
import {
  CN_LOCATIONS as LOCATIONS, RANDI_ID, F_TEXT, F_CONTENT, TYPE_IDS, clickupToken, checkPass, cu, json,
} from "./_cn.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Noon US Central lands on the intended calendar day across North American time zones.
const dueMs = (d: string) => Date.parse(`${d}T17:00:00Z`);
type Kind = "EMAIL" | "SMS" | "SOCIAL";

// Most recent subtask name this list uses for each task type.
async function namingFor(list: string, token: string): Promise<Record<Kind, string>> {
  const names: Record<Kind, string> = { EMAIL: "EMAIL", SMS: "SMS", SOCIAL: "SOCIAL" };
  try {
    const qs = new URLSearchParams({ subtasks: "true", include_closed: "true", order_by: "created" });
    for (const k of ["EMAIL", "SMS"] as Kind[]) qs.append("custom_items[]", String(TYPE_IDS[k]));
    const j = await cu(`/list/${list}/task?${qs}`, token);
    const seen = new Set<Kind>();
    for (const t of j?.tasks || []) {
      if (!t.parent) continue;
      const kind = (Object.keys(TYPE_IDS) as Kind[]).find((k) => TYPE_IDS[k] === t.custom_item_id);
      if (!kind || seen.has(kind)) continue;
      const n = String(t.name || "").trim();
      if (n && n.length <= 20 && n.toUpperCase().includes(kind)) { names[kind] = n.toUpperCase(); seen.add(kind); }
    }
  } catch {}
  return names;
}

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

  // The parent must live in this center's list — never write into another center.
  let parent: any;
  try {
    parent = await cu(`/task/${encodeURIComponent(b.parentId)}?include_subtasks=true`, token);
  } catch (e: any) {
    return json({ error: `Couldn't read the event card: ${e.message || e}` }, 502);
  }
  if (String(parent?.list?.id) !== loc.list) {
    return json({ error: `That card isn't in ${loc.name}'s ClickUp list.` }, 400);
  }
  const existing: any[] = parent.subtasks || [];

  const jobs: { kind: Kind; text?: string; content: string; due: string }[] = [];
  if (b.email?.html) jobs.push({ kind: "EMAIL", text: b.email.subject || "", content: b.email.html, due: b.dueDates?.email });
  if (b.sms?.text) jobs.push({ kind: "SMS", content: b.sms.text, due: b.dueDates?.sms });
  if (b.social?.caption) jobs.push({ kind: "SOCIAL", text: b.social.caption, content: b.social.imageUrl || "", due: b.dueDates?.social });
  if (!jobs.length) return json({ error: "Nothing to push." }, 400);
  for (const j of jobs) {
    if (!DATE_RE.test(j.due || "")) return json({ error: `Missing due date for ${j.kind}.` }, 400);
  }

  const naming = await namingFor(loc.list, token);
  const results: any[] = [];
  for (const j of jobs) {
    const fields = [{ id: F_CONTENT, value: j.content }];
    if (j.text) fields.push({ id: F_TEXT, value: j.text });
    try {
      const prior = existing.find((s) =>
        s.custom_item_id === TYPE_IDS[j.kind] || String(s.name || "").trim().toUpperCase().endsWith(j.kind));
      if (prior) {
        await cu(`/task/${prior.id}`, token, {
          method: "PUT",
          body: JSON.stringify({ due_date: dueMs(j.due), due_date_time: false, assignees: { add: [RANDI_ID] } }),
        });
        for (const f of fields) {
          await cu(`/task/${prior.id}/field/${f.id}`, token, { method: "POST", body: JSON.stringify({ value: f.value }) });
        }
        results.push({ name: prior.name, action: "updated", id: prior.id, url: prior.url || `https://app.clickup.com/t/${prior.id}` });
      } else {
        const name = naming[j.kind];
        const t = await cu(`/list/${loc.list}/task`, token, {
          method: "POST",
          body: JSON.stringify({
            name, parent: parent.id, assignees: [RANDI_ID], due_date: dueMs(j.due), due_date_time: false,
            custom_item_id: TYPE_IDS[j.kind], custom_fields: fields,
          }),
        });
        results.push({ name, action: "created", id: t.id, url: t.url });
      }
    } catch (e: any) {
      results.push({ name: j.kind, action: "failed", error: String(e.message || e) });
    }
  }

  return json({ ok: results.every((r) => r.action !== "failed"), parent: { id: parent.id, name: parent.name, url: parent.url }, results });
};

export const config = { path: "/api/cn/push" };
