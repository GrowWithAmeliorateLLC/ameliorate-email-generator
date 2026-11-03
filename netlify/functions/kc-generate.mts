// POST /api/kc/generate — writes the campaign COPY as JSON. It never writes HTML:
// the page drops this copy into a locked template, so layout, colors and links can't drift.
import { LOCATIONS, env, checkPass, json } from "./_kc.js";

const MODEL_DEFAULT = "claude-sonnet-5-5";

interface Session {
  name: string; date: string; start: string; end: string; ages: string;
  price: string; content: string;
}

const RULES = `You write event marketing for Kidcreate Studio, a kids' art studio franchise, on behalf of Grow With Ameliorate.

VOICE (non-negotiable)
- Mess-positive, warm, human, written for parents. Kid benefit first, parent benefit last.
- Open on what the kids will actually DO. Name real projects and techniques from the description (clay, slime, splatter, printmaking), never generic "art fun".
- Signature line (used by the template, don't repeat it): "Making a mess is the best at Kidcreate!"
- BANNED words/phrases: world-class, transform your child, unlock potential, journey, game-changing, guilt-free, ME-TIME, me-time, thrilled, exciting creative experience.
- No accidental innuendo: never "we turn the lights off", "after dark".
- American spelling. Dates as "Tue 11/3" or "Tue, Nov 3".
- Copy goes out days before the event: never write "today", "tonight" or "this morning" about the event.
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
- urgency: one short line ONLY if the event description itself says spots are limited; never state a number of spots. Otherwise "".
- ctaNote: one short helper line under the main button (e.g. how to book the full day), or "".
- also: one entry per "also mention" event (label e.g. "ALSO THIS WEEK · FOR THE LITTLEST ONES", name, details line "Thu, Nov 5 · 10–11 AM · Ages 12 months–6 years · $20", description 1 sentence, linkText, alsoIndex). [] if none.
- imageAlt: short, plain description of the attached photo.

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

FLAGS: at most 3, and only things Randi must act on before sending (the photo doesn't match the event or its ages, the description contradicts the schedule, a price or time is missing, the event breaks a studio rule). One short sentence each. Don't flag choices you made correctly. [] if nothing.

STUDIO RULES: the "Studio rules" line in the input is mandatory for that studio and overrides anything above.

OUTPUT: return ONLY one JSON object, no markdown fences, exactly this shape (omit a top-level key if that service was not requested):
{"angle":"","angleWhy":"","flags":[],
 "email":{"subjects":["","",""],"recommended":0,"preheader":"","headline":"","intro1":"","intro2":"",
  "band":{"date":"","time":"","ages":"","agesSub":"","price":"","priceSub":""},
  "cards":[{"sessionIndex":0,"label":"","name":"","description":"","linkText":""}],
  "urgency":"","ctaNote":"","also":[{"alsoIndex":0,"label":"","name":"","details":"","description":"","linkText":""}],"imageAlt":""},
 "sms":{"options":[{"label":"A","text":""},{"label":"B","text":""},{"label":"C","text":""}],"recommended":"A","lastCall":""},
 "social":{"caption":""}}`;

// WEEK CALENDAR mode: several camps/events in one week, one email + one SMS covers all of them,
// and every promoted event gets its own social caption. The page draws the calendar grid itself
// from the session dates and times; Claude only writes the words.
const WEEK_RULES = `
WEEK CALENDAR MODE (this request) — overrides the EMAIL COPY, SMS and SOCIAL CAPTION sections above where they conflict.
The input lists EVENTS (each a promoted camp/event that runs on one or more days, with its sessions) plus ALSO MENTION add-ons (e.g. Lunch & Doodle). The email shows a week calendar the template builds from the dates, then one card per EVENT.
- Pick ONE angle for the whole week (usually "Screen-free" or "Something new to do" for a school break).
- email.eyebrow: short label over the headline, e.g. "THANKSGIVING BREAK · NOV 23 – 27" (name the break only if the input or notes name it; otherwise "NO SCHOOL WEEK · NOV 23 – 27" or "THIS WEEK AT KIDCREATE").
- email.headline: max ~8 words, about the week as a whole, not one event.
- email.intro1 / intro2: 1–2 sentences each. intro1 names 3–4 vivid real projects across the events. intro2 explains how to book (single day vs the full run, stacking a morning + add-on + afternoon into a full day) — only claim what the sessions support.
- email.cards: one per EVENT, in input order: {"eventIndex":N,"name":"","when":"Mon–Wed · 9 AM–12 PM","price":"$65 per day","description":"1–2 sentences from that event's own description","linkText":"Register"}. Price only from the input.
- email.notes: exactly 3 "What you're walking into" lines {"label":"Drop-off, all supplies included.","text":"..."}: logistics from the descriptions (what to pack, add-ons like Lunch & Doodle with their price, a parent-benefit line for Parent's Time Off / drop-off days). Every ALSO MENTION add-on must appear in a note.
- email.urgency: one short line if any description says spots are limited, else "".
- email.ctaNote: "", or one short line such as "Prices plus admin fee at checkout." only if the input says there's an admin fee.
- Do NOT return email.band, email.also or email.imageAlt.
- SMS: the timing lead covers the week ("Thanksgiving break 11/23-11/27:" / "No school 11/23-11/27:"). Each option still names the studio, ends its invitation sentence with ONE exclamation point and writes ages into a sentence. Make the options different angles (whole week / one standout day / full-day stack). lastCall opens "Tomorrow morning:" for the first day.
- social: {"captions":[{"eventIndex":N,"caption":""}]} — one caption per EVENT following the SOCIAL CAPTION rules, each opening on that event's own activity, each worded differently. Do NOT return social.caption.
OUTPUT SHAPE in this mode:
{"angle":"","angleWhy":"","flags":[],
 "email":{"subjects":["","",""],"recommended":0,"preheader":"","eyebrow":"","headline":"","intro1":"","intro2":"",
  "cards":[{"eventIndex":0,"name":"","when":"","price":"","description":"","linkText":"Register"}],
  "notes":[{"label":"","text":""}],"urgency":"","ctaNote":""},
 "sms":{"options":[{"label":"A","text":""},{"label":"B","text":""},{"label":"C","text":""}],"recommended":"A","lastCall":""},
 "social":{"captions":[{"eventIndex":0,"caption":""}]}}`;

