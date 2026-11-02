import assert from 'node:assert/strict';
import test from 'node:test';
import contactHandler, { normalizeUzbekOrthography as normalizeContact } from '../api/contact.js';
import webhookHandler, { normalizeUzbekOrthography as normalizeWebhook } from '../api/webhook.js';

for (const [name, normalize] of [['contact', normalizeContact], ['webhook', normalizeWebhook]]) {
  test(`${name}: migrates every legacy apostrophe variant, including U+02BC`, () => {
    for (const mark of ["'", '`', 'ʻ', '‘', '’', 'ʼ', '´']) {
      assert.equal(normalize(`O${mark}zbek o${mark}z G${mark}oya tog${mark}.`), 'Özbek öz Ğoya toğ.');
    }
  });

  test(`${name}: composes Unicode and migrates macrons while preserving the new letters`, () => {
    assert.equal(normalize('Ō ō Ḡ ḡ O\u0304 o\u0304 G\u0304 g\u0304'), 'Ö ö Ğ ğ Ö ö Ğ ğ');
    assert.equal(normalize('O\u0308zbek G\u0306oya S\u0327axs C\u0327iqiş'), 'Özbek Ğoya Şaxs Çiqiş');
    assert.equal(normalize('Ö ö Ğ ğ Ş ş Ç ç'), 'Ö ö Ğ ğ Ş ş Ç ç');
  });

  test(`${name}: retains tutuq and standardizes paired prose quotation marks`, () => {
    assert.equal(normalize("ma'lumot san‘at masʻul qatʼiy ta’minlaş"), 'maʼlumot sanʼat masʼul qatʼiy taʼminlaş');
    assert.equal(normalize('«Gʻoya» va "tog\'"'), '“Ğoya” va “toğ”');
  });

  test(`${name}: leaves code, links, email addresses and mixed-language names intact`, () => {
    const technical = [
      '`const label = "g\'oya"; const combining = "o\u0304";`',
      '```js\nconst label = "g\'oya";\n```',
      '~~~text\nŌ ḡ sh ch\n~~~',
      'https://example.com/checkout?q=ō&name=g\'oya',
      'www.example.com/ō',
      'shopify@example.com',
      'ChatGPT Shopify JavaScript shell checkout Ўзбекистон Русский English',
    ].join('\n');
    assert.equal(normalize(technical), technical);
    assert.equal(normalize(`oʻzbek ${technical} gʻoya`), `özbek ${technical} ğoya`);
  });

  test(`${name}: normalization is idempotent and preserves empty values`, () => {
    for (const value of ['', null, undefined]) assert.equal(normalize(value), value);
    const normalized = normalize('«Ōzbek» ma‘lumot gʼoya Şaxs Çiqiş');
    assert.equal(normalize(normalized), normalized);
  });
}

function mockEnvironment(t) {
  for (const [key, value] of Object.entries({
    TELEGRAM_BOT_TOKEN: 'local-test-token',
    TELEGRAM_CHAT_ID: '12345',
    INCEPTION_API_KEY: 'local-test-key',
  })) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
  }
}

function response() {
  return {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('contact: new alphabet is used for AI prose while submitted spelling and HTML safety are preserved', async t => {
  mockEnvironment(t);
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    if (url.includes('inceptionlabs')) {
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Ōzbek gʼoya; ChatGPT Shopify <x>' } }] }) };
    }
    return { ok: true, json: async () => ({ ok: true }) };
  });
  const message = '"o\'zbek" g\'oya <b>Shopify checkout</b>';
  const res = response();
  await contactHandler({
    method: 'POST',
    body: { name: "O'Connor", contact: '@shopify_user', service: 'Shopify checkout', budget: '$100', message },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true });
  const aiPrompt = calls.find(call => call.url.includes('inceptionlabs')).body.messages[0].content;
  assert.ok(aiPrompt.includes('Ö ö, Ğ ğ, Ş ş, Ç ç'));
  assert.ok(aiPrompt.includes(message));
  const telegram = calls.find(call => call.url.includes('/sendMessage')).body;
  assert.ok(telegram.text.includes("<b>Ism:</b> O'Connor"));
  assert.ok(telegram.text.includes('"o\'zbek" g\'oya &lt;b&gt;Shopify checkout&lt;/b&gt;'));
  assert.ok(telegram.text.includes('Özbek ğoya; ChatGPT Shopify &lt;x&gt;'));
  assert.equal(telegram.reply_markup.inline_keyboard[0][0].url, 'https://t.me/shopify_user');
});

test('webhook: project status notification uses Ş in the new alphabet', async t => {
  mockEnvironment(t);
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return { ok: true, json: async () => ({ ok: true }) };
  });
  const res = response();
  await webhookHandler({
    method: 'POST',
    body: { callback_query: { id: 'callback', from: { id: 12345 }, data: 'status_started', message: { chat: { id: 12345 }, message_id: 7 } } },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(calls.find(call => call.url.includes('/answerCallbackQuery')).body.text, '🚀 Iş boşlandi!');
});

test('webhook: AI system prompt and response use the new alphabet without rewriting the incoming message', async t => {
  mockEnvironment(t);
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    if (url.includes('inceptionlabs')) {
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Gʻoya toʻgʻri; Ōzbek, ChatGPT <script>' } }] }) };
    }
    return { ok: true, json: async () => ({ ok: true }) };
  });
  const incoming = 'ChatGPT "o\'zbek" JavaScript checkout';
  const res = response();
  await webhookHandler({ method: 'POST', body: { message: { chat: { id: 12345 }, text: incoming } } }, res);

  assert.equal(res.statusCode, 200);
  const messages = calls.find(call => call.url.includes('inceptionlabs')).body.messages;
  assert.ok(messages[0].content.includes('Ö ö, Ğ ğ, Ş ş, Ç ç'));
  assert.equal(messages[1].content, incoming);
  assert.equal(calls.find(call => call.url.includes('/sendMessage')).body.text, 'Ğoya töğri; Özbek, ChatGPT &lt;script&gt;');
});
