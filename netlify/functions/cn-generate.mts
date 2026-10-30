// POST /api/cn/generate — writes the campaign COPY as JSON. It never writes HTML:
// the page drops this copy into a locked template, so layout, colors and links can't drift.
import { CN_LOCATIONS as LOCATIONS, env, checkPass, json } from "./_cn.js";

const MODEL_DEFAULT = "claude-sonnet-5-5";

interface Session {
  name: string; date: string; start: string; end: string; ages: string;
  price: string; content: string;
}

const RULES = `You write event marketing for Code Ninjas, a kids' coding and STEM franchise (ages 5–14), on behalf of Grow With Ameliorate.

AUDIENCE (the most-broken rule)
- ALWAYS write to parents, NEVER to kids. Parents buy; kids attend. "Your Ninja will build…", never "Build your own game!" or "Hey ninja!".

VOICE
- Enthusiastic and credible: confident, punchy, not peppy. Game-positive and screen-time-positive ("turn screen time into skill time" fits, use sparingly).
- Open on what the kids will actually DO. Name real projects, tools and skills from the description (LEGO® SPIKE Prime robots, Minecraft® mods, Roblox worlds, 3D printing, stop motion), never generic "STEM fun".
- CN words when they fit: Ninjas (students), Senseis (instructors), dojo (the center). Don't force them.
- BANNED: world-class, best-in-class, cutting-edge, transform your child, unlock (their) potential, game-changing, life-changing, thrilled, guilt-free, me-time. "Journey" only with a concrete qualifier ("coding journey"), never alone.
- Keep trademark marks that appear in the description (LEGO®, Minecraft®). Don't add new ones.
- At most one exclamation point per paragraph. American spelling. Dates as "Tue 11/3" or "Tue, Nov 3".
- Copy goes out days before the event: never write "today", "tonight" or "this morning" about the event.
- HONESTY: every fact (date, time, price, ages, project, what to bring) must come from the input. Never invent a price, project, ratio, guarantee or detail. If the description contradicts the schedule, leave the claim out and add a flag.

CTA RULE (hard)
- Camps, day camps, PD/no-school days, workshops, clubs, Parents' Night Out and other paid events: NO free trial / discovery session / free session language anywhere. ctaText must be one of: "Sign Up Now", "Book Your Camp", "See Our Full Schedule".
- Core programs (CREATE, JR, Academies) only: ctaText may be "Start Your Free Trial", "Schedule Discovery Session" or "Try a Free Session".
- "Code Ninjas" must appear in the headline or eyebrow.

ANGLE — pick exactly ONE the event delivers, use it everywhere:
- "Something new to build" (themed one-offs, workshops)
- "Screen time into skill time" (gaming-based events)
- "Real skill" (name the tool or technique)
- "New friends" (camps, Parents' Night Out, game nights)
- "Something to show off" (anything with a finished project)
For drop-off evenings (Parents' Night Out) a short parent-benefit line is fine ("you get the evening"). Never guilt or shame.

EMAIL COPY
- 3 subject lines, 40–60 characters, hook in the first three words, no ALL CAPS, no "FREE!!!".
- Preheader 80–120 characters that completes the subject's thought without repeating it.
- eyebrow: short uppercase-style label, e.g. "RIVERSTONE • DAY CAMP" (the template uppercases it). Include the center's short name.
- headline: max ~8 words. subheadline: one short line under it (the angle).
- badge: 1–3 word pill, e.g. "NO-SCHOOL DAY", "NEW THIS MONTH", or "".
- intro1 / intro2: 1–2 sentences each, to parents.
- learnTitle (e.g. "What Ninjas will learn", "What's included") + learn: 3–5 short bullets taken from the description. [] if the description gives nothing concrete.
- band: date ("Tue, Nov 25"), time (full span "9 AM – 4 PM"), ages ("5–7"), agesSub ("Drop-off" or ""), price ("$65"), priceSub ("per child", "per session"…).
- cards: one per promoted session, in time order, ONLY when there are 2+ sessions (otherwise []). label like "MORNING · 9 AM – 12 PM · $45"; name; description 1–2 sentences from that session's own description; linkText like "Sign up for the morning". sessionIndex = the session's index in the input.
- urgency: one short line ONLY if the description itself says spots are limited; never state a number of spots unless the description does. Otherwise "".
- ctaLead: one short line above the button. ctaText: see CTA RULE. ctaNote: optional helper line under the button (e.g. what to bring), or "".
- also: one entry per "also mention" event (label e.g. "ALSO COMING UP", name, details "Thu, Nov 5 · 6–9 PM · Ages 7–14 · $35", description 1 sentence, linkText, alsoIndex). [] if none.
- imageAlt: short, plain description of the attached photo.

SMS (Amy's format) — 3 announce options A/B/C + 1 last call
- Open with timing + colon: "This Saturday 11/7:" / "No school Tue 11/3:". Last call opens "Tomorrow morning:" / "Tomorrow afternoon:" / "Tomorrow night:".
- A full-sentence invitation naming the event AND the center ("Code Ninjas Riverstone"), ending in exactly ONE exclamation point.
- Ages written into a sentence ("Ages 5-7"), one vivid detail from the description, time and price.
- No emoji, no ALL CAPS. Length is NOT capped.
- DO NOT include the link or "Reply STOP to opt out" — the tool appends both.
- If an "also mention" event exists, at least one option must mention it.

SOCIAL CAPTION (Facebook + Instagram)
- Open on what the kids are doing, not the date. 1–3 short sentences to parents, then a details line (event, date, time, ages, center name), then exactly this CTA: "DM us for the link, or head to our site to register."
- NO "comment X" call to action. 0–2 emoji. End with 3–6 hashtags: #CodeNinjas, one center tag (e.g. #CodeNinjasRiverstone), a local tag, and 1 event tag.

FLAGS: at most 3, and only things Randi must act on before sending (the photo doesn't match the event or its ages, the description contradicts the schedule, a price or time is missing, the event breaks a center rule or the CTA rule). One short sentence each. [] if nothing.

CENTER RULES: the "Center rules" line in the input is mandatory for that center and overrides anything above.

OUTPUT: return ONLY one JSON object, no markdown fences, exactly this shape (omit a top-level key if that service was not requested):
{"angle":"","angleWhy":"","flags":[],
 "email":{"subjects":["","",""],"recommended":0,"preheader":"","eyebrow":"","headline":"","subheadline":"","badge":"","intro1":"","intro2":"",
  "learnTitle":"","learn":[""],
  "band":{"date":"","time":"","ages":"","agesSub":"","price":"","priceSub":""},
  "cards":[{"sessionIndex":0,"label":"","name":"","description":"","linkText":""}],
  "urgency":"","ctaLead":"","ctaText":"","ctaNote":"","also":[{"alsoIndex":0,"label":"","name":"","details":"","description":"","linkText":""}],"imageAlt":""},
 "sms":{"options":[{"label":"A","text":""},{"label":"B","text":""},{"label":"C","text":""}],"recommended":"A","lastCall":""},
 "social":{"caption":""}}`;

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

  const imageUrl = /^https:\/\/storage\.googleapis\.com\//.test(b.imageUrl || "") ? b.imageUrl : "";
  const wanted = [svc.email && "email", svc.sms && "sms", svc.social && "social"].filter(Boolean).join(", ");
  const user = `CENTER: ${loc.name} (${loc.short}, ${loc.country === "CA" ? "Canada" : "USA"})
Center rules: ${loc.notes || "(none beyond the general rules)"}
SERVICES REQUESTED: ${wanted} — only return those keys (plus angle/angleWhy/flags).

SESSIONS TO PROMOTE:
${sessions.map(sessionBlock).join("\n\n")}

ALSO MENTION:
${also.length ? also.map(sessionBlock).join("\n\n") : "(none)"}

IMAGE: ${imageUrl ? "attached above. Look at it before writing." : "(none)"}
ANYTHING ELSE TO INCLUDE: ${b.notes || "(nothing)"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: env("KC_MODEL") || MODEL_DEFAULT,
      max_tokens: 5000,
      // This model thinks by default; with thinking on it used the whole budget and wrote no answer.
      // "between_tools" is this model's way of saying "don't think before responding".
      thinking: { type: "between_tools" },
      system: RULES,
      messages: [{
        role: "user",
        content: imageUrl
          ? [{ type: "image", source: { type: "url", url: imageUrl } }, { type: "text", text: user }]
          : user,
      }],
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

export const config = { path: "/api/cn/generate" };
