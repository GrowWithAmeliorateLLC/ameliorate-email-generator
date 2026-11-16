// POST /api/csk/push — creates EMAIL (and SMS, once texting is live) subtasks under the chosen
// camp card in the location's ClickUp list, assigned to Randi.
import { CSK_LOCATIONS } from "./_csk.js";
import { RANDI_ID, F_TEXT, F_CONTENT, TYPE_IDS, clickupToken, checkPass, cu, json } from "./_kc.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const dueMs = (d: string) => Date.parse(`${d}T17:00:00Z`); // noon US Central lands on the right day in every US zone

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const denied = checkPass(req);
  if (denied) return denied;
  const token = clickupToken();
  if (!token) return json({ error: "No ClickUp token on this Netlify site yet." }, 503);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }
  const loc = CSK_LOCATIONS[b.loc];
  if (!loc) return json({ error: "Unknown location." }, 400);
  if (!loc.emailInScope) return json({ error: `${loc.name} doesn't pay for email.` }, 400);
  if (!b.parentId) return json({ error: "No camp card picked." }, 400);

  let parent: any;
  try {
    parent = await cu(`/task/${encodeURIComponent(b.parentId)}`, token);
    if (String(parent?.list?.id) !== loc.list) throw new Error(`"${parent?.name || b.parentId}" isn't in ${loc.name}'s ClickUp list.`);
  } catch (e: any) {
    return json({ error: `Couldn't use that camp card: ${e.message || e}` }, 400);
  }

  const jobs: { name: "EMAIL" | "SMS"; text?: string; content: string; due: string }[] = [];
  if (b.email?.html) jobs.push({ name: "EMAIL", text: b.email.subject || "", content: b.email.html, due: b.dueDates?.email });
  if (b.sms?.text) {
    if (!loc.smsLive) return json({ error: "Texting isn't live for this location yet." }, 400);
    jobs.push({ name: "SMS", content: b.sms.text, due: b.dueDates?.sms });
  }
  if (!jobs.length) return json({ error: "Nothing to push." }, 400);
  for (const j of jobs) if (!DATE_RE.test(j.due || "")) return json({ error: `Missing due date for ${j.name}.` }, 400);

  const results: any[] = [];
  for (const j of jobs) {
    const fields = [{ id: F_CONTENT, value: j.content }];
    if (j.text) fields.push({ id: F_TEXT, value: j.text });
    try {
      const t = await cu(`/list/${loc.list}/task`, token, {
        method: "POST",
        body: JSON.stringify({
          name: j.name, parent: parent.id, assignees: [RANDI_ID],
          due_date: dueMs(j.due), due_date_time: false,
          custom_item_id: TYPE_IDS[j.name], custom_fields: fields,
        }),
      });
      results.push({ name: j.name, action: "created", id: t.id, url: t.url });
    } catch (e: any) {
      results.push({ name: j.name, action: "failed", error: String(e.message || e) });
    }
  }
  return json({ ok: results.every((r) => r.action !== "failed"), parent: { id: parent.id, name: parent.name, url: parent.url }, results });
};

export const config = { path: "/api/csk/push" };
