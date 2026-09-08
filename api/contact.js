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

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_TOKEN.trim() : '';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ? process.env.TELEGRAM_CHAT_ID.trim() : '';
  const INCEPTION_API_KEY = (process.env.INCEPTION_API_KEY || '***REMOVED***').trim();

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return res.status(500).json({ error: 'Server sozlamalari mavjud emas: TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID sozlanmagan.' });
  }

  const { name, contact, service, budget, message } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Ism kiritilishi shart' });
  }
  if (!contact || !contact.trim()) {
    return res.status(400).json({ error: 'Telegram aloqa ma’lumoti kiritilishi shart' });
  }
  const invalidServicePlaceholders = [
    'tanlanmadi',
    'xizmat turini tanlang...',
    'хизмат турини танланг...',
    'выберите услугу...',
    'select a service...'
  ];
  if (!service || !service.trim() || invalidServicePlaceholders.includes(service.trim().toLowerCase())) {
    return res.status(400).json({ error: 'Xizmat turi tanlanishi shart' });
  }
  if (!budget || !budget.trim()) {
    return res.status(400).json({ error: 'Taxminiy byudjet kiritilishi shart' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Loyiha haqida xabar kiritilishi shart' });
  }
  if (message.trim().length < 20) {
    return res.status(400).json({ error: 'Loyiha haqida xabar kamida 20 ta harfdan iborat bo‘lishi kerak' });
  }

  const cleanName = name.trim().slice(0, 100);
  const cleanService = service.trim().slice(0, 100);
  const cleanBudget = budget.trim().slice(0, 100);
  const cleanMessage = message.trim().slice(0, 3000);

  // Validate and build contact URL safely to avoid Telegram BUTTON_URL_INVALID errors
  const rawContact = contact.trim().slice(0, 100);
  let contactUrl = null;
  let formattedContact = rawContact;

  const digitsOnly = rawContact.replace(/[^\d]/g, '');
  if (/^[\d\+\s\-\(\)]+$/.test(rawContact) && digitsOnly.length >= 7 && digitsOnly.length <= 15) {
    contactUrl = `https://t.me/+${digitsOnly}`;
    formattedContact = rawContact.startsWith('+') ? rawContact : `+${digitsOnly}`;
  } else {
    const usernameMatch = rawContact.replace(/^(?:https?:\/\/)?(?:www\.)?t\.me\//i, '').replace(/^@/, '').trim();
    if (/^[a-zA-Z0-9_]{4,32}$/.test(usernameMatch)) {
      contactUrl = `https://t.me/${usernameMatch}`;
      formattedContact = `@${usernameMatch}`;
    }
  }

  // --- AI ANALYSIS ---
  let aiAnalysis = '<i>AI tahlili mavjud emas.</i>';
  try {
    const aiPrompt = `Siz qobiliyatli IT konsultantsiz. MrAstronaut ismli frilanserga yordam beryapsiz.
Yangi mijoz quyidagi loyiha so‘rovini yubordi:
- Xizmat turi: ${cleanService}
- Byudjet: ${cleanBudget}
- Mijozning xabari: ${cleanMessage}

Iltimos, ushbu mijoz so‘rovini tahlil qilib, qisqa 3–4 ta band (nuqtachalar) bilan quyidagilarni o‘zbek tilida yozing:
1. Loyiha uchun qaysi texnologiyalar (Tech Stack) eng mos keladi?
2. Boshlang‘ich narxni qanday aytish va qanday sotish strategiyasini qo‘llash kerak?
3. Mijozning xabaridagi asosiy xavf yoki talab nima?
Faqat aniq faktlar va maslahat bo‘lsin. Hech qanday salomlashishsiz, to‘g‘ridan-to‘g‘ri tahlilni yozing. QAT’IY QOIDA: O‘zbek tili grammatikasi va imlo qoidalariga 100% amal qiling. O‘ va G‘ harflarida har doim to‘g‘ri chapga egilgan apostrof belgisini ishlating (O‘, o‘, G‘, g‘). Ularni oddiy to‘g‘ri tutuq belgisi yoki birikmali tirnoqlar bilan almashtirmang. Tutuq belgisini (’) o‘z o‘rnida va to‘g‘ri shaklda qo‘llang. Matndagi barcha iqtibos va nomlarni standart qo‘shtirnoqlar (“...”) ichida bering. Har bir gap va so‘z grammatik jihatdan benuqson bo‘lsin.`;

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), 4000) : null;

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
      }),
      signal: controller ? controller.signal : undefined
    });
    if (timeout) clearTimeout(timeout);

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
  const safeName = normalizeUzbekOrthography(escapeHtml(cleanName));
  const safeContact = escapeHtml(formattedContact);
  const safeService = normalizeUzbekOrthography(escapeHtml(cleanService));
  const safeBudget = normalizeUzbekOrthography(escapeHtml(cleanBudget));
  const safeMessage = normalizeUzbekOrthography(escapeHtml(cleanMessage));

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

  const inlineKeyboard = [];
  if (contactUrl) {
    inlineKeyboard.push([ { text: '✉️ Mijozga yozish', url: contactUrl } ]);
  }
  inlineKeyboard.push([
    { text: '✅ Qabul qilish', callback_data: 'status_accepted' },
    { text: '❌ Rad etish', callback_data: 'status_rejected' }
  ]);

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: inlineKeyboard
        }
      })
    });

    const data = await response.json().catch(() => null);
    if (data && data.ok) {
      return res.status(200).json({ success: true });
    } else {
      let desc = data?.description || 'Telegram API xatosi';
      if (desc.includes('Unauthorized')) {
        desc = 'Telegram bot tokeni noto‘g‘ri yoki bekor qilingan (Unauthorized).';
      } else if (desc.includes('chat not found')) {
        desc = 'Telegram chat topilmadi (Botga avval /start yuborilgan bo‘lishi kerak).';
      } else if (desc.includes('bot was blocked')) {
        desc = 'Telegram bot bloklangan. Iltimos, botni blokdan chiqaring.';
      }
      return res.status(502).json({ error: desc });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Xabarni yuborishda xatolik yuz berdi' });
  }
}
