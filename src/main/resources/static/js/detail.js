// Claim details view: full data, findings, review controls, status history.
import { api } from './api.js';
import {
  esc, formatDate, formatDateTime, formatMoney, statusBadge, FINDINGS, STATUS_LABELS,
  confirmAction, toast, setBusy,
} from './util.js';

export async function renderDetail(root, id) {
  root.innerHTML = '<div class="state"><div class="loader"></div><p>Loading claim…</p></div>';
  let claim, history;
  try {
    [claim, history] = await Promise.all([api.getClaim(id), api.getHistory(id)]);
  } catch (e) {
    root.innerHTML = `<a class="back-link" href="#/">← Back to dashboard</a>
      <div class="state card"><h3>${e.status === 404 ? 'Claim not found' : 'Could not load claim'}</h3><p>${esc(e.message)}</p>
      <button type="button" class="btn btn-secondary" id="retry-btn">Try again</button></div>`;
    root.querySelector('#retry-btn').addEventListener('click', () => renderDetail(root, id));
    return;
  }

  const hasMismatch = claim.flags.some((f) => f.code === 'AMOUNT_MISMATCH');

  root.innerHTML = `
    <a class="back-link" href="#/">← Back to dashboard</a>
    <div class="page-head">
      <div>
        <h1>Claim #${claim.id} ${statusBadge(claim.status)}</h1>
        <p class="muted">Version ${claim.version} · submitted ${esc(formatDateTime(claim.submittedAt))} · last updated ${esc(formatDateTime(claim.updatedAt))}</p>
      </div>
    </div>

    <div class="grid-2">
      <section class="card" aria-labelledby="info-h">
        <h2 id="info-h">Claim information</h2>
        <dl class="facts">
          <dt>Patient</dt><dd>${esc(claim.patientName)}</dd>
          <dt>Provider</dt><dd>${esc(claim.providerName)}</dd>
          <dt>Invoice number</dt><dd>${esc(claim.invoiceNumber || 'Not provided')}</dd>
          <dt>Service date</dt><dd>${esc(claim.serviceDate ? formatDate(claim.serviceDate) : 'Not provided')}</dd>
          <dt>Status</dt><dd>${statusBadge(claim.status)}</dd>
          <dt>Version</dt><dd>${claim.version}</dd>
          <dt>Submitted</dt><dd>${esc(formatDateTime(claim.submittedAt))}</dd>
          <dt>Last updated</dt><dd>${esc(formatDateTime(claim.updatedAt))}</dd>
        </dl>
      </section>

      <section class="card" aria-labelledby="amt-h">
        <h2 id="amt-h">Amounts</h2>
        <div class="amounts">
          <div class="amount-box"><div class="label">Claimed amount</div><div class="value mono">${esc(claim.claimedAmount === null ? 'Not provided' : formatMoney(claim.claimedAmount))}</div></div>
          <div class="amount-box"><div class="label">Calculated by Java</div><div class="value mono">${esc(formatMoney(claim.calculatedTotal))}</div></div>
        </div>
        <p class="small ${hasMismatch ? '' : 'muted'}" style="margin:10px 0 0">
          ${hasMismatch ? '⚠ The claimed amount does not match the calculated total.' : 'The calculated total is the sum of the line totals below (BigDecimal, 2 decimals).'}
        </p>
      </section>
    </div>

    <section class="card" style="margin-top:18px" aria-labelledby="li-h">
      <h2 id="li-h">Bill line items</h2>
      ${claim.lineItems.length === 0
        ? '<div class="state" style="padding:16px"><p>No line items were provided.</p></div>'
        : `<div class="table-wrap"><table>
          <thead><tr><th>Description</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Line total</th></tr></thead>
          <tbody>${claim.lineItems.map((i) => `<tr><td>${esc(i.description)}</td><td class="num mono">${i.quantity}</td>
            <td class="num mono">${esc(formatMoney(i.unitPrice))}</td><td class="num mono">${esc(formatMoney(i.lineTotal))}</td></tr>`).join('')}</tbody>
          <tfoot><tr><td colspan="3">Calculated total</td><td class="num mono">${esc(formatMoney(claim.calculatedTotal))}</td></tr></tfoot>
        </table></div>`}
    </section>

    <div class="grid-2">
      <section class="card" aria-labelledby="find-h" style="margin-bottom:0">
        <h2 id="find-h">Validation findings</h2>
        ${claim.flags.length === 0
          ? '<div class="finding finding-none"><span class="icon" aria-hidden="true">✓</span><div><h3>No findings</h3><p>None of the fictional validation rules were triggered.</p></div></div>'
          : claim.flags.map((f) => {
            const info = FINDINGS[f.code] || { title: f.code, text: f.message };
            return `<div class="finding"><span class="icon" aria-hidden="true">⚠</span><div>
              <h3>${esc(info.title)} <code>${esc(f.code)}</code></h3><p>${esc(info.text)}</p></div></div>`;
          }).join('')}
        <p class="muted small" style="margin:8px 0 0">Findings are recalculated by the backend every time a claim is submitted. The 30-day deadline is fictional.</p>
      </section>

      <section class="card" aria-labelledby="act-h" style="margin-bottom:0">
        <h2 id="act-h">Review controls</h2>
        <div class="actions" id="actions"></div>
        <p class="muted small" id="actions-hint" style="margin:10px 0 0"></p>
      </section>
    </div>

    <section class="card" style="margin-top:18px" aria-labelledby="hist-h">
      <h2 id="hist-h">Status history</h2>
      <ol class="timeline">
        ${history.map((h) => `<li>
          <div><strong>${h.fromStatus ? `${esc(STATUS_LABELS[h.fromStatus])} → ` : ''}${esc(STATUS_LABELS[h.toStatus])}</strong></div>
          <div class="when">${esc(formatDateTime(h.changedAt))}</div>
          ${h.note ? `<div class="note">${esc(h.note)}</div>` : ''}</li>`).join('')}
      </ol>
    </section>`;

  drawActions(root, claim);
}

