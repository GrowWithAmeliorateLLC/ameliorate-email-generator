// POST /api/csk/generate — writes the campaign COPY as JSON (never HTML). The page drops it into a
// locked, Constant Contact-safe template, so layout, colors and links can't drift.
import { CSK_LOCATIONS } from "./_csk.js";
import { env, checkPass, json } from "./_kc.js";

const MODEL_DEFAULT = "claude-sonnet-5-5";

interface Camp {
  name: string; dates: string; location: string; ages: string; price: string;
  description: string; spotsLeft?: number | null;
}

const RULES = `You write summer camp marketing for Club SciKidz, a hands-on STEM camp franchise for kids PK-8, on behalf of Grow With Ameliorate. The email goes out through the location's Constant Contact account.

VOICE (non-negotiable)
- Friendly, science-forward, written for PARENTS. Kids doing real science, real experiments. Credibility over hype (STEM.org accredited is a real signal; use it at most once).
- Call attendees "campers". Name the real things campers build or do from the description (build a working robot, dust for prints, fly a drone). Never generic "STEM fun".
- Drunk grandma test: a parent gets what the camp is, when, where, and why their kid will love it in one read. Lead with the benefit, not the spec. Short sentences.
- BANNED: world-class, best-in-class, transform your child, unlock potential, journey, ecosystem, game-changing, thrilled, exciting opportunity. Never write to the child.
- American spelling. Dates as "Mon 6/14" or "June 14–18". Prices as "$385/week".
- HONESTY: every fact (dates, venue, ages, price, early-bird deadline, spots) must come from the input. Never invent a project, price, ratio, guarantee, lunch detail, before/after care or discount. Early-bird pricing exists ONLY if the input gives it, and only until the date given. Mention spots left only if the input gives a number of 10 or fewer, and never state the number.
- Never put a phone number in any copy.

ANGLE — pick exactly ONE and use it everywhere:
- "Real science, real experiments" (lab camps: chemistry, forensics, medicine, vet)
- "They build something that works" (robotics, engineering, 3D printing, drones, LEGO)
- "Screen time that's actually STEM" (coding, Minecraft, AI, movie making)
- "Lock in the early-bird price" (only while the input's early-bird date hasn't passed)
- "Summer, planned" (multi-camp roundups: a whole week or season of options)

EMAIL COPY
- 3 subject lines, 40–60 characters, hook in the first three words, no ALL CAPS, no "FREE!!!", no $$$.
- preheader 80–120 characters that completes the subject's thought without repeating it.
- eyebrow: short label over the headline, e.g. "SUMMER 2027 · FORT MILL" or "WEEK OF JUNE 14".
- headline: max ~9 words. Optional accent: wrap ONE word or short phrase in *asterisks* and the template shows it in orange italic (e.g. "This isn't your average *summer camp.*").
- intro1 / intro2: 1–2 sentences each.
- SINGLE CAMP (exactly one camp in the input): fill band {date:"June 14–18", time:"Mon–Fri · 9 AM–4 PM", ages:"9–11", agesSub:"campers", price:"$385/week", priceSub:"early bird thru 12/31" or "per week"} and notes = exactly 3 "What campers do" lines {"label":"Bold 2–4 word label.","text":"one sentence from the description"}. cards = [].
- MULTIPLE CAMPS: band = null, notes = [] , cards = one per camp in input order {"campIndex":N,"name":"","when":"June 14–18 · St. John's, Fort Mill","description":"1 sentence, what campers do","linkText":"See the camp"}.
- urgency: one short line ONLY for a real deadline in the input (early bird ending within 21 days of today, or few spots left). Otherwise "".
- ctaNote: one short helper line under the main button (e.g. "Early-bird price through 12/31. Full day, Mon–Fri 9–4."), or "".
- imageAlt: short plain description of the attached image (or of a typical camp if none).

SMS (Amy's format) — 3 announce options A/B/C + 1 last call (only if SMS is requested)
- Open with timing + colon ("Summer 2027:" / "Week of 6/14:" / "Early bird ends 12/31:").
- One full-sentence invitation naming the camp (or "STEM summer camps") AND "Club SciKidz Charlotte South" (use the location name given), ending in exactly ONE exclamation point.
- Ages in a sentence, one vivid detail, price. No emoji, no ALL CAPS.
- DO NOT include the link or "Reply STOP to opt out" — the tool appends both.

FLAGS: at most 3, only things Randi must fix before sending (image doesn't match the camp or ages, a price or date missing, ACTIVE and the card disagree, early bird already over). One short sentence each. [] if nothing.

LOCATION RULES: the "Location rules" line in the input is mandatory and overrides anything above.

OUTPUT: return ONLY one JSON object, no markdown fences, exactly this shape (omit "sms" if SMS was not requested):
{"angle":"","angleWhy":"","flags":[],
 "email":{"subjects":["","",""],"recommended":0,"preheader":"","eyebrow":"","headline":"","intro1":"","intro2":"",
  "band":{"date":"","time":"","ages":"","agesSub":"","price":"","priceSub":""},
  "notes":[{"label":"","text":""}],
  "cards":[{"campIndex":0,"name":"","when":"","description":"","linkText":"See the camp"}],
  "urgency":"","ctaNote":"","imageAlt":""},
 "sms":{"options":[{"label":"A","text":""},{"label":"B","text":""},{"label":"C","text":""}],"recommended":"A","lastCall":""}}`;

