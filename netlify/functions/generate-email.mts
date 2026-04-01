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

    // 1. Scrape website — hard 4s limit
    let pageContent = "";
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
        const html = await fallbackRes.text();
        pageContent = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      } catch {
        pageContent = "";
      }
    }

    const contentSnippet = pageContent.substring(0, 3000);

    // 2. Build image slots
    const imageSlots = images && images.length > 0
      ? images.map((url: string, i: number) =>
          url.trim()
            ? `IMAGE_${i + 1}: ${url.trim()}`
            : `IMAGE_${i + 1}: %%IMAGE_${i + 1}%%`
        ).join("\n")
      : [1, 2, 3].map(i => `IMAGE_${i}: %%IMAGE_${i}%%`).join("\n");

    // 3. Build messages
    let messages: any[];

    const systemPrompt = `You are an expert HTML email designer for youth enrichment businesses. Create a beautiful, on-brand, mobile-responsive HTML email.

BRAND EXTRACTION: From the website content, extract colors, logo URL, business name, and tone.

EMAIL RULES:
- Max 600px wide, inline CSS only (no <style> tags)
- Table-based layout for email client compatibility  
- Background colors on both table cell AND element
- Images: alt text + width/height
- Font stack: Arial, Helvetica, sans-serif
- Use extracted brand colors
- Warm, parent-friendly tone
- Structure: logo header → hero image → headline → body → CTA button → footer
- CTA = large table-based button

PLACEHOLDERS: CTA href=%%EVENT_LINK%%, missing images=%%IMAGE_1%% etc, unsubscribe=%%UNSUBSCRIBE_LINK%%

OUTPUT: Complete HTML only. <!DOCTYPE html> to </html>. No explanation, no markdown.`;

    if (revisionRequest && conversationHistory) {
      messages = [
        ...conversationHistory,
        { role: "user", content: `Revise the email: ${revisionRequest}\n\nReturn ONLY the complete updated HTML.` },
      ];
    } else {
      messages = [
        {
          role: "user",
          content: `${systemPrompt}\n\n---\n\nURL: ${websiteUrl}\nPURPOSE: ${emailType || "general promotional email"}\n\nWEBSITE CONTENT:\n${contentSnippet || "No content scraped — use clean professional styling"}\n\nIMAGES:\n${imageSlots}\n\nCTA href: %%EVENT_LINK%%\n\nReturn ONLY the complete HTML.`,
        },
      ];
    }

    // 4. Call Claude Haiku — fastest model, stays within timeout
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
