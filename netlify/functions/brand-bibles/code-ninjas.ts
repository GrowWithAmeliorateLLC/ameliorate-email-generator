// AUTO-GENERATED. Edit /skill-v2/clients/code-ninjas.md and regenerate.
// Do not hand-edit this file.

export const CODE_NINJAS: string = `# Code Ninjas

> Coding for kids, ages 5–14. Game-based curriculum, belt-system progression, hands-on STEM. Franchise system — Amy services 35+ locations.

## Identity

| | |
|---|---|
| **Display name** | Code Ninjas |
| **Short name** | CN |
| **Website (national)** | https://www.codeninjas.com |
| **Location URLs** | \`https://www.codeninjas.com/locations/{state-slug}/{city-slug}\` — slugs vary, **always look up via ClickUp WEBSITE subtask** |
| **Industry** | Kids coding education (franchise) |
| **Recognition signal** | ISTE Seal of Approval |

## Visual identity

### Logos
- **Primary (color, for light bg):** \`https://storage.googleapis.com/logo-references/CN_Logo.svg\`
- **Alt PNG:** \`https://storage.googleapis.com/logo-references/CodeNinjas.png\`
- Verify exact filenames in the \`logo-references\` GCS bucket via \`web_fetch\` before embedding if uncertain.

### Image asset bucket
- \`https://storage.googleapis.com/codeninjas-social-content/references/\` — hero images, program tiles, instructor/dojo photos. Common filenames: \`JR_Gamemakers_02.jpg.jpg\`, \`JR_Bits_and_Bytes_05.jpg.jpg\`, \`Minecraft.png\`, etc.

### Canva brand kit
- ID: \`kAGMEcQrUx4\` (for supplemental graphics via Canva connector)

### Color palette

\`\`\`css
--cn-navy:       #1a1a2e;   /* deep navy background — outer email frame, dark hero on landing */
--cn-black:      #000000;   /* header bar background, hard contrast */
--cn-cream:      #f9f5f2;   /* warm off-white — email body background */
--cn-lime:       #adef32;   /* signature CN lime — eyebrows, badges, accent borders, location tags */
--cn-teal:       #0097b2;   /* hero gradient start */
--cn-blue-mid:   #338fbf;   /* hero gradient mid, footer links */
--cn-blue:       #15a9ff;   /* hero gradient end, CTA button */
--cn-text-light: rgba(255,255,255,0.45);   /* footer copy on dark bg */
\`\`\`

### Typography
- **Display:** Barlow Condensed (Google Fonts) — weights \`400 600 700 800 900\`
- **Body:** Barlow (Google Fonts) — weights \`400 500 600\`
- **Tracking:**
  - Hero eyebrow: \`letter-spacing: 3px\` (uppercase)
  - Location tag / pill labels: \`letter-spacing: 2px\` (uppercase)

\`\`\`html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet">
\`\`\`

### Signature design moves

CN emails generally follow **one of two structural patterns** — choose based on email purpose:

**Pattern A: Multi-program roundup** *(spring break camps, summer camp lineup, "what's new this month")*
- **Dark navy outer** (\`#1a1a2e\`) + **cream inner** (\`#f9f5f2\`)
- **Dark header** (\`#000000\`) with logo on left, **lime-bordered location tag on right** (e.g., "SAMMAMISH, WA")
- **Gradient hero** — teal → blue diagonal (145deg). Decorative lime circle in top-right corner, soft white circle bottom-left
- **Lime eyebrow** for date / time / category lines above headlines
- **Split-line modern headlines**: "Spring Break / Mode: ON" — two lines, second line emphasized
- **"Intro strip"** section between hero and content cards — pulled-quote feel
- **Camp card grid** (image-top, alternates wide cards image-left for rhythm)
- **Urgency line** with ⚡ emoji: "⚡ Only 8 spots per session — spots are filling fast!"

**Pattern B: Single-program spotlight** *(one camp, one new program, one tournament — focused storytelling)*
- **White content card** (\`#ffffff\`) on neutral page bg (\`#f4f4f4\`), \`border-radius: 8px\`, overflow hidden
- **Black header** (\`#000000\`) with **centered logo + blue eyebrow + bold white H1 + colored subheadline**
  - Eyebrow style: \`font-size: 13px; color: #338fbf; letter-spacing: 3px; text-transform: uppercase\` (e.g., "SAMMAMISH, WA • CAMP SPOTLIGHT")
- **Full-width hero image** below header (program photo, no overlay)
- **Pill badge** introducing the email: small uppercase tag in \`#338fbf\` background, white text, letter-spacing 2px (e.g., "NEW THIS SUMMER")
- **Stacked content cards in supporting pastel tints**:
  - Light blue card (\`#dbeeff\` bg, \`#c0d8ef\` divider lines) — "What Ninjas Will Learn" / feature list
  - Warm peach card (\`#fff3e0\`) — pathway / "what this leads to" framing
  - Light green card (\`#e8f5e9\` outer, \`#c8e6c9\` nested) — outcomes, parent-facing detail
- **Arrow bullets** (\`→\` rendered as \`&#8594;\`) in \`#338fbf\` instead of standard bullets — pairs with brand-colored bold prefix
- **Nested callout box** inside a card (darker shade of the card's color family) to emphasize a key parent-facing fact
- **Centered CTA block**: short framing sentence + single blue button (\`#338fbf\` bg, white text, \`border-radius: 6px\`)
- **Black footer** with smaller logo + single-line location text

Both patterns are on-brand. Pattern A is energetic and program-dense; Pattern B is editorial and single-focus. Pick based on whether the email is a roundup or a spotlight.

### Supporting pastel card tints (Pattern B)

These are **content-card backgrounds**, not core palette — they let multiple cards stack without competing with the CN brand colors. Use sparingly and only as card fills:

\`\`\`css
--cn-card-blue:    #dbeeff;   /* light blue card bg */
--cn-card-blue-line: #c0d8ef; /* divider/border inside blue card */
--cn-card-peach:   #fff3e0;   /* warm peach card bg */
--cn-card-green:   #e8f5e9;   /* light green card bg */
--cn-card-green-nested: #c8e6c9; /* nested callout inside green card */
--cn-card-green-text: #1b5e20; /* nested callout text */
\`\`\`

## Voice

### Audience
**ALWAYS parents, NEVER kids.** Parents are the buyer. Kids are the user. Headlines like "Watch Your Kid Build Their First Game" not "Build Your First Game Today!" This is the single most-broken rule when AI generates CN content.

### Tone
Enthusiastic + credible. Game-positive, screen-time-positive (reframe: "screen time → skill time"). No exclamation point overuse. Confidence without hype.

### Signature vocabulary (use these)
- **Ninjas** = the kids/students
- **Senseis** = the instructors
- **Dojo** = the center/location
- **IMPACT** = the proprietary learning platform
- **Belts** = the progression system (white → yellow → orange → green → blue → purple → brown → black)
- **Prodigy Program** = the elite-tier opportunity (Microsoft HQ trips, etc.)
- **CREATE** (ages 8–14) = the flagship Core program
- **JR** (ages 5–7) = pre-reading younger ninja program
- **CAMPS** = paid week-long programs
- **AI Academy / Robotics Academy** = multi-week themed modules
- **FLL** / **FIRST® LEGO League** = robotics competition pathway CN runs camps and ongoing programs around. *(Always include the ® on FIRST when written formally.)*
- **"Show Me" session** = parent-invited moment during camps/tournaments where families can see their Ninja's work in action — real CN program detail, use when relevant

### Brand phrases that work
- "Hands-on coding"
- "Building games and apps"
- "From beginner to advanced"
- "Turn screen time into skill time"
- "Watch your kid build their first game"
- "We make coding fun" *(the national tagline — use sparingly, don't overuse)*
- "Empower their future"
- "Unleash their inner ninja"

### Banned phrases
- "World-class" / "best-in-class" / "cutting-edge"
- "Transform your child" / "unlock their potential"
- "Game-changing" / "life-changing"
- Anything written *to* the child ("Hey ninja!" "Wanna build your first game?")
- Don't overuse "!" — punchy beats peppy

### "Journey" — qualified, not banned
Abstract self-improvement "journey" language is off-brand (banned for kids brands generally). But CN copy DOES use "journey" when it's **qualified with something concrete**: "robotics journey", "coding journey", "their Ninja's progression journey". The qualifier saves it. Abstract use ("start your journey today!") is still off-brand.

### CRITICAL copy rules (also enforced in Google Ads)

These are HARD rules — break them and the campaign fails compliance review or underperforms:

- **Core Programs emails** (CREATE, JR, Academies): MAY use "Free Discovery Session" or "Free Trial" language (interchangeable). Allowed CTAs: "Schedule Discovery Session", "Start Your Free Trial", "Try a Free Session".
- **Summer Camp emails:** MUST NOT use trial/discovery/free session language. Camps are PAID. Allowed CTAs: "See Our Full Schedule", "Sign Up Now", "Book Your Camp".
- **Every email must include "Code Ninjas"** prominently in a headline or eyebrow.

## Business facts

### Programs offered

| Program | Ages | Format | Pricing model |
|---|---|---|---|
| **CREATE** | 8–14 | Year-round Core | Monthly membership |
| **JR** | 5–7 | Year-round Core | Monthly membership |
| **AI Academy** | varies | Multi-week module | Per-module |
| **Robotics Academy** | varies | Multi-week module | Per-module |
| **CAMPS** | 5–14 | Week-long, school breaks | Per-week, paid |
| **Prodigy Program** | Top performers | Invitation only | N/A (program perk) |

### Common CTAs (national pattern)
- **Book a free discovery session** *(Core programs only — never for camps):* \`https://www.codeninjas.com/schedule-tour\` (national) or per-location member URL
- **Register for a camp / browse camp schedule** *(public-facing camp landing):* \`https://www.codeninjas.com/{state-city-slug}/camps\` (e.g., \`/wa-sammamish/camps\`)
- **Member portal / camp booking** *(deep link into purchase flow):* \`https://members.codeninjas.com/e/?=cn{LOCATION_SLUG}/...\` — **always pull location-specific URL from ClickUp WEBSITE subtask**

> **Public camps page vs. member portal:** The \`www.codeninjas.com/{slug}/camps\` URL is the marketing landing page (good for "browse all camps" CTAs). The \`members.codeninjas.com\` deep link is the booking flow (good for "Register Now" CTAs once parents are decided). Pick based on funnel stage.

### Operational hours (default, varies by location)
- Tues–Fri: 3:00 PM – 7:00 PM
- Sat: 9:30 AM – 3:00 PM

### Locations Amy services (35 across the US)
Maintained in \`_locations/locations.json\` (the Code Ninjas Cowork Project) — single source of truth for member URLs, addresses, social handles. Check ClickUp WEBSITE subtask for canonical landing page URL per location.

## ClickUp lookup pattern

Lists named \`CN_LocationName\` with **no spaces** (e.g., \`CN_ParadiseValley\`, \`CN_OrlandoWaterfordLakes\`, \`CN_Frisco\`).

Check **both spaces** — they're split by service tier:

| Space | Locations |
|---|---|
| **CODE NINJAS** | Full-service clients (most locations) |
| **ADS ONLY** | Paradise Valley, Summerlin, Frisco, High Point, Greensboro, Silverlake, Northridge |

Within each list, the **WEBSITE subtask** contains the canonical landing page URL. Always pull this — slugs vary (\`az-paradise-valley-village\`, \`fl-orlando-waterford-lakes\`, \`tx-frisco\`). Never guess.

## Known quirks

- **Cloudflare email obfuscation**: \`codeninjas.com\` obfuscates \`mailto:\` addresses. \`web_fetch\` returns \`[email protected]\` strings. Don't try to extract email addresses from fetched HTML — pull from ClickUp or ask the user.
- **Member URL parameter format**: \`https://members.codeninjas.com/e/?=cn{slug}/504/200426//1774988694\` — the trailing digits stay consistent across locations; only \`{slug}\` changes.
- **Per-location social handles**: instagram.com/codeninjas{location} pattern (e.g., codeninjassammamish). Pull from ClickUp custom field, don't guess.

## Structural moves that work

Editorial patterns that show up in great CN emails:

| Move | When to use |
|---|---|
| **Dark navy outer + cream inner** | Default. Frames the email and matches the game-aesthetic vibe. |
| **Black header + lime location tag** | Always. Establishes brand identity immediately. |
| **Gradient hero with decorative circles** | Hero section — gives motion/energy without being cheesy. |
| **Lime eyebrow** above headline | Dates, ages, "NEW", category labels. |
| **Split-line emphatic headline** | "Spring Break / Mode: ON" pattern works for any campaign. |
| **Intro strip** between hero and cards | Frame the "why this matters" in 1–2 sentences with bolded outcome words. |
| **Camp card grid** (2-col on desktop, 1-col mobile) | Multi-camp roundups. |
| **Wide alternating card** (image-left, text-right) | Spotlighted single program; break up grid rhythm. |
| **Urgency line with ⚡** | When real ("8 spots per session"). Never fake urgency. |
| **Schedule/details strip** | Camp emails — show date, time, location at a glance. |
| **Instagram follow CTA** above footer | Most CN emails include this — drives local social engagement. |

## Footer pattern

Dark bg (\`#1a1a2e\` or \`#000\`), small-print copy, links in \`#338fbf\`:

\`\`\`
[CN logo, smaller]

[Location] Code Ninjas
[Street address]
[City, State ZIP]
[Phone]

Follow: [FB] [IG] [Twitter/X] [LinkedIn]

Unsubscribe · Update Preferences · Privacy Policy

Code Ninjas © [YEAR] All Rights Reserved.
\`\`\`

**TCPA / consent note (when collecting phone via form):** include the standard "I agree to receive informational calls and SMS messages... consent is not a condition of purchase... Reply STOP to opt out" disclaimer.

## Example emails
- ✅ \`examples/code-ninjas/fll-mission-of-the-bots.html\` — **Pattern B (single-program spotlight)** structural reference. Sammamish FLL robotics camp announcement. Black header + blue eyebrow + hero image + pastel content cards (light blue / peach / green) + nested parent callout + blue CTA button + black footer. Use this when building any single-program camp spotlight email.
- *(Pattern A multi-program roundup example — still needed; the Sammamish spring break campaign or any similar would close the loop.)*

## Related Claude Projects / context

If working from claude.ai with the **Code Ninjas Cowork Project**, the deeper context lives in:
- \`_brand/brand_kit.md\` — colors, fonts, logos (matches this file)
- \`_brand/voice_rules.md\` — extended voice rules
- \`_brand/known_quirks.md\` — technical pitfalls
- \`_locations/locations.json\` — every location's URLs, addresses, social
- \`_automations/\` — Make/ClickUp/Notion routing for CN work
`;
