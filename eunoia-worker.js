const GROQ_API_KEY = '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';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

// Limits based on 12000 TPM (llama-3.3-70b new key)
// Input per request = 2000-4000 tokens → safe output = 6000 for all
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

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (request.method !== 'POST') return new Response('ok', { status: 200, headers: CORS });

    let body;
    try { body = await request.json(); }
    catch(e) { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }); }

    if (!body.prompt) return new Response(JSON.stringify({ error: 'Missing prompt' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const reportType = body.report_type || 'preliminary';
    const maxTokens = TOKEN_LIMITS[reportType] || 6000;

    // Scrape links in parallel
    const links = body.social_links || {};
    const urlsToScrape = [
      links.website  && { label: 'Website',  url: links.website },
      links.facebook && { label: 'Facebook', url: links.facebook },
    ].filter(Boolean);

    const scrapedData = [];
    if (urlsToScrape.length > 0) {
      const results = await Promise.allSettled(
        urlsToScrape.map(({ label, url }) =>
          scrapeURL(url).then(data => data ? `\n=== ${label} (${url}) ===\n${data}` : null)
        )
      );
      results.forEach(r => { if (r.status === 'fulfilled' && r.value) scrapedData.push(r.value); });
    }

    let enrichedPrompt = body.prompt;
    if (scrapedData.length > 0) {
      enrichedPrompt += `\n\n=== LIVE DATA SCRAPED FROM CLIENT LINKS ===\n${scrapedData.join('\n')}\n=== END LIVE DATA ===\nUse the above live data to enhance accuracy.`;
    }

    const systemPrompt = `You are an expert marketing strategist at Eunoia Zones Agency, Egypt. Write ALL report content in ENGLISH. Return ONLY valid JSON starting with { and ending with }. No markdown. No \`\`\`json. Every field must have real, specific, actionable content — no placeholders.`;

    try {
      const apiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + GROQ_API_KEY,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: maxTokens,
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: enrichedPrompt }
          ]
        })
      });

      const rawText = await apiRes.text();
      let groqData;
      try { groqData = JSON.parse(rawText); }
      catch(e) {
        return new Response(JSON.stringify({ error: 'Groq parse error', raw: rawText.substring(0, 500), content: [] }),
          { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }

      if (!apiRes.ok) {
        return new Response(JSON.stringify({
          error: groqData.error?.message || 'Groq API error',
          error_type: groqData.error?.type || 'unknown',
          content: []
        }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }

      const text = groqData.choices?.[0]?.message?.content || '';
      return new Response(JSON.stringify({
        content: [{ type: 'text', text }],
        model: groqData.model,
        usage: groqData.usage,
        scraped_sources: urlsToScrape.map(u => u.label)
      }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });

    } catch(e) {
      return new Response(JSON.stringify({ error: e.message, content: [] }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
  }
};
