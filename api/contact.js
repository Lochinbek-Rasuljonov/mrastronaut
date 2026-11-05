export function normalizeUzbekOrthography(text) {
  if (!text) return text;
  // Technical spans must remain byte-for-byte intact while prose is normalized.
  const protectedSpans = /(```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)|(?<![\p{L}\p{N}])`[^`\r\n]*`|(?:https?:\/\/|www\.)[^\s<>"“”]+|[\w.+-]+@[\w.-]+\.[a-z]{2,})/giu;
  return text.split(protectedSpans).map((part, index) => {
    if (index % 2) return part;
    let res = part.normalize('NFC');
    res = res.replace(/«([^«»\r\n]+)»/g, '“$1”');
    res = res.replace(/"([^"\r\n]+)"/g, '“$1”');

    // Preserve compatibility with the former macron alphabet and apostrophe variants.
    const letters = { O: 'Ö', o: 'ö', G: 'Ğ', g: 'ğ', Ō: 'Ö', ō: 'ö', Ḡ: 'Ğ', ḡ: 'ğ' };
    res = res.replace(/[ŌōḠḡ]/g, letter => letters[letter]);
    res = res.replace(/([OoGg])['`ʻ‘’ʼ´](?=\p{L}|\s|[.,!?;:)\]}»”]|$)/gu, (_, letter) => letters[letter]);

    // Tutuq remains U+02BC.
    res = res.replace(/(\p{L})['`ʻ‘’ʼ´](?=\p{L})/gu, '$1ʼ');

    // The AI prompt handles Ş/Ç: global sh/ch replacement would damage brands and English.
    return res;
  }).join('');
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
  const INCEPTION_API_KEY = (process.env.INCEPTION_API_KEY || '').trim();

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Missing config'); return res.status(500).json({ error: 'Serverda vaqtinçalik nosozlik yuz berdi. Iltimos, birozdan söng qayta urinib köring.' });
  }

  const { name, contact, message } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Ism kiritilişi şart' });
  }
  if (!contact || !contact.trim()) {
    return res.status(400).json({ error: 'Telegram yoki telefon raqami kiritilişi şart' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Nima kerakligini yoziş şart' });
  }

  const cleanName = name.trim().slice(0, 100);
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
Yangi mijoz quyidagi loyiha sörovini yubordi:
- Mijozning xabari: ${cleanMessage}

Iltimos, uşbu mijoz sörovini tahlil qilib, qisqa 3–4 ta band (nuqtaçalar) bilan quyidagilarni özbek tilida yozing:
1. Loyiha uçun qaysi texnologiyalar (Tech Stack) eng mos keladi?
2. Boşlanğiç narxni qanday aytiş va qanday sotiş strategiyasini qöllaş kerak?
3. Mijozning xabaridagi asosiy xavf yoki talab nima?
Faqat aniq faktlar va maslahat bölsin. Heç qanday salomlaşişsiz, töğridan-töğri tahlilni yozing. QATʼIY QOIDA: Özbek tili grammatikasi va imlo qoidalariga 100% amal qiling. Faqat yangi özbek lotin alifbosida yozing: Ö ö, Ğ ğ, Ş ş, Ç ç harflarini qöllang (masalan: “özbek”, “töğri”, “işlaş”, “uçun”). Tutuq belgisini (ʼ) öz örnida va töğri şaklda qöllang. Matndagi barça iqtibos va nomlarni standart qöştirnoqlar (“...”) içida bering. Har bir gap va söz grammatik jihatdan benuqson bölsin. Dastur kodi, texnik identifikatorlar, URL manzillari, brend va şaxs nomlari hamda mijoz kiritgan matnni özgartirmang.`;

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
  // Preserve customer spelling, names, technical identifiers and quoted requirements.
  const safeName = escapeHtml(cleanName);
  const safeContact = escapeHtml(formattedContact);
  const safeMessage = escapeHtml(cleanMessage);

  const text = `
🆕 <b>YANGI BUYURTMA</b>

👤 <b>Ism:</b> ${safeName}
📞 <b>Aloqa:</b> ${safeContact}

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
      return res.status(502).json({ error: 'Xizmat vaqtinça faol emas. Iltimos, keyinroq urinib köring.' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Xabarni yuborişda xatolik yuz berdi' });
  }
}
