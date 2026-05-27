// ── OPENAI KEY: set OPENAI_KEY in Cloudflare Workers environment variables ───
// Dashboard → Workers & Pages → your worker → Settings → Variables

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

// ── SCRAPE URL ────────────────────────────────────────────────────────────────
async function scrapeURL(url) {
  if (!url || !url.startsWith('http')) return null;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EunoiaBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ar,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return null;
    const html = await res.text();
    const clean = (s) => s?.replace(/\s+/g, ' ').trim().substring(0, 300) || '';
    const title       = clean(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]);
    const description = clean(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1]);
    const ogTitle     = clean(html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1]);
    const ogDesc      = clean(html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i)?.[1]);
    const fbLikes     = html.match(/(\d[\d,\.]+)\s*(likes?|إعجاب|متابع|followers?)/i)?.[0] || '';
    const h1s         = [...html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)].map(m => clean(m[1])).slice(0,3).join(' | ');
    const h2s         = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)].map(m => clean(m[1])).slice(0,5).join(' | ');
    const bodyText    = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().substring(0, 1500);
    return [
      title && `Title: ${title}`,
      ogTitle && ogTitle !== title && `OG Title: ${ogTitle}`,
      description && `Description: ${description}`,
      ogDesc && ogDesc !== description && `OG Description: ${ogDesc}`,
      fbLikes && `Engagement: ${fbLikes}`,
      h1s && `H1: ${h1s}`,
      h2s && `H2: ${h2s}`,
      `Content: ${bodyText}`,
    ].filter(Boolean).join('\n') || null;
  } catch(e) { return null; }
}

// ── CLEAN JSON ────────────────────────────────────────────────────────────────
function extractJSON(text) {
  let s = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/g, '').trim();
  const start = s.indexOf('{');
  const end   = s.lastIndexOf('}');
  if (start !== -1 && end > start) s = s.substring(start, end + 1);
  return s;
}

// ── OPENAI CALL ───────────────────────────────────────────────────────────────
async function callOpenAI(prompt, systemPrompt, maxTokens, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: prompt }
      ]
    }),
    signal: AbortSignal.timeout(55000)
  });

  const rawText = await res.text();
  let data;
  try { data = JSON.parse(rawText); }
  catch(e) {
    return { ok: false, error: 'OpenAI parse error', raw: rawText.substring(0, 500) };
  }

  if (!res.ok) {
    const errMsg = data.error?.message || 'OpenAI API error ' + res.status;
    return { ok: false, error: errMsg, error_type: data.error?.type || 'api_error' };
  }

  return { ok: true, data };
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (request.method !== 'POST') return new Response('ok', { status: 200, headers: CORS });

    const apiKey = env.OPENAI_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_KEY not configured in worker environment' }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    let body;
    try { body = await request.json(); }
    catch(e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    if (!body.prompt) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // Scrape website + Facebook in parallel
    const links = body.social_links || {};
    const urlsToScrape = [
      links.website  && { label: 'Website',  url: links.website },
      links.facebook && { label: 'Facebook', url: links.facebook },
    ].filter(Boolean);

    const scrapedResults = urlsToScrape.length > 0
      ? await Promise.allSettled(
          urlsToScrape.map(({ label, url }) =>
            scrapeURL(url).then(data => data ? `\n=== ${label} (${url}) ===\n${data}` : null)
          )
        )
      : [];

    // Build enriched prompt
    let enrichedPrompt = body.prompt;

    const scrapedData = [];
    scrapedResults.forEach(r => {
      if (r.status === 'fulfilled' && r.value) scrapedData.push(r.value);
    });
    if (scrapedData.length > 0) {
      enrichedPrompt += `\n\n=== LIVE DATA SCRAPED FROM CLIENT LINKS ===\n${scrapedData.join('\n')}\n=== END LIVE DATA ===\nUse the above live data to enhance accuracy.`;
    }

    const systemPrompt = `You are an expert marketing strategist at Eunoia Zones Agency, Egypt. Write ALL report content in ENGLISH. Return ONLY valid JSON starting with { and ending with }. Use ONLY double quotes. No markdown. No trailing commas. Every field must have real, specific, actionable content.`;

    const result = await callOpenAI(enrichedPrompt, systemPrompt, 6000, apiKey);

    if (!result.ok) {
      return new Response(JSON.stringify({
        error: result.error,
        error_type: result.error_type || 'unknown',
        content: []
      }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const text = result.data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({
      content: [{ type: 'text', text }],
      model: result.data.model,
      usage: result.data.usage,
      scraped_sources: urlsToScrape.map(u => u.label),
    }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
};
