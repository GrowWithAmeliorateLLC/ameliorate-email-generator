function buildSectionPrompt(bk: any, colors: Colors, ctaLink: string, contentSnippet: string, eventDetails: string, emailType: string, imageSlots: string, currentYear: number): string {
  return `You are building a structured marketing email. Return ONLY a valid JSON object — no explanation, no markdown.

BRAND:
  Name: ${bk.brandName || 'the client'}
  Button color: ${colors.button} — use EXACTLY this for CTA buttons and card accent bars
  Heading color: ${colors.heading} — use EXACTLY this for h1/h2 text
  Primary color: ${colors.primary} — use EXACTLY this for section labels, borders, accents
  Logo: ${bk.logoUrl || '(none)'}

CURRENT YEAR: ${currentYear}

OUTPUT FORMAT: { "sections": [ ...section objects... ] }

SECTION TYPES:

{ "type": "alert", "text": "ONE LINE of urgency text", "urgent": true|false }
  → Use ONLY when there is genuine urgency: limited spots, deadline, promo code.
  → MUST be the FIRST section in the array (before hero) when used.

{ "type": "hero", "headline": "...", "subtext": "...", "image_url": "URL_OR_EMPTY_STRING", "image_alt": "...", "cta_text": "..." }
  → ALWAYS include. ALWAYS use IMAGE_1 from image slots if available — never leave image_url empty when an image is provided.
  → cta_text should be action-oriented: "Enroll Now", "Register Today", "Book Your Spot", etc.

{ "type": "photo", "image_url": "URL", "alt": "...", "linked": true }
  → Use a second image for visual pacing between sections. Only if IMAGE_2+ is available.

{ "type": "intro", "label": "EYEBROW TEXT", "headline": "...", "body": "..." }
  → Use for context, details, or logistics about a SINGLE event/program.
  → Use this instead of cards when there is only ONE program/camp/event being promoted.

{ "type": "cards", "label": "SECTION LABEL", "items": [
    {
      "accent_color": "HEX",
      "icon": "EMOJI",
      "title": "...",
      "badges": [{"text":"...","type":"audience|price|status|format"}],
      "body": "...",
      "tags": ["tag1","tag2"],
      "date": "...",
      "cta_text": "...",
      "cta_url": "..."
    }
  ]
}
  → Use ONLY when promoting MULTIPLE DISTINCT programs, camps, or sessions (2+).
  → DO NOT use cards to break one single event into sub-activities or features.
  → Card cta_text: ONLY add when each card links to a DIFFERENT URL. If all cards share the same CTA URL, omit cta_text entirely — the final CTA section handles it.
  → Vary accent_color across cards for visual interest.

{ "type": "proof", "stat": "SHORT_STAT", "quote": "...", "attribution": "..." }
  → stat MUST be a SHORT value: a number, rating, or percentage. e.g. "500+", "4.9★", "98%". NEVER a full sentence.
  → If you only have a testimonial quote, omit stat entirely and just use quote + attribution.

{ "type": "urgency", "headline": "...", "body": "...", "code": "PROMO_CODE_IF_ANY" }
  → Orange callout box. For enrollment deadlines, limited spots, or promo codes.

{ "type": "cta", "headline": "...", "body": "...", "button_text": "...", "button_url": "..." }
  → ALWAYS the LAST section. One clear action. Use strong action text: "Enroll Now", "Book Your Spot", etc.

{ "type": "infostrip", "items": [{"icon": "EMOJI", "text": "..."}] }
  → Lightweight facts row: date, time, location, age range, spots remaining.

SECTION ORDER RULES:
1. "alert" (if needed) — MUST be first
2. "hero" — always second (first if no alert)
3. "intro" or "cards" — for details/programs
4. "infostrip" — for key logistics (date, time, location)
5. "proof" — testimonial or stat
6. "urgency" — if there's a deadline or promo
7. "cta" — always last

CRITICAL RULES:
- "alert" must come BEFORE "hero" in the sections array
- ALWAYS use IMAGE_1 in the hero image_url field when images are provided below
- Use "cards" ONLY for multiple distinct programs — NOT to list features of one program
- Card cta_text: omit unless each card has a unique booking URL
- "proof" stat must be short (number/rating/%) — never a full sentence
- NEVER add a footer

IMAGE SLOTS — use IMAGE_1 in hero.image_url:
${imageSlots}

EMAIL PURPOSE: ${emailType || 'general promotional email'}
${eventDetails ? `\nEVENT DETAILS:\n${eventDetails}` : ''}

WEBSITE CONTENT:
${contentSnippet || '(use brand name and email purpose)'}

CTA URL: ${ctaLink}

Return ONLY the JSON object.`;
}