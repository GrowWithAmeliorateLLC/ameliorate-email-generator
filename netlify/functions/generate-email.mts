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
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured in Netlify environment variables." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Scrape website — tight 7s timeout so we stay well within function limit
    let pageContent = "";
    try {
      const jinaUrl = `https://r.jina.ai/${websiteUrl}`;
      const pageRes = await fetch(jinaUrl, {
        headers: { Accept: "text/plain", "X-Return-Format": "text", "X-Timeout": "6" },
        signal: AbortSignal.timeout(7000),
      });
      pageContent = await pageRes.text();
    } catch {
      // Fallback: plain fetch, 5s max
      try {
        const fallbackRes = await fetch(websiteUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; AmeliorateBot/1.0)" },
          signal: AbortSignal.timeout(5000),
        });
        const html = await fallbackRes.text();
        pageContent = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      } catch {
        pageContent = "";
      }
    }

    const contentSnippet = pageContent.substring(0, 4000);

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
- Primary and secondary colors (hex codes, CSS variables, brand mentions)
- Logo URL if present
- Business name, tagline, tone of voice
- Key offerings and messaging

EMAIL RULES:
- Mobile-first, max 600px wide, inline CSS only (no <style> tags)
- Table-based layout for email client compatibility
- Background colors on BOTH table cell AND element
- All images: alt text + width/height attributes
- Font stack: Arial, Helvetica, sans-serif
- Use extracted brand colors — never generic blue/gray
- Warm, parent-friendly tone
- Structure: header/logo → hero image → headline → body → CTA button → footer
- CTA must be a table-based button, NOT just an <a> tag

PLACEHOLDERS:
- CTA href: %%EVENT_LINK%%
- Missing images: %%IMAGE_1%%, %%IMAGE_2%% etc.
- Unsubscribe: %%UNSUBSCRIBE_LINK%%

OUTPUT: Complete HTML only. Start with <!DOCTYPE html>, end with </html>. No explanation, no markdown.`;

    if (revisionRequest && previousEmail && conversationHistory) {
      messages = [
        ...conversationHistory,
        { role: "user", content: `Revise the email with these changes: ${revisionRequest}\n\nReturn ONLY the complete updated HTML email.` },
      ];
    } else {
      messages = [
        {
          role: "user",
          content: `${systemPrompt}\n\n---\n\nGenerate a professional HTML email.\n\nWEBSITE URL: ${websiteUrl}\nEMAIL PURPOSE: ${emailType || "general promotional email"}\n\nWEBSITE CONTENT (use for brand extraction):\n${contentSnippet || "Could not scrape — use clean professional styling with warm greens/yellows"}\n\nIMAGE SLOTS:\n${imageSlots}\n\nCTA href: %%EVENT_LINK%%\n\nReturn ONLY the complete HTML.`,
        },
      ];
    }

    // 4. Call Claude
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
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
