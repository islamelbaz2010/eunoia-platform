// ── API KEYS ──────────────────────────────────────────────────────────────────
// Add backup Groq keys here — worker rotates on 429 (rate limit)
const GROQ_KEYS = [
  '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',
  // 'gsk_BACKUP_KEY_2_HERE',
  // 'gsk_BACKUP_KEY_3_HERE',
];

// SerpAPI key for live market research (get free key at serpapi.com — 100 req/month free)
const SERPAPI_KEY = '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

const TOKEN_LIMITS = {
  preliminary: 6000, executive: 6000, competitor: 6000,
  campaign: 6000, content: 6000, brand: 6000, clv: 6000,
  sentiment: 6000, trend: 6000, crisis: 6000,
  detailed: 6000, full: 6000,
  pricing: 6000, social_audit: 6000, lead_quality: 6000,
  market_entry: 6000, ecommerce_growth: 6000, media_mix: 6000,
  seasonal: 6000, customer_journey: 6000, annual_budget: 6000,
  rebranding: 6000, b2b_strategy: 6000, product_launch: 6000,
  digital_readiness: 6000, influencer: 6000,
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

// ── SERPAPI LIVE RESEARCH ─────────────────────────────────────────────────────
async function fetchLiveResearch(company, sector, city) {
  if (!SERPAPI_KEY) return null;
  const query = encodeURIComponent(`${company} ${sector} ${city} marketing 2025`);
  try {
    const res = await fetch(
      `https://serpapi.com/search.json?q=${query}&api_key=${SERPAPI_KEY}&num=5&gl=eg&hl=en`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.organic_results?.slice(0, 4) || [];
    const related = data.related_questions?.slice(0, 3).map(q => q.question).join(' | ') || '';
    if (!results.length) return null;
    const snippets = results.map((r, i) =>
      `[${i+1}] ${r.title}\n${r.snippet || ''}\nSource: ${r.link}`
    ).join('\n\n');
    return snippets + (related ? `\n\nRelated Questions: ${related}` : '');
  } catch(e) { return null; }
}

// ── GROQ API CALL WITH KEY ROTATION + EXPONENTIAL BACKOFF ────────────────────
async function callGroqKey(prompt, systemPrompt, maxTokens, keyIndex) {
  const key = GROQ_KEYS[keyIndex];
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: prompt }
      ]
    }),
    signal: AbortSignal.timeout(55000)
  });
  return res;
}

async function callGroqWithRetry(prompt, systemPrompt, maxTokens) {
  const delays = [0, 2000, 4000, 8000]; // exponential backoff
  let lastError = null;

  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) {
      await new Promise(r => setTimeout(r, delays[attempt]));
    }

    // Try each key in rotation
    for (let keyIdx = 0; keyIdx < GROQ_KEYS.length; keyIdx++) {
      try {
        const res = await callGroqKey(prompt, systemPrompt, maxTokens, keyIdx);

        if (res.status === 429) {
          // Rate limited on this key — try next
          lastError = new Error('rate_limit_key_' + keyIdx);
          continue;
        }

        const rawText = await res.text();
        let groqData;
        try { groqData = JSON.parse(rawText); }
        catch(e) {
          return { ok: false, error: 'Groq parse error', raw: rawText.substring(0, 500) };
        }

        if (!res.ok) {
          const errMsg = groqData.error?.message || 'Groq API error';
          const errType = groqData.error?.type || 'unknown';
          // Transient server error — retry with backoff
          if (res.status >= 500) {
            lastError = new Error(errMsg);
            break; // break key loop, retry with backoff
          }
          return { ok: false, error: errMsg, error_type: errType };
        }

        return { ok: true, data: groqData };
      } catch(e) {
        lastError = e;
        // Network/timeout error — try next key
        continue;
      }
    }
  }

  return { ok: false, error: lastError?.message || 'All retries exhausted', error_type: 'exhausted' };
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (request.method !== 'POST') return new Response('ok', { status: 200, headers: CORS });

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

    const reportType = body.report_type || 'preliminary';
    const maxTokens = TOKEN_LIMITS[reportType] || 6000;

    // Run scraping + live research in parallel
    const links = body.social_links || {};
    const urlsToScrape = [
      links.website  && { label: 'Website',  url: links.website },
      links.facebook && { label: 'Facebook', url: links.facebook },
    ].filter(Boolean);

    const [scrapedResults, liveResearch] = await Promise.all([
      urlsToScrape.length > 0
        ? Promise.allSettled(
            urlsToScrape.map(({ label, url }) =>
              scrapeURL(url).then(data => data ? `\n=== ${label} (${url}) ===\n${data}` : null)
            )
          )
        : Promise.resolve([]),
      body.company && body.sector && body.city
        ? fetchLiveResearch(body.company, body.sector, body.city)
        : Promise.resolve(null)
    ]);

    // Build enriched prompt
    let enrichedPrompt = body.prompt;

    const scrapedData = [];
    scrapedResults.forEach(r => {
      if (r.status === 'fulfilled' && r.value) scrapedData.push(r.value);
    });
    if (scrapedData.length > 0) {
      enrichedPrompt += `\n\n=== LIVE DATA SCRAPED FROM CLIENT LINKS ===\n${scrapedData.join('\n')}\n=== END LIVE DATA ===\nUse the above live data to enhance accuracy.`;
    }

    if (liveResearch) {
      enrichedPrompt += `\n\n=== LIVE MARKET INTELLIGENCE (SerpAPI — fetched now) ===\n${liveResearch}\n=== END LIVE INTELLIGENCE ===\nFactor this current market intelligence into your analysis.`;
    }

    const systemPrompt = `You are an expert marketing strategist at Eunoia Zones Agency, Egypt. Write ALL report content in ENGLISH. Return ONLY valid JSON starting with { and ending with }. No markdown. No \`\`\`json. Every field must have real, specific, actionable content — no placeholders.`;

    const result = await callGroqWithRetry(enrichedPrompt, systemPrompt, maxTokens);

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
      live_research: !!liveResearch
    }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
};
