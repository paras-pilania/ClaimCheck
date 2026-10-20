// Dashboard view: statistics, status filter, claim table.
import { api } from './api.js';
import { esc, formatDate, formatMoney, statusBadge, flagsHtml, STATUS_LABELS, setBusy } from './util.js';

let selectedStatus = 'ALL';

export async function renderDashboard(root) {
  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1>Claims dashboard</h1>
        <p class="muted">All figures come from the ClaimCheck backend and MySQL database.</p>
      </div>
      <div class="toolbar">
        <button type="button" class="btn btn-ghost" id="refresh-btn">↻ Refresh</button>
        <a class="btn btn-primary" href="#/new">+ New claim</a>
      </div>
    </div>
    <section aria-label="Claim statistics" class="stats" id="stats"></section>
    <section class="card" aria-labelledby="claims-heading">
      <div class="page-head" style="margin-bottom:12px">
        <h2 id="claims-heading" style="margin:0">Claims</h2>
        <div class="toolbar">
          <label for="status-filter" class="small muted">Filter by status</label>
          <select id="status-filter" style="width:auto"></select>
        </div>
      </div>
      <div id="claims-area" aria-live="polite"></div>
    </section>`;

  const filter = root.querySelector('#status-filter');
  filter.innerHTML = ['ALL', ...Object.keys(STATUS_LABELS)].map((s) =>
    `<option value="${s}">${s === 'ALL' ? 'All statuses' : STATUS_LABELS[s]}</option>`).join('');
  filter.value = selectedStatus;

  let claims = [];
  const refreshButton = root.querySelector('#refresh-btn');

  async function load() {
    setBusy(refreshButton, true, 'Refreshing…');
    root.querySelector('#claims-area').innerHTML = '<div class="state"><div class="loader"></div><p>Loading claims…</p></div>';
    try {
      claims = await api.listClaims();
      drawStats();
      drawTable();
    } catch (e) {
      root.querySelector('#stats').innerHTML = '';
      root.querySelector('#claims-area').innerHTML = `
        <div class="state"><h3>Could not load claims</h3><p>${esc(e.message)}</p>
        <button type="button" class="btn btn-secondary" id="retry-btn">Try again</button></div>`;
      root.querySelector('#retry-btn').addEventListener('click', load);
    } finally {
      setBusy(refreshButton, false);
    }
  }

  function count(status) { return claims.filter((c) => c.status === status).length; }

  function drawStats() {
    root.querySelector('#stats').innerHTML = `
      <div class="stat"><div class="stat-label">Total claims</div><div class="stat-value">${claims.length}</div><div class="stat-hint">Stored in MySQL</div></div>
      <div class="stat attention"><div class="stat-label">Needs attention</div><div class="stat-value">${count('NEEDS_INFORMATION')}</div><div class="stat-hint">Waiting for corrections</div></div>
      <div class="stat review"><div class="stat-label">Under review</div><div class="stat-value">${count('UNDER_REVIEW')}</div><div class="stat-hint">Being reviewed now</div></div>
      <div class="stat done"><div class="stat-label">Reviewed</div><div class="stat-value">${count('REVIEWED')}</div><div class="stat-hint">Internal review finished</div></div>`;
  }

  function drawTable() {
    const area = root.querySelector('#claims-area');
    const rows = selectedStatus === 'ALL' ? claims : claims.filter((c) => c.status === selectedStatus);
    if (claims.length === 0) {
      area.innerHTML = `<div class="state"><h3>No claims yet</h3>
        <p>Submit a synthetic claim, or paste bill text and let AI suggest the fields.</p>
        <a class="btn btn-primary" href="#/new">Submit the first claim</a></div>`;
      return;
    }
    if (rows.length === 0) {
      area.innerHTML = `<div class="state"><h3>No claims with status “${esc(STATUS_LABELS[selectedStatus])}”</h3>
        <p>Choose another status to see more claims.</p></div>`;
      return;
    }
    area.innerHTML = `<div class="table-wrap"><table class="responsive">
      <thead><tr><th>ID</th><th>Patient</th><th>Provider</th><th class="num">Claimed</th><th>Findings</th><th>Status</th></tr></thead>
      <tbody>${rows.map((c) => `
        <tr class="clickable" data-id="${c.id}">
          <td data-label="ID"><a href="#/claims/${c.id}"><strong>#${c.id}</strong></a>
            <div class="cell-sub">${esc(c.invoiceNumber || 'No invoice no.')}</div></td>
          <td data-label="Patient">${esc(c.patientName)}<div class="cell-sub">Service ${esc(formatDate(c.serviceDate))}</div></td>
          <td data-label="Provider">${esc(c.providerName)}</td>
          <td data-label="Claimed" class="num mono">${esc(formatMoney(c.claimedAmount))}</td>
          <td data-label="Findings">${flagsHtml(c.flags)}</td>
          <td data-label="Status">${statusBadge(c.status)}</td>
        </tr>`).join('')}</tbody></table></div>`;
    area.querySelectorAll('tr.clickable').forEach((row) =>
      row.addEventListener('click', (event) => {
        if (!event.target.closest('a')) location.hash = `#/claims/${row.dataset.id}`;
      }));
  }

  filter.addEventListener('change', () => { selectedStatus = filter.value; if (claims.length) drawTable(); });
  refreshButton.addEventListener('click', load);
  await load();
}
