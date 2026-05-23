import type { Context } from "@netlify/functions";
import { BRAND_CONTEXT, CLIENTS, type ClientId } from "./_brand-context.js";

// ─── Constants ─────────────────────────────────────────────────────────────────────

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 6000;
const MAX_PAGE_CONTENT_CHARS = 6000;

// ─── HTML integrity check (carried over from prior version) ───────────────────────

function verifyHtmlIntegrity(html: string): string[] {
  const warnings: string[] = [];
  if (!html || html.trim().length < 200) {
    warnings.push("Output is very short — generation may have failed mid-stream.");
    return warnings;
  }
  if (!/<!doctype html/i.test(html)) warnings.push("Missing <!doctype html> declaration.");
  if (!/<html[\s>]/i.test(html)) warnings.push("Missing <html> tag.");
  if (!/<body[\s>]/i.test(html)) warnings.push("Missing <body> tag.");
  const opens = (html.match(/<(table|tr|td)\b[^>]*>/gi) || []).length;
  const closes = (html.match(/<\/(table|tr|td)>/gi) || []).length;
  if (Math.abs(opens - closes) > 2) {
    warnings.push(`Possible unbalanced table tags (opens=${opens}, closes=${closes}).`);
  }
  if (/lorem\s+ipsum|placeholder text|\{\{[A-Z_]+\}\}/i.test(html)) {
    warnings.push("Possible placeholder text left in output.");
  }
  return warnings;
}

// ─── Post-process: tracking-safe headers and link safety ───────────────────────────

