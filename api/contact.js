export function normalizeUzbekOrthography(text) {
  if (!text) return text;
  // 1. Convert paired quotation marks: "..." and «...» to standard “...” (U+201C / U+201D)
  let res = text.replace(/«([^«»\r\n]+)»/g, '“$1”');
  res = res.replace(/"([^"\r\n]+)"/g, '“$1”');

  // 2. Oʻ/Gʻ (any apostrophe variant) → Ō ō Ḡ ḡ (yangi alifbo)
  // Followed by letters (oʻz → ōz, gʻoya → ḡoya) or word boundary/whitespace/punctuation (togʻ → toḡ)
  const MACRON = { O: 'Ō', o: 'ō', G: 'Ḡ', g: 'ḡ' };
  res = res.replace(/([OoGg])['`ʻ‘’´](?=[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF]|\s|[.,!?;:)]|$)/g, (m, p1) => MACRON[p1]);

  // 3. Tutuq belgisi with right curly apostrophe ʼ (U+02BC)
  // Between letters: maʼlumot, sanʼat, masʼul, taʼminlaş, etc.
  res = res.replace(/([a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF])['`ʻ‘’´]([a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF])/g, '$1ʼ$2');

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
    console.error('Missing config'); return res.status(500).json({ error: 'Serverda vaqtinçalik nosozlik yuz berdi. Iltimos, birozdan sōng qayta urinib kōring.' });
  }

  const { name, contact, service, budget, message } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Ism kiritilişi şart' });
  }
  if (!contact || !contact.trim()) {
    return res.status(400).json({ error: 'Telegram aloqa maʼlumoti kiritilişi şart' });
  }
  const invalidServicePlaceholders = [
    'tanlanmadi',
    'xizmat turini tanlang...',
    'хизмат турини танланг...',
    'выберите услугу...',
    'select a service...'
  ];
  if (!service || !service.trim() || invalidServicePlaceholders.includes(service.trim().toLowerCase())) {
    return res.status(400).json({ error: 'Xizmat turi tanlanişi şart' });
  }
  if (!budget || !budget.trim()) {
    return res.status(400).json({ error: 'Taxminiy byudjet kiritilişi şart' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Loyiha haqida xabar kiritilişi şart' });
  }
  if (message.trim().length < 20) {
    return res.status(400).json({ error: 'Loyiha haqida xabar kamida 20 ta harfdan iborat bōlişi kerak' });
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
Yangi mijoz quyidagi loyiha sōrovini yubordi:
- Xizmat turi: ${cleanService}
- Byudjet: ${cleanBudget}
- Mijozning xabari: ${cleanMessage}

Iltimos, uşbu mijoz sōrovini tahlil qilib, qisqa 3–4 ta band (nuqtaçalar) bilan quyidagilarni ōzbek tilida yozing:
1. Loyiha uçun qaysi texnologiyalar (Tech Stack) eng mos keladi?
2. Boşlanḡiç narxni qanday aytiş va qanday sotiş strategiyasini qōllaş kerak?
3. Mijozning xabaridagi asosiy xavf yoki talab nima?
Faqat aniq faktlar va maslahat bōlsin. Heç qanday salomlaşişsiz, tōḡridan-tōḡri tahlilni yozing. QATʼIY QOIDA: Ōzbek tili grammatikasi va imlo qoidalariga 100% amal qiling. Faqat yangi ōzbek lotin alifbosida yozing: oʻ, gʻ, sh, ch ōrniga har doim Ō ō, Ḡ ḡ, Ş ş, Ç ç harflarini qōllang (masalan: “ōzbek”, “tōḡri”, “işlaş”, “uçun”). Tutuq belgisini (ʼ) ōz ōrnida va tōḡri şaklda qōllang. Matndagi barça iqtibos va nomlarni standart qōştirnoqlar (“...”) içida bering. Har bir gap va sōz grammatik jihatdan benuqson bōlsin.`;

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
        max_tokens: 300,
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
        // Escape HTML first to prevent XSS
        let safeContent = escapeHtml(rawContent);
        // Convert Markdown to Telegram HTML
        safeContent = safeContent.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        safeContent = safeContent.replace(/__(.*?)__/g, '<b>$1</b>');
        safeContent = safeContent.replace(/\*(.*?)\*/g, '<i>$1</i>');
        safeContent = safeContent.replace(/_(.*?)_/g, '<i>$1</i>');
        safeContent = safeContent.replace(/^-\s/gm, '• ');
        aiAnalysis = safeContent;
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

👤 <b>Ism:</b> ${safeName}
📞 <b>Telegram:</b> ${safeContact}
💼 <b>Xizmat turi:</b> ${safeService}
💰 <b>Byudjet:</b> ${safeBudget}

📝 <b>Qisqaça maʼlumot:</b>
<i>${safeMessage}</i>

🤖 <b>AI Yordamçi Tahlili:</b>
${aiAnalysis}
  `.trim();

  const inlineKeyboard = [];
  if (contactUrl) {
    inlineKeyboard.push([ { text: '✉️ Mijozga yoziş', url: contactUrl } ]);
  }
  inlineKeyboard.push([
    { text: '✅ Qabul qiliş', callback_data: 'status_accepted' },
    { text: '❌ Rad etiş', callback_data: 'status_rejected' }
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
      console.error('Telegram API error:', data);
      return res.status(502).json({ error: 'Xizmat vaqtinça faol emas. Iltimos, keyinroq urinib kōring.' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Xabarni yuborişda xatolik yuz berdi' });
  }
}
