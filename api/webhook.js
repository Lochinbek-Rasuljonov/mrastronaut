export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  const INCEPTION_API_KEY = process.env.INCEPTION_API_KEY || '***REMOVED***';

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return res.status(500).json({ error: 'Config missing' });
  }

  const body = req.body;
  if (!body) return res.status(200).json({ ok: true });

  // ==========================================
  // 1. HANDLE BUTTON CLICKS (CALLBACK QUERIES)
  // ==========================================
  if (body.callback_query) {
    const cb = body.callback_query;
    if (cb.from.id.toString() !== TELEGRAM_CHAT_ID.toString()) {
      return res.status(200).json({ ok: true }); 
    }

    const data = cb.data;
    let newKeyboard = [];
    let alertText = '';

    if (data === 'status_accepted') {
      alertText = '✅ Loyiha qabul qilindi!';
      newKeyboard = [
        [ { text: '🟢 HOLAT: QABUL QILINDI (Kutilmoqda)', callback_data: 'ignore' } ],
        [ { text: '🚀 Ishni boshlash', callback_data: 'status_started' }, { text: '❌ Bekor qilish', callback_data: 'status_rejected' } ]
      ];
    } else if (data === 'status_started') {
      alertText = '🚀 Ish boshlandi!';
      newKeyboard = [
        [ { text: '🔵 HOLAT: BAJARILMOQDA (Jarayonda)', callback_data: 'ignore' } ],
        [ { text: '🏁 Loyihani topshirish', callback_data: 'status_finished' }, { text: '❌ Bekor qilish', callback_data: 'status_rejected' } ]
      ];
    } else if (data === 'status_finished') {
      alertText = '🏁 Loyiha tugatildi, to\'lov kutilmoqda!';
      newKeyboard = [
        [ { text: '🟣 HOLAT: YAKUNLANDI (To\'lov kutilmoqda)', callback_data: 'ignore' } ],
        [ { text: '💵 To\'lov qabul qilindi', callback_data: 'status_paid' } ]
      ];
    } else if (data === 'status_paid') {
      alertText = '🏆 To\'lov olindi. Tabriklaymiz!';
      newKeyboard = [
        [ { text: '🏆 HOLAT: TUGATILDI VA TO\'LOV OLINDI!', callback_data: 'ignore' } ]
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
    // Security check: Ignore anyone except the admin
    if (msg.chat.id.toString() !== TELEGRAM_CHAT_ID.toString()) {
      return res.status(200).json({ ok: true });
    }

    const text = msg.text || '';
    let replyText = '';
    let replyMarkup = null;

    if (text === '/start') {
      replyText = `Salom janob MrAstronaut! 👨‍🚀\n\nMen sizning shaxsiy AI yordamchingiz va CRM tizimingizman. Nima xizmat?`;
      replyMarkup = {
        keyboard: [
          [{ text: "📊 Statistika" }, { text: "💬 AI bilan suhbat" }]
        ],
        resize_keyboard: true,
        persistent: true
      };
    } 
    else if (text === '📊 Statistika') {
      replyText = "📊 Hozircha Ma'lumotlar bazasi (DB) ulanmaganligi sababli, aniq statistika ko'rsata olmayman. Agar Vercel KV ulasangiz, bu yerda daromad va loyihalar soni chiqib turadi!";
    }
    else {
      // Chat with AI!
      // Send temporary "typing..." action
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: msg.chat.id, action: 'typing' })
      }).catch(e => console.error(e));

      try {
        const aiResponse = await fetch('https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage', {
          // WAIT! We need to fetch from InceptionLabs!
        });
      } catch (err) {}
      
      try {
        const aiResponse = await fetch('https://api.inceptionlabs.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${INCEPTION_API_KEY}`
          },
          body: JSON.stringify({
            model: 'mercury-2',
            reasoning_effort: 'low',
            messages: [
              { role: 'system', content: "Siz MrAstronautning shaxsiy yordamchisisiz. Qisqa va aniq o'zbek tilida javob bering." },
              { role: 'user', content: text }
            ]
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          replyText = aiData.choices[0].message.content;
        } else {
          replyText = "Kechirasiz, AI xizmatida xatolik yuz berdi.";
        }
      } catch (e) {
        replyText = "AI ga ulanishda muammo bo'ldi.";
      }
    }

    if (replyText) {
      const payload = {
        chat_id: msg.chat.id,
        text: replyText
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
