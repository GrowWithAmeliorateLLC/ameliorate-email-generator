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

function filterMeaningfulColors(hexList: string[]): string[] {
  return [...new Set(hexList)].filter(hex => {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const brightness = (r + g + b) / 3;
    const isGray = Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20;
    return brightness > 25 && brightness < 220 && !isGray;
  });
}

async function extractBrandKit(rawHtml: string, baseUrl: string): Promise<{
  colors: string[];
  fonts: string[];
  logoUrl: string;
  ogImage: string;
  brandName: string;
  cssVarSnippet: string;
}> {
  const base = new URL(baseUrl);

  // --- GOOGLE FONTS detection from HTML ---
  const gFontsUrls = rawHtml.match(/fonts\.googleapis\.com\/css[^"'\s>]+/g) || [];
  const fonts: string[] = [];
  for (const u of gFontsUrls) {
    const fams = u.match(/family=([^&"'\s]+)/g) || [];
    for (const f of fams) {
      const name = decodeURIComponent(f.replace('family=', '').split(':')[0].replace(/\+/g, ' ')).trim();
      if (name && !fonts.includes(name)) fonts.push(name);
    }
  }

  // --- FETCH EXTERNAL CSS (up to 3 stylesheets, skip fonts/icons) ---
  const cssLinkMatches = rawHtml.match(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi) || [];
  const cssUrls = cssLinkMatches
    .map(m => { const h = m.match(/href=["']([^"']+)["']/i); return h ? resolveUrl(h[1], base) : ''; })
    .filter(u => u && !/font|google|gstatic|icon|awesome/i.test(u))
    .slice(0, 3);

  // Inline <style> blocks
  let cssText = (rawHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [])
    .map(s => s.replace(/<\/?style[^>]*>/gi, '')).join('\n');

  // Fetch external CSS files in parallel
  const cssResults = await Promise.allSettled(
    cssUrls.map(url => fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AmeliorateBot/1.0)' },
      signal: AbortSignal.timeout(3000),
    }).then(r => r.text()))
  );
  for (const r of cssResults) {
    if (r.status === 'fulfilled') cssText += '\n' + r.value;
  }

  // --- FONTS from CSS font-family declarations ---
  const cssFontDecls = cssText.match(/font-family\s*:\s*['"]?([^;'"`,\n]+)/gi) || [];
  for (const decl of cssFontDecls) {
    const name = decl.replace(/font-family\s*:\s*/i, '').replace(/['"]/g, '').split(',')[0].trim();
    if (name && name.length > 1 && name.length < 40 && !fonts.includes(name)
      && !/inherit|initial|unset|sans-serif|serif|monospace|system-ui|cursive/i.test(name)) {
      fonts.push(name);
    }
  }

  // --- COLORS: CSS custom properties (most reliable) ---
  const cssVarMatches = cssText.match(/--[a-zA-Z0-9-]*(?:color|primary|secondary|accent|brand|main|bg|background|btn|button|cta|highlight)[a-zA-Z0-9-]*\s*:\s*(#[0-9a-fA-F]{3,6})/gi) || [];
  const cssVarColors = cssVarMatches.map(m => { const h = m.match(/#[0-9a-fA-F]{3,6}/); return h ? h[0] : ''; }).filter(Boolean);
  const cssVarSnippet = cssVarMatches.slice(0, 12).join('; ');

  // Colors from CSS property declarations
  const propMatches = cssText.match(/(?:^|[{;])\s*(?:color|background(?:-color)?|border(?:-color)?|fill|stroke)\s*:\s*(#[0-9a-fA-F]{3,6})/gim) || [];
  const propColors = propMatches.map(m => { const h = m.match(/#[0-9a-fA-F]{3,6}/); return h ? h[0] : ''; }).filter(Boolean);

  // Fallback: hex values anywhere in HTML
  const htmlColors = (rawHtml.match(/#[0-9A-Fa-f]{6}\b/g) || []);

  const colors = filterMeaningfulColors([...cssVarColors, ...propColors, ...htmlColors]).slice(0, 12);

  // --- LOGO ---
  const logoPatterns = [
    /<img[^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*src=["']([^"']+)["'][^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["']/i,
    /<img[^>]*src=["']([^"']*logo[^"']+)["']/i,
    /<img[^>]*src=["']([^"']*brand[^"']+)["']/i,
  ];
  let logoUrl = '';
  for (const p of logoPatterns) {
    const m = rawHtml.match(p);
    if (m) { logoUrl = resolveUrl(m[1], base); break; }
  }

  // --- OG IMAGE ---
  const ogMatch = rawHtml.match(/<meta[^>]+(?:property=["']og:image["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:image["'])/i);
  const ogImage = ogMatch ? resolveUrl(ogMatch[1] || ogMatch[2] || '', base) : '';

  // --- BRAND NAME ---
  const ogNameMatch = rawHtml.match(/<meta[^>]+(?:property=["']og:site_name["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:site_name["'])/i);
  const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
  const brandName = ((ogNameMatch ? (ogNameMatch[1] || ogNameMatch[2]) : titleMatch ? titleMatch[1] : '') || '')
    .trim().split('|')[0].trim().split(' - ')[0].trim().split(' – ')[0].trim();

  return { colors, fonts: fonts.slice(0, 6), logoUrl, ogImage, brandName, cssVarSnippet };
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const { websiteUrl, ctaUrl, eventDetails, images, emailType, revisionRequest, conversationHistory } = await req.json();

    if (!websiteUrl) {
      return new Response(JSON.stringify({ error: "Missing required field: websiteUrl" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const anthropicKey = Netlify.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured." }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const ctaLink = ctaUrl?.trim() || websiteUrl;
    const currentYear = new Date().getFullYear();

    // 1. Fetch Jina text + raw HTML in parallel
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

    // 2. Extract full brand kit (also fetches CSS files)
    const brandKit = rawHtml
      ? await extractBrandKit(rawHtml, websiteUrl)
      : { colors: [], fonts: [], logoUrl: '', ogImage: '', brandName: '', cssVarSnippet: '' };

    const contentSnippet = pageContent.substring(0, 2500);

    // 3. Image slots — auto-fill OG image if nothing provided
    let resolvedImages = images && images.length > 0 ? [...images] : [];
    if (resolvedImages.length === 0 && brandKit.ogImage) resolvedImages = [brandKit.ogImage];

    const imageSlots = resolvedImages.length > 0
      ? resolvedImages.map((url: string, i: number) =>
          url.trim() ? `IMAGE_${i + 1}: ${url.trim()}` : `IMAGE_${i + 1}: %%IMAGE_${i + 1}%%`
        ).join("\n")
      : [1, 2, 3].map(i => `IMAGE_${i}: %%IMAGE_${i}%%`).join("\n");

    // 4. Build prompt
    const base = new URL(websiteUrl);

    const brandSection = [
      `EXTRACTED BRAND KIT — apply ALL of these precisely:`,
      `  Business name : ${brandKit.brandName || base.hostname}`,
      `  Logo URL      : ${brandKit.logoUrl || '(none — use business name as styled text header)'}`,
      `  Brand colors  : ${brandKit.colors.length ? brandKit.colors.join(', ') : '(none extracted — infer carefully from website content or use dark navy + white)'}`,
      `  CSS color vars: ${brandKit.cssVarSnippet || '(none)'}`,
      `  Fonts on site : ${brandKit.fonts.length ? brandKit.fonts.join(', ') : '(none — use Arial, Helvetica, sans-serif)'}`,
      ``,
      `CRITICAL COLOR RULES:`,
      `  - You MUST use the brand colors listed above for buttons, headlines, accents`,
      `  - NEVER use purple, orange, or teal unless they appear in the color list above`,
      `  - If color list is empty, default to dark charcoal (#222) headers + white background — do NOT invent colors`,
    ].join('\n');

    const systemPrompt = `You are an expert HTML email designer. Create a beautiful, on-brand, mobile-first HTML email for a youth enrichment or kids activity business.

CURRENT YEAR: ${currentYear}. Use ${currentYear} in all date references — never use 2024 or any past year.

${brandSection}

EMAIL RULES:
- MOBILE-FIRST: single column, min 16px body text, CTA button min 48px tall and full-width on mobile
- Max 600px wide, inline CSS only (no <style> tags — stripped by email clients)
- Table-based layout for email client compatibility
- Set background-color on BOTH <td> AND child element
- Images: alt text + width="100%" + max-width inline + referrerpolicy="no-referrer"
- Font in email: Arial, Helvetica, sans-serif (web fonts don't render in email clients)
- Tone: warm, parent-friendly, action-oriented

STRUCTURE (in this exact order):
1. Header — <img> using the Logo URL above; if no logo, render business name as large bold centered text
2. Hero — IMAGE_1 linked to CTA URL, opens in new window
3. Headline — benefit-first, use primary brand color
4. Body — 2–3 short paragraphs, conversational
5. CTA button — table-based, full-width, brand color background, white text, href="${ctaLink}", target="_blank"
6. NO footer unless the user explicitly requests one

ALL <a> tags: target="_blank" rel="noopener noreferrer"

OUTPUT: Complete HTML only. <!DOCTYPE html> through </html>. No markdown fences, no explanation.`;

    let messages: any[];

    if (revisionRequest && conversationHistory) {
      messages = [
        ...conversationHistory,
        { role: "user", content: `Revise the email: ${revisionRequest}\n\nReturn ONLY the complete updated HTML.` },
      ];
    } else {
      const eventSection = eventDetails?.trim()
        ? `\n\nEVENT DETAILS (use for copy — dates, price, description):\n${eventDetails.trim()}`
        : "";

      messages = [{
        role: "user",
        content: `${systemPrompt}\n\n---\n\nBRAND WEBSITE: ${websiteUrl}\nEMAIL PURPOSE: ${emailType || "general promotional email"}${eventSection}\n\nWEBSITE CONTENT (additional brand context):\n${contentSnippet || "Could not scrape — rely entirely on the extracted brand kit above"}\n\nIMAGE SLOTS:\n${imageSlots}\n\nReturn ONLY the complete HTML.`,
      }];
    }

    // 5. Call Claude Haiku
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 3000, messages }),
    });

    if (!claudeRes.ok) {
      const errData = await claudeRes.json().catch(() => null);
      return new Response(
        JSON.stringify({ error: `AI failed (${claudeRes.status}): ${errData ? JSON.stringify(errData) : 'unknown'}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
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
        brandKit: { logoUrl: brandKit.logoUrl, ogImage: brandKit.ogImage, colors: brandKit.colors, fonts: brandKit.fonts, brandName: brandKit.brandName },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Unknown error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const config = { path: "/api/generate-email" };
