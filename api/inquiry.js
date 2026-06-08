export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, city, pkg } = req.body;

  if (!name || !phone || !city) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const SUPABASE_URL = 'https://iolgjxjjgsynisqtrzit.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. ALWAYS save to Supabase first — this is the safety net
  let savedId = null;
  try {
    const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/franchise_inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name,
        phone,
        email: email || 'not provided',
        city,
        package: pkg || 'Not specified',
        source: req.headers.referer || 'franchise.3dbotics.ph'
      })
    });
    const saved = await saveRes.json();
    savedId = saved?.[0]?.id;
    console.log('Inquiry saved to Supabase:', savedId);
  } catch (err) {
    console.error('Supabase save error:', err.message);
  }

  // 2. Send email via Resend — secondary (email can fail, data is already safe)
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: '3DBotics® Franchise <onboarding@resend.dev>',
        to: 'toydemic@gmail.com',
        subject: `🚀 New Franchise Inquiry — ${name} (${city})`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0f1e;color:#e8edf5;padding:32px;border-radius:12px;">
            <div style="background:linear-gradient(135deg,#2A9D8F,#1a7a6e);padding:16px 24px;border-radius:8px;margin-bottom:24px;">
              <h2 style="margin:0;color:white;font-size:22px;">🚀 New Franchise Inquiry</h2>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">via franchise.3dbotics.ph · ID: ${savedId || 'not saved'}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:12px 0;border-bottom:1px solid #1e293b;color:#8899aa;width:160px;font-size:13px;">Full Name</td><td style="padding:12px 0;border-bottom:1px solid #1e293b;font-weight:700;font-size:15px;">${name}</td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #1e293b;color:#8899aa;font-size:13px;">Contact Number</td><td style="padding:12px 0;border-bottom:1px solid #1e293b;font-weight:700;font-size:15px;">${phone}</td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #1e293b;color:#8899aa;font-size:13px;">Email</td><td style="padding:12px 0;border-bottom:1px solid #1e293b;font-weight:700;font-size:15px;">${email || 'not provided'}</td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #1e293b;color:#8899aa;font-size:13px;">City / Location</td><td style="padding:12px 0;border-bottom:1px solid #1e293b;font-weight:700;font-size:15px;">${city}</td></tr>
              <tr><td style="padding:12px 0;color:#8899aa;font-size:13px;">Package Interest</td><td style="padding:12px 0;font-weight:700;font-size:15px;color:#F5B400;">${pkg || 'Not specified'}</td></tr>
            </table>
            <div style="margin-top:24px;padding:16px;background:#111827;border-radius:8px;font-size:12px;color:#556677;border-left:3px solid #2A9D8F;">
              Submitted ${new Date().toLocaleString('en-PH', {timeZone:'Asia/Manila', dateStyle:'full', timeStyle:'short'})}
            </div>
          </div>
        `
      })
    });

    const data = await response.json();
    console.log('Email sent:', data.id);
    return res.status(200).json({ success: true, id: data.id, saved: savedId });
  } catch (err) {
    console.error('Email error:', err.message);
    // Email failed but data is safe in Supabase
    return res.status(200).json({ success: true, saved: savedId, emailError: err.message });
  }
}