function postProcessHtml(html: string): string {
  let out = html.trim();
  out = out.replace(/^```html\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  if (!/<meta\s+name=["']referrer["']/i.test(out)) {
    out = out.replace(/<head([^>]*)>/i, '<head$1>\n  <meta name="referrer" content="no-referrer">');
  }
  out = out.replace(/<img\b(?![^>]*referrerpolicy)([^>]*?)(\/?>)/gi, '<img$1 referrerpolicy="no-referrer"$2');
  out = out.replace(/<a\b(?![^>]*target=)([^>]*?)>/gi, '<a$1 target="_blank" rel="noopener noreferrer">');
  return out;
}

// ─── Destination URL fetch (Jina) — gives the model real context about the offer ──

async function fetchPageContent(url: string): Promise<string> {
  if (!url) return "";
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: "text/plain", "X-Return-Format": "text", "X-Timeout": "5" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return "";
    const text = await res.text();
    return text.substring(0, MAX_PAGE_CONTENT_CHARS);
  } catch {
    return "";
  }
}

// ─── Prompt construction ───────────────────────────────────────────────────────────

function buildSystemPrompt(clientLabel: string, brandContext: string): string {
  return `You are an expert HTML email producer at Grow With Ameliorate LLC, a marketing agency serving franchise and small-business clients.

You are producing an email for ${clientLabel}. The brand bible below is AUTHORITATIVE — voice rules, colors, fonts, banned phrases, signature design moves, business facts, CTA URLs, ClickUp lookup patterns, all of it. Adhere to it strictly. When the bible contradicts a generic email-marketing instinct you might have, the bible wins.

═══════════════ BRAND BIBLE: ${clientLabel.toUpperCase()} ═══════════════
${brandContext}
═══════════════ END BRAND BIBLE ═══════════════

OUTPUT REQUIREMENTS:
- Produce a COMPLETE, self-contained HTML email document starting with <!doctype html>.
- Use table-based layout (table, tr, td, role="presentation") for Outlook/Gmail/Apple-Mail compatibility.
- Inline ALL CSS via the style attribute. Do not use <style> blocks for layout-critical styles (you may use a small <style> in <head> only for font-face imports and media queries).
- Use the brand's actual colors and fonts from the bible. Always pair brand fonts with web-safe fallbacks.
- Use the brand's structural moves (header pattern, hero pattern, card pattern, footer pattern) — do not invent generic email-template structures when the bible specifies particular moves.
- Follow the brand's voice rules EXACTLY: signature vocabulary, signature phrases, banned phrases, copy rules. Re-check before finalizing.
- Use the destination URL provided as the primary CTA target (unless the brand bible specifies a different conversion URL pattern, e.g. Opus1.io for Gramercy).
- Use ONLY the image URLs the user provides — do not invent image URLs, do not use placeholder services like via.placeholder.com, do not link to images that aren't in the provided list.
- If no image URLs were provided, design a strong text-and-color-driven email without images.
- Keep email width 600–640px, mobile-responsive via media queries where useful.
- Add a clean, brand-consistent footer (per the bible's footer pattern). Include an unsubscribe placeholder link.

COMPLIANCE & SAFETY:
- For Code Ninjas: enforce the "Free Discovery/Trial language allowed for CORE programs ONLY, never for CAMPS" rule. Camps must use "Sign Up Now" / "Book Your Camp" / "See Our Full Schedule".
- For Weight Loss RVA: include the medical disclaimer from the bible. Never make disease-treatment claims. Body-positive framing only.
- For any client: respect their banned-phrases list, especially around prestige language ("world-class" is banned for kids brands; intentionally on-brand for Gramercy only).

Output ONLY the complete HTML document. No preamble. No markdown code fences. No explanation. Just the email.`;
}

function buildUserPrompt(
  websiteUrl: string,
  brief: string,
  pageContent: string,
  imageUrls: string[],
): string {
  const imageBlock = imageUrls.length
    ? imageUrls.map((u, i) => `  IMAGE_${i + 1}: ${u}`).join("\n")
    : "  (no images provided — design a strong text/color-driven email)";

  const pageBlock = pageContent
    ? `\n\nDESTINATION PAGE CONTENT (scraped for context — use to inform copy, do not verbatim-quote):\n${pageContent}`
    : "";

  return `EMAIL BRIEF:
${brief || "(no specific brief — produce a strong default promotional email pointing to the destination URL)"}

DESTINATION URL (primary CTA target):
${websiteUrl}

IMAGE URLS (use these in the email, in this order, where it makes sense per the brand bible):
${imageBlock}${pageBlock}

Produce the complete HTML email now.`;
}

// ─── Main handler ──────────────────────────────────────────────────────────────────

interface RequestBody {
  clientId?: string;
  websiteUrl?: string;
  brief?: string;
  imageUrls?: string[];
  revisionRequest?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export default async (req: Request, _context: Context) => {
  if (req.method === "GET") {
    return new Response(JSON.stringify({ clients: CLIENTS }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const {
      clientId,
      websiteUrl,
      brief,
      imageUrls = [],
      revisionRequest,
      conversationHistory,
    } = body;

    if (!clientId || !(clientId in BRAND_CONTEXT)) {
      return new Response(
        JSON.stringify({
          error: `Unknown clientId: ${clientId || "(missing)"}. Valid options: ${CLIENTS.map(c => c.id).join(", ")}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const typedClientId = clientId as ClientId;
    const clientMeta = CLIENTS.find(c => c.id === typedClientId)!;
    const brandContext = BRAND_CONTEXT[typedClientId];

    if (!revisionRequest && !websiteUrl) {
      return new Response(
        JSON.stringify({ error: "Missing websiteUrl" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const anthropicKey = Netlify.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured on Netlify site" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const cleanImages = (imageUrls || []).map(u => u.trim()).filter(Boolean);

    // ─── Revision path ─────────────────────────────────────────────────────────────
    if (revisionRequest && conversationHistory && conversationHistory.length > 0) {
      const systemPrompt = buildSystemPrompt(clientMeta.label, brandContext);
      const messages = [
        ...conversationHistory,
        {
          role: "user" as const,
          content: `Revise the email based on this feedback: ${revisionRequest}\n\nReturn ONLY the complete updated HTML document — no preamble, no code fences.`,
        },
      ];

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages,
        }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => null);
        return new Response(
          JSON.stringify({ error: `Revision failed: ${e ? JSON.stringify(e) : res.status}` }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      const data = await res.json();
      const rawHtml = data.content[0].text;
      const emailHtml = postProcessHtml(rawHtml);

      return new Response(
        JSON.stringify({
          success: true,
          emailHtml,
          conversationHistory: [
            ...conversationHistory,
            { role: "user", content: `Revise the email based on this feedback: ${revisionRequest}` },
            { role: "assistant", content: emailHtml },
          ],
          integrityWarnings: verifyHtmlIntegrity(emailHtml),
          client: clientMeta,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // ─── Fresh-generation path ────────────────────────────────────────────────────
    const pageContent = websiteUrl ? await fetchPageContent(websiteUrl) : "";

    const systemPrompt = buildSystemPrompt(clientMeta.label, brandContext);
    const userPrompt = buildUserPrompt(websiteUrl!, brief || "", pageContent, cleanImages);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => null);
      return new Response(
        JSON.stringify({ error: `AI generation failed: ${e ? JSON.stringify(e) : res.status}` }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    const rawHtml = data.content[0].text;
    const emailHtml = postProcessHtml(rawHtml);

    return new Response(
      JSON.stringify({
        success: true,
        emailHtml,
        conversationHistory: [
          { role: "user", content: userPrompt },
          { role: "assistant", content: emailHtml },
        ],
        integrityWarnings: verifyHtmlIntegrity(emailHtml),
        client: clientMeta,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const config = { path: "/api/generate-email" };
