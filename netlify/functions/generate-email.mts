import type { Context } from "@netlify/functions";

function postProcessHtml(html: string): string {
  let result = html.replace(/<head([^>]*)>/i, '<head$1><meta name="referrer" content="no-referrer">');
  result = result.replace(/<img\b(?![^>]*referrerpolicy)([^>]*?)(\/?>)/gi, '<img$1 referrerpolicy="no-referrer"$2');
  result = result.replace(/<a\b(?![^>]*target)([^>]*?)>/gi, '<a$1 target="_blank" rel="noopener noreferrer">');
  return result;
}

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
  return brightness < 20 || brightness > 230 || isGray;
}

// Find the background-color of button/CTA selectors in CSS text
function findButtonColor(cssText: string): string {
  const btnPatterns = [
    /\.btn[^{,]*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
    /button[^{,]*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
    /\.button[^{,]*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
    /\[type=["']submit["']\][^{,]*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
    /\.cta[^{,]*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
    /a\.btn[^{,]*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
    /input\[type[^{,]*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
  ];
  for (const p of btnPatterns) {
    const m = cssText.match(p);
    if (m && !isLayoutColor(m[1])) return m[1];
  }
  return '';
}

// Find heading color
function findHeadingColor(cssText: string): string {
  const hPatterns = [
    /\bh1\b[^{,]*\{[^}]*(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6})/im,
    /\bh2\b[^{,]*\{[^}]*(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6})/im,
    /\.heading[^{,]*\{[^}]*(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6})/im,
    /\.headline[^{,]*\{[^}]*(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6})/im,
    /\.title[^{,]*\{[^}]*(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6})/im,
  ];
  for (const p of hPatterns) {
    const m = cssText.match(p);
    if (m && !isLayoutColor(m[1])) return m[1];
  }
  return '';
}

// Find primary/accent color from CSS variables
function findCssVarColors(cssText: string): { primary: string; accent: string } {
  const primaryPatterns = [
    /--(?:color-)?primary(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
    /--brand(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
    /--main(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
    /--theme(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
  ];
  const accentPatterns = [
    /--(?:color-)?(?:accent|secondary|highlight)(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
    /--cta(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i,
  ];
  let primary = '', accent = '';
  for (const p of primaryPatterns) { const m = cssText.match(p); if (m && !isLayoutColor(m[1])) { primary = m[1]; break; } }
  for (const p of accentPatterns) { const m = cssText.match(p); if (m && !isLayoutColor(m[1])) { accent = m[1]; break; } }
  return { primary, accent };
}

// Most frequently used non-layout color in CSS (likely the primary brand color)
function findMostUsedColor(cssText: string): string {
  const allHex = cssText.match(/#[0-9a-fA-F]{6}\b/g) || [];
  const counts: Record<string, number> = {};
  for (const h of allHex) {
    if (!isLayoutColor(h)) counts[h] = (counts[h] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

async function extractBrandKit(rawHtml: string, baseUrl: string): Promise<{
  buttonColor: string;
  headingColor: string;
  primaryColor: string;
  accentColor: string;
  fonts: string[];
  logoUrl: string;
  ogImage: string;
  brandName: string;
}> {
  const base = new URL(baseUrl);

  // Google Fonts from HTML
  const gFontsUrls = rawHtml.match(/fonts\.googleapis\.com\/css[^"'\s>]+/g) || [];
  const fonts: string[] = [];
  for (const u of gFontsUrls) {
    for (const f of (u.match(/family=([^&"'\s]+)/g) || [])) {
      const name = decodeURIComponent(f.replace('family=', '').split(':')[0].replace(/\+/g, ' ')).trim();
      if (name && !fonts.includes(name)) fonts.push(name);
    }
  }

  // Find linked CSS files (skip font/icon CDNs)
  const cssUrls = (rawHtml.match(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi) || [])
    .map(m => { const h = m.match(/href=["']([^"']+)["']/i); return h ? resolveUrl(h[1], base) : ''; })
    .filter(u => u && !/font|google|gstatic|icon|awesome|bootstrap/i.test(u))
    .slice(0, 4);

  // Inline styles
  let cssText = (rawHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [])
    .map(s => s.replace(/<\/?style[^>]*>/gi, '')).join('\n');

  // Fetch external CSS in parallel
  const cssResults = await Promise.allSettled(
    cssUrls.map(url => fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AmeliorateBot/1.0)' },
      signal: AbortSignal.timeout(4000),
    }).then(r => r.text()))
  );
  for (const r of cssResults) {
    if (r.status === 'fulfilled') cssText += '\n' + r.value;
  }

  // Fonts from CSS
  for (const decl of (cssText.match(/font-family\s*:\s*['"]?([^;'"`,\n]+)/gi) || [])) {
    const name = decl.replace(/font-family\s*:\s*/i, '').replace(/['"]/g, '').split(',')[0].trim();
    if (name && name.length > 1 && name.length < 40 && !fonts.includes(name)
      && !/inherit|initial|unset|sans-serif|serif|monospace|system-ui|cursive|Arial|Helvetica/i.test(name)) {
      fonts.push(name);
    }
  }

  // Extract role-labeled colors
  const btnColor = findButtonColor(cssText);
  const headColor = findHeadingColor(cssText);
  const { primary, accent } = findCssVarColors(cssText);
  const mostUsed = findMostUsedColor(cssText);

  // Logo
  const logoPatterns = [
    /<img[^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*src=["']([^"']+)["'][^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["']/i,
    /<img[^>]*src=["']([^"']*logo[^"']+)["']/i,
  ];
  let logoUrl = '';
  for (const p of logoPatterns) {
    const m = rawHtml.match(p);
    if (m) { logoUrl = resolveUrl(m[1], base); break; }
  }

  // OG image
  const ogMatch = rawHtml.match(/<meta[^>]+(?:property=["']og:image["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:image["'])/i);
  const ogImage = ogMatch ? resolveUrl(ogMatch[1] || ogMatch[2] || '', base) : '';

  // Brand name
  const ogNameMatch = rawHtml.match(/<meta[^>]+(?:property=["']og:site_name["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:site_name["'])/i);
  const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
  const brandName = ((ogNameMatch ? (ogNameMatch[1] || ogNameMatch[2]) : titleMatch ? titleMatch[1] : '') || '')
    .trim().split(/[|–-]/)[0].trim();

  return {
    buttonColor: btnColor || primary || mostUsed,
    headingColor: headColor || primary || mostUsed,
    primaryColor: primary || btnColor || mostUsed,
    accentColor: accent || btnColor,
    fonts: fonts.slice(0, 5),
    logoUrl,
    ogImage,
    brandName,
  };
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const { websiteUrl, ctaUrl, eventDetails, images, emailType, revisionRequest, conversationHistory } = await req.json();
    if (!websiteUrl) return new Response(JSON.stringify({ error: "Missing websiteUrl" }), { status: 400, headers: { "Content-Type": "application/json" } });

    const anthropicKey = Netlify.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });

    const ctaLink = ctaUrl?.trim() || websiteUrl;
    const currentYear = new Date().getFullYear();

    // Fetch Jina + raw HTML in parallel
    const [jinaResult, rawHtmlResult] = await Promise.allSettled([
      fetch(`https://r.jina.ai/${websiteUrl}`, {
        headers: { Accept: "text/plain", "X-Return-Format": "text", "X-Timeout": "4" },
        signal: AbortSignal.timeout(5000),
      }).then(r => r.text()),
      fetch(websiteUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AmeliorateBot/1.0)" },
        signal: AbortSignal.timeout(5000),
      }).then(r => r.text()),
    ]);

    const pageContent = jinaResult.status === 'fulfilled' ? jinaResult.value : '';
    const rawHtml = rawHtmlResult.status === 'fulfilled' ? rawHtmlResult.value : '';

    // Extract brand kit (fetches CSS files)
    const bk = rawHtml
      ? await extractBrandKit(rawHtml, websiteUrl)
      : { buttonColor: '', headingColor: '', primaryColor: '', accentColor: '', fonts: [], logoUrl: '', ogImage: '', brandName: '' };

    const contentSnippet = pageContent.substring(0, 2500);

    // Auto-fill OG image if no images given
    let resolvedImages = images && images.length > 0 ? [...images] : [];
    if (resolvedImages.length === 0 && bk.ogImage) resolvedImages = [bk.ogImage];

    const imageSlots = resolvedImages.length > 0
      ? resolvedImages.map((url: string, i: number) =>
          url.trim() ? `IMAGE_${i + 1}: ${url.trim()}` : `IMAGE_${i + 1}: %%IMAGE_${i + 1}%%`
        ).join("\n")
      : [`IMAGE_1: %%IMAGE_1%%`];

    const base = new URL(websiteUrl);

    // Build explicit color instructions with labeled roles
    const colorLines = [
      bk.buttonColor  ? `  CTA button background : ${bk.buttonColor}  ← USE THIS for the CTA button` : null,
      bk.headingColor ? `  Headline color        : ${bk.headingColor}  ← USE THIS for h1/h2 headings` : null,
      bk.primaryColor && bk.primaryColor !== bk.buttonColor && bk.primaryColor !== bk.headingColor
        ? `  Primary brand color   : ${bk.primaryColor}` : null,
      bk.accentColor  && bk.accentColor !== bk.buttonColor
        ? `  Accent color          : ${bk.accentColor}` : null,
    ].filter(Boolean).join('\n');

    const brandSection = [
      `BRAND KIT — follow these EXACTLY, no substitutions:`,
      `  Business name : ${bk.brandName || base.hostname}`,
      `  Logo URL      : ${bk.logoUrl || '(none found — render business name as large bold text)'}`,
      colorLines || `  Colors        : (none extracted — use dark charcoal #1a1a1a headers, white background, NO purple)`,
      `  Site fonts    : ${bk.fonts.length ? bk.fonts.join(', ') : 'none detected'}`,
    ].join('\n');

    const systemPrompt = `You are an expert HTML email designer. Build a beautiful, on-brand, mobile-first HTML email.

CURRENT YEAR: ${currentYear}. Use only ${currentYear} for dates — never 2024 or earlier.

${brandSection}

ABSOLUTE COLOR RULE: You MUST use the exact hex colors listed above. 
NEVER use purple (#7c4dff or any purple), NEVER use orange unless it's in the brand kit.
If no colors were extracted, use #1a1a1a for headings and a neutral dark button. Do not invent colors.

EMAIL RULES:
- Mobile-first, single column, 600px max width
- Inline CSS only — no <style> tags (stripped by email clients)
- Table-based layout for email client compatibility
- background-color must be set on both the <td> AND the child element
- Images: width="100%", max-width inline, alt text, referrerpolicy="no-referrer"
- Body font: Arial, Helvetica, sans-serif
- Tone: warm, parent-friendly, action-oriented

EXACT STRUCTURE — follow this order:
1. Header row — logo <img> if Logo URL exists above; otherwise business name as centered bold text
2. Hero row — IMAGE_1, linked to the CTA URL, target="_blank"
3. Headline — short, punchy, benefit-first; color = headline color above
4. Body — 2–3 short paragraphs max
5. CTA button — full-width table button, background = button color above, white bold text, href="${ctaLink}", target="_blank"
6. *** NO FOOTER — do not add any footer, copyright line, address, or unsubscribe text ***

All <a> tags must have target="_blank" rel="noopener noreferrer".

Respond with ONLY the complete HTML document. No markdown fences, no explanation, no preamble.`;

    let messages: any[];
    if (revisionRequest && conversationHistory) {
      messages = [
        ...conversationHistory,
        { role: "user", content: `Revise the email: ${revisionRequest}\n\nReturn ONLY the complete updated HTML.` },
      ];
    } else {
      const eventSection = eventDetails?.trim()
        ? `\n\nEVENT DETAILS (use for email copy):\n${eventDetails.trim()}` : "";
      messages = [{
        role: "user",
        content: `${systemPrompt}\n\n---\n\nBRAND WEBSITE: ${websiteUrl}\nEMAIL PURPOSE: ${emailType || "general promotional email"}${eventSection}\n\nWEBSITE CONTENT:\n${contentSnippet || "Could not scrape — use brand kit above only"}\n\nIMAGE SLOTS:\n${imageSlots}\n\nReturn ONLY the complete HTML.`,
      }];
    }

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 3000, messages }),
    });

    if (!claudeRes.ok) {
      const errData = await claudeRes.json().catch(() => null);
      return new Response(JSON.stringify({ error: `AI failed: ${errData ? JSON.stringify(errData) : claudeRes.status}` }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const claudeData = await claudeRes.json();
    let emailHtml: string = claudeData.content[0].text;
    emailHtml = emailHtml.replace(/^```html\n?/i, "").replace(/\n?```$/i, "").trim();
    emailHtml = postProcessHtml(emailHtml);

    const updatedHistory = revisionRequest
      ? [...conversationHistory, { role: "user", content: `Revise the email: ${revisionRequest}` }, { role: "assistant", content: emailHtml }]
      : [...messages, { role: "assistant", content: emailHtml }];

    return new Response(
      JSON.stringify({
        success: true, emailHtml, conversationHistory: updatedHistory,
        brandKit: { logoUrl: bk.logoUrl, ogImage: bk.ogImage, buttonColor: bk.buttonColor, headingColor: bk.headingColor, fonts: bk.fonts, brandName: bk.brandName },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Unknown error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const config = { path: "/api/generate-email" };
