export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return res.status(500).json({ error: 'Server configuration missing' });
  }

  // Expecting structured data from frontend now
  const { name, contact, service, budget, message } = req.body;

  if (!name || !contact) {
    return res.status(400).json({ error: 'Name and contact are required' });
  }

  // Format the message like a CRM card
  const text = `
🆕 <b>YANGI BUYURTMA</b>

👤 <b>Ism/Kompaniya:</b> ${name}
📞 <b>Telegram/Raqam:</b> ${contact}
💼 <b>Xizmat turi:</b> ${service || 'Tanlanmadi'}
💰 <b>Byudjet:</b> ${budget || 'Kiritilmadi'}

📝 <b>Qisqacha ma'lumot:</b>
<i>${message || 'Kiritilmadi'}</i>
  `.trim();

  // Clean the contact info to create a direct link if it's a username
  let cleanContact = contact.trim().replace('@', '');
  let contactUrl = `https://t.me/${cleanContact}`;
  
  // If it looks like a phone number (contains + or numbers), don't try to link it directly as a username
  if (/^[\d\+\s\-\(\)]+$/.test(contact)) {
    // Basic phone clean
    let phone = contact.replace(/[^\d+]/g, '');
    contactUrl = `https://t.me/+${phone.replace('+', '')}`;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✉️ Mijozga yozish', url: contactUrl }
            ],
            [
              { text: '✅ Qabul qilish', callback_data: 'status_accepted' },
              { text: '❌ Bekor qilish', callback_data: 'status_rejected' }
            ]
          ]
        }
      })
    });

    const data = await response.json();
    if (data.ok) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ error: data.description || 'Telegram API Error' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
