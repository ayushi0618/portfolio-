// Contact-form backend for the portfolio (Vercel serverless function).
// Env vars (Vercel dashboard -> project -> Settings -> Environment Variables):
//   RESEND_API_KEY   (required) - free API key from resend.com; without it the function
//                    answers 501 and the site's form falls back to the visitor's email app.
//   CONTACT_TO_EMAIL (optional) - inbox for messages; defaults to ayushi.singh0618@gmail.com.
//   RESEND_FROM      (optional) - sender shown on the email; defaults to onboarding@resend.dev
//                    (works without a verified domain; switch to a verified domain later).
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(501).json({ error: 'Email backend not configured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const name = String((body && body.name) || '').trim().slice(0, 100);
  const company = String((body && body.company) || '').trim().slice(0, 100);
  const email = String((body && body.email) || '').trim().slice(0, 200);
  const message = String((body && body.message) || '').trim().slice(0, 5000);
  if (!name || !message || !email || !email.includes('@')) {
    return res.status(400).json({ error: 'Name, email and message are required' });
  }

  const to = process.env.CONTACT_TO_EMAIL || 'ayushi.singh0618@gmail.com';
  const from = process.env.RESEND_FROM || 'onboarding@resend.dev';

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: from,
      to: [to],
      subject: 'Portfolio contact from ' + name + (company ? ' (' + company + ')' : ''),
      reply_to: email,
      text: 'Name: ' + name + '\nCompany: ' + (company || '-') + '\nEmail: ' + email + '\n\n' + message,
    }),
  });

  if (!r.ok) {
    return res.status(502).json({ error: 'Email provider rejected the message' });
  }
  return res.status(200).json({ ok: true });
};
