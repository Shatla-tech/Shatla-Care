const NOTION_TOKEN = process.env.NOTION_TOKEN;
const TASKS_DB = '792f3c59-1946-40b7-8edd-a5b0c704fe0b';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { deal_id } = req.query;
  if (!deal_id) return res.status(400).json({ error: 'Missing deal_id' });

  const h = {
    'Authorization': `Bearer ${NOTION_TOKEN}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  try {
    // 1. Fetch deal page
    const dealRes = await fetch(`https://api.notion.com/v1/pages/${deal_id}`, { headers: h });
    if (!dealRes.ok) return res.status(404).json({ error: 'Deal not found' });
    const deal = await dealRes.json();
    const dp = deal.properties || {};

    const dealInfo = {
      id: deal_id,
      name:     (dp['Deal Name']?.title || []).map(t => t.plain_text).join('') || 'عميل',
      pipeline: dp['Pipeline']?.select?.name || '',
      stage:    dp['Stage']?.select?.name || '',
      phone:    dp['Phone number']?.phone_number || '',
      address:  (dp['Address']?.rich_text || []).map(r => r.plain_text).join('') || '',
      region:   (dp['Region/Area']?.rich_text || []).map(r => r.plain_text).join('') || '',
      email:    dp['Email']?.email || ''
    };

    // 2. Query visits linked to this deal that have an AI report
    const tasksRes = await fetch(`https://api.notion.com/v1/databases/${TASKS_DB}/query`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        filter: {
          and: [
            { property: 'Deal', relation: { contains: deal_id } },
            { property: 'Ai Report', rich_text: { is_not_empty: true } }
          ]
        },
        sorts: [{ property: 'Submission Date', direction: 'descending' }],
        page_size: 100
      })
    });
    const tasksData = await tasksRes.json();

    const visits = (tasksData.results || []).map(p => {
      const props = p.properties;
      const elapsedText = (props['Elapsed Time']?.rich_text || []).map(r => r.plain_text).join('');
      const spentMins = props['Spent time']?.formula?.number || null;
      const spentFormatted = elapsedText || (spentMins != null
        ? `${Math.floor(spentMins / 60)}:${String(spentMins % 60).padStart(2, '0')}`
        : null);

      return {
        id: p.id,
        title:          (props['Task']?.title || []).map(t => t.plain_text).join(''),
        status:         props['Status']?.status?.name || '',
        submissionDate: props['Submission Date']?.date?.start || '',
        startTime:      props['Start time']?.date?.start || '',
        endTime:        props['End time']?.date?.start || '',
        spentTime:      spentFormatted,
        bags:           props['عدد الشكاير']?.number || 0,
        photoCount:     props['Photo Count']?.number || 0,
        responsible:     (props['Responsible']?.people || []).map(p => p.name).join(', ') || '',
        photos:         (props['Photos']?.files || []).map(f => f.external?.url || f.file?.url || '').filter(u => u && u.startsWith('http')),
        aiReport:       (props['Ai Report']?.rich_text || []).map(r => r.plain_text).join(''),
        reportedStatus: (props['Reported Status']?.multi_select || []).map(s => s.name),
        tags:           (props['Tags']?.multi_select || []).map(s => s.name)
      };
    });

    res.json({
      deal: dealInfo,
      visits,
      totalVisits: visits.length,
      lastVisit: visits[0]?.submissionDate || null
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
