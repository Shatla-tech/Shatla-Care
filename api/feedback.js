const NOTION_TOKEN   = process.env.NOTION_TOKEN;
const MONTHLY_KPI_DB = 'f21919ca-5478-41f9-ab9b-6f1e6a71abfa';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { visit_id, ratings, comment, photoUrl } = req.body || {};
  if (!visit_id || !ratings) return res.status(400).json({ error: 'Missing visit_id or ratings' });

  const nH = {
    'Authorization':  `Bearer ${NOTION_TOKEN}`,
    'Notion-Version': '2022-06-28',
    'Content-Type':   'application/json'
  };

  const num = (v) => v != null && v > 0 ? { number: Number(v) } : { number: null };

  const props = {
    'Name':                        { title: [{ text: { content: 'تقييم الزيارة' } }] },
    'Overall Satisfaction':        num(ratings.overall),
    'Communication':               num(ratings.communication),
    'Service Quality':             num(ratings.serviceQuality),
    'Work Completion':             num(ratings.workCompletion),
    'Issue Resolution':            num(ratings.issueResolution),
    'Professionalism':             num(ratings.professionalism),
    'Site Cleanliness':            num(ratings.cleanliness),
    'Before & After Comparison':   num(ratings.beforeAfter),
    'Visit':                       { relation: [{ id: visit_id }] }
  };

  if (comment && comment.trim()) {
    props['Client Comment'] = { rich_text: [{ text: { content: comment.trim() } }] };
  }

  if (photoUrl) {
    props['Image Feedback'] = { files: [{ name: 'client-photo.webp', external: { url: photoUrl } }] };
  }

  /* Create Monthly KPI page */
  const createRes = await fetch('https://api.notion.com/v1/pages', {
    method:  'POST',
    headers: nH,
    body:    JSON.stringify({ parent: { database_id: MONTHLY_KPI_DB }, properties: props })
  });

  if (!createRes.ok) {
    const detail = await createRes.text();
    return res.status(500).json({ error: 'Notion create failed', detail });
  }

  const kpiPage = await createRes.json();

  /* Link KPI page back to Task */
  await fetch(`https://api.notion.com/v1/pages/${visit_id}`, {
    method:  'PATCH',
    headers: nH,
    body:    JSON.stringify({
      properties: { 'Monthly KPI Report': { relation: [{ id: kpiPage.id }] } }
    })
  }).catch(() => {});

  return res.json({ ok: true, kpiPageId: kpiPage.id });
}
