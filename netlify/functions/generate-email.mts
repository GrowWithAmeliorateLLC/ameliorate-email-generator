import type { Context } from "@netlify/functions";

// Post-process: inject referrerpolicy + target=_blank on all links and images
function postProcessHtml(html: string): string {
  // Add meta referrer to <head>
  let result = html.replace(
    /<head([^>]*)>/i,
    '<head$1><meta name="referrer" content="no-referrer">'
  );
  // Add referrerpolicy to every <img> that doesn't already have it
  result = result.replace(/<img\b(?![^>]*referrerpolicy)([^>]*?)(\/?>)/gi, '<img$1 referrerpolicy="no-referrer"$2');
  // Add target=_blank + rel=noopener to every <a> that doesn't already have target
  result = result.replace(/<a\b(?![^>]*target)([^>]*?)>/gi, '<a$1 target="_blank" rel="noopener noreferrer">');
  return result;
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
    const currentYear = new Date().getFullYear(); // Always use real current year

    // 1. Scrape brand website for colors/logo/tone
    let pageContent = "";
    let rawHtml = "";
    try {
      const jinaUrl = `https://r.jina.ai/${websiteUrl}`;
      const pageRes = await fetch(jinaUrl, {
        headers: { Accept: "text/plain", "X-Return-Format": "text", "X-Timeout": "4" },
        signal: AbortSignal.timeout(4500),
      });
      pageContent = await pageRes.text();
    } catch {
      try {
        const fallbackRes = await fetch(websiteUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; AmeliorateBot/1.0)" },
          signal: AbortSignal.timeout(3000),
        });
        rawHtml = await fallbackRes.text();
        pageContent = rawHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      } catch {
        pageContent = "";
      }
    }

    // Also try to extract hex colors and logo URL directly from raw HTML
    const hexColors = rawHtml
      ? [...new Set((rawHtml.match(/#[0-9A-Fa-f]{3,6}\b/g) || []))].slice(0, 10).join(", ")
      : "";
    const logoMatch = rawHtml?.match(/<img[^>]*(logo|brand)[^>]*src=["']([^"']+)["']/i)
      || rawHtml?.match(/src=["']([^"']+logo[^"']+)["']/i);
    const detectedLogoUrl = logoMatch ? (logoMatch[2] || logoMatch[1]) : "";

    const contentSnippet = pageContent.substring(0, 3000);

    // 2. Build image slots
    const imageSlots = images && images.length > 0
      ? images.map((url: string, i: number) =>
          url.trim() ? `IMAGE_${i + 1}: ${url.trim()}` : `IMAGE_${i + 1}: %%IMAGE_${i + 1}%%`
        ).join("\n")
      : [1, 2, 3].map(i => `IMAGE_${i}: %%IMAGE_${i}%%`).join("\n");

    // 3. Build messages
    let messages: any[];

    const systemPrompt = `You are an expert HTML email designer for youth enrichment and kids activity businesses. Create a beautiful, on-brand, mobile-first HTML email.

CURRENT YEAR: ${currentYear}. Always use ${currentYear} for any date references. Never use 2024 or any past year.

BRAND EXTRACTION RULES (critical — do NOT default to orange or generic colors):
- You MUST extract and use the actual brand colors from the website content provided
- Look for hex codes (e.g. #FF5A00), CSS variables, color mentions, button colors, header backgrounds
- Extract the logo URL if present and use it in the email header
- Extract the business name, tagline, and tone of voice
- If you detect colors like these from the site, use them: ${hexColors || "extract from content below"}
- Detected logo URL: ${detectedLogoUrl || "extract from content below"}
- NEVER default to generic orange (#FF6600) unless the brand is actually orange

EMAIL DESIGN RULES:
- MOBILE-FIRST: single column layout, minimum 16px font, tap-friendly buttons (min 48px height)
- Max 600px wide, inline CSS only (no <style> tags — email clients strip them)
- Table-based layout for email client compatibility
- Background colors on BOTH the table cell AND the element itself
- All images: alt text, width="100%", max-width in inline style, referrerpolicy="no-referrer"
- Font stack: Arial, Helvetica, sans-serif only
- Use ONLY the extracted brand colors — never substitute with orange if not the brand color
- Warm, parent-friendly tone matching the brand voice

STRUCTURE:
1. Logo header (use extracted logo URL, or business name as text if no logo found)
2. Hero image (use provided image or %%IMAGE_1%% placeholder)
3. Compelling headline
4. Body copy (warm, benefit-focused, parent-friendly)
5. CTA button (table-based, brand color, full-width on mobile)
6. Footer ONLY if explicitly requested — otherwise omit entirely

LINKS:
- ALL <a> tags must have target="_blank" rel="noopener noreferrer"
- ALL images that are clickable must also link to the CTA URL with target="_blank"
- CTA button href must be exactly: ${ctaLink}

PLACEHOLDERS: Missing images use %%IMAGE_1%%, %%IMAGE_2%% etc.

OUTPUT: Return ONLY the complete HTML. Start with <!DOCTYPE html>, end with </html>. No explanation, no markdown fences.`;

    if (revisionRequest && conversationHistory) {
      messages = [
        ...conversationHistory,
        { role: "user", content: `Revise the email: ${revisionRequest}\n\nReturn ONLY the complete updated HTML.` },
      ];
    } else {
      const eventSection = eventDetails?.trim()
        ? `\n\nEVENT DETAILS (use for email copy — dates, pricing, description):\n${eventDetails.trim()}`
        : "";

      messages = [
        {
          role: "user",
          content: `${systemPrompt}\n\n---\n\nBRAND WEBSITE: ${websiteUrl}\nEMAIL PURPOSE: ${emailType || "general promotional email"}${eventSection}\n\nWEBSITE CONTENT (extract brand colors, logo URL, business name, tone from this):\n${contentSnippet || "Could not scrape — use clean professional styling and extract brand info from the URL domain name"}\n\nIMAGE SLOTS:\n${imageSlots}\n\nReturn ONLY the complete HTML.`,
        },
      ];
    }

    // 4. Call Claude Haiku
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

    // 5. Post-process: inject referrer policy + target=_blank on all links
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
      JSON.stringify({ success: true, emailHtml, conversationHistory: updatedHistory }),
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
