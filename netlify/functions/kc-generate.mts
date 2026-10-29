// POST /api/kc/generate — writes the campaign COPY as JSON. It never writes HTML:
// the page drops this copy into a locked template, so layout, colors and links can't drift.
import { LOCATIONS, env, checkPass, json } from "./_kc.js";

const MODEL_DEFAULT = "claude-sonnet-5-5";

interface Session {
  name: string; date: string; start: string; end: string; ages: string;
  price: string; spots: string; content: string;
}

const RULES = `You write event marketing for Kidcreate Studio, a kids' art studio franchise, on behalf of Grow With Ameliorate.

VOICE (non-negotiable)
- Mess-positive, warm, human, written for parents. Kid benefit first, parent benefit last.
- Open on what the kids will actually DO. Name real projects and techniques from the description (clay, slime, splatter, printmaking), never generic "art fun".
- Signature line (used by the template, don't repeat it): "Making a mess is the best at Kidcreate!"
- BANNED words/phrases: world-class, transform your child, unlock potential, journey, game-changing, guilt-free, ME-TIME, me-time, thrilled, exciting creative experience.
- No accidental innuendo: never "we turn the lights off", "after dark".
- American spelling. Dates as "Tue 11/3" or "Tue, Nov 3".
- HONESTY: every fact (date, time, price, ages, project, FAQ) must come from the input. Never invent a price, project, ratio, guarantee or detail. If the description contradicts the schedule (e.g. "a full week" on a 3-hour session), leave the claim out and add a flag.

ANGLE — pick exactly ONE the event actually delivers, and use it everywhere:
- "Something new to do" (themed one-offs, glow nights)
- "Screen-free" (evenings, no-school days)
- "Creative skill" (name the technique)
- "New friends" (camps, Kids Night Out, drop-offs)
- "Something to be proud of" (anything producing a finished piece)
If a caregiver joins in (family / caregiver-required event), also lean into time together, and NEVER use any "a few hours for yourself" line. A parent-benefit line ("we handle the cleanup") is fine for drop-off events.

EMAIL COPY
- 3 subject lines, 40–60 characters, hook in the first three words, no ALL CAPS, no "FREE!!!".
- Preheader 80–120 characters that completes the subject's thought without repeating it.
- headline: max ~10 words, the angle in one line. Do not repeat the event name if the image already shows it.
- intro1 / intro2: 1–2 sentences each.
- band: date (e.g. "Tue, Nov 3"; for a bundled day, the one date), time (full span, e.g. "8:30 AM – 4:30 PM"), ages ("5–12"), agesSub ("Drop-off" or "With a grown-up"), price ("$50"), priceSub ("per workshop", "per child"…).
- cards: one per promoted session, in time order, ONLY when there are 2+ sessions (otherwise []). label like "MORNING · 8:30 AM – 12:00 PM · $50"; description 1–2 sentences from that session's own description; linkText like "Reserve the morning". sessionIndex = the session's index in the input.
- urgency: one short line ONLY if the input shows real scarcity (spots left / "limited"); otherwise "".
- ctaNote: one short helper line under the main button (e.g. how to book the full day), or "".
- also: one entry per "also mention" event (label e.g. "ALSO THIS WEEK · FOR THE LITTLEST ONES", name, details line "Thu, Nov 5 · 10–11 AM · Ages 12 months–6 years · $20", description 1 sentence, linkText, alsoIndex). [] if none.
- imageAlt: short, describes the photo as Randi described it (or generic kids-at-the-art-table if unknown).

SMS (Amy's format) — 3 announce options A/B/C + 1 last call
- Open with timing + colon: "This Saturday 11/7:" / "No school Tue 11/3:". Last call opens "Tomorrow morning:" / "Tomorrow afternoon:" / "Tomorrow night:".
- A full-sentence invitation naming the event AND the studio name, ending in exactly ONE exclamation point.
- Ages written into a sentence ("Ages 5-12y"), one vivid detail from the description, time and price.
- No emoji, no ALL CAPS. Lively and fun. Length is NOT capped.
- DO NOT include the link or "Reply STOP to opt out" — the tool appends both.
- If an "also mention" event exists, at least one option must mention it.

SOCIAL CAPTION (Facebook + Instagram)
- Open on what the kids are doing, not the date. 1–3 short sentences, then a details line (event, date, time, ages, studio name), then exactly this CTA: "DM us for the link, or head to our site to register."
- 0–1 emoji (🎨 only). End with 3–6 hashtags: the location's tags plus 1 event tag.

FLAGS: list anything Randi or Amy should check (image doesn't match the audience, description contradicts schedule, missing price, etc.). [] if nothing.

OUTPUT: return ONLY one JSON object, no markdown fences, exactly this shape (omit a top-level key if that service was not requested):
{"angle":"","angleWhy":"","flags":[],
 "email":{"subjects":["","",""],"recommended":0,"preheader":"","headline":"","intro1":"","intro2":"",
  "band":{"date":"","time":"","ages":"","agesSub":"","price":"","priceSub":""},
  "cards":[{"sessionIndex":0,"label":"","name":"","description":"","linkText":""}],
  "urgency":"","ctaNote":"","also":[{"alsoIndex":0,"label":"","name":"","details":"","description":"","linkText":""}],"imageAlt":""},
 "sms":{"options":[{"label":"A","text":""},{"label":"B","text":""},{"label":"C","text":""}],"recommended":"A","lastCall":""},
 "social":{"caption":""}}`;

