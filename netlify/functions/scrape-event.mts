import type { Context } from "@netlify/functions";

// Tries to extract event details from a URL (including JS-rendered pages via Jina)
export default async (req: Request, _context: Context) => {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url")?.trim();

  if (!url || !url.startsWith("http")) {
    return new Response(JSON.stringify({ details: "", success: false }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const anthropicKey = Netlify.env.get("ANTHROPIC_API_KEY") ?? "";
  let pageText = "";

  // Try Jina first — it renders JS so works on MyStudio, LineLeader etc.
  try {
    const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: "text/plain", "X-Return-Format": "text", "X-Timeout": "5" },
      signal: AbortSignal.timeout(6000),
    });
    pageText = await jinaRes.text();
  } catch {
    // Fallback: plain fetch
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AmeliorateBot/1.0)" },
        signal: AbortSignal.timeout(4000),
      });
      const html = await res.text();
      pageText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    } catch {
      pageText = "";
    }
  }

  if (!pageText || pageText.length < 50) {
    return new Response(JSON.stringify({ details: "", success: false, reason: "no_content" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Use Claude to extract clean event details from the scraped text
  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: `Extract the key event details from the page content below. Return a clean, concise summary (3-6 lines max) that includes: event/camp name, dates, times, age range, price, and any standout features or description. Write in plain text — no markdown, no bullet symbols, no labels. Just the facts in natural sentence fragments that could be dropped into an email brief.\n\nIf the page doesn't contain a specific event (e.g. it's a general website), return exactly: NO_EVENT\n\nPAGE CONTENT:\n${pageText.substring(0, 3000)}`,
        }],
      }),
    });

    if (!claudeRes.ok) {
      return new Response(JSON.stringify({ details: "", success: false, reason: "ai_failed" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await claudeRes.json();
    const extracted = data.content[0].text.trim();

    if (extracted === "NO_EVENT" || extracted.length < 10) {
      return new Response(JSON.stringify({ details: "", success: false, reason: "no_event" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ details: extracted, success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ details: "", success: false, reason: "error" }), {
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/scrape-event" };
