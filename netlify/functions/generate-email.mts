import type { Context } from "@netlify/functions";

// Post-process: inject referrerpolicy + target=_blank on all links and images
function postProcessHtml(html: string): string {
  let result = html.replace(
    /<head([^>]*)>/i,
    '<head$1><meta name="referrer" content="no-referrer">'
  );
  result = result.replace(/<img\b(?![^>]*referrerpolicy)([^>]*?)(\/?>)/gi, '<img$1 referrerpolicy="no-referrer"$2');
  result = result.replace(/<a\b(?![^>]*target)([^>]*?)>/gi, '<a$1 target="_blank" rel="noopener noreferrer">');
  return result;
}

// Extract brand kit from raw HTML: hex colors, logo URL, OG image, brand name
function extractBrandKit(rawHtml: string, baseUrl: string): {
  colors: string[];
  logoUrl: string;
  ogImage: string;
  brandName: string;
} {
  const base = new URL(baseUrl);

  // Hex colors — grab from inline styles, CSS blocks, data attributes
  const hexMatches = rawHtml.match(/#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g) || [];
  // Filter out near-white, near-black, and pure grays which are usually layout colors
  const meaningfulColors = [...new Set(hexMatches)].filter(hex => {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const brightness = (r + g + b) / 3;
    const isGray = Math.abs(r - g) < 15 && Math.abs(g - b) < 15;
    return brightness > 20 && brightness < 230 && !isGray;
  }).slice(0, 8);

  // Logo URL — prioritise elements with 'logo' in class/id/src/alt
  const logoPatterns = [
    /<img[^>]*(?:class|id|alt|src)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*src=["']([^"']*logo[^"']+)["']/i,
    /<img[^>]*src=["']([^"']*brand[^"']+)["']/i,
  ];
  let logoUrl = '';
  for (const pattern of logoPatterns) {
    const m = rawHtml.match(pattern);
    if (m) { logoUrl = m[1]; break; }
  }
  // Resolve relative URLs
  if (logoUrl && !logoUrl.startsWith('http')) {
    logoUrl = logoUrl.startsWith('//')
      ? `${base.protocol}${logoUrl}`
      : logoUrl.startsWith('/')
        ? `${base.origin}${logoUrl}`
        : `${base.origin}/${logoUrl}`;
  }

  // OG image as hero fallback
  const ogMatch = rawHtml.match(/<meta[^>]+(?:property=["']og:image["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:image["'])/i);
  const ogImage = ogMatch ? (ogMatch[1] || ogMatch[2] || '') : '';

  // Brand/business name from title or og:site_name
  const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogNameMatch = rawHtml.match(/<meta[^>]+(?:property=["']og:site_name["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:site_name["'])/i);
  const brandName = (ogNameMatch ? (ogNameMatch[1] || ogNameMatch[2]) : titleMatch ? titleMatch[1] : '').trim().split('|')[0].trim().split('-')[0].trim();

  return { colors: meaningfulColors, logoUrl, ogImage, brandName };
}

function resolveUrl(src: string, base: URL): string {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return `${base.protocol}${src}`;
  if (src.startsWith('/')) return `${base.origin}${src}`;
  return `${base.origin}/${src}`;
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { websiteUrl, ctaUrl, eventDetails, images, emailType, revisionRequest, conversationHistory } = await req.json();

    if (!websiteUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required field: websiteUrl" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const anthropicKey = Netlify.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const ctaLink = ctaUrl?.trim() || websiteUrl;
    const currentYear = new Date().getFullYear();

    // 1. Fetch BOTH Jina text (for content) AND raw HTML (for brand extraction) IN PARALLEL
    const [jinaResult, rawHtmlResult] = await Promise.allSettled([
      fetch(`https://r.jina.ai/${websiteUrl}`, {
        headers: { Accept: "text/plain", "X-Return-Format": "text", "X-Timeout": "4" },
        signal: AbortSignal.timeout(5000),
      }).then(r => r.text()),
      fetch(websiteUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AmeliorateBot/1.0; +https://growwithameliorate.com)" },
        signal: AbortSignal.timeout(5000),
      }).then(r => r.text()),
    ]);

    const pageContent = jinaResult.status === 'fulfilled' ? jinaResult.value : '';
    const rawHtml = rawHtmlResult.status === 'fulfilled' ? rawHtmlResult.value : '';

    // 2. Extract brand kit from raw HTML
    const brandKit = rawHtml ? extractBrandKit(rawHtml, websiteUrl) : { colors: [], logoUrl: '', ogImage: '', brandName: '' };
    const contentSnippet = pageContent.substring(0, 3000);

    // 3. Build image slots — auto-use OG image as first slot if no images provided and no placeholders set
    let resolvedImages = images && images.length > 0 ? images : [];
    // If first slot is empty and we have an OG image, pre-fill it
    if (resolvedImages.length === 0 && brandKit.ogImage) {
      resolvedImages = [brandKit.ogImage];
    }

    const imageSlots = resolvedImages.length > 0
      ? resolvedImages.map((url: string, i: number) =>
          url.trim() ? `IMAGE_${i + 1}: ${url.trim()}` : `IMAGE_${i + 1}: %%IMAGE_${i + 1}%%`
        ).join("\n")
      : [1, 2, 3].map(i => `IMAGE_${i}: %%IMAGE_${i}%%`).join("\n");

    // 4. Build messages
    let messages: any[];

    const brandSection = `
EXTRACTED BRAND KIT (use these — do NOT override with generic colors):
- Business name: ${brandKit.brandName || 'extract from content'}
- Brand colors found on site: ${brandKit.colors.length > 0 ? brandKit.colors.join(', ') : 'extract from website content below'}
- Logo URL: ${brandKit.logoUrl ? resolveUrl(brandKit.logoUrl, new URL(websiteUrl)) : 'extract from website content or use business name as text'}
- OG/Hero image: ${brandKit.ogImage || 'use image slots below'}
- CRITICAL: Use ONLY these extracted colors. Do NOT default to orange unless it appears above.`;

    const systemPrompt = `You are an expert HTML email designer for youth enrichment and kids activity businesses. Create a beautiful, on-brand, mobile-first HTML email.

CURRENT YEAR: ${currentYear}. Always use ${currentYear} — never use 2024 or past years.

${brandSection}

EMAIL DESIGN RULES:
- MOBILE-FIRST: single column, min 16px font, buttons min 48px tall, full-width CTA on mobile
- Max 600px wide, inline CSS only (no <style> tags)
- Table-based layout for full email client compatibility
- Set background-color on BOTH the <td> AND the child element
- Images: alt text + width="100%" + max-width inline style + referrerpolicy="no-referrer"
- Font: Arial, Helvetica, sans-serif only
- Tone: warm, parent-friendly, benefit-focused

STRUCTURE (in order):
1. Header — logo image if URL provided above, otherwise business name as bold text
2. Hero image — use IMAGE_1 from slots below
3. Headline — compelling, benefit-first
4. Body copy — 2-3 short paragraphs max
5. CTA button — table-based, full-width, brand color, href="${ctaLink}", target="_blank"
6. NO footer unless explicitly requested

ALL links must have target="_blank" rel="noopener noreferrer"

OUTPUT: Complete HTML only. <!DOCTYPE html> to </html>. No markdown, no explanation.`;

    if (revisionRequest && conversationHistory) {
      messages = [
        ...conversationHistory,
        { role: "user", content: `Revise the email: ${revisionRequest}\n\nReturn ONLY the complete updated HTML.` },
      ];
    } else {
      const eventSection = eventDetails?.trim()
        ? `\n\nEVENT DETAILS (use for email copy):\n${eventDetails.trim()}`
        : "";

      messages = [
        {
          role: "user",
          content: `${systemPrompt}\n\n---\n\nBRAND WEBSITE: ${websiteUrl}\nEMAIL PURPOSE: ${emailType || "general promotional email"}${eventSection}\n\nWEBSITE CONTENT (for additional brand context):\n${contentSnippet || "Could not scrape — rely on extracted brand kit above"}\n\nIMAGE SLOTS:\n${imageSlots}\n\nReturn ONLY the complete HTML.`,
        },
      ];
    }

    // 5. Call Claude Haiku
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3000,
        messages,
      }),
    });

    if (!claudeRes.ok) {
      const errData = await claudeRes.json().catch(() => null);
      const errText = errData ? JSON.stringify(errData) : `HTTP ${claudeRes.status}`;
      return new Response(
        JSON.stringify({ error: `AI generation failed (${claudeRes.status}): ${errText}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const claudeData = await claudeRes.json();
    let emailHtml: string = claudeData.content[0].text;
    emailHtml = emailHtml.replace(/^```html\n?/i, "").replace(/\n?```$/i, "").trim();

    // 6. Post-process: referrer policy + target=_blank
    emailHtml = postProcessHtml(emailHtml);

    const updatedHistory = revisionRequest
      ? [
          ...conversationHistory,
          { role: "user", content: `Revise the email: ${revisionRequest}` },
          { role: "assistant", content: emailHtml },
        ]
      : [
          ...messages,
          { role: "assistant", content: emailHtml },
        ];

    return new Response(
      JSON.stringify({
        success: true,
        emailHtml,
        conversationHistory: updatedHistory,
        // Return detected brand kit so UI can auto-populate image slots
        brandKit: {
          logoUrl: brandKit.logoUrl ? resolveUrl(brandKit.logoUrl, new URL(websiteUrl)) : '',
          ogImage: brandKit.ogImage || '',
          colors: brandKit.colors,
          brandName: brandKit.brandName,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Unknown server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = { path: "/api/generate-email" };