const block = (c: Camp, i: number) => `[${i}] ${c.name}
  Dates: ${c.dates || "?"} · Venue: ${c.location || "?"} · Ages: ${c.ages || "?"} · Price: ${c.price || "?"}${c.spotsLeft != null ? ` · Spots left: ${c.spotsLeft}` : ""}
  Description: ${(c.description || "(none)").replace(/\n/g, " ")}`;

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const denied = checkPass(req);
  if (denied) return denied;
  const key = env("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "ANTHROPIC_API_KEY is not set on this Netlify site." }, 503);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }
  const loc = CSK_LOCATIONS[b.loc];
  if (!loc) return json({ error: "Unknown location." }, 400);
  if (!loc.emailInScope) return json({ error: `${loc.name} doesn't pay for email.` }, 400);
  const camps: Camp[] = Array.isArray(b.camps) ? b.camps.slice(0, 12) : [];
  if (!camps.length) return json({ error: "Pick at least one camp." }, 400);
  const wantSms = !!b.sms && loc.smsLive;
  const imageUrl = typeof b.imageUrl === "string" && /^https:\/\/.+\.(png|jpe?g)(\?.*)?$/i.test(b.imageUrl) ? b.imageUrl : "";

  const today = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York", month: "numeric", day: "numeric", year: "numeric" });
  const user = `TODAY: ${today}
LOCATION: ${loc.name}
Location rules: ${loc.notes}
MODE: ${camps.length === 1 ? "SINGLE CAMP" : `MULTIPLE CAMPS (${camps.length})`}
SERVICES: email${wantSms ? ", sms" : ""} — only return those keys (plus angle/angleWhy/flags).

CAMPS:
${camps.map(block).join("\n\n")}

IMAGE: ${imageUrl ? "attached above. Look at it before writing." : "(none)"}
ANYTHING ELSE TO INCLUDE: ${b.notes || "(nothing)"}`;

  const content: any[] = [];
  if (imageUrl) content.push({ type: "image", source: { type: "url", url: imageUrl } });
  content.push({ type: "text", text: user });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: env("CSK_MODEL") || env("KC_MODEL") || MODEL_DEFAULT,
      max_tokens: 3500,
      thinking: { type: "between_tools" }, // same setting the KC tool needed to return an answer in time
      system: RULES,
      messages: [{ role: "user", content }],
    }),
  });
  const raw = await res.text();
  if (!res.ok) return json({ error: `Claude API ${res.status}: ${raw.slice(0, 400)}` }, 502);

  let text = "";
  try {
    const parsed = JSON.parse(raw);
    text = (parsed.content || []).map((c: any) => (c.type === "text" ? c.text || "" : "")).join("");
  } catch {}
  try {
    const out = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return json({ ok: true, copy: out });
  } catch {
    return json({ error: "Claude returned something that wasn't JSON. Try Generate again.", raw: text.slice(0, 1500) }, 502);
  }
};

export const config = { path: "/api/csk/generate" };
