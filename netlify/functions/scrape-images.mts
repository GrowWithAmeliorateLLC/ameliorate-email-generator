import type { Context } from "@netlify/functions";

export default async (req: Request, _context: Context) => {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url")?.trim();

  if (!url || !url.startsWith("http")) {
    return new Response(JSON.stringify({ images: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch raw HTML — short timeout so UI feels snappy
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AmeliorateBot/1.0)" },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();

    const base = new URL(url);
    const candidates: Array<{ url: string; score: number; type: string }> = [];

    // ── 1. Open Graph image (highest priority) ──
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch?.[1]) {
      candidates.push({ url: resolveUrl(ogMatch[1], base), score: 100, type: "og:image" });
    }

    // ── 2. Logo detection via img tags ──
    const imgRegex = /<img[^>]+>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const tag = imgMatch[0];
      const src = extractAttr(tag, "src");
      if (!src || src.startsWith("data:")) continue;

      const alt = extractAttr(tag, "alt")?.toLowerCase() ?? "";
      const cls = extractAttr(tag, "class")?.toLowerCase() ?? "";
      const id  = extractAttr(tag, "id")?.toLowerCase() ?? "";
      const srcLower = src.toLowerCase();

      let score = 0;
      // Logo signals
      if (/logo/.test(alt + cls + id + srcLower)) score += 80;
      if (/brand/.test(cls + id + srcLower)) score += 40;
      if (/header/.test(cls + id)) score += 20;
      if (/banner/.test(cls + id + srcLower)) score += 15;
      // Image format bonus
      if (/\.(svg|png|webp)/i.test(srcLower)) score += 10;
      if (/\.(jpg|jpeg)/i.test(srcLower)) score += 5;
      // Penalise tiny/icon images
      if (/icon|favicon|sprite|pixel|badge|avatar/i.test(srcLower + cls + id)) score -= 60;
      if (/thumbnail|thumb/i.test(srcLower + cls)) score -= 20;

      if (score > 0) {
        candidates.push({ url: resolveUrl(src, base), score, type: "img" });
      }
    }

    // ── 3. Background images in inline styles ──
    const bgRegex = /background(?:-image)?\s*:[^;]*url\(['"]?([^)'"]+)['"]?\)/gi;
    let bgMatch;
    while ((bgMatch = bgRegex.exec(html)) !== null) {
      const src = bgMatch[1];
      if (src && !src.startsWith("data:")) {
        candidates.push({ url: resolveUrl(src, base), score: 30, type: "bg" });
      }
    }

    // ── 4. Deduplicate, sort, return top 5 ──
    const seen = new Set<string>();
    const deduped = candidates
      .filter(c => {
        if (seen.has(c.url)) return false;
        seen.add(c.url);
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(c => ({ url: c.url, type: c.type }));

    return new Response(JSON.stringify({ images: deduped }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ images: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }
};

function extractAttr(tag: string, attr: string): string | null {
  const match = tag.match(new RegExp(`${attr}=["']([^"']*)["']`, "i"))
    ?? tag.match(new RegExp(`${attr}=([^\\s>]+)`, "i"));
  return match?.[1] ?? null;
}

function resolveUrl(src: string, base: URL): string {
  if (src.startsWith("http")) return src;
  if (src.startsWith("//")) return `${base.protocol}${src}`;
  if (src.startsWith("/")) return `${base.origin}${src}`;
  return `${base.origin}/${src}`;
}

export const config = { path: "/api/scrape-images" };
