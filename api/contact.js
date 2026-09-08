export function normalizeUzbekOrthography(text) {
  if (!text) return text;
  // 1. Convert paired quotation marks: "..." and «...» to standard “...” (U+201C / U+201D)
  let res = text.replace(/«([^«»\r\n]+)»/g, '“$1”');
  res = res.replace(/"([^"\r\n]+)"/g, '“$1”');

  // 2. O‘, o‘, G‘, g‘ with left curly apostrophe ‘ (U+2018)
  // Followed by letters (o‘z, g‘oya) or word boundary/whitespace/punctuation (tog‘, bog‘)
  res = res.replace(/([OoGg])['`’ʻʼ´](?=[a-zA-Z\u0400-\u04FF]|\s|[.,!?;:)]|$)/g, (m, p1) => p1 + '‘');

  // 3. Tutuq belgisi with right curly apostrophe ’ (U+2019)
  // Between letters (except O/G handled above): ma’lumot, san’at, mas’ul, ta’minlash, etc.
  res = res.replace(/([a-zA-Z\u0400-\u04FF])['`‘ʻʼ´]([a-zA-Z\u0400-\u04FF])/g, (m, p1, p2) => {
    if (/^[og]$/i.test(p1)) return p1 + '‘' + p2;
    return p1 + '’' + p2;
  });

  return res;
}

export function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  const INCEPTION_API_KEY = process.env.INCEPTION_API_KEY || '***REMOVED***';

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return res.status(500).json({ error: 'Server configuration missing' });
  }

  const { name, contact, service, budget, message } = req.body;

  if (!name || !contact) {
    return res.status(400).json({ error: 'Name and contact are required' });
  }

  let formattedContact = contact.trim();
  if (!/^[\d\+\s\-\(\)]+$/.test(formattedContact)) {
    if (!formattedContact.startsWith('@')) {
      formattedContact = '@' + formattedContact;
    }
  }

  // --- AI ANALYSIS ---
  let aiAnalysis = "<i>AI tahlili mavjud emas.</i>";
  try {
    const aiPrompt = `Siz qobiliyatli IT konsultantsiz. MrAstronaut ismli frilanserga yordam beryapsiz.
Yangi mijoz quyidagi loyiha so‘rovini yubordi:
- Xizmat turi: ${service || 'Aytilmadi'}
- Byudjet: ${budget || 'Aytilmadi'}
- Mijozning xabari: ${message || 'Aytilmadi'}

Iltimos, ushbu mijoz so‘rovini tahlil qilib, qisqa 3–4 ta band (nuqtachalar) bilan quyidagilarni o‘zbek tilida yozing:
1. Loyiha uchun qaysi texnologiyalar (Tech Stack) eng mos keladi?
2. Boshlang‘ich narxni qanday aytish va qanday sotish strategiyasini qo‘llash kerak?
3. Mijozning xabaridagi asosiy xavf yoki talab nima?
Faqat aniq faktlar va maslahat bo‘lsin. Hech qanday salomlashishsiz, to‘g‘ridan-to‘g‘ri tahlilni yozing. QAT’IY QOIDA: O‘zbek tili grammatikasi va imlo qoidalariga 100% amal qiling. O‘ va G‘ harflarida har doim to‘g‘ri chapga egilgan apostrof belgisini ishlating (O‘, o‘, G‘, g‘). Ularni oddiy to‘g‘ri tutuq belgisi yoki birikmali tirnoqlar bilan almashtirmang. Tutuq belgisini (’) o‘z o‘rnida va to‘g‘ri shaklda qo‘llang. Matndagi barcha iqtibos va nomlarni standart qo‘shtirnoqlar (“...”) ichida bering. Har bir gap va so‘z grammatik jihatdan benuqson bo‘lsin.`;

    const aiResponse = await fetch('https://api.inceptionlabs.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INCEPTION_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mercury-2',
        reasoning_effort: 'low',
        messages: [{ role: 'user', content: aiPrompt }]
      })
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      if (aiData.choices && aiData.choices[0] && aiData.choices[0].message) {
        let rawContent = aiData.choices[0].message.content || '';
        rawContent = normalizeUzbekOrthography(rawContent);
        aiAnalysis = escapeHtml(rawContent);
      }
    } else {
      console.error('AI API failed', await aiResponse.text());
    }
  } catch (err) {
    console.error('AI call failed', err);
  }


  // --- BUILD TELEGRAM MESSAGE ---
  const safeName = normalizeUzbekOrthography(escapeHtml(name));
  const safeContact = escapeHtml(formattedContact);
  const safeService = normalizeUzbekOrthography(escapeHtml(service || 'Tanlanmadi'));
  const safeBudget = normalizeUzbekOrthography(escapeHtml(budget || 'Kiritilmadi'));
  const safeMessage = normalizeUzbekOrthography(escapeHtml(message || 'Kiritilmadi'));

  const text = `
🆕 <b>YANGI BUYURTMA</b>

👤 <b>Ism/Kompaniya:</b> ${safeName}
📞 <b>Telegram:</b> ${safeContact}
💼 <b>Xizmat turi:</b> ${safeService}
💰 <b>Byudjet:</b> ${safeBudget}

📝 <b>Qisqacha ma’lumot:</b>
<i>${safeMessage}</i>

🤖 <b>AI Yordamchi Tahlili:</b>
${aiAnalysis}
  `.trim();

  let cleanContact = formattedContact.replace('@', '');
  let contactUrl = `https://t.me/${cleanContact}`;
  if (/^[\d\+\s\-\(\)]+$/.test(formattedContact)) {
    let phone = formattedContact.replace(/[^\d+]/g, '');
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
            [ { text: '✉️ Mijozga yozish', url: contactUrl } ],
            [
              { text: '✅ Qabul qilish', callback_data: 'status_accepted' },
              { text: '❌ Rad etish', callback_data: 'status_rejected' }
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
