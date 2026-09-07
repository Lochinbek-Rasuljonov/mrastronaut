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
    return res.status(200).json({ ok: true }); // Ignore non-callback messages
  }

  const cb = body.callback_query;
  // Security check: Only you can click buttons
  if (cb.from.id.toString() !== TELEGRAM_CHAT_ID.toString()) {
    return res.status(200).json({ ok: true }); 
  }

  const data = cb.data;
  const message = cb.message;
  let newStatus = '';
  
  if (data === 'status_accepted') {
    newStatus = '\n\n🟢 <b>HOLAT: QABUL QILINDI</b> (Javob yozish jarayonida)';
  } else if (data === 'status_rejected') {
    newStatus = '\n\n🔴 <b>HOLAT: BEKOR QILINDI</b>';
  }

  if (newStatus) {
    try {
      // Edit the original message to remove buttons and append status
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cb.message.chat.id,
          message_id: cb.message.message_id,
          text: cb.message.text + newStatus, // Original text + status
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [] } // Remove buttons
        })
      });
      
      // Answer callback query to remove loading state
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cb.id })
      });
      
    } catch (err) {
      console.error(err);
    }
  }

  return res.status(200).json({ ok: true });
}
