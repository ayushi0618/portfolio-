// Portfolio chat backend (Vercel serverless function).
// Env vars (Vercel dashboard -> project -> Settings -> Environment Variables):
//   GEMINI_API_KEY (required) - free API key from Google AI Studio
//                    (https://aistudio.google.com). Without it the function
//                    answers 501 and the site's chat widget falls back to its
//                    built-in FAQ answers, so the widget still works.
// The API key is sent to Google in the x-goog-api-key header; it is never
// logged and never included in any response. When Gemini returns an error,
// its HTTP status and error message are included in the 502 response so the
// failure is diagnosable (e.g. API not enabled, bad key, unknown model).
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

  // Model chain: newest first. gemini-2.0-flash / gemini-1.5-flash were
  // retired and now answer 404; a 404 falls through to the next model.
  const models = [
    'gemini-2.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];
  let lastError = { status: 502, detail: 'Chat service error' };

  for (const model of models) {
    let r;
    try {
      r = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/' + model +
          ':generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: message }] }],
            generationConfig: { maxOutputTokens: 400 },
          }),
        }
      );
    } catch {
      lastError = { status: 502, detail: 'Chat service unreachable' };
      break;
    }

    if (!r.ok) {
      lastError = { status: r.status, detail: await geminiErrorDetail(r) };
      if (r.status === 404 && model !== models[models.length - 1]) {
        // Model name not available on this account: try the next one.
        continue;
      }
      return res.status(502).json({
        error: 'Chat service error',
        status: lastError.status,
        detail: lastError.detail,
      });
    }

    let data;
    try {
      data = await r.json();
    } catch {
      return res.status(502).json({
        error: 'Chat service error',
        status: r.status,
        detail: 'Gemini returned an unreadable response',
      });
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
      return res.status(502).json({
        error: 'Chat service error',
        status: r.status,
        detail: 'Gemini returned no reply text',
      });
    }
    return res.status(200).json({ reply: reply });
  }

  return res.status(502).json({
    error: 'Chat service error',
    status: lastError.status,
    detail: lastError.detail,
  });
};

// Extract Gemini's error message text from a failed response.
// Returns a short string; never includes the API key.
async function geminiErrorDetail(r) {
  try {
    const data = await r.json();
    if (data && data.error && typeof data.error.message === 'string') {
      return data.error.message.slice(0, 500);
    }
    return JSON.stringify(data).slice(0, 500);
  } catch {
    return 'Gemini returned HTTP ' + r.status;
  }
}
