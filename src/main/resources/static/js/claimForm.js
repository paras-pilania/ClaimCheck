// Claim form used for three things:
//   1. creating a claim            (mode "create")
//   2. reviewing AI suggestions    (mode "create" + prefill from AI)
//   3. correcting and resubmitting (mode "edit", claim in NEEDS_INFORMATION)
// It only collects values. Totals and findings are always calculated by the Java backend.
import { api, ApiError } from './api.js';
import { esc, humanizeDetail, setBusy, toast } from './util.js';

let rowCounter = 0;

const AI_TAG = '<span class="ai-tag">AI suggestion</span>';

export function renderClaimForm(root, { mode, claim = null, prefill = null, reviewerNote = null, onSaved, onCancel }) {
  const isEdit = mode === 'edit';
  const source = claim || prefill || {};
  const fromAi = !isEdit && prefill !== null;
  // Fields that AI filled in; the marker disappears as soon as the user edits that field.
  const aiFields = new Set();
  if (fromAi) {
    ['patientName', 'providerName', 'invoiceNumber', 'serviceDate', 'claimedAmount']
      .forEach((f) => { if (source[f] !== null && source[f] !== undefined) aiFields.add(f); });
  }

  const title = isEdit ? `Correct and resubmit claim #${claim.id}` : 'Submit a new claim';
  root.innerHTML = `
    <a class="back-link" href="${isEdit ? `#/claims/${claim.id}` : '#/'}">← ${isEdit ? 'Back to claim' : 'Back to dashboard'}</a>
    <div class="page-head"><div><h1>${esc(title)}</h1>
      <p class="muted">${isEdit
        ? 'Fix the problems the reviewer described, then resubmit. The claim returns to “Submitted”.'
        : 'Optional fields may be left blank; the backend will flag missing information instead of rejecting the claim.'}</p></div></div>
    ${fromAi ? `<div class="notice notice-ai" role="status"><strong>✦ AI suggestions loaded.</strong>
      These values were suggested by Gemini and may be wrong or incomplete. Check every field against the original bill,
      edit anything you like, and submit when you are satisfied. <strong>Nothing has been saved yet.</strong>
      Totals are calculated by the Java backend, not by AI.</div>` : ''}
    ${isEdit && reviewerNote ? `<div class="notice notice-warn"><strong>Reviewer request:</strong> ${esc(reviewerNote)}</div>` : ''}
    <div id="form-errors" class="notice notice-error" role="alert" hidden></div>
    <form id="claim-form" class="card" autocomplete="off">
      <h2>Claim details</h2>
      <div class="form-grid">
        ${textField('patientName', 'Patient name', source.patientName, { required: true, maxlength: 100 })}
        ${textField('providerName', 'Provider name', source.providerName, { required: true, maxlength: 150 })}
        ${textField('invoiceNumber', 'Invoice number', source.invoiceNumber, { maxlength: 50, hint: '(optional)' })}
        ${dateField('serviceDate', 'Service date', source.serviceDate)}
        ${numberField('claimedAmount', 'Claimed amount (USD)', source.claimedAmount, { step: '0.01', min: '0.01' })}
      </div>
      <h2 style="margin-top:8px">Bill line items</h2>
      <p class="muted small">Each line total and the bill total are calculated by the backend using <code>BigDecimal</code>.</p>
      <div id="line-items"></div>
      <button type="button" class="btn btn-secondary btn-sm" id="add-line">+ Add line item</button>
      <div class="form-actions" style="margin-top:20px">
        <button type="submit" class="btn btn-primary" id="submit-btn">${isEdit ? 'Resubmit claim' : 'Submit claim'}</button>
        <button type="button" class="btn btn-ghost" id="cancel-btn">Cancel</button>
      </div>
    </form>`;

  const form = root.querySelector('#claim-form');
  const itemsHost = root.querySelector('#line-items');
  const errorBox = root.querySelector('#form-errors');

  function textField(name, label, value, opts = {}) {
    return `<div class="field ${aiFields.has(name) ? 'is-ai' : ''}" data-field="${name}">
      <label for="f-${name}">${label}${opts.required ? ' <span aria-hidden="true">*</span>' : ''}
        ${opts.hint ? `<span class="hint">${opts.hint}</span>` : ''}<span class="ai-slot">${aiFields.has(name) ? AI_TAG : ''}</span></label>
      <input type="text" id="f-${name}" name="${name}" value="${esc(value ?? '')}"
        ${opts.required ? 'required aria-required="true"' : ''} maxlength="${opts.maxlength || 100}"></div>`;
  }
  function dateField(name, label, value) {
    return `<div class="field ${aiFields.has(name) ? 'is-ai' : ''}" data-field="${name}">
      <label for="f-${name}">${label} <span class="hint">(optional)</span><span class="ai-slot">${aiFields.has(name) ? AI_TAG : ''}</span></label>
      <input type="date" id="f-${name}" name="${name}" value="${esc(value ?? '')}"></div>`;
  }
  function numberField(name, label, value, opts = {}) {
    return `<div class="field ${aiFields.has(name) ? 'is-ai' : ''}" data-field="${name}">
      <label for="f-${name}">${label} <span class="hint">(optional)</span><span class="ai-slot">${aiFields.has(name) ? AI_TAG : ''}</span></label>
      <input type="number" id="f-${name}" name="${name}" value="${esc(value ?? '')}" step="${opts.step}" min="${opts.min}" inputmode="decimal"></div>`;
  }

  function addLineItem(item = {}, ai = false) {
    const n = ++rowCounter;
    const row = document.createElement('div');
    row.className = 'line-item' + (ai ? ' is-ai' : '');
    row.innerHTML = `
      <div class="field"><label for="li-d-${n}">Description${ai ? AI_TAG : ''}</label>
        <input type="text" id="li-d-${n}" data-k="description" value="${esc(item.description ?? '')}" maxlength="200"></div>
      <div class="field"><label for="li-q-${n}">Quantity</label>
        <input type="number" id="li-q-${n}" data-k="quantity" value="${esc(item.quantity ?? 1)}" min="1" max="1000" step="1"></div>
      <div class="field"><label for="li-p-${n}">Unit price (USD)</label>
        <input type="number" id="li-p-${n}" data-k="unitPrice" value="${esc(item.unitPrice ?? '')}" min="0.01" step="0.01" inputmode="decimal"></div>
      <div class="remove-wrap"><button type="button" class="btn btn-ghost btn-sm remove-line" aria-label="Remove this line item">Remove</button></div>`;
    row.querySelector('.remove-line').addEventListener('click', () => { row.remove(); });
    row.querySelectorAll('input').forEach((input) => input.addEventListener('input', () => {
      row.classList.remove('is-ai');
      const tag = row.querySelector('.ai-tag');
      if (tag) tag.remove();
    }));
    itemsHost.appendChild(row);
    return row;
  }

  // Seed rows
  const initialItems = source.lineItems || [];
  if (initialItems.length === 0) addLineItem();
  initialItems.forEach((item) => addLineItem(item, fromAi));

  root.querySelector('#add-line').addEventListener('click', () => {
    addLineItem().querySelector('input').focus();
  });

  // Clear the AI marker when the user edits a field
  form.querySelectorAll('.field[data-field]').forEach((field) => {
    field.querySelector('input').addEventListener('input', () => {
      field.classList.remove('is-ai');
      const slot = field.querySelector('.ai-slot');
      if (slot) slot.innerHTML = '';
    });
  });

  root.querySelector('#cancel-btn').addEventListener('click', onCancel);

  function readValue(name) {
    const v = form.elements[name].value.trim();
    return v === '' ? null : v;
  }

  function buildPayload() {
    const amount = readValue('claimedAmount');
    const lineItems = [...itemsHost.querySelectorAll('.line-item')]
      .map((row) => {
        const get = (k) => row.querySelector(`[data-k="${k}"]`).value.trim();
        return { description: get('description'), quantity: get('quantity'), unitPrice: get('unitPrice') };
      })
      // Skip rows the user left completely empty
      .filter((r) => r.description !== '' || r.unitPrice !== '')
      .map((r) => ({
        description: r.description,
        quantity: r.quantity === '' ? null : Number(r.quantity),
        unitPrice: r.unitPrice === '' ? null : Number(r.unitPrice),
      }));
    const payload = {
      patientName: readValue('patientName'),
      providerName: readValue('providerName'),
      invoiceNumber: readValue('invoiceNumber'),
      serviceDate: readValue('serviceDate'),
      claimedAmount: amount === null ? null : Number(amount),
      lineItems,
    };
    if (isEdit) payload.version = claim.version; // optimistic locking
    return payload;
  }

  function showErrors(error) {
    const details = (error.details || []).map(humanizeDetail);
    errorBox.innerHTML = `<strong>${esc(error.message)}</strong>
      ${details.length ? `<ul>${details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
      ${isEdit && error.status === 409 ? `<p style="margin:8px 0 0"><a href="#/claims/${claim.id}">Reload the latest version of this claim</a></p>` : ''}`;
    errorBox.hidden = false;
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    const button = root.querySelector('#submit-btn');
    setBusy(button, true, isEdit ? 'Resubmitting…' : 'Submitting…');
    try {
      const payload = buildPayload();
      const saved = isEdit ? await api.resubmitClaim(claim.id, payload) : await api.createClaim(payload);
      toast(isEdit ? `Claim #${saved.id} corrected and resubmitted.` : `Claim #${saved.id} submitted.`, 'success');
      onSaved(saved);
    } catch (e) {
      showErrors(e instanceof ApiError ? e : new ApiError(0, e.message));
    } finally {
      setBusy(button, false);
    }
  });
}
