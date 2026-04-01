import type { Context } from "@netlify/functions";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { websiteUrl, images, emailType, revisionRequest, previousEmail, conversationHistory } = await req.json();

    if (!websiteUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required field: websiteUrl" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const anthropicKey = Netlify.env.get("ANTHROPIC_API_KEY");

    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured. Please add it in Netlify → Site configuration → Environment variables." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Scrape website for brand kit
    let pageContent = "";
    try {
      const jinaUrl = `https://r.jina.ai/${websiteUrl}`;
      const pageRes = await fetch(jinaUrl, {
        headers: { Accept: "text/plain", "X-Return-Format": "text", "X-Timeout": "15" },
        signal: AbortSignal.timeout(20000),
      });
      pageContent = await pageRes.text();
    } catch {
      try {
        const fallbackRes = await fetch(websiteUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; AmeliorateBot/1.0)" },
          signal: AbortSignal.timeout(10000),
        });
        const html = await fallbackRes.text();
        pageContent = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      } catch {
        pageContent = "";
      }
    }

    const contentSnippet = pageContent.substring(0, 6000);

    // 2. Build image slots
    const imageSlots = images && images.length > 0
      ? images.map((url: string, i: number) =>
          url.trim()
            ? `IMAGE_${i + 1}: ${url.trim()}`
            : `IMAGE_${i + 1}: [PLACEHOLDER — add image URL here]`
        ).join("\n")
      : Array.from({ length: 3 }, (_, i) => `IMAGE_${i + 1}: [PLACEHOLDER — add image URL here]`).join("\n");

    // 3. Build messages
    let messages: any[];

    const systemPrompt = `You are an expert HTML email designer for youth enrichment and kids' activity businesses. You create beautiful, on-brand, mobile-responsive HTML emails that parents love to open.

BRAND EXTRACTION: When given website content, extract:
- Primary and secondary colors (look for hex codes, CSS variables, brand mentions)
- Logo URL if present in the content
- Business name, tagline, tone of voice
- Key offerings and messaging

EMAIL RULES:
- Mobile-first, max 600px wide, inline CSS only (no <style> tags — email clients strip them)
- Use table-based layout for maximum email client compatibility
- Background colors set on BOTH the table cell AND the element itself
- All images must have alt text and width/height attributes
- Font stack: Arial, Helvetica, sans-serif (web-safe only)
- Use the brand's actual extracted colors — never generic blue/gray
- Warm, parent-friendly tone
- Clear visual hierarchy: header with logo → hero image → headline → body copy → CTA button → footer
- CTA button must be a large, tappable table-based button (not just an <a> tag)

PLACEHOLDER RULES:
- Main CTA link href: use exactly %%EVENT_LINK%%
- Any image without a URL: use %%IMAGE_1%%, %%IMAGE_2%% etc.
- Footer unsubscribe: use %%UNSUBSCRIBE_LINK%%

OUTPUT: Return ONLY the complete HTML email. Start with <!DOCTYPE html> and end with </html>. No explanation, no markdown fences.`;

    if (revisionRequest && previousEmail && conversationHistory) {
      messages = [
        ...conversationHistory,
        { role: "user", content: `Please revise the email with these changes: ${revisionRequest}\n\nReturn ONLY the complete updated HTML email with no explanation.` },
      ];
    } else {
      messages = [
        {
          role: "user",
          content: `${systemPrompt}\n\n---\n\nGenerate a professional HTML email for this business.\n\nWEBSITE URL: ${websiteUrl}\nEMAIL TYPE / PURPOSE: ${emailType || "general promotional email"}\n\nWEBSITE CONTENT (extract brand colors, logo, tone from this):\n${contentSnippet || "Could not scrape — use professional generic styling"}\n\nIMAGE SLOTS:\n${imageSlots}\n\nCTA LINK: Use %%EVENT_LINK%% as the href for the main button.\n\nRequirements:\n- Extract and use the actual brand colors from the website content\n- Include logo if URL found in content\n- Mobile-responsive table-based layout\n- Compelling copy matching the email purpose\n- Large tappable CTA button linking to %%EVENT_LINK%%\n- Simple footer with %%UNSUBSCRIBE_LINK%%\n\nReturn ONLY the complete HTML. No explanation.`,
        },
      ];
    }

    // 4. Call Claude — using claude-sonnet-4-6
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages,
      }),
    });

    if (!claudeRes.ok) {
      const errData = await claudeRes.json().catch(() => null);
      const errText = errData
        ? JSON.stringify(errData)
        : await claudeRes.text().catch(() => `HTTP ${claudeRes.status}`);
      return new Response(
        JSON.stringify({ error: `AI generation failed (${claudeRes.status}): ${errText}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const claudeData = await claudeRes.json();
    let emailHtml: string = claudeData.content[0].text;
    emailHtml = emailHtml.replace(/^```html\n?/i, "").replace(/\n?```$/i, "").trim();

    // Build updated conversation history
    const updatedHistory = revisionRequest
      ? [
          ...conversationHistory,
          { role: "user", content: `Please revise the email with these changes: ${revisionRequest}\n\nReturn ONLY the complete updated HTML email with no explanation.` },
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
