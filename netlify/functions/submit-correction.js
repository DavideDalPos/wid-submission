exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  let data;
  try { data = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: 'Bad request' }; }

  if (data.website) return { statusCode: 200, body: JSON.stringify({ ok: true }) };

  const clean = (v, max = 2000) => (v || '').toString().trim().slice(0, max);
  const taxon = clean(data.taxon, 300);
  const type = clean(data.type, 50);
  const details = clean(data.details, 4000);
  const reference = clean(data.reference, 500);
  const name = clean(data.name, 200) || 'Anonymous';

  if (!taxon || !type || !details) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Taxon, type, and details are required' }) };
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;

  const bodyLines = [
    `**Taxon / name:** ${taxon}`,
    `**Type of problem:** ${type}`,
    ``,
    `**Details:**`,
    details,
    reference ? `\n**Reference / source:** ${reference}` : null,
    ``,
    `---`,
    `Submitted by: ${name}`
  ].filter(Boolean).join('\n');

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
      title: `Correction (${type}): ${taxon.slice(0, 100)}`,
      body: bodyLines,
      labels: ['correction']
    })
  });

  if (!res.ok) {
    const text = await res.text();
    return { statusCode: 502, body: JSON.stringify({ error: 'GitHub error', detail: text }) };
  }
  const issue = await res.json();
  return { statusCode: 200, body: JSON.stringify({ ok: true, url: issue.html_url }) };
};
