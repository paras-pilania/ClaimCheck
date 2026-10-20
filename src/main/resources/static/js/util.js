// Small helpers shared by all views: escaping, formatting, toasts, confirmation dialog.

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export function formatMoney(value) {
  return value === null || value === undefined ? '—' : money.format(value);
}

export function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export const STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  NEEDS_INFORMATION: 'Needs information',
  REVIEWED: 'Reviewed',
};

export function statusBadge(status) {
  return `<span class="badge badge-${esc(status)}">${esc(STATUS_LABELS[status] || status)}</span>`;
}

// Readable explanations for the backend finding codes.
export const FINDINGS = {
  MISSING_INFORMATION: {
    title: 'Missing information',
    text: 'The invoice number, service date, claimed amount, or line items are missing.',
  },
  AMOUNT_MISMATCH: {
    title: 'Amount mismatch',
    text: 'The claimed amount does not equal the sum of the line items, as calculated by the backend.',
  },
  FUTURE_SERVICE_DATE: {
    title: 'Future service date',
    text: 'The service date is later than today.',
  },
  LATE_SUBMISSION: {
    title: 'Late submission',
    text: 'The claim was first submitted more than 30 days after the service date. '
      + 'This 30-day deadline is fictional and exists only in this educational prototype.',
  },
};

export function findingLabel(code) {
  return (FINDINGS[code] && FINDINGS[code].title) || code;
}

export function flagsHtml(flags) {
  if (!flags || flags.length === 0) return '<span class="flag flag-ok">✓ No findings</span>';
  return `<div class="flags">${flags.map((f) =>
    `<span class="flag" title="${esc(f.message)}">⚠ ${esc(findingLabel(f.code))}</span>`).join('')}</div>`;
}

// Turn "lineItems[0].quantity: must be..." into "Line item 1 · quantity: must be..."
export function humanizeDetail(detail) {
  const match = /^lineItems\[(\d+)\]\.(\w+):\s*(.*)$/.exec(detail);
  if (match) return `Line item ${Number(match[1]) + 1} · ${match[2]}: ${match[3]}`;
  return detail;
}

export function setBusy(button, busy, busyLabel) {
  if (busy) {
    button.dataset.label = button.innerHTML;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${esc(busyLabel || 'Working…')}`;
  } else {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    if (button.dataset.label !== undefined) button.innerHTML = button.dataset.label;
  }
}

// ---- Toasts (used instead of alert()) ----
export function toast(message, type = 'info') {
  const host = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = '<div class="toast-msg"></div><button type="button" aria-label="Dismiss notification">×</button>';
  el.querySelector('.toast-msg').textContent = message;
  const remove = () => el.remove();
  el.querySelector('button').addEventListener('click', remove);
  host.appendChild(el);
  setTimeout(remove, type === 'error' ? 9000 : 5000);
}

// ---- Confirmation dialog, optionally collecting a note ----
// Resolves with { note } when confirmed, or null when cancelled.
export function confirmAction({ title, message, confirmLabel = 'Confirm', noteLabel, noteRequired = false }) {
  const dialog = document.getElementById('confirm-dialog');
  const form = document.getElementById('confirm-form');
  const noteWrap = document.getElementById('confirm-note-wrap');
  const note = document.getElementById('confirm-note');
  const noteError = document.getElementById('confirm-note-error');
  const okButton = document.getElementById('confirm-ok');
  const cancelButton = document.getElementById('confirm-cancel');

  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  okButton.textContent = confirmLabel;
  note.value = '';
  noteError.hidden = true;
  noteWrap.hidden = !noteLabel;
  if (noteLabel) {
    document.getElementById('confirm-note-label').textContent = noteLabel + (noteRequired ? ' (required)' : ' (optional)');
    note.required = noteRequired;
  }

  return new Promise((resolve) => {
    const cleanup = (result) => {
      form.removeEventListener('submit', onSubmit);
      cancelButton.removeEventListener('click', onCancel);
      dialog.removeEventListener('cancel', onCancel);
      if (dialog.open) dialog.close();
      resolve(result);
    };
    const onSubmit = (event) => {
      event.preventDefault();
      if (noteRequired && !note.value.trim()) {
        noteError.textContent = 'A note is required for this action.';
        noteError.hidden = false;
        note.focus();
        return;
      }
      cleanup({ note: note.value.trim() });
    };
    const onCancel = (event) => { if (event) event.preventDefault(); cleanup(null); };
    form.addEventListener('submit', onSubmit);
    cancelButton.addEventListener('click', onCancel);
    dialog.addEventListener('cancel', onCancel);
    dialog.showModal();
    (noteLabel ? note : okButton).focus();
  });
}
