import type { Context } from "@netlify/functions";

// ─── Utilities ──────────────────────────────────────────────────────────────

function resolveUrl(src: string, base: URL): string {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return `${base.protocol}${src}`;
  if (src.startsWith('/')) return `${base.origin}${src}`;
  return `${base.origin}/${src}`;
}

function isLayoutColor(hex: string): boolean {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const brightness = (r + g + b) / 3;
  const isGray = Math.abs(r - g) < 22 && Math.abs(g - b) < 22 && Math.abs(r - b) < 22;
  return brightness < 20 || brightness > 228 || isGray;
}

// ─── Brand Extraction ────────────────────────────────────────────────────────

async function extractBrandKit(rawHtml: string, baseUrl: string) {
  const base = new URL(baseUrl);

  // Google Fonts
  const fonts: string[] = [];
  for (const u of (rawHtml.match(/fonts\.googleapis\.com\/css[^"'\s>]+/g) || [])) {
    for (const f of (u.match(/family=([^&"'\s]+)/g) || [])) {
      const name = decodeURIComponent(f.replace('family=', '').split(':')[0].replace(/\+/g, ' ')).trim();
      if (name && !fonts.includes(name)) fonts.push(name);
    }
  }

  // CSS files
  const cssUrls = (rawHtml.match(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi) || [])
    .map(m => { const h = m.match(/href=["']([^"']+)["']/i); return h ? resolveUrl(h[1], base) : ''; })
    .filter(u => u && !/font|google|gstatic|icon|awesome|bootstrap/i.test(u))
    .slice(0, 4);

  let cssText = (rawHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [])
    .map(s => s.replace(/<\/?style[^>]*>/gi, '')).join('\n');

  const cssResults = await Promise.allSettled(
    cssUrls.map(url => fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(4000) }).then(r => r.text()))
  );
  for (const r of cssResults) { if (r.status === 'fulfilled') cssText += '\n' + r.value; }

  // Fonts from CSS
  for (const decl of (cssText.match(/font-family\s*:\s*['"]?([^;'"`,\n]+)/gi) || [])) {
    const name = decl.replace(/font-family\s*:\s*/i, '').replace(/['"]/g, '').split(',')[0].trim();
    if (name && name.length > 1 && name.length < 40 && !fonts.includes(name)
      && !/inherit|initial|unset|sans-serif|serif|monospace|system-ui|cursive|Arial|Helvetica/i.test(name))
      fonts.push(name);
  }

  // Button color
  let buttonColor = '';
  for (const p of [/\.btn[^{,]*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i, /button[^{,]*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i, /\.cta[^{,]*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i]) {
    const m = cssText.match(p); if (m && !isLayoutColor(m[1])) { buttonColor = m[1]; break; }
  }

  // Heading color
  let headingColor = '';
  for (const p of [/\bh1\b[^{,]*\{[^}]*(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6})/im, /\bh2\b[^{,]*\{[^}]*(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6})/im]) {
    const m = cssText.match(p); if (m && !isLayoutColor(m[1])) { headingColor = m[1]; break; }
  }

  // CSS var primary/accent
  let primaryColor = '', accentColor = '';
  for (const p of [/--(?:color-)?primary(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i, /--brand(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i, /--main(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i]) {
    const m = cssText.match(p); if (m && !isLayoutColor(m[1])) { primaryColor = m[1]; break; }
  }
  for (const p of [/--(?:color-)?accent(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i, /--secondary(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i]) {
    const m = cssText.match(p); if (m && !isLayoutColor(m[1])) { accentColor = m[1]; break; }
  }

  // Most used color as final fallback
  const counts: Record<string, number> = {};
  for (const h of (cssText.match(/#[0-9a-fA-F]{6}\b/g) || [])) { if (!isLayoutColor(h)) counts[h] = (counts[h] || 0) + 1; }
  const mostUsed = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  // Logo
  let logoUrl = '';
  for (const p of [/<img[^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i, /<img[^>]*src=["']([^"']+)["'][^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["']/i, /<img[^>]*src=["']([^"']*logo[^"']+)["']/i]) {
    const m = rawHtml.match(p); if (m) { logoUrl = resolveUrl(m[1], base); break; }
  }

  // OG image
  const ogMatch = rawHtml.match(/<meta[^>]+(?:property=["']og:image["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:image["'])/i);
  const ogImage = ogMatch ? resolveUrl(ogMatch[1] || ogMatch[2] || '', base) : '';

  // Brand name
  const ogNameMatch = rawHtml.match(/<meta[^>]+(?:property=["']og:site_name["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:site_name["'])/i);
  const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
  const brandName = ((ogNameMatch ? (ogNameMatch[1] || ogNameMatch[2]) : titleMatch ? titleMatch[1] : '') || '').trim().split(/[|–\-]/)[0].trim();

  return {
    buttonColor: buttonColor || primaryColor || mostUsed,
    headingColor: headingColor || primaryColor || mostUsed,
    primaryColor: primaryColor || buttonColor || mostUsed,
    accentColor: accentColor || buttonColor || mostUsed,
    fonts: fonts.slice(0, 5), logoUrl, ogImage, brandName,
  };
}

// ─── Design System Components ────────────────────────────────────────────────

interface Colors { primary: string; heading: string; button: string; accent: string; }

function badge(text: string, type: 'audience' | 'price' | 'status' | 'format'): string {
  const styles: Record<string, string> = {
    status:   'background-color:#fee2e2;color:#991b1b;',
    audience: 'background-color:#f1f5f9;color:#475569;',
    price:    'background-color:#fef9c3;color:#713f12;',
    format:   'background-color:#dbeafe;color:#1e40af;',
  };
  return `<span style="display:inline-block;${styles[type] || styles.audience}font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;margin:0 4px 4px 0;letter-spacing:0.5px;text-transform:uppercase;white-space:nowrap;">${text}</span>`;
}

function pillButton(text: string, url: string, bg: string, fullWidth = true): string {
  return `
<table cellpadding="0" cellspacing="0" border="0" ${fullWidth ? 'width="100%"' : ''} style="border-collapse:collapse;margin-top:16px;">
  <tr>
    <td align="center">
      <a href="${url}" target="_blank" rel="noopener noreferrer"
         style="display:block;background-color:${bg};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:800;text-decoration:none;padding:17px 32px;border-radius:50px;text-align:center;${fullWidth ? 'width:100%;box-sizing:border-box;' : ''}line-height:1.2;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

// Section: Header
function sectionHeader(bk: any, colors: Colors): string {
  const inner = bk.logoUrl
    ? `<img src="${bk.logoUrl}" alt="${bk.brandName || 'Logo'}" width="180" style="max-width:180px;height:auto;display:inline-block;" referrerpolicy="no-referrer" />`
    : `<span style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${bk.brandName || ''}</span>`;
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr><td bgcolor="${colors.primary}" style="background-color:${colors.primary};padding:26px 32px;text-align:center;">${inner}</td></tr>
</table>`;
}

// Section: Alert bar
function sectionAlert(s: any, colors: Colors): string {
  const bg = s.urgent ? '#dc2626' : colors.primary;
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr><td bgcolor="${bg}" style="background-color:${bg};padding:11px 24px;text-align:center;">
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#ffffff;margin:0;letter-spacing:0.6px;text-transform:uppercase;">${s.urgent ? '🚨 ' : '📢 '}${s.text}</p>
  </td></tr>
</table>`;
}

// Section: Hero
function sectionHero(s: any, colors: Colors, ctaUrl: string): string {
  const imgSrc = s.image_url && !s.image_url.includes('%%') ? s.image_url : '';
  return `
${imgSrc ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td style="padding:0;line-height:0;"><a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="display:block;"><img src="${imgSrc}" alt="${s.image_alt || ''}" width="600" style="width:100%;max-width:600px;height:auto;display:block;" referrerpolicy="no-referrer" /></a></td></tr></table>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:36px 32px 28px;">
    <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:32px;font-weight:800;color:${colors.heading};margin:0 0 14px;line-height:1.2;">${s.headline}</h1>
    ${s.subtext ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#444444;margin:0 0 4px;line-height:1.6;">${s.subtext}</p>` : ''}
    ${s.cta_text ? pillButton(s.cta_text, ctaUrl, colors.button) : ''}
  </td></tr>
</table>`;
}

// Section: Photo break
function sectionPhoto(s: any, ctaUrl: string): string {
  if (!s.image_url || s.image_url.includes('%%')) return '';
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr><td style="padding:0;line-height:0;">
    ${s.linked !== false ? `<a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="display:block;">` : ''}
    <img src="${s.image_url}" alt="${s.alt || ''}" width="600" style="width:100%;max-width:600px;height:auto;display:block;" referrerpolicy="no-referrer" />
    ${s.linked !== false ? '</a>' : ''}
  </td></tr>
</table>`;
}

// Section: Intro/context block
function sectionIntro(s: any, colors: Colors): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:24px 32px;">
    ${s.label ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:${colors.primary};margin:0 0 10px;letter-spacing:1px;text-transform:uppercase;">${s.label}</p>` : ''}
    ${s.headline ? `<h2 style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;color:${colors.heading};margin:0 0 10px;">${s.headline}</h2>` : ''}
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#444444;margin:0;line-height:1.7;">${s.body}</p>
  </td></tr>
</table>`;
}

// Card component (inside cards section)
function buildCard(card: any, colors: Colors, defaultCtaUrl: string): string {
  const accentColor = card.accent_color || colors.accent;
  const badgesHtml = (card.badges || []).map((b: any) => badge(b.text, b.type)).join('');
  const tagsHtml = (card.tags || []).map((t: string) =>
    `<span style="display:inline-block;background-color:#f1f5f9;color:#475569;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;padding:4px 11px;border-radius:6px;margin:0 5px 5px 0;">${t}</span>`
  ).join('');

  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:16px;border-radius:8px;overflow:hidden;">
  <tr>
    <td width="5" bgcolor="${accentColor}" style="background-color:${accentColor};width:5px;min-width:5px;"></td>
    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:22px 24px;border:1px solid #e2e8f0;border-left:none;border-radius:0 8px 8px 0;">
      <!-- Title row -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:8px;">
        <tr><td>
          ${card.icon ? `<span style="font-size:20px;margin-right:8px;vertical-align:middle;">${card.icon}</span>` : ''}
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:19px;font-weight:800;color:${colors.heading};vertical-align:middle;">${card.title}</span>
        </td></tr>
        ${badgesHtml ? `<tr><td style="padding-top:7px;">${badgesHtml}</td></tr>` : ''}
      </table>
      <!-- Body -->
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#4a4a4a;margin:0 0 12px;line-height:1.65;">${card.body}</p>
      <!-- Feature tags -->
      ${tagsHtml ? `<div style="margin-bottom:12px;">${tagsHtml}</div>` : ''}
      <!-- Date/session -->
      ${card.date ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#64748b;margin:0 0 12px;">📅 ${card.date}</p>` : ''}
      <!-- Card CTA -->
      ${card.cta_text ? pillButton(card.cta_text, card.cta_url || defaultCtaUrl, accentColor) : ''}
    </td>
  </tr>
</table>`;
}

// Section: Cards
function sectionCards(s: any, colors: Colors, ctaUrl: string): string {
  const cardsHtml = (s.items || []).map((c: any) => buildCard(c, colors, ctaUrl)).join('');
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr><td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:24px 24px 8px;">
    ${s.label ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:${colors.primary};margin:0 0 16px;letter-spacing:1px;text-transform:uppercase;">${s.label}</p>` : ''}
    ${cardsHtml}
  </td></tr>
</table>`;
}

// Section: Social proof
function sectionProof(s: any, colors: Colors): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr><td bgcolor="#f0f9ff" style="background-color:#f0f9ff;padding:28px 32px;text-align:center;border-top:3px solid ${colors.primary};">
    ${s.stat ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:44px;font-weight:800;color:${colors.primary};margin:0 0 6px;">${s.stat}</p>` : ''}
    ${s.quote ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:17px;font-style:italic;color:#334155;margin:0 0 10px;line-height:1.6;">"${s.quote}"</p>` : ''}
    ${s.attribution ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#94a3b8;margin:0;text-transform:uppercase;letter-spacing:0.8px;">— ${s.attribution}</p>` : ''}
  </td></tr>
</table>`;
}

// Section: Urgency / offer block
function sectionUrgency(s: any): string {
  const bg = s.bg || '#fff7ed';
  const border = s.border_color || '#f97316';
  const headColor = s.head_color || '#c2410c';
  const bodyColor = s.body_color || '#7c2d12';
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr><td bgcolor="${bg}" style="background-color:${bg};padding:22px 32px;border-left:5px solid ${border};">
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;color:${headColor};margin:0 0 8px;">⚡ ${s.headline}</p>
    ${s.body ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${bodyColor};margin:0 0 10px;line-height:1.6;">${s.body}</p>` : ''}
    ${s.code ? `<p style="font-family:'Courier New',Courier,monospace;font-size:20px;font-weight:800;color:${headColor};margin:0;letter-spacing:3px;display:inline-block;background:#ffffff;padding:7px 18px;border-radius:6px;border:2px dashed ${border};">${s.code}</p>` : ''}
  </td></tr>
</table>`;
}

// Section: Primary CTA
function sectionCta(s: any, colors: Colors, ctaUrl: string): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:40px 32px;text-align:center;border-top:4px solid ${colors.primary};">
    ${s.headline ? `<h2 style="font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:800;color:${colors.heading};margin:0 0 12px;line-height:1.25;">${s.headline}</h2>` : ''}
    ${s.body ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#555555;margin:0 0 8px;line-height:1.6;">${s.body}</p>` : ''}
    ${pillButton(s.button_text || 'Learn More', s.button_url || ctaUrl, colors.button)}
  </td></tr>
</table>`;
}

// Section: Info strip
function sectionInfoStrip(s: any, colors: Colors): string {
  const cols = (s.items || []).length;
  const itemsHtml = (s.items || []).map((item: any, i: number) => `
  <td align="center" style="padding:14px 16px;${i < cols - 1 ? 'border-right:1px solid #e2e8f0;' : ''}vertical-align:top;width:${Math.floor(100 / cols)}%;">
    <p style="font-size:22px;margin:0 0 5px;">${item.icon || '📌'}</p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;margin:0;line-height:1.4;">${item.text}</p>
  </td>`).join('');
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr><td bgcolor="#f1f5f9" style="background-color:#f1f5f9;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>${itemsHtml}</tr></table>
  </td></tr>
</table>`;
}

// ─── Email Assembler ──────────────────────────────────────────────────────────

function assembleEmail(headerHtml: string, sections: any[], colors: Colors, ctaUrl: string): string {
  const sectionHtml = sections.map(s => {
    switch (s.type) {
      case 'alert':     return sectionAlert(s, colors);
      case 'hero':      return sectionHero(s, colors, ctaUrl);
      case 'photo':     return sectionPhoto(s, ctaUrl);
      case 'intro':     return sectionIntro(s, colors);
      case 'cards':     return sectionCards(s, colors, ctaUrl);
      case 'proof':     return sectionProof(s, colors);
      case 'urgency':   return sectionUrgency(s);
      case 'cta':       return sectionCta(s, colors, ctaUrl);
      case 'infostrip': return sectionInfoStrip(s, colors);
      default: return '';
    }
  }).filter(Boolean).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="referrer" content="no-referrer" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>Email</title>
</head>
<body style="margin:0;padding:0;background-color:#edf2f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background-color:#edf2f7;">
  <tr><td align="center" style="padding:24px 0 40px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse;max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
      <tr><td>
        ${headerHtml}
        ${sectionHtml}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── Claude JSON Prompt ───────────────────────────────────────────────────────

function buildSectionPrompt(bk: any, ctaLink: string, contentSnippet: string, eventDetails: string, emailType: string, imageSlots: string, currentYear: number): string {
  const colors = resolveColors(bk);

  return `You are building a structured marketing email. Return ONLY a valid JSON object — no explanation, no markdown.

BRAND:
  Name: ${bk.brandName || 'the client'}
  Button color: ${colors.button} — use for CTA buttons and card accent bars
  Heading color: ${colors.heading} — use for h1/h2 text
  Primary color: ${colors.primary} — use for labels, borders, accents
  Logo: ${bk.logoUrl || '(none)'}

CURRENT YEAR: ${currentYear}

OUTPUT FORMAT:
{
  "sections": [ ...section objects... ]
}

AVAILABLE SECTION TYPES — pick only what fits the content:

{ "type": "alert", "text": "...", "urgent": true|false }
  → One-line announcement bar. Use for promo codes, deadlines, limited spots.

{ "type": "hero", "headline": "...", "subtext": "...", "image_url": "IMAGE_URL_OR_EMPTY", "image_alt": "...", "cta_text": "..." }
  → Always include. Lead with the strongest benefit headline.

{ "type": "photo", "image_url": "URL", "alt": "...", "linked": true }
  → Full-width image break. Use between sections for visual pacing.

{ "type": "intro", "label": "OPTIONAL EYEBROW", "headline": "...", "body": "..." }
  → Context paragraph. Sets up the 'why' before cards or details.

{ "type": "cards", "label": "OPTIONAL SECTION LABEL", "items": [
    {
      "accent_color": "HEX",
      "icon": "EMOJI",
      "title": "...",
      "badges": [ { "text": "...", "type": "audience"|"price"|"status"|"format" } ],
      "body": "...",
      "tags": ["tag1", "tag2"],
      "date": "...",
      "cta_text": "...",
      "cta_url": "OPTIONAL_OVERRIDE_URL"
    }
  ]
}
  → Badge types: "status"=red (filling fast/new/featured), "audience"=gray (ages/grades), "price"=yellow ($amounts), "format"=blue (half day/virtual)

{ "type": "proof", "stat": "...", "quote": "...", "attribution": "..." }
  → Testimonial, stat callout, or trust signal. Use stat OR quote OR both.

{ "type": "urgency", "headline": "...", "body": "...", "code": "PROMOCODE" }
  → Orange callout box. For deadlines, limited spots, promo codes.

{ "type": "cta", "headline": "...", "body": "...", "button_text": "...", "button_url": "..." }
  → Always include as the LAST section. One clear call to action.

{ "type": "infostrip", "items": [ { "icon": "EMOJI", "text": "..." } ] }
  → Lightweight facts row. Use for location, hours, contact.

RULES:
- Always include "hero" first and "cta" last
- Use "cards" when listing multiple programs, camps, sessions, or services
- Use "alert" only when there's real urgency or a promo code
- Use "urgency" when there's a limited-time offer or enrollment deadline
- NEVER include a footer section
- For image_url fields: use the provided image URLs below if relevant, or leave empty string ""
- For card accent_color: vary colors across cards for visual interest — use the brand button color for primary, lighter tints or analogous colors for secondary cards

IMAGE SLOTS (use these URLs in image_url fields where appropriate):
${imageSlots}

EMAIL PURPOSE: ${emailType || 'general promotional email'}
${eventDetails ? `\nEVENT DETAILS:\n${eventDetails}` : ''}

WEBSITE CONTENT:
${contentSnippet || '(use brand name and email purpose to infer content)'}

CTA URL: ${ctaLink}

Return ONLY the JSON object. No markdown, no explanation.`;
}

function resolveColors(bk: any): Colors {
  return {
    primary: bk.primaryColor || bk.buttonColor || '#1a1a2e',
    heading: bk.headingColor || bk.primaryColor || '#1a1a2e',
    button:  bk.buttonColor  || bk.primaryColor || '#1a1a2e',
    accent:  bk.accentColor  || bk.buttonColor  || bk.primaryColor || '#f59e0b',
  };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const { websiteUrl, ctaUrl, eventDetails, images, emailType, revisionRequest, conversationHistory } = await req.json();
    if (!websiteUrl) return new Response(JSON.stringify({ error: "Missing websiteUrl" }), { status: 400, headers: { "Content-Type": "application/json" } });

    const anthropicKey = Netlify.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });

    const ctaLink = ctaUrl?.trim() || websiteUrl;
    const currentYear = new Date().getFullYear();

    // Fetch content + raw HTML in parallel
    const [jinaResult, rawHtmlResult] = await Promise.allSettled([
      fetch(`https://r.jina.ai/${websiteUrl}`, { headers: { Accept: "text/plain", "X-Return-Format": "text", "X-Timeout": "4" }, signal: AbortSignal.timeout(5000) }).then(r => r.text()),
      fetch(websiteUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; AmeliorateBot/1.0)" }, signal: AbortSignal.timeout(5000) }).then(r => r.text()),
    ]);

    const pageContent = jinaResult.status === 'fulfilled' ? jinaResult.value : '';
    const rawHtml = rawHtmlResult.status === 'fulfilled' ? rawHtmlResult.value : '';

    const bk = rawHtml ? await extractBrandKit(rawHtml, websiteUrl) : { buttonColor: '', headingColor: '', primaryColor: '', accentColor: '', fonts: [], logoUrl: '', ogImage: '', brandName: '' };
    const colors = resolveColors(bk);

    const contentSnippet = pageContent.substring(0, 2500);

    // Image slots — auto-fill OG image
    let resolvedImages = images && images.length > 0 ? [...images] : [];
    if (resolvedImages.length === 0 && bk.ogImage) resolvedImages = [bk.ogImage];
    const imageSlots = resolvedImages.length > 0
      ? resolvedImages.map((url: string, i: number) => url.trim() ? `IMAGE_${i + 1}: ${url.trim()}` : `IMAGE_${i + 1}: (empty)`).join("\n")
      : 'IMAGE_1: (no image available)';

    let emailHtml = '';
    let updatedHistory: any[] = [];

    // ── Revision path (HTML → HTML) ──
    if (revisionRequest && conversationHistory) {
      const messages = [
        ...conversationHistory,
        { role: "user", content: `Revise the email: ${revisionRequest}\n\nIMPORTANT: Return ONLY the complete updated HTML document, no explanation.` },
      ];
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 4000, messages }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        return new Response(JSON.stringify({ error: `Revision failed: ${e ? JSON.stringify(e) : res.status}` }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
      const d = await res.json();
      emailHtml = d.content[0].text.replace(/^```html\n?/i, "").replace(/\n?```$/i, "").trim();
      // Inject referrer policy into revised HTML
      emailHtml = emailHtml.replace(/<head([^>]*)>/i, '<head$1><meta name="referrer" content="no-referrer">');
      emailHtml = emailHtml.replace(/<img\b(?![^>]*referrerpolicy)([^>]*?)(\/?>)/gi, '<img$1 referrerpolicy="no-referrer"$2');
      emailHtml = emailHtml.replace(/<a\b(?![^>]*target)([^>]*?)>/gi, '<a$1 target="_blank" rel="noopener noreferrer">');
      updatedHistory = [...conversationHistory, { role: "user", content: `Revise the email: ${revisionRequest}` }, { role: "assistant", content: emailHtml }];

    // ── Generation path (JSON → assembled HTML) ──
    } else {
      const sectionPrompt = buildSectionPrompt(bk, ctaLink, contentSnippet, eventDetails || '', emailType || '', imageSlots, currentYear);

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 2000, messages: [{ role: "user", content: sectionPrompt }] }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        return new Response(JSON.stringify({ error: `AI failed: ${e ? JSON.stringify(e) : res.status}` }), { status: 500, headers: { "Content-Type": "application/json" } });
      }

      const d = await res.json();
      let rawJson = d.content[0].text.trim();
      rawJson = rawJson.replace(/^```json\n?/i, "").replace(/^```\n?/i, "").replace(/\n?```$/i, "").trim();

      let sections: any[] = [];
      try {
        const parsed = JSON.parse(rawJson);
        sections = parsed.sections || [];
      } catch {
        // JSON parse failed — fall back to a minimal structure
        sections = [{
          type: 'hero',
          headline: emailType || 'Learn More',
          subtext: `Visit ${bk.brandName || 'us'} to find out more.`,
          image_url: resolvedImages[0] || '',
          cta_text: 'Learn More',
        }, {
          type: 'cta',
          button_text: 'Visit Our Website',
          button_url: ctaLink,
        }];
      }

      const headerHtml = sectionHeader(bk, colors);
      emailHtml = assembleEmail(headerHtml, sections, colors, ctaLink);

      // Store assembled HTML + section spec in history for revision
      updatedHistory = [
        { role: "user", content: sectionPrompt },
        { role: "assistant", content: rawJson },
        {
          role: "user",
          content: `Great. Here is the fully assembled HTML email built from those sections:\n\n${emailHtml}\n\nRemember this HTML — I may ask you to revise it.`
        },
        {
          role: "assistant",
          content: "Understood. I have the full HTML email. I'm ready to revise it based on your instructions."
        },
      ];
    }

    return new Response(
      JSON.stringify({
        success: true, emailHtml, conversationHistory: updatedHistory,
        brandKit: { logoUrl: bk.logoUrl, ogImage: bk.ogImage, buttonColor: colors.button, headingColor: colors.heading, fonts: bk.fonts, brandName: bk.brandName },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Unknown error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const config = { path: "/api/generate-email" };