function sessionBlock(s: Session, i: number) {
  return `[${i}] ${s.name}
  Date: ${s.date} · Time: ${s.start || "?"}–${s.end || "?"} · Ages: ${s.ages || "?"} · Price: ${s.price || "?"}
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

  const okImg = (u: any) => typeof u === "string" && /^https:\/\/storage\.googleapis\.com\//.test(u);
  const imageUrl = okImg(b.imageUrl) ? b.imageUrl : "";
  const week = !!b.weekMode;
  // Week mode: [{ name, sessionIndexes: number[], imageUrl }] — one entry per promoted event.
  const weekEvents: { name: string; sessionIndexes: number[]; imageUrl?: string }[] =
    week && Array.isArray(b.weekEvents) ? b.weekEvents.slice(0, 8) : [];
  if (week && !weekEvents.length) return json({ error: "Week calendar mode needs at least one event to promote." }, 400);
  const wanted = [svc.email && "email", svc.sms && "sms", svc.social && "social"].filter(Boolean).join(", ");

  const eventsBlock = weekEvents.map((ev, i) => {
    const ss = ev.sessionIndexes.map((k) => sessions[k]).filter(Boolean);
    const days = ss.map((s) => `${s.date} ${s.start || "?"}–${s.end || "?"} ${s.price || "?"}`).join("; ");
    return `EVENT [${i}] ${ev.name}
  Sessions: ${days}
  Ages: ${ss[0]?.ages || "?"}
  Image: ${okImg(ev.imageUrl) ? `attached (labeled EVENT [${i}])` : "(none)"}
  Description:
  ${(ss[0]?.content || "(none)").replace(/\n/g, "\n  ")}`;
  }).join("\n\n");

  const user = `STUDIO: ${loc.name} (${loc.short})
Studio rules: ${loc.notes || "(none beyond the general rules)"}
Location hashtags: ${loc.hashtags}
SERVICES REQUESTED: ${wanted} — only return those keys (plus angle/angleWhy/flags).
${week ? `MODE: WEEK CALENDAR (see WEEK CALENDAR MODE rules)

EVENTS:
${eventsBlock}` : `
SESSIONS TO PROMOTE:
${sessions.map(sessionBlock).join("\n\n")}`}

ALSO MENTION:
${also.length ? also.map(sessionBlock).join("\n\n") : "(none)"}

${week ? "IMAGES: one per EVENT where attached above, each labeled. Look at them before writing." : `IMAGE: ${imageUrl ? "attached above. Look at it before writing." : "(none)"}`}
ANYTHING ELSE TO INCLUDE: ${b.notes || "(nothing)"}`;

  const content: any[] = [];
  if (week) {
    weekEvents.forEach((ev, i) => {
      if (okImg(ev.imageUrl)) {
        content.push({ type: "text", text: `EVENT [${i}] image (${ev.name}):` });
        content.push({ type: "image", source: { type: "url", url: ev.imageUrl } });
      }
    });
  } else if (imageUrl) {
    content.push({ type: "image", source: { type: "url", url: imageUrl } });
  }
  content.push({ type: "text", text: user });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: env("KC_MODEL") || MODEL_DEFAULT,
      max_tokens: week ? 7000 : 4000,
      // This model thinks by default; with thinking on it used the whole budget and wrote no answer.
      // "between_tools" is this model's way of saying "don't think before responding".
      thinking: { type: "between_tools" },
      system: week ? RULES + "\n" + WEEK_RULES : RULES,
      messages: [{ role: "user", content }],
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
