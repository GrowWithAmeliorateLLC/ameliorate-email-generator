import type { Context } from "@netlify/functions";

// ─── Utilities ──────────────────────────────────────────────────────────────────────

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

// ─── Vision Color Extraction ─────────────────────────────────────────────────────────────────

async function extractColorsFromScreenshot(websiteUrl: string, ogImageUrl: string, anthropicKey: string): Promise<{
  buttonColor: string; headingColor: string; primaryColor: string; accentColor: string;
}> {
  const empty = { buttonColor: '', headingColor: '', primaryColor: '', accentColor: '' };
  let imageBase64 = '';
  let mediaType = 'image/png';

  try {
    const res = await fetch(`https://r.jina.ai/${websiteUrl}`, {
      headers: { 'X-Return-Format': 'screenshot', 'X-Timeout': '8' },
      signal: AbortSignal.timeout(9000),
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('image')) {
        const buf = await res.arrayBuffer();
        if (buf.byteLength < 3_000_000) {
          imageBase64 = Buffer.from(buf).toString('base64');
          mediaType = contentType.split(';')[0].trim() as any;
        }
      }
    }
  } catch { /* fall through */ }

  if (!imageBase64 && ogImageUrl) {
    try {
      const res = await fetch(ogImageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': '' },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        if (/image\/(jpeg|png|gif|webp)/.test(contentType)) {
          const buf = await res.arrayBuffer();
          if (buf.byteLength < 3_000_000) {
            imageBase64 = Buffer.from(buf).toString('base64');
            mediaType = contentType.split(';')[0].trim() as any;
          }
        }
      }
    } catch { /* give up */ }
  }

  if (!imageBase64) return empty;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            {
              type: 'text',
              text: `Identify the brand colors in this image. Return ONLY valid JSON, nothing else:\n{"primaryColor":"#hex","buttonColor":"#hex","headingColor":"#hex","accentColor":"#hex"}\n\nRules:\n- primaryColor = dominant brand color (header/nav background, logo color, most prominent color)\n- buttonColor = color used on CTA/action buttons\n- headingColor = color used for main headings/titles\n- accentColor = secondary highlight color\n- Use 6-digit hex codes (#RRGGBB)\n- Use "" if a color cannot be determined\n- DO NOT use white (#ffffff), near-white, black (#000000), or gray colors`,
            },
          ],
        }],
      }),
    });
    if (!res.ok) return empty;
    const d = await res.json();
    const text = d.content[0].text.trim().replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(text);
    const clean = (hex: string) => hex && /^#[0-9a-fA-F]{6}$/.test(hex) && !isLayoutColor(hex) ? hex : '';
    return {
      primaryColor: clean(parsed.primaryColor),
      buttonColor: clean(parsed.buttonColor),
      headingColor: clean(parsed.headingColor),
      accentColor: clean(parsed.accentColor),
    };
  } catch {
    return empty;
  }
}

// ─── CSS/HTML Brand Extraction ───────────────────────────────────────────────────────────────────

