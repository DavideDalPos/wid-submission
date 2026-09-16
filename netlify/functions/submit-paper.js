exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let data;
  try { data = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: 'Bad request' }; }

  // Honeypot — bots fill this hidden field, people don't
  if (data.website) return { statusCode: 200, body: JSON.stringify({ ok: true }) };

  const citation = (data.citation || '').toString().trim();
  const name = (data.name || 'Anonymous').toString().trim().slice(0, 200);
  if (!citation) return { statusCode: 400, body: JSON.stringify({ error: 'Citation required' }) };
  if (citation.length > 2000) return { statusCode: 400, body: JSON.stringify({ error: 'Too long' }) };

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // e.g. "davidedalpos/wid"

  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'wid-submissions',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: `New paper: ${citation.slice(0, 80)}`,
      body: `**Submitted citation / DOI:**\n\n${citation}\n\n---\nSubmitted by: ${name}`,
      labels: ['new-paper']
    })
  });

  if (!res.ok) {
    const text = await res.text();
    return { statusCode: 502, body: JSON.stringify({ error: 'GitHub error', detail: text }) };
  }
  const issue = await res.json();
  return { statusCode: 200, body: JSON.stringify({ ok: true, url: issue.html_url }) };
};