function sessionBlock(s: Session, i: number) {
  return `[${i}] ${s.name}
  Date: ${s.date} · Time: ${s.start || "?"}–${s.end || "?"} · Ages: ${s.ages || "?"} · Price: ${s.price || "?"} · Spots: ${s.spots || "not given"}
  Description:
  ${(s.content || "(none)").replace(/\n/g, "\n  ")}`;
}

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const denied = checkPass(req);
  if (denied) return denied;
  const key = env("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "ANTHROPIC_API_KEY is not set on this Netlify site." }, 503);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }
  const loc = LOCATIONS[b.loc];
  if (!loc) return json({ error: "Unknown location." }, 400);
  const sessions: Session[] = Array.isArray(b.sessions) ? b.sessions : [];
  const also: Session[] = Array.isArray(b.also) ? b.also : [];
  const svc = b.services || {};
  if (!sessions.length) return json({ error: "Pick at least one session." }, 400);
  if (!svc.email && !svc.sms && !svc.social) return json({ error: "Pick at least one service." }, 400);

  const wanted = [svc.email && "email", svc.sms && "sms", svc.social && "social"].filter(Boolean).join(", ");
  const user = `STUDIO: ${loc.name} (${loc.short})
Studio notes: ${loc.notes}
Location hashtags: ${loc.hashtags}
SERVICES REQUESTED: ${wanted} — only return those keys (plus angle/angleWhy/flags).

SESSIONS TO PROMOTE:
${sessions.map(sessionBlock).join("\n\n")}

ALSO MENTION:
${also.length ? also.map(sessionBlock).join("\n\n") : "(none)"}

IMAGE: ${b.imageNote ? b.imageNote : "(no description given — don't describe specific projects in the photo)"}
EXTRA INSTRUCTIONS FROM AMY/RANDI: ${b.notes || "(none)"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: env("KC_MODEL") || MODEL_DEFAULT,
      max_tokens: 3000,
      system: RULES,
      messages: [{ role: "user", content: user }],
    }),
  });
  const raw = await res.text();
  if (!res.ok) return json({ error: `Claude API ${res.status}: ${raw.slice(0, 400)}` }, 502);

  let text = "", meta: any = {};
  try {
    const parsed = JSON.parse(raw);
    meta = { model: parsed.model, stop_reason: parsed.stop_reason, blocks: (parsed.content || []).map((c: any) => c.type), usage: parsed.usage };
    text = (parsed.content || []).map((c: any) => (c.type === "text" ? c.text || "" : "")).join("");
  } catch {}
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  try {
    const out = JSON.parse(text.slice(start, end + 1));
    return json({ ok: true, copy: out });
  } catch {
    return json({ error: "Claude returned something that wasn't JSON. Try Generate again.", meta, raw: text.slice(0, 1500) }, 502);
  }
};

export const config = { path: "/api/kc/generate" };
