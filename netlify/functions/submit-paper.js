exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  let data;
  try { data = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: 'Bad request' }; }

  if (data.website) return { statusCode: 200, body: JSON.stringify({ ok: true }) };

  const clean = (v, max = 500) => (v || '').toString().trim().slice(0, max);
  const authors = clean(data.authors);
  const title = clean(data.title);
  const year = clean(data.year, 10);
  const journal = clean(data.journal);
  const doiRaw = clean(data.doi, 200);
  const name = clean(data.name, 200) || 'Anonymous';

  if (!authors || !title) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Authors and title are required' }) };
  }

  // Normalise DOI: strip any URL prefix, then rebuild a clean link
  let doiLink = '';
  if (doiRaw) {
    const doiId = doiRaw.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:/i, '').trim();
    doiLink = `https://doi.org/${doiId}`;
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;

  const bodyLines = [
    `**Authors:** ${authors}`,
    year ? `**Year:** ${year}` : null,
    `**Title:** ${title}`,
    journal ? `**Journal / source:** ${journal}` : null,
    doiLink ? `**DOI:** [${doiLink}](${doiLink})` : null,
    ``,
    `---`,
    `Submitted by: ${name}`
  ].filter(Boolean).join('\n');

  const titleBits = [authors.split(/[,&]/)[0].trim(), year, title].filter(Boolean).join(' ');

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
      title: `New paper: ${titleBits.slice(0, 120)}`,
      body: bodyLines,
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
