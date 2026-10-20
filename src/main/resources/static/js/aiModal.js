// "Extract bill with AI" dialog. Calls POST /api/ai/extract-claim and hands the
// suggestions to the app, which loads them into the normal claim form.
// The dialog never saves anything.
import { api } from './api.js';
import { setBusy } from './util.js';

const SAMPLE = `Sample Community Clinic
Invoice: INV-2002
Patient: Test Patient Three
Date of service: 2026-10-08
Consultation 1 x 100.00
Blood test 2 x 40.00
Total due: 180.00`;

export function initAiModal(onExtracted) {
  const dialog = document.getElementById('ai-dialog');
  const form = document.getElementById('ai-form');
  const text = document.getElementById('ai-text');
  const count = document.getElementById('ai-count');
  const error = document.getElementById('ai-error');
  const submit = document.getElementById('ai-submit');
  const cancel = document.getElementById('ai-cancel');

  const updateCount = () => { count.textContent = `${text.value.length} / 10000`; };
  text.addEventListener('input', updateCount);

  document.getElementById('ai-sample-btn').addEventListener('click', () => {
    text.value = SAMPLE;
    updateCount();
    text.focus();
  });

  let busy = false;
  function close() { if (!busy) dialog.close(); }
  cancel.addEventListener('click', close);
  dialog.addEventListener('cancel', (event) => { if (busy) event.preventDefault(); });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    if (!text.value.trim()) {
      error.textContent = 'Paste some bill text first.';
      error.hidden = false;
      text.focus();
      return;
    }
    busy = true;
    setBusy(submit, true, 'Gemini is reading the bill…');
    cancel.disabled = true;
    try {
      const preview = await api.extractClaim(text.value);
      dialog.close();
      onExtracted(preview);
    } catch (e) {
      error.textContent = e.message;
      error.hidden = false;
    } finally {
      busy = false;
      setBusy(submit, false);
      cancel.disabled = false;
    }
  });

  return function open() {
    error.hidden = true;
    dialog.showModal();
    text.focus();
  };
}
