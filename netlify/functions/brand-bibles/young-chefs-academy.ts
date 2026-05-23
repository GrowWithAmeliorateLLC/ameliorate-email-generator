// AUTO-GENERATED. Edit /skill-v2/clients/young-chefs-academy.md and regenerate.
// Do not hand-edit this file.

export const YOUNG_CHEFS_ACADEMY: string = `# Young Chefs® Academy

> National kids cooking franchise (20+ years, "nation's original children's cooking franchise"). Hands-on culinary classes, parties, camps, workshops, field trips, plus adult/family courses. Amy currently serves **Pittsburgh East PA**, with potential to expand to other franchise locations.

## Identity

| | |
|---|---|
| **Display name** | **Young Chefs® Academy** *(the ® is part of how the brand writes itself)* |
| **Short name** | YCA or Young Chefs® |
| **Parent website** | https://youngchefsacademy.com |
| **Currently-active location** | **Pittsburgh East PA** — \`https://pittsburgheastpa.youngchefsacademy.com\` |
| **Industry** | Kids culinary education franchise (multi-location, parent-brand + franchisees) |
| **Tagline** | "Cooking Classes for Kids of all Ages!" |
| **Positioning** | "The nation's original children's cooking franchise" |
| **Heritage signal** | "For twenty years Young Chefs® Academy has been the leader in teaching kids the joy and value of culinary arts" |
| **Network rating** | 4.7 stars on Google · 1,359 reviews (aggregated brand-wide) |
| **As Seen On** | CNN, ABC, Food Network, Working Mother, Inc., Disney, Fox, Blippi |
| **Booking platform** | **WellnessLiving** — \`wellnessliving.com\` (same as Romp n' Roll; per-location k_business IDs) |
| **CMS** | WordPress (Sage theme + Tailwind) |

### URL pattern across the franchise network
- **Parent corporate site:** \`youngchefsacademy.com\`
- **Franchise location sites:** \`{locationname}.youngchefsacademy.com\` — slugs combine city + direction + state (e.g., \`pittsburgheastpa\` = Pittsburgh East PA)
- **Common per-location paths (consistent across all franchises):**
  - \`/weekly-classes/\`
  - \`/culinary-camps/\`
  - \`/parties/\`
  - \`/workshops-special-events/\`
  - \`/field-trips/\`
  - \`/group-events/\`
  - \`/adults-and-families/\`
  - \`/intro-class/\` *(the primary acquisition CTA)*
  - \`/about-us/\`
  - \`/contact/\`

## Visual identity

> ✅ Colors **confirmed** from CSS variables on the live Pittsburgh East PA site (\`--wp--preset--color--brand-*\` tokens in the WordPress/Sage theme).

### Logos
- **Primary logo (cropped favicon):** \`https://youngchefsacademy.com/wp-content/uploads/2025/01/cropped-YCA-Logo-270x270.png\`
- **Inline SVG logo** is embedded directly in the header/footer of every page — green wordmark with the orange running-chef figure. Two-color: \`#17AA4A\` (the leaf/flourish), \`#F47523\` (the chef figure), \`#183B29\` (the "Young Chefs Academy" wordmark).

### Color palette
\`\`\`css
/* CONFIRMED from live CSS variables on pittsburgheastpa.youngchefsacademy.com */

/* Greens — the brand's anchor */
--yca-green-dark:    #183B29;   /* primary brand green — hero backgrounds, wordmark, headings */
--yca-green-light:   #17AA4A;   /* accent green — leaf flourishes, secondary highlights */

/* Orange — the signature CTA color */
--yca-orange:        #F47523;   /* every primary button, the running-chef icon, key accents */

/* Neutrals */
--yca-ink:           #27282c;   /* body text — very dark cool gray, near-black */
--yca-paper:         #FFFFFF;   /* primary surface */
--yca-anthracite:    #1C1F22;   /* footer background — Tailwind \`.bg-anthracite\` (approx; dark cool gray) */
--yca-card-border:   rgba(0, 14, 51, 0.06);  /* subtle card border — #000e330f at 1px */
\`\`\`

**Hierarchy in use:**
- **Dark green (#183B29)** = section backgrounds (hero, dark sections), headings on light backgrounds, the wordmark
- **Light green (#17AA4A)** = small accents and the logo flourish — NOT used as a background; never paired with white text in large blocks
- **Orange (#F47523)** = the *only* CTA color. Every button on the site. Don't dilute by using it elsewhere as a background.
- **White (#FFFFFF)** = primary surface for cards + body text on dark green
- **Anthracite** = footer only

### Typography
> The Sage theme bundles fonts via \`app.css\`, so the exact \`font-family\` isn't in the page source. Visually the brand reads as a **bold modern sans-serif** — heavy headings (font-weight 700–900), uppercase letter-spaced CTA buttons, comfortable body text.
>
> **Safe email font stack** *(best-guess + reliable fallback)*:
> \`\`\`css
> font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
> \`\`\`
> Poppins is the closest match to the brand's friendly geometric character. Optional Google Fonts import for the hero/heading only — body should use the fallback stack to stay email-safe.

**Typographic moves:**
- **Headings:** bold to extra-bold (700–900), tight line-height (~1.1), often paired with \`<strong>\` inside the heading text itself
- **Body:** regular weight, line-height 1.5–1.6, dark cool gray (\`#27282c\`)
- **Buttons:** ALL CAPS, \`letter-spacing: 0.05em\`, \`font-weight: 700\`, no underline, slight border-radius (~4–6px, NOT pill)
- **\`<strong>\` is used aggressively inside body copy** — the brand bolds key phrases mid-sentence for emphasis, not just for headings

### Stock program imagery (used network-wide)
- Cooking class tile: \`https://youngchefsacademy.com/wp-content/uploads/2025/02/Class-1.png\`
- Party tile: \`https://youngchefsacademy.com/wp-content/uploads/2025/02/Party.png\`
- Camp tile: \`https://youngchefsacademy.com/wp-content/uploads/2025/02/Camp-1.png\`
- Reviews badge: \`https://youngchefsacademy.com/wp-content/uploads/2025/02/Google-Reviews.png\`
- Lifestyle photo 1: \`https://youngchefsacademy.com/wp-content/uploads/2025/03/original-E087EC1E-12A8-4E7C-B9F5-299F3AC89673-1.jpg\`
- Lifestyle photo 2: \`https://youngchefsacademy.com/wp-content/uploads/2025/03/photo-for-website-1.jpg\`

## Voice

### Audience
- **Primary:** Parents of kids ages ~4-14 (the brand says "Kids of all Ages!")
- **Secondary:** Adults and families seeking together-time cooking experiences (own audience block — \`/adults-and-families/\`)
- **Tertiary buyers:** Birthday party planners, scout/group leaders, school field-trip coordinators
- **Common parent context:** Wanting hands-on enrichment that isn't another screen-based activity; valuing "life skills" framing; preferring discovery over correction (NOT looking for "fix my picky eater")

### Tone — warm, joyful, discovery-oriented
The brand is built on **joy, creativity, and discovery** — not skill remediation, not parent-anxiety messaging, not "fix your kid." Cooking is positioned as art + science + life skill + bonding experience, in that order.

**Cooking is:**
- Joyful, creative, hands-on
- A path to confidence and independence
- A lifelong skill
- An adventure of flavors, cultures, techniques
- A bonding activity (family courses)

**Cooking is NOT (in this brand):**
- A diet intervention
- A "fix picky eater" tactic
- A weight/health concern
- A chore disguised as fun

### Signature phrases (use these — they're approved YCA language)
- "Cooking Classes for Kids of all Ages"
- "Hands-on environment"
- "Develop, build upon, and sharpen their culinary skills"
- "Immerses young chefs in a world of culinary creativity and discovery"
- "Building skills that last a lifetime"
- "Lifelong love of cooking"
- "Independence, teamwork, and a deeper appreciation for the culinary arts"
- "Creative meal preparation"
- "Proper food handling, kitchen safety, culinary techniques"
- "Themed workshops celebrate holidays, special interests, and community events"
- "Multi-day camps deliver hands-on adventures"
- "Master skills week by week"
- "Inspiring a lifelong love of cooking through creativity and play in the kitchen"
- "Mastering sauces" / "Measuring ingredients" *(specific concrete techniques sell the curriculum)*

### Signature vocabulary (use these — they're brand assets)
- **"Young Chefs"** = the students (always plural, capitalized)
- **"Culinary arts"** *(not "cooking" alone — the brand intentionally elevates it)*
- **"Curriculum"** *(structured progression is part of the differentiator vs. one-off "cooking parties")*
- **"Hands-on"** *(repeat — this is the brand's chief differentiator)*
- **"Intro Class"** = the trial / first-touch product. Specific phrase, not "free class" or "trial."
- **"Camps"** = multi-day immersive (3-hour sessions, summer + seasonal)
- **"Workshops"** = single-session, themed (holidays, special events)
- **"Weekly Classes"** = year-round structured program
- **"Field Trips"** = school/group hosted at YCA
- **"Group Events"** = scouts, sports teams, etc.

### Banned phrases
- **Diet-culture language:** "healthy eating," "low-cal," "lose weight," "burn calories," "guilt-free," "low-fat" — YCA is about culinary joy, NOT dietary intervention. Stay positive and discovery-framed.
- **Body-image content:** any reference to a child's body, weight, or appearance.
- **"Picky eaters"** / "fix your kid" / "get them to eat vegetables" framing — repositions cooking as parent-anxiety-tactic. Off-brand.
- **"Edutainment"** / "secretly educational" — the brand sells education AS entertainment; no need to apologize for it.
- **"World-class" / "best-in-class" / "premier"** — banned per the kids-brand rule set.
- **"Transform your child"** / "unlock potential" / "game-changing" — off-brand for the warm, discovery tone.
- **"Journey"** as abstract self-improvement *(qualified is fine: "culinary journey", "20-year journey")*.
- **Anything written *to* the child** — emails go to parents.

### Copy rules
- **Lead with the experience, not the schedule** — what the child will *do* and *create*, not "we have classes Tuesdays."
- **Name specific techniques and dishes** — "mastering sauces," "knife skills," "pasta from scratch," "global cuisines" — the specificity sells.
- **Use "® " on first mention of the brand name** — "Young Chefs® Academy" — and once is enough per email.
- **Order of programs in lists** *(Amy's documented strategic priority for paid placements like GBP)*:
  1. Summer / seasonal camps *(highest demand)*
  2. Year-round weekly classes
  3. Workshops (themed/holiday)
  4. Parties / Field trips / Groups / Adults *(supplementary)*
- **Intro Class is the conversion event** — every email funnels new prospects there, not directly to weekly enrollment. (Compare to: Lazar's free consultation; Gramercy's free first lesson.)
- **Reviews + "As Seen On" are network-level credibility** — the 1,359 Google reviews and CNN/ABC/Food Network/Disney/Fox media features are brand-wide trust signals. Use sparingly but they hammer hard when used.

## Business facts

### Programs offered

| Program | Audience | Format |
|---|---|---|
| **Weekly Classes** | Kids (ages tier varies by location) | Year-round, structured curriculum, ~1 hour/week, progression-based |
| **Culinary Camps** | Kids | 3-hour sessions, multi-day (summer + spring break + winter break) |
| **Workshops & Special Events** | Kids | Single-session, themed (holidays, special interests, seasonal) |
| **Parties** | Kids | Birthday parties (hands-on cooking experience) |
| **Field Trips** | School groups | Group visits to the academy |
| **Group Events** | Scouts, sports teams, etc. | Custom group experiences |
| **Adults & Families** | Adults / parent-child | Adult-only or family-together cooking courses |

### Intro Class
- The primary new-family acquisition product
- Per-location URL pattern: \`/{location-subdomain}/intro-class/\`
- This is the trial / first-touch — every email funneling new families should point here, not to full enrollment

### Pittsburgh East PA — Active Location

| | |
|---|---|
| **Address** | 6 Torrens Street, Pittsburgh, PA 15206 |
| **Phone** | (412) 540-3505 |
| **Website** | https://pittsburgheastpa.youngchefsacademy.com |
| **URL slug** | \`pittsburgheastpa\` *(NOT \`pittsburgheast\`, NOT \`pittsburghpa\` — the slug uses city + direction + state)* |
| **Intro Class CTA** | https://pittsburgheastpa.youngchefsacademy.com/intro-class/ |
| **Facebook** | https://www.facebook.com/YoungChefsPittsburghEast |
| **Instagram** | https://www.instagram.com/YoungChefsPittsburghEast |
| **WellnessLiving Gift Cards** | https://www.wellnessliving.com/rs/catalog-view.html?k_business=744725&id_sale=7&k_id=172053 |
| **WellnessLiving k_business ID** | 744725 *(use for any direct booking/catalog deep-links)* |

### Past Amy work for this client
- **April 2026 — Google Business Profile description revision** for the Pittsburgh East location. Strategic reorientation: led with summer camps → year-round classes → workshops → supplementary offerings. Approved copy is in chat history (\`2dfe7ba0\`). Reference for voice tone.

## Structural moves that should work

| Move | Why it fits YCA |
|---|---|
| **Dark-green hero with orange CTA** | The signature visual: deep green background (\`#183B29\`), white text, single orange button (\`#F47523\`). Mirrors the homepage hero exactly. Optional white "View on Google · 4.7 (1,359 reviews)" badge underneath the CTA. |
| **3-tile program row** (Classes / Camps / Parties) | Mirrors their own homepage structure — proven. Each tile = white card, subtle border (\`#000e330f\` at 1px), border-radius 10px, 16:9 image with rounded corners, bold heading, body copy, orange CTA at bottom. |
| **"As Seen On" media logo strip** | CNN / ABC / Food Network / Disney / Fox / Working Mother / Inc. / Blippi — strong network-level credibility. White background, grayscale or full-color logos in a row. |
| **Google Reviews badge** with the 4.7 / 1,359-reviews framing | Brand-wide trust signal. Often paired with the rating image asset. |
| **Lifestyle photo grid** (kids in chef hats, in-action cooking shots) | The brand sells the *experience*, not the facility — photo-driven. Use 2-image side-by-side with rounded corners (20px). |
| **Themed-camp / themed-workshop card** | Themes are how camps differentiate — global cuisines, holiday workshops, etc. |
| **"What Parents Are Saying" testimonial block** | Their own header phrasing — use it. Typically on a green background section. |
| **Intro Class CTA** as the primary conversion action | Their funnel anchor. |
| **Heritage callout** ("20 years," "nation's original children's cooking franchise") | Specific, unique, credible. |
| **Anthracite-dark footer** with address + phone + per-location social | Matches the site's actual footer — dark cool gray bg, white text, simple list of links. |

### Button styling reference (use this exactly for primary CTAs)
\`\`\`css
/* Primary CTA — the YCA signature button */
.cta-primary {
  background-color: #F47523;          /* brand orange */
  color: #FFFFFF;
  border: 1px solid #F47523;
  padding: 12px 28px;
  font-family: 'Poppins', -apple-system, sans-serif;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 4px;                 /* subtle rounding, NOT pill */
  text-decoration: none;
  display: inline-block;
}

/* Secondary CTA (used in hero — white button on dark-green bg) */
.cta-secondary {
  background-color: #FFFFFF;
  color: #183B29;                     /* brand green */
  /* same padding/typography as primary */
}
\`\`\`

### Section-background reference
| Section type | Background | Text color |
|---|---|---|
| Hero | \`#183B29\` (dark green) + optional photo/video overlay at 27% opacity | \`#FFFFFF\` white |
| Card row / standard content | \`#FFFFFF\` white | \`#27282c\` ink |
| Testimonial block | \`#183B29\` dark green with optional background image | \`#FFFFFF\` white |
| Footer | \`#1C1F22\` anthracite (approximate) | \`#FFFFFF\` white |

## Footer pattern

\`\`\`
[Anthracite-dark background, #1C1F22, white text]

[Young Chefs® Academy logo — wordmark + chef icon, scaled to ~80px width]

[Programs row — horizontal links, white, no underline]
Cooking Classes  ·  Culinary Camps  ·  Kids Parties  ·  Workshops  ·  About Us  ·  Contact

[Two-column section]
Left column:
  Young Chefs Academy of Pittsburgh East, PA
  6 Torrens Street
  Pittsburgh, PA 15206
  (412) 540-3505
  
  [Facebook icon] · [Instagram icon]

Right column (optional):
  Newsletter signup or featured CTA

[Thin divider line: 1px, rgba(0,0,0,0.5)]

© [YEAR] Young Chefs® Academy. All Rights Reserved.
Unsubscribe · Update Preferences
\`\`\`

## Known quirks

- **The ® matters** — "Young Chefs® Academy" is how the brand writes itself. Include on first mention in any email. Subsequent mentions can drop it.
- **URL slug oddity** — Pittsburgh East PA is \`pittsburgheastpa.youngchefsacademy.com\`, not \`pittsburgheast.\` or \`pittsburghpa.\`. Verify any other location's slug from their \`/locations/\` page before linking.
- **Multi-location franchise** — emails should be location-specific (address, phone, social handles) even if the program copy comes from the national brand. Pull location specifics from each franchise's subdomain footer.
- **Booking platform is WellnessLiving** — same as Romp n' Roll. CTAs that go deep into booking flows use WellnessLiving URLs (k_business per location). For most emails, the simpler CTA is the per-location Intro Class page.
- **Network mission statement is brand-wide** — every location uses the same mission line. Treat as canonical.
- **"Cooking" vs "Culinary"** — both are used, but "culinary arts" carries the elevated framing the brand wants. "Cooking" works for casual/joyful copy; "culinary" for credibility/curriculum copy. Mix intentionally.
- **20-year heritage update** — the brand recently updated copy from "more than a decade" to "twenty years." Use the current "twenty years" framing.
- **Don't blur with adult cooking schools** — YCA primary brand is kids. Adult courses are a real but secondary offering, NOT the lead.
- **Orange is precious** — \`#F47523\` is *only* used for buttons and the chef-figure logo accent. Don't use it as a background or for plain text — that dilutes the CTA signal.

## Example emails
- \`examples/young-chefs-academy/\` — *(empty — no past YCA emails built yet)*

> **Gap:** Past work for YCA includes a Google Business Profile revision (April 2026) but no email campaigns. To close this:
> 1. **Send any past YCA email** (Mailchimp / GHL / Constant Contact / WellnessLiving) — best option
> 2. **First email we build via Claude becomes the structural reference**

## Open items to confirm
- [x] ~~Exact hex codes~~ ✅ Confirmed: \`#183B29\` dark green, \`#17AA4A\` light green, \`#F47523\` orange, \`#27282c\` body ink, \`#1C1F22\`-ish anthracite footer
- [ ] Exact font-family (best guess: Poppins; system sans-serif fallback works fine for emails)
- [ ] Full uncropped logo URL *(the SVG is embedded in every page — could be extracted)*
- [ ] Pittsburgh East owner / point-of-contact name
- [ ] Pittsburgh East specific age tiers (the network says "all ages" — but each location typically has structured age groups; pull from their \`/weekly-classes/\` page when known)
- [ ] Current promotional offers / camp themes for the season
- [ ] Sender email domain for outbound marketing (a \`@pittsburgheastpa.youngchefsacademy.com\` mailbox, a \`@yca-pittsburgheast.com\`, or routed through Amy's agency address)
- [ ] Other YCA franchise locations Amy currently serves or plans to add
`;
