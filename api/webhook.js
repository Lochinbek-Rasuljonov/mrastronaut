import Redis from 'ioredis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, INCEPTION_API_KEY, REDIS_URL } = process.env;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return res.status(500).json({ error: 'Config missing' });
  }

  // Setup Redis instance
  let redis = null;
  if (REDIS_URL) {
    try {
      const urlObj = new URL(REDIS_URL);
      redis = new Redis(REDIS_URL, {
        tls: {
          servername: urlObj.hostname
        }
      });
      redis.on('error', (err) => console.error('Redis Error:', err));
    } catch(e) {
      console.error('Redis connection error:', e);
    }
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
        [ { text: '🚀 Ishni boshlash', callback_data: 'status_started' }, { text: '❌ Bekor qilish', callback_data: 'status_rejected' } ]
      ];
      if (redis) await redis.incr('stats_accepted');
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
      if (redis) {
        await redis.incr('stats_completed');
        // Extract budget
        const msgText = cb.message.text || '';
        const budgetMatch = msgText.match(/Byudjet:\s*([0-9\.\,]+)/);
        if (budgetMatch && budgetMatch[1]) {
          const amount = parseInt(budgetMatch[1].replace(/[^0-9]/g, ''));
          if (!isNaN(amount) && amount > 0) {
            await redis.incrby('stats_profit', amount);
          }
        }
      }
    } else if (data === 'status_rejected') {
      alertText = '🔴 Bekor qilindi.';
      newKeyboard = [
        [ { text: '🔴 HOLAT: RAD ETILDI / BEKOR QILINDI', callback_data: 'ignore' } ]
      ];
      if (redis) await redis.incr('stats_rejected');
    } else if (data === 'ignore') {
      if (redis) redis.quit();
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
    
    if (redis) redis.quit();
    return res.status(200).json({ ok: true });
  }

  // ==========================================
  // 2. HANDLE NORMAL CHAT MESSAGES
  // ==========================================
  if (body.message) {
    const msg = body.message;
    if (msg.chat.id.toString() !== TELEGRAM_CHAT_ID.toString().trim()) {
      if (redis) redis.quit();
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
      if (!redis) {
        replyText = "📊 Hozircha Ma’lumotlar bazasi (DB) ulanmagan. REDIS_URL ni kiritishingiz bilan statistika shu yerda ko‘rsatiladi!";
      } else {
        const accepted = (await redis.get('stats_accepted')) || 0;
        const completed = (await redis.get('stats_completed')) || 0;
        const rejected = (await redis.get('stats_rejected')) || 0;
        const profit = (await redis.get('stats_profit')) || 0;
        
        replyText = `📊 <b>Sizning shaxsiy statistikangiz:</b>\n\n` +
                    `✅ Qabul qilingan loyihalar: <b>${accepted} ta</b>\n` +
                    `🏆 Muvaffaqiyatli yakunlangan: <b>${completed} ta</b>\n` +
                    `🔴 Rad etilganlar: <b>${rejected} ta</b>\n\n` +
                    `💰 Umumiy daromad: <b>$${profit}</b>`;
      }
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
              { role: 'system', content: "Siz MrAstronautning shaxsiy yordamchisisiz. Qisqa va aniq o‘zbek tilida javob bering. QAT’IY QOIDA: O‘zbek tili grammatikasi va imlo qoidalariga 100% amal qiling. O‘ va G‘ harflari uchun har doim to‘g‘ri chapga egilgan apostrof belgisini ishlating (O‘, o‘, G‘, g‘). Tutuq belgisini (’) o‘z o‘rnida va to‘g‘ri shaklda qo‘llang. Matndagi barcha iqtibos va nomlarni standart qo‘shtirnoqlar ("...") ichida bering. Har bir gap va so‘z grammatik jihatdan benuqson bo‘lsin." },
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
        replyText = "AI ga ulanishda muammo bo‘ldi.";
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

    if (redis) redis.quit();
    return res.status(200).json({ ok: true });
  }

  if (redis) redis.quit();
  return res.status(200).json({ ok: true });
}
