// Entry point: hash router that connects the views together.
import { api } from './api.js';
import { renderDashboard } from './dashboard.js';
import { renderClaimForm } from './claimForm.js';
import { renderDetail } from './detail.js';
import { initAiModal } from './aiModal.js';
import { esc, toast } from './util.js';

const root = document.getElementById('app');
let pendingPrefill = null; // AI suggestions waiting to be shown in the form

const openAi = initAiModal((preview) => {
  pendingPrefill = preview;
  toast('AI suggestions loaded. Review and edit them before submitting.', 'success');
  if (location.hash === '#/new') route(); else location.hash = '#/new';
});
document.getElementById('open-ai-btn').addEventListener('click', openAi);

function setNav(name) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

async function route() {
  const hash = location.hash || '#/';
  let match;
  window.scrollTo(0, 0);

  if (hash === '#/new') {
    setNav('new');
    const prefill = pendingPrefill;
    pendingPrefill = null;
    renderClaimForm(root, {
      mode: 'create',
      prefill,
      onSaved: (claim) => { location.hash = `#/claims/${claim.id}`; },
      onCancel: () => { location.hash = '#/'; },
    });
  } else if ((match = /^#\/claims\/(\d+)\/edit$/.exec(hash))) {
    setNav(null);
    await showEdit(Number(match[1]));
  } else if ((match = /^#\/claims\/(\d+)$/.exec(hash))) {
    setNav(null);
    await renderDetail(root, Number(match[1]));
  } else {
    setNav('dashboard');
    await renderDashboard(root);
  }
}

async function showEdit(id) {
  root.innerHTML = '<div class="state"><div class="loader"></div><p>Loading claim…</p></div>';
  try {
    const [claim, history] = await Promise.all([api.getClaim(id), api.getHistory(id)]);
    if (claim.status !== 'NEEDS_INFORMATION') {
      toast('Only claims that need information can be corrected and resubmitted.', 'error');
      location.hash = `#/claims/${id}`;
      return;
    }
    const lastRequest = [...history].reverse().find((h) => h.toStatus === 'NEEDS_INFORMATION');
    renderClaimForm(root, {
      mode: 'edit',
      claim,
      reviewerNote: lastRequest ? lastRequest.note : null,
      onSaved: () => { location.hash = `#/claims/${id}`; },
      onCancel: () => { location.hash = `#/claims/${id}`; },
    });
  } catch (e) {
    root.innerHTML = `<a class="back-link" href="#/">← Back to dashboard</a>
      <div class="state card"><h3>Could not load claim</h3><p>${esc(e.message)}</p></div>`;
  }
}

window.addEventListener('hashchange', route);
route();
