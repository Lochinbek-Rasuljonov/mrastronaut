export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return res.status(500).json({ error: 'Config missing' });
  }

  const body = req.body;
  if (!body || !body.callback_query) {
    return res.status(200).json({ ok: true }); 
  }

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
  } 
  else if (data === 'status_started') {
    alertText = '🚀 Ish boshlandi!';
    newKeyboard = [
      [ { text: '🔵 HOLAT: BAJARILMOQDA (Jarayonda)', callback_data: 'ignore' } ],
      [ { text: '🏁 Loyihani topshirish', callback_data: 'status_finished' }, { text: '❌ Bekor qilish', callback_data: 'status_rejected' } ]
    ];
  }
  else if (data === 'status_finished') {
    alertText = '🏁 Loyiha tugatildi, to\'lov kutilmoqda!';
    newKeyboard = [
      [ { text: '🟣 HOLAT: YAKUNLANDI (To\'lov kutilmoqda)', callback_data: 'ignore' } ],
      [ { text: '💵 To\'lov qabul qilindi', callback_data: 'status_paid' } ]
    ];
  }
  else if (data === 'status_paid') {
    alertText = '🏆 To\'lov olindi. Tabriklaymiz!';
    newKeyboard = [
      [ { text: '🏆 HOLAT: TUGATILDI VA TO\'LOV OLINDI!', callback_data: 'ignore' } ]
    ];
  }
  else if (data === 'status_rejected') {
    alertText = '🔴 Bekor qilindi.';
    newKeyboard = [
      [ { text: '🔴 HOLAT: RAD ETILDI / BEKOR QILINDI', callback_data: 'ignore' } ]
    ];
  }
  else if (data === 'ignore') {
    return res.status(200).json({ ok: true });
  }

  // Preserve the 'Mijozga yozish' URL button if it exists
  let contactBtnRow = null;
  if (cb.message.reply_markup && cb.message.reply_markup.inline_keyboard) {
    const firstRow = cb.message.reply_markup.inline_keyboard[0];
    if (firstRow && firstRow[0] && firstRow[0].url) {
      contactBtnRow = firstRow;
    }
  }

  if (contactBtnRow) {
    newKeyboard.unshift(contactBtnRow); // Add it back to the top
  }

  try {
    // Edit ONLY the buttons, preserving the original message text and HTML
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cb.message.chat.id,
        message_id: cb.message.message_id,
        reply_markup: { inline_keyboard: newKeyboard }
      })
    });
    
    // Show a popup alert to the admin
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        callback_query_id: cb.id,
        text: alertText,
        show_alert: false // True makes a big popup, false is a small toast
      })
    });
  } catch (err) {
    console.error(err);
  }

  return res.status(200).json({ ok: true });
}
// Actually I need to completely replace webhook.js again to prepend the contact button
