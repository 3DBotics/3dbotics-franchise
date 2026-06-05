export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, city, pkg } = req.body;

  if (!name || !phone || !email || !city) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: '3DBotics® Franchise <franchise@3dbotics.ph>',
        to: 'toydemic@gmail.com',
        subject: `🚀 New Franchise Inquiry — ${name} (${city})`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0f1e;color:#e8edf5;padding:32px;border-radius:12px;">
            <div style="background:linear-gradient(135deg,#2A9D8F,#1a7a6e);padding:16px 24px;border-radius:8px;margin-bottom:24px;">
              <h2 style="margin:0;color:white;font-size:22px;">🚀 New Franchise Inquiry</h2>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">via franchise.3dbotics.ph</p>
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:12px 0;border-bottom:1px solid #1e293b;color:#8899aa;width:160px;font-size:13px;">Full Name</td><td style="padding:12px 0;border-bottom:1px solid #1e293b;font-weight:700;font-size:15px;">${name}</td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #1e293b;color:#8899aa;font-size:13px;">Contact Number</td><td style="padding:12px 0;border-bottom:1px solid #1e293b;font-weight:700;font-size:15px;"><a href="tel:${phone}" style="color:#4BBFBF;">${phone}</a></td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #1e293b;color:#8899aa;font-size:13px;">Email</td><td style="padding:12px 0;border-bottom:1px solid #1e293b;font-weight:700;font-size:15px;"><a href="mailto:${email}" style="color:#4BBFBF;">${email}</a></td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #1e293b;color:#8899aa;font-size:13px;">City / Location</td><td style="padding:12px 0;border-bottom:1px solid #1e293b;font-weight:700;font-size:15px;">${city}</td></tr>
              <tr><td style="padding:12px 0;color:#8899aa;font-size:13px;">Package Interest</td><td style="padding:12px 0;font-weight:700;font-size:15px;color:#F5B400;">${pkg || 'Not specified'}</td></tr>
            </table>
            <div style="margin-top:24px;padding:16px;background:#111827;border-radius:8px;font-size:12px;color:#556677;border-left:3px solid #2A9D8F;">
              Submitted via franchise.3dbotics.ph · ${new Date().toLocaleString('en-PH', {timeZone:'Asia/Manila', dateStyle:'full', timeStyle:'short'})}
            </div>
          </div>
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Resend error');
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Inquiry email error:', err);
    return res.status(500).json({ error: err.message });
  }
}
