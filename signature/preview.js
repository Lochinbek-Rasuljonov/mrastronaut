const copyButton = document.querySelector('#copy-code');
const codeField = document.querySelector('#embed-code');
const copyStatus = document.querySelector('#copy-status');

copyButton.hidden = false;

copyButton.addEventListener('click', async () => {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(codeField.value);
    copyStatus.textContent = 'Kod nusxalandi. Loyihangizga joylaştirişingiz mumkin.';
  } catch {
    codeField.focus();
    codeField.select();
    codeField.setSelectionRange(0, codeField.value.length);
    copyStatus.textContent = 'Kod belgilandi. Nusxalaş uçun Ctrl+C yoki ⌘C bosing.';
  }
});
