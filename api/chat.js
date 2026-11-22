// Portfolio chat backend (Vercel serverless function).
// Env vars (Vercel dashboard -> project -> Settings -> Environment Variables):
//   GEMINI_API_KEY (required) - free API key from Google AI Studio
//                    (https://aistudio.google.com). Without it the function
//                    answers 501 and the site's chat widget falls back to its
//                    built-in FAQ answers, so the widget still works.
// The API key is sent to Google as a query param; it is never logged.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(501).json({ error: 'Chat backend not configured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const message = String((body && body.message) || '').trim().slice(0, 1000);
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const systemInstruction =
    'You are a helpful assistant on Ayushi Singh\'s portfolio website, answering ' +
    'recruiters\' and visitors\' questions about her. Use ONLY the facts below. ' +
    'Never invent facts, dates, numbers or links. If asked something not covered ' +
    'by the facts, say you do not have that information and suggest emailing ' +
    'ayushi.singh0618@gmail.com. Keep answers brief (2-4 sentences) and friendly.\n\n' +
    'FACTS:\n' +
    '- Ayushi Singh, final-year B.Tech CSE student at Babu Banarasi Das Institute ' +
    'of Technology (BBDIT), Ghaziabad, affiliated to Dr. A.P.J. Abdul Kalam ' +
    'Technical University (AKTU). CGPA 8.0. Graduating April 2027.\n' +
    '- Full-stack developer: React, Node.js, Express, TypeScript, JavaScript, ' +
    'Python, MongoDB, SQL, Tailwind CSS.\n' +
    '- Data analyst: Pandas, NumPy, Matplotlib, Seaborn, Power BI.\n' +
    '- Projects: BondPoints.ai (social relationship tracker), Food for Mood AI ' +
    '(food suggestions from emotion detection), Cyber Scanner (scans code repos ' +
    'for vulnerabilities), SnapSplit (bill splitting), Trishul (admin analytics), ' +
    'Olist (e-commerce analytics), Retail Analyzer, A/B Testing.\n' +
    '- LeetCode: 225 problems solved.\n' +
    '- Software Engineer Intern at Army Base Workshop, Meerut (Jul-Aug 2026).\n' +
    '- YouTube channel "Code Like Lily" (coding explainers).\n' +
    '- Portfolio: https://ayushi-tech-06181.vercel.app. GitHub: github.com/ayushi0618. ' +
    'Contact: ayushi.singh0618@gmail.com.\n' +
    '- Open to full-stack developer and data analyst roles. Based in Ghaziabad, India.';

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastStatus = 502;

  for (const model of models) {
    let r;
    try {
      r = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/' + model +
          ':generateContent?key=' + encodeURIComponent(apiKey),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: message }] }],
            generationConfig: { maxOutputTokens: 400 },
          }),
        }
      );
    } catch {
      return res.status(502).json({ error: 'Chat service unreachable' });
    }

    if (r.status === 404 && model !== models[models.length - 1]) {
      // Model name not available on this account: try the next one.
      continue;
    }
    if (!r.ok) {
      lastStatus = r.status;
      return res.status(502).json({ error: 'Chat service error' });
    }

    let data;
    try {
      data = await r.json();
    } catch {
      return res.status(502).json({ error: 'Chat service error' });
    }

    const reply =
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      String(data.candidates[0].content.parts[0].text || '').trim();

    if (!reply) {
      return res.status(502).json({ error: 'Chat service error' });
    }
    return res.status(200).json({ reply: reply });
  }

  return res.status(502).json({ error: 'Chat service error', status: lastStatus });
};