// Only the actions that are valid for the current status are shown.
function drawActions(root, claim) {
  const host = root.querySelector('#actions');
  const hint = root.querySelector('#actions-hint');
  const reload = () => renderDetail(root, claim.id);

  const defs = {
    SUBMITTED: [
      { label: 'Start review', cls: 'btn-primary', target: 'UNDER_REVIEW',
        confirm: { title: 'Start review?', message: `Move claim #${claim.id} to “Under review”.`, confirmLabel: 'Start review', noteLabel: 'Note' } },
      { label: 'Request information', cls: 'btn-warn', target: 'NEEDS_INFORMATION', confirm: requestInfo(claim) },
    ],
    UNDER_REVIEW: [
      { label: 'Request information', cls: 'btn-warn', target: 'NEEDS_INFORMATION', confirm: requestInfo(claim) },
      { label: 'Complete review', cls: 'btn-ok', target: 'REVIEWED',
        confirm: { title: 'Complete review?', message: 'This finishes the internal review and cannot be undone. It does not mean an insurer approved or will pay the claim.', confirmLabel: 'Complete review', noteLabel: 'Note' } },
    ],
  };

  if (claim.status === 'NEEDS_INFORMATION') {
    host.innerHTML = `<a class="btn btn-primary" href="#/claims/${claim.id}/edit">Correct and resubmit</a>`;
    hint.textContent = 'The reviewer asked for more information. Edit the claim and resubmit it to return it to “Submitted”.';
    return;
  }
  if (claim.status === 'REVIEWED') {
    host.innerHTML = '<span class="muted">No further actions.</span>';
    hint.textContent = 'This claim has been reviewed. REVIEWED is a final internal status, not an insurance approval.';
    return;
  }

  const actions = defs[claim.status];
  host.innerHTML = actions.map((a, i) => `<button type="button" class="btn ${a.cls}" data-i="${i}">${a.label}</button>`).join('');
  hint.textContent = 'Every status change sends the claim’s current version so concurrent edits are never overwritten.';

  host.querySelectorAll('button').forEach((button) => button.addEventListener('click', async () => {
    const action = actions[Number(button.dataset.i)];
    const answer = await confirmAction(action.confirm);
    if (!answer) return;
    setBusy(button, true, 'Saving…');
    host.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    try {
      await api.changeStatus(claim.id, { status: action.target, note: answer.note || null, version: claim.version });
      toast(`Claim #${claim.id} is now “${STATUS_LABELS[action.target]}”.`, 'success');
    } catch (e) {
      if (e.status === 409) {
        toast(`${e.message} The claim was reloaded, so you are now looking at its latest state.`, 'error');
      } else {
        toast(e.message, 'error');
      }
    }
    reload(); // always show the current server state
  }));
}

function requestInfo(claim) {
  return {
    title: 'Request more information?',
    message: `Claim #${claim.id} will move to “Needs information”. Tell the submitter what to fix.`,
    confirmLabel: 'Request information',
    noteLabel: 'Reviewer note',
    noteRequired: true,
  };
}
