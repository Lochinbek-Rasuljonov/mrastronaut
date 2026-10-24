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
    console.error('Missing config'); return res.status(500).json({ error: 'Server error' });
  }

  const body = req.body;
  if (!body) return res.status(200).json({ ok: true });

  // ==========================================
  // 1. HANDLE BUTTON CLICKS (CALLBACK QUERIES)
  // ==========================================
  if (body.callback_query) {
    const cb = body.callback_query;
    if (cb.from.id.toString() !== TELEGRAM_CHAT_ID.toString().trim()) {
      return res.status(200).json({ ok: true }); 
    }

    const data = cb.data;
    let newKeyboard = [];
    let alertText = '';

    if (data === 'status_accepted') {
      alertText = '✅ Loyiha qabul qilindi!';
      newKeyboard = [
        [ { text: '🟢 HOLAT: QABUL QILINDI (Kutilmoqda)', callback_data: 'ignore' } ],
        [ { text: '🚀 Işni boşlaş', callback_data: 'status_started' }, { text: '❌ Bekor qiliş', callback_data: 'status_rejected' } ]
      ];
    } else if (data === 'status_started') {
      alertText = '🚀 Ish boshlandi!';
      newKeyboard = [
        [ { text: '🔵 HOLAT: BAJARILMOQDA (Jarayonda)', callback_data: 'ignore' } ],
        [ { text: '🏁 Loyihani topşiriş', callback_data: 'status_finished' }, { text: '❌ Bekor qiliş', callback_data: 'status_rejected' } ]
      ];
    } else if (data === 'status_finished') {
      alertText = '🏁 Loyiha tugatildi, tōlov kutilmoqda!';
      newKeyboard = [
        [ { text: '🟣 HOLAT: YAKUNLANDI (Tōlov kutilmoqda)', callback_data: 'ignore' } ],
        [ { text: '💵 Tōlov qabul qilindi', callback_data: 'status_paid' } ]
      ];
    } else if (data === 'status_paid') {
      alertText = '🏆 Tōlov olindi. Tabriklaymiz!';
      newKeyboard = [
        [ { text: '🏆 HOLAT: TUGATILDI VA TŌLOV OLINDI!', callback_data: 'ignore' } ]
      ];
    } else if (data === 'status_rejected') {
      alertText = '🔴 Bekor qilindi.';
      newKeyboard = [
        [ { text: '🔴 HOLAT: RAD ETILDI / BEKOR QILINDI', callback_data: 'ignore' } ]
      ];
    } else if (data === 'ignore') {
      return res.status(200).json({ ok: true });
    }

    let contactBtnRow = null;
    if (cb.message.reply_markup && cb.message.reply_markup.inline_keyboard) {
      const firstRow = cb.message.reply_markup.inline_keyboard[0];
      if (firstRow && firstRow[0] && firstRow[0].url) {
        contactBtnRow = firstRow;
      }
    }
    if (contactBtnRow) newKeyboard.unshift(contactBtnRow);

    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cb.message.chat.id,
          message_id: cb.message.message_id,
          reply_markup: { inline_keyboard: newKeyboard }
        })
      });
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cb.id, text: alertText, show_alert: false })
      });
    } catch (err) { console.error(err); }

    return res.status(200).json({ ok: true });
  }

  // ==========================================
  // 2. HANDLE NORMAL CHAT MESSAGES
  // ==========================================
  if (body.message) {
    const msg = body.message;
    if (msg.chat.id.toString() !== TELEGRAM_CHAT_ID.toString().trim()) {
      return res.status(200).json({ ok: true });
    }

    const text = msg.text || '';
    let replyText = '';
    let replyMarkup = null;

    if (text === '/start') {
      replyText = `Salom, janob MrAstronaut! 👨‍🚀\n\nBiz sizning şaxsiy AI yordamçingiz va CRM boşqaruv markazingiz bōlamiz. Nima xizmat?`;
      replyMarkup = {
        keyboard: [
          [{ text: "💬 AI bilan suhbat" }]
        ],
        resize_keyboard: true,
        persistent: true
      };
    } 
    else if (text === '📊 Statistika') {
      replyText = "Barça buyurtmalar tōḡridan-tōḡri Telegram xabarlari orqali xavfsiz boşqariladi.";
    }
    else {
      // AI Chat
      const apiKey = INCEPTION_API_KEY || '***REMOVED***';
      
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: msg.chat.id, action: 'typing' })
      }).catch(e => {});

      try {
        const aiResponse = await fetch('https://api.inceptionlabs.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'mercury-2',
            reasoning_effort: 'low',
            messages: [
              { role: 'system', content: "Siz MrAstronautning şaxsiy yordamçisisiz. Qisqa va aniq ōzbek tilida javob bering. QATʼIY QOIDA: Ōzbek tili grammatikasi va imlo qoidalariga 100% amal qiling. Faqat yangi ōzbek lotin alifbosida yozing: oʻ, gʻ, sh, ch ōrniga har doim Ō ō, Ḡ ḡ, Ş ş, Ç ç harflarini qōllang (masalan: “ōzbek”, “tōḡri”, “işlaş”, “uçun”). Tutuq belgisini (ʼ) ōz ōrnida va tōḡri şaklda qōllang. Matndagi barça iqtibos va nomlarni standart qōştirnoqlar (“...”) içida bering. Har bir gap va sōz grammatik jihatdan benuqson bōlsin." },
              { role: 'user', content: text }
            ]
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          let rawAiText = aiData.choices[0].message.content || '';
          replyText = escapeHtml(normalizeUzbekOrthography(rawAiText));
        } else {
          replyText = "Keçirasiz, AI xizmatida xatolik yuz berdi.";
        }
      } catch (e) {
        replyText = "AIga ulanişda muammo yuz berdi.";
      }
    }

    if (replyText) {
      const payload = {
        chat_id: msg.chat.id,
        text: replyText,
        parse_mode: 'HTML'
      };
      if (replyMarkup) {
        payload.reply_markup = replyMarkup;
      }

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(200).json({ ok: true });
}