async function extractBrandKitFromHtml(rawHtml: string, baseUrl: string): Promise<{
  buttonColor: string; headingColor: string; primaryColor: string; accentColor: string;
  fonts: string[]; logoUrl: string; ogImage: string; brandName: string;
}> {
  const base = new URL(baseUrl);
  const fonts: string[] = [];
  for (const u of (rawHtml.match(/fonts\.googleapis\.com\/css[^"'\s>]+/g) || [])) {
    for (const f of (u.match(/family=([^&"'\s]+)/g) || [])) {
      const name = decodeURIComponent(f.replace('family=', '').split(':')[0].replace(/\+/g, ' ')).trim();
      if (name && !fonts.includes(name)) fonts.push(name);
    }
  }
  const cssUrls = (rawHtml.match(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi) || [])
    .map(m => { const h = m.match(/href=["']([^"']+)["']/i); return h ? resolveUrl(h[1], base) : ''; })
    .filter(u => u && !/font|google|gstatic|icon|awesome|bootstrap/i.test(u))
    .slice(0, 4);
  let cssText = (rawHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [])
    .map(s => s.replace(/<\/?style[^>]*>/gi, '')).join('\n');
  const cssResults = await Promise.allSettled(
    cssUrls.map(url => fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3500) }).then(r => r.text()))
  );
  for (const r of cssResults) { if (r.status === 'fulfilled') cssText += '\n' + r.value; }
  for (const decl of (cssText.match(/font-family\s*:\s*['"']?([^;'"`,\n]+)/gi) || [])) {
    const name = decl.replace(/font-family\s*:\s*/i, '').replace(/['"]/g, '').split(',')[0].trim();
    if (name && name.length > 1 && name.length < 40 && !fonts.includes(name)
      && !/inherit|initial|unset|sans-serif|serif|monospace|system-ui|cursive|Arial|Helvetica/i.test(name))
      fonts.push(name);
  }
  let buttonColor = '';
  for (const p of [
    /\.btn[^{,]*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
    /button[^{,]*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
    /\.cta[^{,]*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
  ]) { const m = cssText.match(p); if (m && !isLayoutColor(m[1])) { buttonColor = m[1]; break; } }
  let headingColor = '';
  for (const p of [
    /\bh1\b[^{,]*\{[^}]*(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6})/im,
    /\bh2\b[^{,]*\{[^}]*(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6})/im,
  ]) { const m = cssText.match(p); if (m && !isLayoutColor(m[1])) { headingColor = m[1]; break; } }
  let primaryColor = '', accentColor = '';
  for (const p of [/--(?:color-)?primary(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i, /--brand(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i]) {
    const m = cssText.match(p); if (m && !isLayoutColor(m[1])) { primaryColor = m[1]; break; }
  }
  for (const p of [/--(?:color-)?accent(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i, /--secondary(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i]) {
    const m = cssText.match(p); if (m && !isLayoutColor(m[1])) { accentColor = m[1]; break; }
  }
  const counts: Record<string, number> = {};
  for (const h of (cssText.match(/#[0-9a-fA-F]{6}\b/g) || [])) { if (!isLayoutColor(h)) counts[h] = (counts[h] || 0) + 1; }
  const mostUsed = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  let logoUrl = '';
  for (const p of [
    /<img[^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*src=["']([^"']+)["'][^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["']/i,
    /<img[^>]*src=["']([^"']*logo[^"']+)["']/i,
  ]) { const m = rawHtml.match(p); if (m) { logoUrl = resolveUrl(m[1], base); break; } }
  const ogMatch = rawHtml.match(/<meta[^>]+(?:property=["']og:image["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:image["'])/i);
  const ogImage = ogMatch ? resolveUrl(ogMatch[1] || ogMatch[2] || '', base) : '';
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

// ─── Design System Components ─────────────────────────────────────────────────────────────────────
interface Colors { primary: string; heading: string; button: string; accent: string; }
function resolveColors(bk: any): Colors {
  return {
    primary: bk.primaryColor || bk.buttonColor || '#1a1a2e',
    heading: bk.headingColor || bk.primaryColor || '#1a1a2e',
    button:  bk.buttonColor  || bk.primaryColor || '#1a1a2e',
    accent:  bk.accentColor  || bk.buttonColor  || bk.primaryColor || '#f59e0b',
  };
}
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
  <tr><td align="center">
    <a href="${url}" target="_blank" rel="noopener noreferrer"
       style="display:block;background-color:${bg};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:800;text-decoration:none;padding:17px 32px;border-radius:50px;text-align:center;${fullWidth ? 'width:100%;box-sizing:border-box;' : ''}line-height:1.2;">
      ${text}
    </a>
  </td></tr>
</table>`;
}
function sectionHeader(bk: any, colors: Colors): string {
  const inner = bk.logoUrl
    ? `<img src="${bk.logoUrl}" alt="${bk.brandName || 'Logo'}" width="180" style="max-width:180px;height:auto;display:inline-block;" referrerpolicy="no-referrer" />`
    : `<span style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;color:#ffffff;">${bk.brandName || ''}</span>`;
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td bgcolor="${colors.primary}" style="background-color:${colors.primary};padding:26px 32px;text-align:center;">${inner}</td></tr></table>`;
}
function sectionAlert(s: any, colors: Colors): string {
  const bg = s.urgent ? '#dc2626' : colors.primary;
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td bgcolor="${bg}" style="background-color:${bg};padding:11px 24px;text-align:center;"><p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#ffffff;margin:0;letter-spacing:0.6px;text-transform:uppercase;">${s.urgent ? '\uD83D\uDEA8 ' : '\uD83D\uDCE2 '}${s.text}</p></td></tr></table>`;
}
function sectionHero(s: any, colors: Colors, ctaUrl: string): string {
  const imgSrc = s.image_url && !s.image_url.includes('%%') ? s.image_url : '';
  return `${imgSrc ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td style="padding:0;line-height:0;"><a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="display:block;"><img src="${imgSrc}" alt="${s.image_alt || ''}" width="600" style="width:100%;max-width:600px;height:auto;display:block;" referrerpolicy="no-referrer" /></a></td></tr></table>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:36px 32px 28px;">
  <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:32px;font-weight:800;color:${colors.heading};margin:0 0 14px;line-height:1.2;">${s.headline}</h1>
  ${s.subtext ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#444444;margin:0 0 4px;line-height:1.6;">${s.subtext}</p>` : ''}
  ${s.cta_text ? pillButton(s.cta_text, ctaUrl, colors.button) : ''}
</td></tr></table>`;
}
function sectionPhoto(s: any, ctaUrl: string): string {
  if (!s.image_url || s.image_url.includes('%%')) return '';
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td style="padding:0;line-height:0;">${s.linked !== false ? `<a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="display:block;">` : ''}<img src="${s.image_url}" alt="${s.alt || ''}" width="600" style="width:100%;max-width:600px;height:auto;display:block;" referrerpolicy="no-referrer" />${s.linked !== false ? '</a>' : ''}</td></tr></table>`;
}
function sectionIntro(s: any, colors: Colors): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:24px 32px;">${s.label ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:${colors.primary};margin:0 0 10px;letter-spacing:1px;text-transform:uppercase;">${s.label}</p>` : ''}${s.headline ? `<h2 style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;color:${colors.heading};margin:0 0 10px;">${s.headline}</h2>` : ''}<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#444444;margin:0;line-height:1.7;">${s.body}</p></td></tr></table>`;
}
function buildCard(card: any, colors: Colors, defaultCtaUrl: string): string {
  const accentColor = card.accent_color || colors.accent;
  const badgesHtml = (card.badges || []).map((b: any) => badge(b.text, b.type)).join('');
  const tagsHtml = (card.tags || []).map((t: string) =>
    `<span style="display:inline-block;background-color:#f1f5f9;color:#475569;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;padding:4px 11px;border-radius:6px;margin:0 5px 5px 0;">${t}</span>`
  ).join('');
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:16px;">
  <tr>
    <td width="5" bgcolor="${accentColor}" style="background-color:${accentColor};width:5px;min-width:5px;"></td>
    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:22px 24px;border:1px solid #e2e8f0;border-left:none;border-radius:0 8px 8px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:8px;">
        <tr><td>${card.icon ? `<span style="font-size:20px;margin-right:8px;vertical-align:middle;">${card.icon}</span>` : ''}<span style="font-family:Arial,Helvetica,sans-serif;font-size:19px;font-weight:800;color:${colors.heading};vertical-align:middle;">${card.title}</span></td></tr>
        ${badgesHtml ? `<tr><td style="padding-top:7px;">${badgesHtml}</td></tr>` : ''}
      </table>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#4a4a4a;margin:0 0 12px;line-height:1.65;">${card.body}</p>
      ${tagsHtml ? `<div style="margin-bottom:12px;">${tagsHtml}</div>` : ''}
      ${card.date ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#64748b;margin:0 0 12px;">\uD83D\uDCC5 ${card.date}</p>` : ''}
      ${card.cta_text ? pillButton(card.cta_text, card.cta_url || defaultCtaUrl, accentColor) : ''}
    </td>
  </tr>
</table>`;
}
function sectionCards(s: any, colors: Colors, ctaUrl: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:24px 24px 8px;">${s.label ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:${colors.primary};margin:0 0 16px;letter-spacing:1px;text-transform:uppercase;">${s.label}</p>` : ''}${(s.items || []).map((c: any) => buildCard(c, colors, ctaUrl)).join('')}</td></tr></table>`;
}
function sectionProof(s: any, colors: Colors): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td bgcolor="#f0f9ff" style="background-color:#f0f9ff;padding:28px 32px;text-align:center;border-top:3px solid ${colors.primary};">${s.stat ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:44px;font-weight:800;color:${colors.primary};margin:0 0 6px;">${s.stat}</p>` : ''}${s.quote ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:17px;font-style:italic;color:#334155;margin:0 0 10px;line-height:1.6;">\u201c${s.quote}\u201d</p>` : ''}${s.attribution ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#94a3b8;margin:0;text-transform:uppercase;letter-spacing:0.8px;">\u2014 ${s.attribution}</p>` : ''}</td></tr></table>`;
}
function sectionUrgency(s: any): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td bgcolor="${s.bg || '#fff7ed'}" style="background-color:${s.bg || '#fff7ed'};padding:22px 32px;border-left:5px solid ${s.border_color || '#f97316'};"><p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;color:${s.head_color || '#c2410c'};margin:0 0 8px;">\u26A1 ${s.headline}</p>${s.body ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${s.body_color || '#7c2d12'};margin:0 0 10px;line-height:1.6;">${s.body}</p>` : ''}${s.code ? `<p style="font-family:'Courier New',Courier,monospace;font-size:20px;font-weight:800;color:${s.head_color || '#c2410c'};margin:0;letter-spacing:3px;background:#ffffff;display:inline-block;padding:7px 18px;border-radius:6px;border:2px dashed ${s.border_color || '#f97316'};">${s.code}</p>` : ''}</td></tr></table>`;
}
function sectionCta(s: any, colors: Colors, ctaUrl: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:40px 32px;text-align:center;border-top:4px solid ${colors.primary};">${s.headline ? `<h2 style="font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:800;color:${colors.heading};margin:0 0 12px;line-height:1.25;">${s.headline}</h2>` : ''}${s.body ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#555555;margin:0 0 8px;line-height:1.6;">${s.body}</p>` : ''}${pillButton(s.button_text || 'Learn More', s.button_url || ctaUrl, colors.button)}</td></tr></table>`;
}
function sectionInfoStrip(s: any): string {
  const cols = (s.items || []).length || 1;
  const itemsHtml = (s.items || []).map((item: any, i: number) =>
    `<td align="center" style="padding:14px 16px;${i < cols - 1 ? 'border-right:1px solid #e2e8f0;' : ''}vertical-align:top;width:${Math.floor(100/cols)}%;"><p style="font-size:22px;margin:0 0 5px;">${item.icon || '\uD83D\uDCCC'}</p><p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;margin:0;line-height:1.4;">${item.text}</p></td>`
  ).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td bgcolor="#f1f5f9" style="background-color:#f1f5f9;padding:0;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>${itemsHtml}</tr></table></td></tr></table>`;
}

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
      case 'infostrip': return sectionInfoStrip(s);
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
      <tr><td>${headerHtml}${sectionHtml}</td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── Section Prompt (improved rules) ──────────────────────────────────────────────────────────────

function buildSectionPrompt(bk: any, colors: Colors, ctaLink: string, contentSnippet: string, eventDetails: string, emailType: string, imageSlots: string, currentYear: number): string {
  return `You are building a structured marketing email. Return ONLY a valid JSON object \u2014 no explanation, no markdown.

BRAND:
  Name: ${bk.brandName || 'the client'}
  Button color: ${colors.button} \u2014 use EXACTLY this for CTA buttons and card accent bars
  Heading color: ${colors.heading} \u2014 use EXACTLY this for h1/h2 text
  Primary color: ${colors.primary} \u2014 use EXACTLY this for section labels, borders, accents
  Logo: ${bk.logoUrl || '(none)'}

CURRENT YEAR: ${currentYear}

OUTPUT FORMAT: { "sections": [ ...section objects... ] }

SECTION TYPES:

{ "type": "alert", "text": "ONE LINE urgency text", "urgent": true|false }
  \u2192 Use ONLY for genuine urgency: limited spots, deadline, promo code.
  \u2192 MUST be the FIRST section in the array when used.

{ "type": "hero", "headline": "...", "subtext": "...", "image_url": "URL_OR_EMPTY_STRING", "image_alt": "...", "cta_text": "..." }
  \u2192 ALWAYS include. ALWAYS use IMAGE_1 from slots if available \u2014 never leave image_url empty when images are provided.
  \u2192 cta_text should be action-oriented: "Enroll Now", "Register Today", "Book Your Spot".

{ "type": "photo", "image_url": "URL", "alt": "...", "linked": true }
  \u2192 Full-width image break. Only if IMAGE_2+ is available.

{ "type": "intro", "label": "EYEBROW", "headline": "...", "body": "..." }
  \u2192 Use for context/details about a SINGLE event or program.
  \u2192 Use this INSTEAD OF cards when promoting just one event.

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
  \u2192 Use ONLY for MULTIPLE DISTINCT programs, camps, or sessions (2 or more).
  \u2192 DO NOT use cards to break a single event into features/activities.
  \u2192 Card cta_text + cta_url: ONLY add when each card links to a DIFFERENT booking URL.
  \u2192 If all cards share the same CTA URL \u2014 omit cta_text from every card. The final CTA section handles it.
  \u2192 Vary accent_color across cards.

{ "type": "proof", "stat": "SHORT_STAT_ONLY", "quote": "...", "attribution": "..." }
  \u2192 stat MUST be a SHORT value: number, rating, or %. e.g. "500+", "4.9\u2605", "98%". NEVER a full sentence.
  \u2192 If no short stat exists, omit stat entirely and use only quote + attribution.

{ "type": "urgency", "headline": "...", "body": "...", "code": "PROMO_CODE" }
  \u2192 Orange callout box. For enrollment deadlines, limited spots, or promo codes.

{ "type": "cta", "headline": "...", "body": "...", "button_text": "...", "button_url": "..." }
  \u2192 ALWAYS the LAST section. Strong action text: "Enroll Now", "Book Your Spot".

{ "type": "infostrip", "items": [{"icon": "EMOJI", "text": "..."}] }
  \u2192 Key logistics row: date, time, location, age range, spots remaining.

SECTION ORDER:
1. "alert" (if needed) \u2014 MUST be first
2. "hero" \u2014 always second (or first if no alert)
3. "intro" or "cards"
4. "infostrip" \u2014 for logistics
5. "proof" \u2014 testimonial or stat
6. "urgency" \u2014 if deadline/promo
7. "cta" \u2014 always last

BADGE TYPES: "status"=red (Filling Fast/New), "audience"=gray (Ages/Grades), "price"=yellow ($amounts), "format"=blue (Half Day/Virtual)

IMAGE SLOTS \u2014 use IMAGE_1 in hero.image_url:
${imageSlots}

EMAIL PURPOSE: ${emailType || 'general promotional email'}
${eventDetails ? `\nEVENT DETAILS:\n${eventDetails}` : ''}

WEBSITE CONTENT:
${contentSnippet || '(use brand name and email purpose)'}

CTA URL: ${ctaLink}

Return ONLY the JSON object.`;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────────────────────

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const { websiteUrl, ctaUrl, eventDetails, images, emailType, revisionRequest, conversationHistory } = await req.json();
    if (!websiteUrl) return new Response(JSON.stringify({ error: "Missing websiteUrl" }), { status: 400, headers: { "Content-Type": "application/json" } });
    const anthropicKey = Netlify.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
    const ctaLink = ctaUrl?.trim() || websiteUrl;
    const currentYear = new Date().getFullYear();
    const [jinaResult, rawHtmlResult] = await Promise.allSettled([
      fetch(`https://r.jina.ai/${websiteUrl}`, { headers: { Accept: "text/plain", "X-Return-Format": "text", "X-Timeout": "4" }, signal: AbortSignal.timeout(5000) }).then(r => r.text()),
      fetch(websiteUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; AmeliorateBot/1.0)" }, signal: AbortSignal.timeout(5000) }).then(r => r.text()),
    ]);
    const pageContent = jinaResult.status === 'fulfilled' ? jinaResult.value : '';
    const rawHtml = rawHtmlResult.status === 'fulfilled' ? rawHtmlResult.value : '';
    const [cssKit, visualColors] = await Promise.allSettled([
      rawHtml ? extractBrandKitFromHtml(rawHtml, websiteUrl) : Promise.resolve({ buttonColor: '', headingColor: '', primaryColor: '', accentColor: '', fonts: [], logoUrl: '', ogImage: '', brandName: '' }),
      (async () => {
        const base = new URL(websiteUrl);
        const ogMatch = rawHtml?.match(/<meta[^>]+(?:property=["']og:image["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:image["'])/i);
        const ogImage = ogMatch ? resolveUrl(ogMatch[1] || ogMatch[2] || '', base) : '';
        return extractColorsFromScreenshot(websiteUrl, ogImage, anthropicKey);
      })(),
    ]);
    const htmlBk = cssKit.status === 'fulfilled' ? cssKit.value : { buttonColor: '', headingColor: '', primaryColor: '', accentColor: '', fonts: [], logoUrl: '', ogImage: '', brandName: '' };
    const visBk = visualColors.status === 'fulfilled' ? visualColors.value : { buttonColor: '', headingColor: '', primaryColor: '', accentColor: '' };
    const bk = {
      ...htmlBk,
      buttonColor:  visBk.buttonColor  || htmlBk.buttonColor,
      headingColor: visBk.headingColor || htmlBk.headingColor,
      primaryColor: visBk.primaryColor || htmlBk.primaryColor,
      accentColor:  visBk.accentColor  || htmlBk.accentColor,
    };
    const colors = resolveColors(bk);
    const contentSnippet = pageContent.substring(0, 2500);
    let resolvedImages = images && images.length > 0 ? [...images] : [];
    if (resolvedImages.length === 0 && bk.ogImage) resolvedImages = [bk.ogImage];
    const imageSlots = resolvedImages.length > 0
      ? resolvedImages.map((url: string, i: number) => url.trim() ? `IMAGE_${i + 1}: ${url.trim()}` : `IMAGE_${i + 1}: (empty)`).join("\n")
      : 'IMAGE_1: (no image available)';
    let emailHtml = '';
    let updatedHistory: any[] = [];
    if (revisionRequest && conversationHistory) {
      const messages = [
        ...conversationHistory,
        { role: "user", content: `Revise the email: ${revisionRequest}\n\nReturn ONLY the complete updated HTML document.` },
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
      emailHtml = d.content[0].text.replace(/^```html\n?/i, '').replace(/\n?```$/i, '').trim();
      emailHtml = emailHtml.replace(/<head([^>]*)>/i, '<head$1><meta name="referrer" content="no-referrer">');
      emailHtml = emailHtml.replace(/<img\b(?![^>]*referrerpolicy)([^>]*?)(\/?>)/gi, '<img$1 referrerpolicy="no-referrer"$2');
      emailHtml = emailHtml.replace(/<a\b(?![^>]*target)([^>]*?)>/gi, '<a$1 target="_blank" rel="noopener noreferrer">');
      updatedHistory = [...conversationHistory, { role: "user", content: `Revise the email: ${revisionRequest}` }, { role: "assistant", content: emailHtml }];
    } else {
      const sectionPrompt = buildSectionPrompt(bk, colors, ctaLink, contentSnippet, eventDetails || '', emailType || '', imageSlots, currentYear);
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
      let rawJson = d.content[0].text.trim().replace(/^```json?\n?/i, '').replace(/^```\n?/i, '').replace(/\n?```$/i, '').trim();
      let sections: any[] = [];
      try {
        sections = JSON.parse(rawJson).sections || [];
      } catch {
        sections = [
          { type: 'hero', headline: emailType || 'Learn More', subtext: `Discover what ${bk.brandName || 'we'} has to offer.`, image_url: resolvedImages[0] || '', cta_text: 'Learn More' },
          { type: 'cta', button_text: 'Visit Our Website', button_url: ctaLink },
        ];
      }
      const headerHtml = sectionHeader(bk, colors);
      emailHtml = assembleEmail(headerHtml, sections, colors, ctaLink);
      updatedHistory = [
        { role: "user", content: sectionPrompt },
        { role: "assistant", content: rawJson },
        { role: "user", content: `Here is the assembled HTML:\n\n${emailHtml}\n\nRemember this for revisions.` },
        { role: "assistant", content: "Understood. Ready to revise." },
      ];
    }
    return new Response(
      JSON.stringify({
        success: true, emailHtml, conversationHistory: updatedHistory,
        brandKit: { logoUrl: bk.logoUrl, ogImage: bk.ogImage, buttonColor: colors.button, headingColor: colors.heading, primaryColor: colors.primary, fonts: bk.fonts, brandName: bk.brandName },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Unknown error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const config = { path: "/api/generate-email" };
