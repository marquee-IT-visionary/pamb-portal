(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEY = 'pamb.projects.v1', AUTH = 'pamb.user';
  const app = $('#app');

  const RKEY = 'pamb.risks.v1';
  const USERS = ['John Doe', 'Jane Smith', 'C James', 'Alex Chen', 'Priya Patel', 'Sam Wilson'];
  const RISK_TYPES = ['Road', 'Bridge'], PRIORITIES = ['High', 'Medium', 'Low'];
  const seedRisks = () => [
    { id: 'RISK-1', title: 'Structural fatigue', type: 'Bridge', priority: 'High', owner: 'John Doe', actionOwner: 'Alex Chen', assetId: 'BIS-9561' },
    { id: 'RISK-2', title: 'Scour at piers', type: 'Bridge', priority: 'Medium', owner: 'Jane Smith', actionOwner: 'Priya Patel', assetId: 'BIS-1234' },
    { id: 'RISK-3', title: 'Pavement deterioration', type: 'Road', priority: 'High', owner: 'John Doe', actionOwner: 'Sam Wilson', assetId: 'RAMS-4410' },
    { id: 'RISK-4', title: 'Drainage failure', type: 'Road', priority: 'Low', owner: 'Jane Smith', actionOwner: 'Alex Chen', assetId: '' },
    { id: 'RISK-5', title: 'Heavy vehicle overload', type: 'Road', priority: 'Medium', owner: 'John Doe', actionOwner: 'Priya Patel', assetId: '' },
  ];
  let RISKS;
  try { RISKS = JSON.parse(localStorage.getItem(RKEY)) || seedRisks(); } catch { RISKS = seedRisks(); }
  const saveRisks = () => localStorage.setItem(RKEY, JSON.stringify(RISKS));
  const nextRiskId = () => 'RISK-' + (Math.max(0, ...RISKS.map((r) => parseInt(String(r.id).replace(/\D/g, ''), 10) || 0)) + 1);
  const riskTitle = (id) => (RISKS.find((r) => r.id === id) || {}).title || '';
  const riskSel = (attr, cur, dis) => `<select ${attr} ${dis ? 'disabled' : ''}><option value="">None</option>${RISKS.map((r) => `<option value="${esc(r.id)}" ${r.id === cur ? 'selected' : ''}>${esc(r.id)} – ${esc(r.title)}</option>`).join('')}${cur && !riskTitle(cur) ? `<option selected>${esc(cur)}</option>` : ''}</select>`;
  const userSel = (attr, cur) => `<select ${attr}><option value="">Select user</option>${USERS.map((u) => `<option ${u === cur ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>`;
  const seed = () => [
    mk('PROJ-1234', 'Parramatta Rd Maint', { gated: true, preGate: 'PRE-23', assetType: 'Road', assetId: 'RAMS-4410', riskId: 'RISK-3', agenda: 'JIRA-12345', p50: '12/12/2025', p90: '25/2/2026', slip: 'Yes', gate: 'Gate 2', pm: 'John Doe', score: 7, lat: -33.8150, lng: 151.0011 }),
    mk('PROJ-5678', 'Parramatta Bridge Maintenance', { gated: true, preGate: 'PRE-24', assetType: 'Bridge', assetId: 'BIS-9561', riskId: 'RISK-1', agenda: 'JIRA-12345', p50: '1/3/2026', p90: '30/6/2026', slip: 'No', gate: 'Gate 1', pm: 'Jane Smith', score: 8, lat: -33.8136, lng: 151.0034 }),
  ];
  function seedExtra() {
    return [
      mk('Pre-Gate-1', 'Hawkesbury River Bridge Deck Repair', { preGate: 'Pre-Gate-1', assetType: 'Bridge', assetId: 'BIS-1234', riskId: 'RISK-2', lat: -33.5446, lng: 151.1359 }),
      mk('Pre-Gate-2', 'Pacific Highway Newcastle Resurfacing', { preGate: 'Pre-Gate-2', assetType: 'Road', assetId: 'RAMS-1234', riskId: 'RISK-4', lat: -32.9283, lng: 151.7817 }),
      mk('Pre-Gate-3', 'Epping Road Pavement Maintenance', { preGate: 'Pre-Gate-3', assetType: 'Road', assetId: 'RAMS-2210', riskId: 'RISK-5', lat: -33.7769, lng: 151.1180 }),
      mk('PROJ-111', 'Parramatta Bridge Bearing Replacement', { gated: true, preGate: 'PRE-111', assetType: 'Bridge', assetId: 'BIS-9561', riskId: 'RISK-1', p50: '1/7/2026', p90: '30/11/2026', slip: 'No', gate: 'Gate 2', pm: 'Jane Smith', score: 9, lat: -33.8136, lng: 151.0034 }),
      mk('PROJ-112', 'Parramatta Road Pavement Rehabilitation', { gated: true, preGate: 'PRE-112', assetType: 'Road', assetId: 'RAMS-4410', riskId: 'RISK-3', p50: '1/8/2026', p90: '15/12/2026', slip: 'Yes', gate: 'Gate 1', pm: 'John Doe', score: 6, lat: -33.8150, lng: 151.0011 }),
      mk('PROJ-113', 'Hawkesbury Bridge Scour Protection', { gated: true, preGate: 'PRE-113', assetType: 'Bridge', assetId: 'BIS-1234', riskId: 'RISK-2', p50: '1/9/2026', p90: '28/2/2027', slip: 'No', gate: 'Gate 2', pm: 'Jane Smith', score: 8, lat: -33.5446, lng: 151.1359 }),
    ];
  }
  const SEED_LINKS = {
    'BIS-9561': { inflight: ['PROJ-5678', 'PROJ-111'], future: [] },
    'RAMS-4410': { inflight: ['PROJ-1234', 'PROJ-112'], future: [] },
    'BIS-1234': { inflight: ['PROJ-113'], future: ['Pre-Gate-1'] },
    'RAMS-1234': { inflight: [], future: ['Pre-Gate-2'] },
    'RAMS-2210': { inflight: [], future: ['Pre-Gate-3'] },
  };
  function mk(id, name, o) {
    return {
      id, name, preGate: o.preGate || '', gated: !!o.gated, prereq: !!o.gated, gatedId: o.gated ? id : '', preChk: true, gatedChk: true, assetType: o.assetType || '', assetId: o.assetId || '', riskId: o.riskId || '',
      agenda: o.agenda || '', lat: o.lat ?? -33.8688, lng: o.lng ?? 151.2093, p50: o.p50 || '', p90: o.p90 || '', slip: o.slip || 'No', gate: o.gate || 'Pre-Gate 0',
      pm: o.pm || '', score: o.score ?? '', created: '2025-12-01', active: 'Yes', council: 'No', focus: 'Maintenance', wbs: 'WBS-001',
      benefits: { identification: ['Address lack of maintenance for the last few years', 'Address concerns raised by the public'], analysis: ['Address lack of maintenance for the last few years', 'Address concerns raised by the public'], delivery: ['Address lack of maintenance for the last few years', 'Address concerns raised by the public'], transition: [], sustainment: [] },
      risk: { title: riskTitle(o.riskId), rid: o.riskId || '', asset: o.assetId || '', cat: 'Safety', owner: o.pm || '', created: '01/12/2025', due: '30/06/2026', status: 'Open', action: '', comment: '' },
      fin: { code: 'PC-100', wo: 'WO-2001', wbs: 'WBS-001', po: 'PO-7788', total: 750000, fy: 'FY26', spent: 550000 },
      docs: [{ name: 'Project_estimate.pdf', date: '15/12/2025' }, { name: 'Design v11.pdf', date: '15/12/2025' }],
      schedule: [
        ['M', 'Ideation', '', '1/3/2026', '31/3/2026', 24], ['S', 'Concept Paper', '', '1/3/2026', '14/3/2026', 9], ['S', 'PSAD', '', '15/3/2026', '31/3/2026', 15],
        ['M', 'Design', '', '1/4/2026', '30/4/2026', 20], ['M', 'Development & Build', '', '1/5/2026', '30/6/2026', 40], ['S', 'Development', '', '1/5/2026', '15/6/2026', 35],
      ].map(([t, a, b, s, e, d]) => ({ type: t, title: a, sub: b, start: s, end: e, days: d, status: 'NEW' })),
    };
  }
  const AKEY = 'pamb.assets.v1';
  const seedAssets = () => [
    { id: 'BIS-9561', title: 'Parramatta Bridge', type: 'Bridge', riskId: 'RISK-1', loc: 'Parramatta', lat: -33.8136, lng: 151.0034, suburb: 'Parramatta', state: 'NSW', postcode: '2150', intersection: 'Church St & Macquarie St', grants: [{ name: 'Parramatta Bridge Renewal', id: 'GR-1001', status: 'Approved' }] },
    { id: 'RAMS-4410', title: 'Parramatta Road', type: 'Road', riskId: 'RISK-3', loc: 'Parramatta', lat: -33.8150, lng: 151.0011, suburb: 'Granville', state: 'NSW', postcode: '2142', intersection: 'Parramatta Rd & Good St', grants: [] },
    { id: 'BIS-1234', title: 'Hawkesbury River Bridge', type: 'Bridge', riskId: 'RISK-2', loc: 'Hawkesbury', lat: -33.5446, lng: 151.1359, suburb: 'Brooklyn', state: 'NSW', postcode: '2083', intersection: 'Pacific Hwy & Brooklyn Rd', grants: [{ name: 'Hawkesbury Bridge Strengthening', id: 'GR-1003', status: 'Submitted' }] },
    { id: 'RAMS-1234', title: 'Pacific Highway Newcastle', type: 'Road', riskId: 'RISK-4', loc: 'Newcastle', lat: -32.9283, lng: 151.7817, suburb: 'Newcastle', state: 'NSW', postcode: '2300', intersection: 'Pacific Hwy & Hunter St', grants: [{ name: 'Newcastle Road Resheeting', id: 'GR-1002', status: 'Submitted' }] },
    { id: 'RAMS-2210', title: 'Epping Road Macquarie Park', type: 'Road', riskId: 'RISK-5', loc: 'Mac Park', lat: -33.7769, lng: 151.1180, suburb: 'Macquarie Park', state: 'NSW', postcode: '2113', intersection: 'Epping Rd & Herring Rd', grants: [] },
  ];
  let assets;
  try { assets = JSON.parse(localStorage.getItem(AKEY)) || seedAssets(); } catch { assets = seedAssets(); }
  const saveAssets = () => localStorage.setItem(AKEY, JSON.stringify(assets));
  const findAsset = (id) => assets.find((a) => a.id.toLowerCase() === String(id || '').trim().toLowerCase());
  const ASSET_TYPES = ['Road', 'Bridge', 'Rail', 'Maritime'];
  const typePlural = (t) => ({ Road: 'Roads', Bridge: 'Bridges' }[t] || t);
  function syncProjectAsset(p) {
    assets.forEach((a) => { if (a.id !== p.assetId) { a.inflight = a.inflight.filter((i) => i !== p.id); a.future = a.future.filter((i) => i !== p.id); } });
    const a = findAsset(p.assetId);
    if (a && !a.inflight.includes(p.id) && !a.future.includes(p.id)) a.inflight.push(p.id);
    saveAssets();
  }
  function assetPicker(p) {
    const cur = findAsset(p.assetId);
    return `<div class="f"><label>Asset (search by ID or title, e.g. BIS-1234, RAMS-1234)</label><input data-k="assetId" list="assetlist" autocomplete="off" placeholder="Search assets…" value="${esc(p.assetId)}"><datalist id="assetlist">${assets.map((a) => `<option value="${esc(a.id)}">${esc(a.title)}</option>`).join('')}</datalist>${cur ? `<div class="muted" style="margin-top:4px">${esc(cur.title)} · <a href="#/asset/${esc(cur.id)}">View asset</a></div>` : ''}</div>`;
  }
  let projects;
  try { projects = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { projects = seed(); }
  // Upgrade assets stored by earlier versions: add seed assets and the new fields.
  seedAssets().forEach((s) => { if (!findAsset(s.id)) assets.push(s); });
  assets.forEach((a) => {
    const s = seedAssets().find((x) => x.id === a.id) || {};
    if (a.loc === undefined) a.loc = s.loc || a.suburb || '';
    if (!a.grants) a.grants = s.grants || [];
    if (!a.inflight) a.inflight = projects.filter((x) => x.assetId === a.id).map((x) => x.id);
    if (!a.future) a.future = [];
    if (a.riskId === undefined) a.riskId = s.riskId || '';
  });
  projects.forEach((p) => { if (p.gated === undefined) { p.gated = p.id !== p.preGate; p.prereq = p.gated; p.gatedId = p.gated ? p.id : ''; } });
  // One-off: add the new sample projects and link them to assets (flag stops them reappearing after being renamed).
  if (!localStorage.getItem('pamb.seed.v2')) {
    seedExtra().forEach((s) => { if (!projects.some((x) => x.id === s.id)) projects.push(s); });
    Object.entries(SEED_LINKS).forEach(([aid, l]) => {
      const a = findAsset(aid); if (!a) return;
      ['inflight', 'future'].forEach((k) => l[k].forEach((pid) => { if (projects.some((x) => x.id === pid) && !a[k].includes(pid)) a[k].push(pid); }));
    });
    localStorage.setItem('pamb.seed.v2', '1');
    localStorage.setItem(KEY, JSON.stringify(projects)); localStorage.setItem(AKEY, JSON.stringify(assets));
  }
  const save = () => localStorage.setItem(KEY, JSON.stringify(projects));
  const user = () => localStorage.getItem(AUTH);

  function toast(msg, kind = 'ok') {
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = msg; $('#toasts').append(t); setTimeout(() => t.remove(), 3500);
  }
  function modal(html, onMount) {
    const m = $('#modal'); m.innerHTML = `<div class="dlg" role="dialog" aria-modal="true">${html}</div>`; m.classList.add('on');
    m.onclick = (e) => { if (e.target === m) closeModal(); };
    $$('[data-close]', m).forEach((b) => (b.onclick = closeModal));
    onMount && onMount(m);
  }
  function closeModal() { const m = $('#modal'); m.classList.remove('on'); m.innerHTML = ''; }

  const userSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4.5"/><path d="M3 21c0-5 4-7 9-7s9 2 9 7z"/></svg>';
  const MENU = [
    ['Projects', [['List of Projects', '#/projects'], ['Create Project', '#/new']]],
    ['Assets', [['List of Assets', '#/assets']]],
    ['Grants', [['List of Grants', '#/list/grants']]],
    ['Risk', [['List of Risks', '#/risks']]],
    ['Grants Prioritization', [['Prioritization Scores', '#/list/gprio']]],
    ['Freight Permits', [['List of Permits', '#/list/permits']]],
  ];
  const LISTS = {
    grants: ['List of Grants', ['Grant Name', 'Grant ID', 'Council', 'Amount', 'Status'], [['Parramatta Bridge Renewal', 'GR-1001', 'City of Parramatta', '$1,200,000', 'Approved'], ['Newcastle Road Resheeting', 'GR-1002', 'Newcastle', '$850,000', 'Submitted']]],
    documents: ['List of Documents', ['Document', 'Project ID', 'Type', 'Uploaded', 'Compliance'], [['Project_estimate.pdf', 'PROJ-1234', 'PDF', '15/12/2025', 'Compliant'], ['Design v11.pdf', 'PROJ-1234', 'PDF', '15/12/2025', 'Under review']]],
    gprio: ['Prioritization Scores', ['Grant ID', 'Grant Name', 'Score', 'Rank'], [['GR-1001', 'Parramatta Bridge Renewal', '8', '1'], ['GR-1002', 'Newcastle Road Resheeting', '6', '2']]],
    permits: ['List of Permits', ['Permit ID', 'Operator', 'Route', 'Valid To', 'Status'], [['FP-2001', 'Hunter Freight Pty Ltd', 'Pacific Hwy', '30/06/2026', 'Active'], ['FP-2002', 'Metro Haulage', 'M4 Motorway', '31/03/2026', 'Pending']]],
  };
  function renderNav() {
    const li = !!user();
    const menu = li ? MENU.map(([n, subs], i) => `<div class="mi"><button class="mb" aria-haspopup="true" aria-expanded="false">${n} ▾</button><div class="sm">${subs.map(([s, h]) => `<a href="${h}">${s}</a>`).join('')}</div></div>`).join('') : '';
    $('#nav').innerHTML = `<div class="menu">${menu}</div><div class="util"><a href="${li ? '#/tiles' : '#/'}">Home</a><a href="#/contact">Contact Us</a><a href="#/help">Help</a></div>`;
    $$('#nav .mb').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const o = b.parentElement.classList.contains('open'); $$('#nav .mi').forEach((x) => x.classList.remove('open')); if (!o) b.parentElement.classList.add('open'); b.setAttribute('aria-expanded', String(!o)); }));
  }
  document.addEventListener('click', () => $$('#nav .mi').forEach((x) => x.classList.remove('open')));
  function renderUser() {
    renderNav();
    $('#userbox').innerHTML = user() ? `<button class="user" id="logout" title="Click to sign out">C James ${userSvg}</button>` : '';
    const b = $('#logout'); if (b) b.onclick = () => { localStorage.removeItem(AUTH); location.hash = '#/'; };
  }

  const heroSvg = `<svg viewBox="0 0 600 380" preserveAspectRatio="xMidYMid slice"><circle cx="420" cy="170" r="46" fill="#ffd9a0" opacity=".9"/><path d="M-20 300 Q300 120 620 290" stroke="#fff" stroke-width="10" fill="none"/><path d="M-20 330 Q300 150 620 320" stroke="#e8e8f5" stroke-width="6" fill="none"/>${Array.from({ length: 14 }, (_, i) => { const x = 20 + i * 42; const y = 300 - 175 * Math.sin((x + 20) / 640 * Math.PI) * 0.97; return `<line x1="${x}" y1="${y + 14}" x2="${x}" y2="${y + 40}" stroke="#fff" stroke-width="2"/>`; }).join('')}<rect y="330" width="600" height="50" fill="#1b2a52"/></svg>`;

  const views = {
    home() {
      app.innerHTML = `<div class="home"><div><div class="hero"><img src="hero.png" alt="Asset management illustration"></div><a class="btn" href="#/login">Transport User Login</a></div><div>
      <div class="card"><h2>📰 Latest News</h2><ul><li>Transport has secured $1.2B funds to pave 36 km in Newcastle</li><li>Line marking supplier sued by ACCC</li><li>TACP program has moved to Phase 2</li><li>RAISI Phase 2 &amp; 3 now may extend to end of 2028</li></ul></div>
      <div class="card"><h2>📅 Announcements</h2><ul><li>Transport secretary bold claim: we are modernizing TFM</li><li>TFM unit just secured $1.2B funding to upskill</li></ul></div></div></div>`;
    },
    login() {
      localStorage.setItem(AUTH, 'C James');
      location.hash = '#/projects';
    },
    tiles() {
      app.innerHTML = `<div class="banner"><h1>Select the appropriate tile</h1><div class="tiles">${['Transport Assets|#/transport', 'Rail Assets|#/soon/Rail Assets', 'Maritime Assets|#/soon/Maritime Assets'].map((t) => { const [n, h] = t.split('|'); return `<a class="tile" href="${h}">${n}<span>➜</span></a>`; }).join('')}</div></div>`;
    },
    transport() {
      const t = MENU.map(([n, s]) => [n, s[0][1]]);
      app.innerHTML = `<div class="banner"><h1>Transport Assets</h1><div class="tiles">${t.map(([n, h]) => `<a class="tile" href="${h}">${n}<span>➜</span></a>`).join('')}</div></div>`;
    },
    soon(name) { app.innerHTML = `<h1>${esc(decodeURIComponent(name))}</h1><p class="muted">This module is not part of the current design.</p><a class="btn" href="#/tiles">Back</a>`; },
    list(k) {
      const d = LISTS[k]; if (!d) return views.soon(k);
      app.innerHTML = `<h1>${d[0]}</h1><div class="scroll"><table class="tbl"><thead><tr>${d[1].map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${d[2].map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="muted">Showing ${d[2].length} of ${d[2].length} results</p>`;
    },
    contact() { app.innerHTML = '<h1>Contact Us</h1><p>Email: pamb-support@transport.nsw.gov.au (demo)</p>'; },
    help() { app.innerHTML = '<h1>Help</h1><p>Use the tiles to open Transport Assets → Projects. Open a project to view its Project, Asset, Benefits, Risk, Financial, Schedule and Audit tabs.</p>'; },
    map() {
      app.innerHTML = '<h1>Regional Map</h1><div id="rm" class="map" style="height:520px"></div>';
      const m = L.map('rm').setView([-33.2, 147.0], 6); tiles(m);
      projects.forEach((p) => L.marker([p.lat, p.lng]).addTo(m).bindPopup(`<b>${esc(p.name)}</b><br>${esc(p.id)}`));
    },
    projects() {
      const adv = sessionStorage.getItem('adv') === '1', q = (sessionStorage.getItem('q') || '').toLowerCase();
      const f = JSON.parse(sessionStorage.getItem('f') || '{}');
      const map = { pid: 'id', aid: 'assetId', rid: 'riskId', gate: 'gate', active: 'active', created: 'created', council: 'council', focus: 'focus', score: 'score', fin: 'p90', pm: 'pm', wbs: 'wbs' };
      let rows = projects.filter((p) => !q || (p.name + p.id + p.assetType + p.pm).toLowerCase().includes(q));
      Object.entries(f).forEach(([k, v]) => { if (v) rows = rows.filter((p) => String(p[map[k]] ?? '').toLowerCase().includes(v.toLowerCase())); });
      const size = +(sessionStorage.getItem('ps') || 10), pg = +(sessionStorage.getItem('pg') || 1), pages = Math.max(1, Math.ceil(rows.length / size));
      const shown = rows.slice((pg - 1) * size, pg * size);
      app.innerHTML = `<h1>List of Projects</h1><div class="row sp"><div class="row search"><input id="q" placeholder="Search projects" value="${esc(sessionStorage.getItem('q') || '')}"><button class="btn" id="sq">Search</button><button class="btn alt" id="adv">Advanced Search ${adv ? '▲' : '▼'}</button></div><div class="row"><a class="btn green" href="#/new">＋ Create Project</a><button class="btn alt" id="pdf">Export PDF</button></div></div>
      ${adv ? advPanel(f) : ''}
      <div class="scroll" style="margin-top:16px"><table class="tbl"><thead><tr>${['Project Name', 'Project ID', 'Asset Type', 'P50 Date', 'P90 Date', 'Slippage', 'Gate Status', 'PM', 'Prioritization Score', 'Action'].map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>
      ${shown.map((p) => `<tr><td><a href="#/project/${p.id}/project">${esc(p.name)}</a></td><td><a href="#/project/${p.id}/project">${esc(p.id)}</a></td><td>${esc(p.assetType)}</td><td>${esc(p.p50)}</td><td>${esc(p.p90)}</td><td>${esc(p.slip)}</td><td>${esc(p.gate)}</td><td>${esc(p.pm)}</td><td>${esc(p.score)}</td><td><a href="#/project/${esc(p.id)}/project">View</a> | <a href="#/project/${esc(p.id)}/project">Edit</a></td></tr>`).join('') || '<tr><td colspan="10">No data found</td></tr>'}
      </tbody></table></div>
      <div class="pager"><label>Page size <select id="ps">${[5, 10, 25].map((n) => `<option ${n === size ? 'selected' : ''}>${n}</option>`).join('')}</select></label><span>Showing ${shown.length} of ${rows.length} results</span><span class="row"><button class="btn sm alt" id="pv" ${pg <= 1 ? 'disabled' : ''}>&lt;</button> ${pg} / ${pages} <button class="btn sm alt" id="nx" ${pg >= pages ? 'disabled' : ''}>&gt;</button></span></div>`;
      $('#sq').onclick = () => { sessionStorage.setItem('q', $('#q').value); sessionStorage.setItem('pg', 1); views.projects(); };
      $('#q').onkeydown = (e) => e.key === 'Enter' && $('#sq').click();
      $('#adv').onclick = () => { sessionStorage.setItem('adv', adv ? '0' : '1'); views.projects(); };
      $('#ps').onchange = (e) => { sessionStorage.setItem('ps', e.target.value); sessionStorage.setItem('pg', 1); views.projects(); };
      $('#pv').onclick = () => { sessionStorage.setItem('pg', pg - 1); views.projects(); };
      $('#nx').onclick = () => { sessionStorage.setItem('pg', pg + 1); views.projects(); };
      $('#pdf').onclick = () => window.print();
      if (adv) {
        $('#asCancel').onclick = () => { sessionStorage.removeItem('f'); sessionStorage.setItem('adv', '0'); views.projects(); };
        $('#asGo').onclick = () => { const o = {}; $$('[data-f]').forEach((i) => (o[i.dataset.f] = i.value)); sessionStorage.setItem('f', JSON.stringify(o)); sessionStorage.setItem('pg', 1); views.projects(); };
      }
    },
    new() { projectForm({ isNew: true }); },
    project(id, tab = 'project') {
      const p = projects.find((x) => x.id === id); if (!p) { app.innerHTML = '<h1>Project not found</h1><a class="btn" href="#/projects">Back</a>'; return; }
      projectForm({ p, tab });
    },
    agenda() { jiraPage(); },
    amd() { amdPage(); },
  };

  const advFields = [['pid', 'Project ID'], ['aid', 'Asset ID'], ['rid', 'Risk ID'], ['gate', 'Gate Status'], ['active', 'Active Project'], ['created', 'Created Date'], ['council', 'Council Grant'], ['focus', 'Project Focus'], ['score', 'Prioritization Score'], ['fin', 'Forecast Finish Date'], ['pm', 'Project Manager'], ['wbs', 'WBS Code']];
  function advPanel(f) {
    return `<div class="panel" style="margin-top:14px"><h2>Advanced Search</h2><div class="body"><div class="g4 f">${advFields.map(([k, l]) => `<div><label>${l}</label><input data-f="${k}" value="${esc(f[k] || '')}"></div>`).join('')}</div><div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn alt" id="asCancel">Cancel</button><button class="btn" id="asGo">Search</button></div></div></div>`;
  }

  function tiles(map) { L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map); }
  const tabs = ['project', 'asset', 'benefits', 'risk', 'financial', 'schedule', 'audit'];
  const tabName = { project: 'Project', asset: 'Asset', benefits: 'Benefits', risk: 'Risk', financial: 'Financial', schedule: 'Schedule', audit: 'Audit' };

  function projectForm({ p, tab = 'project', isNew }) {
    if (isNew) p = mk('', '', {});
    const hdr = isNew ? '<h1>Create New Project</h1>' : `<div class="row sp"><h1>${esc(p.name)} <small class="muted">${esc(p.id)}</small></h1><button class="btn red" id="close">Initiate Project Closure</button></div>`;
    const list = isNew ? tabs.filter((t) => t !== 'schedule') : tabs;
    const nav = `<div class="tbar">${list.map((t) => (isNew ? `<button class="${t === tab ? 'on' : ''}" data-t="${t}">${tabName[t]}</button>` : `<a class="${t === tab ? 'on' : ''}" href="#/project/${p.id}/${t}">${tabName[t]}</a>`)).join('')}</div>`;
    app.innerHTML = hdr + nav + '<div id="tab"></div>';
    const draftTab = (t) => { tabs_[t](p, isNew); };
    if (isNew) $$('[data-t]').forEach((b) => (b.onclick = () => { collect(p); $$('[data-t]').forEach((x) => x.classList.toggle('on', x === b)); draftTab(b.dataset.t); }));
    if (!isNew) $('#close').onclick = () => modal(`<h2>Initiate Project Closure</h2><p>Close <b>${esc(p.name)}</b>? This marks the project as closed.</p><div class="row"><button class="btn alt" data-close>Cancel</button><button class="btn red" id="ok">Confirm closure</button></div>`, () => ($('#ok').onclick = () => { p.gate = 'Closed'; p.active = 'No'; save(); closeModal(); toast('Project closure initiated.'); location.hash = '#/projects'; }));
    draftTab(tab);
  }

  const F = (k, label, v, extra = '') => `<div class="f"><label>${label}</label><input data-k="${k}" value="${esc(v)}" ${extra}></div>`;
  function collect(p) {
    $$('#tab [data-k]').forEach((el) => {
      const path = el.dataset.k.split('.'); let o = p; while (path.length > 1) o = o[path.shift()];
      const k = path[0]; const val = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value; o[k] = val;
    });
  }
  function saveBar(p, isNew, label = 'Save') {
    return `<div class="row" style="justify-content:flex-end;margin-top:16px"><a class="btn alt" href="#/projects">Cancel</a><button class="btn" id="save">${label}</button></div>`;
  }
  function bindSave(p, isNew, msg = 'Project saved successfully.') {
    const b = $('#save'); if (!b) return;
    b.onclick = () => {
      collect(p);
      if (p.assetId) {
        const a = findAsset(p.assetId);
        if (!a) { toast('Asset not found. Pick an existing asset ID.', 'err'); return; }
        p.assetId = a.id; p.assetType = a.type;
      }
      if ($('#tab [data-k="riskId"]')) p.risk.rid = p.riskId; else if ($('#tab [data-k="risk.rid"]')) p.riskId = p.risk.rid;
      if (riskTitle(p.riskId)) p.risk.title = riskTitle(p.riskId);
      if ($('#tab [data-k="prereq"]')) {
        if (p.prereq && !p.gated && !p.gatedId.trim()) { toast('Enter a Gated Project ID once all pre-requisites are complete.', 'err'); return; }
      }
      const oldId = p.id;
      const nid = p.gated ? p.id : (p.prereq && p.gatedId.trim()) ? p.gatedId.trim() : (p.preGate || '').trim();
      if (!p.name || !nid) { toast(isNew ? 'Project Name and Pre-Gate Project ID are required.' : 'Project Name is required.', 'err'); return; }
      if (projects.some((x) => x !== p && x.id === nid)) { toast('A project with that ID already exists.', 'err'); return; }
      if (!p.gated && p.prereq) { p.gated = true; p.gatedId = nid; if (/^pre-gate/i.test(p.gate)) p.gate = 'Gate 1'; }
      p.id = nid;
      if (isNew) {
        projects.push(p); syncProjectAsset(p); save(); toast('Project created.'); location.hash = `#/project/${p.id}/project`; return;
      }
      if (oldId !== nid) {
        assets.forEach((a) => ['inflight', 'future'].forEach((k) => { a[k] = a[k].map((x) => (x === oldId ? nid : x)); }));
        saveAssets(); syncProjectAsset(p); save(); toast('Project promoted to gated: ' + nid); location.hash = `#/project/${nid}/project`; return;
      }
      syncProjectAsset(p); save(); toast(msg);
    };
  }

  const tabs_ = {
    project(p, isNew) {
      $('#tab').innerHTML = `<div class="cols"><div class="panel"><div class="body">
      ${F('name', 'Project Name', p.name)}
      <div class="f"><label>Pre-Gate Project ID</label><input data-k="preGate" value="${esc(p.preGate)}"       ${isNew ? '' : 'readonly'}></div><br>
      <div class="f"><label class="inl"><input data-k="prereq" id="prereq" type="checkbox" ${p.prereq ? 'checked' : ''} ${p.gated ? 'disabled' : ''}> All pre-requisites complete</label></div><br>
      <div class="f" id="gatedRow" style="display:${p.prereq ? 'block' : 'none'}"><label>Gated Project ID</label><input data-k="gatedId" value="${esc(p.gatedId)}" ${p.gated ? 'readonly' : ''} placeholder="e.g. PROJ-114"></div>${p.prereq ? '<br>' : ''}
      <div class="f"><label>Asset Type</label><select data-k="assetType">${['', 'Road', 'Bridge', 'Rail', 'Maritime'].map((o) => `<option ${o === p.assetType ? 'selected' : ''}>${o}</option>`).join('')}</select></div><br>
      ${assetPicker(p)}<br><div class="f"><label>Risk ID</label>${riskSel('data-k="riskId"', p.riskId)}</div><br>
      <div class="f"><label>Ministerial Agenda</label><div class="inl"><input data-k="agenda" value="${esc(p.agenda)}"><button class="btn sm" id="play" title="Open agenda">▶</button></div></div>
      </div></div><div><div id="map" class="map"></div>
      ${isNew ? `<div class="row f" style="margin-top:10px"><div><label>Longitude</label><input id="lng" type="number" step="any" value="${p.lng}"></div><div><label>Latitude</label><input id="lat" type="number" step="any" value="${p.lat}"></div><button class="btn" id="plot" style="align-self:flex-end">Plot on Map</button></div>` : '<p class="muted">Live traffic map (OpenStreetMap).</p>'}</div></div>${saveBar(p, isNew)}`;
      const m = L.map('map').setView([p.lat, p.lng], 14); tiles(m); const mk_ = L.marker([p.lat, p.lng]).addTo(m);
      if (isNew) $('#plot').onclick = () => { const la = +$('#lat').value, lo = +$('#lng').value; if (isNaN(la) || isNaN(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) return toast('Invalid coordinates.', 'err'); p.lat = la; p.lng = lo; mk_.setLatLng([la, lo]); m.setView([la, lo], 14); };
      $('#play').onclick = () => (location.hash = '#/agenda');
      $('#prereq').onchange = (e) => { $('#gatedRow').style.display = e.target.checked ? 'block' : 'none'; };
      bindSave(p, isNew);
    },
    asset(p, isNew) {
      const a = findAsset(p.assetId);
      if (!a) { $('#tab').innerHTML = '<div class="panel"><div class="body">No asset linked. Select an existing asset on the Project tab.</div></div>'; return; }
      const pid = p.id || p.preGate;
      const pool = isNew ? [...projects, { ...p, id: pid }] : projects;
      const st = { edit: false, d: a, pool, inflight: new Set(a.inflight), future: new Set(a.future), risks: new Set(RISKS.filter((r) => r.assetId === a.id).map((r) => r.id)) };
      if (pid && !st.inflight.has(pid) && !st.future.has(pid)) st.inflight.add(pid);
      st.footer = `<div class="row" style="justify-content:flex-end;margin-top:16px"><a class="btn" href="#/asset/${esc(a.id)}">Open Asset to Edit</a></div>`;
      assetTabs($('#tab'), st);
    },
    benefits(p) {
      const st = [['identification', 'Identification'], ['analysis', 'Analysis & Planning'], ['delivery', 'Delivery'], ['transition', 'Transition'], ['sustainment', 'Sustainment']];
      $('#tab').innerHTML = `<div class="f" style="max-width:280px"><label>Prioritization Score</label><input data-k="score" type="number" value="${esc(p.score)}"></div><br>
      <div class="stage">${st.map(([k, l]) => `<div class="card"><h2>${l}</h2><ul>${p.benefits[k].map((b) => `<li>${esc(b)}</li>`).join('') || '<li class="muted" style="list-style:none">No benefits recorded</li>'}</ul><div style="padding:0 16px 12px" class="dots">${p.benefits[k].length ? '<i></i><i class="g"></i>' : '<i class="g"></i><i class="r"></i>'}</div></div>`).join('')}</div><br>
      <div class="stack"><button class="btn" id="survey">Create Customer Satisfaction Survey</button>
      <div class="row"><input id="em" placeholder="Email Customer Survey" style="width:300px"><button class="btn green" id="send">SEND</button></div>
      <button class="btn" id="resp">Open Customer Survey Response</button><button class="btn" id="brr">Open/Load Benefit Realization Report</button><button class="btn" id="cm">Populate Configuration Management</button></div>${saveBar(p)}`;
      $('#survey').onclick = () => { const link = `${location.origin}${location.pathname}#/survey/${p.id}`; modal(`<h2>Customer Satisfaction Survey</h2><p>Share this link with customers:</p><div class="row"><input id="lk" value="${esc(link)}" readonly><button class="btn" id="cp">Copy Link</button></div><br><button class="btn alt" data-close>Close</button>`, () => ($('#cp').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(link); toast('Link copied.'); })); };
      $('#send').onclick = () => { const v = $('#em').value.trim(); if (!/^\S+@\S+\.\S+$/.test(v)) return toast('Enter a valid email address.', 'err'); toast('Survey sent to ' + v); $('#em').value = ''; };
      $('#resp').onclick = () => modal('<h2>Survey Responses</h2><p>Satisfaction: 4.2 / 5 (12 responses)</p><button class="btn alt" data-close>Close</button>');
      $('#cm').onclick = () => toast('Configuration management populated.');
      $('#brr').onclick = () => uploadModal({ title: 'Open/Load Benefit Realization Report', accept: /\.(xlsx?|csv)$/i, hint: 'Excel or CSV only', done: (f) => previewModal('Benefit Realization Report', f, 'table') });
      bindSave(p, false, 'Benefits saved successfully.');
    },
    risk(p) {
      const r = p.risk;
      $('#tab').innerHTML = `<div class="panel"><h2>Risk Identification</h2><div class="body g4 f">${F('risk.title', 'Risk Title', r.title)}<div class="f"><label>Risk ID</label>${riskSel('data-k="risk.rid"', r.rid)}</div>${F('risk.asset', 'Asset ID', r.asset)}${F('risk.cat', 'Risk Category', r.cat)}</div></div>
      <div class="panel"><h2>Additional Details</h2><div class="body g4 f">${F('risk.owner', 'Risk Owner', r.owner)}${F('risk.created', 'Created', r.created)}${F('risk.due', 'Due date', r.due)}<div><label>Risk Status</label><select data-k="risk.status">${['Open', 'Mitigated', 'Closed'].map((o) => `<option ${o === r.status ? 'selected' : ''}>${o}</option>`).join('')}</select></div></div></div>
      <div class="g2 f"><div><label>Risk Action</label><textarea data-k="risk.action">${esc(r.action)}</textarea></div><div><label>Risk Commentary</label><textarea data-k="risk.comment">${esc(r.comment)}</textarea></div></div>${saveBar(p)}`;
      bindSave(p, false, 'Risk saved successfully.');
    },
    financial(p) {
      const f = p.fin, rem = f.total - f.spent;
      $('#tab').innerHTML = `<div class="panel"><h2>Cost Details</h2><div class="body"><div class="g4 f">${F('fin.code', 'Project Code', f.code)}<div><label>Work Order</label><select data-k="fin.wo">${['WO-2001', 'WO-2002', 'WO-2003'].map((o) => `<option ${o === f.wo ? 'selected' : ''}>${o}</option>`).join('')}</select></div>${F('fin.wbs', 'WBS Code', f.wbs)}${F('fin.po', 'Purchase Order', f.po)}</div><br><button class="btn" id="val">Validate</button></div></div>
      <div class="panel"><div class="body g4 f"><div><label>Total Funding</label><input data-k="fin.total" type="number" value="${f.total}"></div>${F('fin.fy', 'FY', f.fy)}<div><label>Current Spent</label><input data-k="fin.spent" type="number" value="${f.spent}"></div><div><label>Remaining Funding</label><input readonly value="$${rem.toLocaleString()}"></div></div>
      <div class="body row"><span class="tick">✔ Sync</span><button class="btn" id="ms">Open/Load Project Milestones</button></div></div>
      <div class="panel"><h2>Supporting Document Details</h2><div class="body"><p class="muted">Word, Excel or PDF only. Maximum file size 5MB.</p><div class="drop" id="dz">Drag &amp; drop files here, or click to browse<input id="fi" type="file" multiple hidden></div><ul class="files" id="fl"></ul></div></div>${saveBar(p)}`;
      const drawFiles = () => { $('#fl').innerHTML = p.docs.map((d, i) => `<li><span>📄 ${esc(d.name)} <span class="muted">${esc(d.date)}</span></span><button class="ic" data-del="${i}" title="Delete">🗑️</button></li>`).join('') || '<li class="muted">No documents</li>'; $$('[data-del]').forEach((b) => (b.onclick = () => { p.docs.splice(+b.dataset.del, 1); drawFiles(); })); };
      drawFiles();
      const addFiles = (files) => [...files].forEach((fl) => { if (!/\.(docx?|xlsx?|pdf)$/i.test(fl.name)) return toast(`${fl.name}: only Word, Excel or PDF allowed.`, 'err'); if (fl.size > 5 * 1024 * 1024) return toast(`${fl.name}: exceeds 5MB.`, 'err'); p.docs.push({ name: fl.name, date: new Date().toLocaleDateString('en-AU') }); drawFiles(); });
      wireDrop($('#dz'), $('#fi'), addFiles);
      $('#val').onclick = () => { collect(p); if (p.fin.wbs !== p.wbs) toast('Validation Failed. WBS Code does not match.', 'err'); else toast('Validation successful.'); };
      $('#ms').onclick = () => uploadModal({ title: 'Open/Load Project Milestones', accept: /\.(xlsx?|csv)$/i, hint: 'Excel or CSV only', done: (f) => previewModal('Milestone Status', f, 'gantt') });
      bindSave(p, false, 'Financial details saved successfully.');
    },
    schedule(p) {
      const blk = (pre, t) => `<div class="panel"><h2>${t}</h2><div class="body g4 f"><div><label>Title</label><input id="${pre}t"></div><div><label>Start</label><input id="${pre}s" type="date"></div><div><label>End</label><input id="${pre}e" type="date"></div><div><label>No. of Days</label><input id="${pre}d" readonly></div></div></div>`;
      $('#tab').innerHTML = `${blk('m', 'Main Task')}${blk('u', 'Sub Task')}<div class="row"><button class="btn" id="cm">Create Main Task</button><button class="btn" id="cs">Create Sub Task</button><button class="btn green" id="sv">Save Schedule</button></div><br>
      <div class="panel"><h2>Project Schedule</h2><div class="body scroll"><table class="tbl"><thead><tr><th>Task Title</th><th>Sub Task Title</th><th>Start</th><th>End</th><th>No. of Days</th><th>Status</th></tr></thead><tbody id="sb"></tbody></table></div></div>`;
      const draw = () => { $('#sb').innerHTML = p.schedule.map((t) => `<tr class="${t.type === 'M' ? 'main' : 'sub'}"><td>${t.type === 'M' ? esc(t.title) : ''}</td><td>${t.type === 'S' ? esc(t.title) : ''}</td><td>${esc(t.start)}</td><td>${esc(t.end)}</td><td>${t.days}</td><td>${esc(t.status)}</td></tr>`).join(''); };
      draw();
      const days = (pre) => { const s = $(`#${pre}s`).value, e = $(`#${pre}e`).value; $(`#${pre}d`).value = s && e ? Math.max(0, Math.round((new Date(e) - new Date(s)) / 864e5) + 1) : ''; };
      ['m', 'u'].forEach((pre) => { $(`#${pre}s`).onchange = $(`#${pre}e`).onchange = () => days(pre); });
      const fmt = (d) => { const x = new Date(d); return `${x.getDate()}/${x.getMonth() + 1}/${x.getFullYear()}`; };
      const add = (pre, type) => {
        const t = $(`#${pre}t`).value.trim(), s = $(`#${pre}s`).value, e = $(`#${pre}e`).value;
        if (!t || !s || !e) return toast('Title, start and end dates are required.', 'err');
        if (e < s) return toast('End date must not be before start date.', 'err');
        p.schedule.push({ type, title: t, sub: '', start: fmt(s), end: fmt(e), days: +$(`#${pre}d`).value, status: 'NEW' }); draw(); ['t', 's', 'e', 'd'].forEach((k) => ($(`#${pre}${k}`).value = ''));
      };
      $('#cm').onclick = () => add('m', 'M'); $('#cs').onclick = () => add('u', 'S');
      $('#sv').onclick = () => { save(); toast('Project schedule saved successfully.'); };
    },
    audit(p) { $('#tab').innerHTML = '<div class="panel"><h2>Audit</h2><div class="body muted">No audit entries yet.</div></div>'; },
  };

  function wireDrop(dz, input, handler) {
    dz.onclick = () => input.click(); input.onchange = () => { handler(input.files); input.value = ''; };
    dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = () => dz.classList.remove('over');
    dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove('over'); handler(e.dataTransfer.files); };
  }
  function uploadModal({ title, accept, hint, done }) {
    let files = [];
    modal(`<h2>${title}</h2><p class="muted">${hint}</p><div class="drop" id="dz">Drag &amp; drop files here, or click to browse<input id="fi" type="file" hidden></div><ul class="files" id="fl"></ul><div class="row"><button class="btn alt" data-close>Cancel</button><button class="btn" id="pf">Process File</button></div>`, () => {
      const draw = () => { $('#fl').innerHTML = files.map((f, i) => `<li><span>📄 ${esc(f.name)}</span><button class="ic" data-d="${i}">🗑️</button></li>`).join(''); $$('[data-d]').forEach((b) => (b.onclick = () => { files.splice(+b.dataset.d, 1); draw(); })); };
      wireDrop($('#dz'), $('#fi'), (fl) => { const f = fl[0]; if (!f) return; if (!accept.test(f.name)) return toast('Only Excel or CSV files are accepted.', 'err'); files = [f]; draw(); });
      $('#pf').onclick = () => { if (!files.length) return toast('Please upload a file first.', 'err'); const f = files[0]; closeModal(); done(f); };
    });
  }
  async function previewModal(title, file, kind) {
    let rows = [];
    if (/\.csv$/i.test(file.name)) rows = (await file.text()).split(/\r?\n/).filter(Boolean).map((r) => r.split(','));
    const note = rows.length ? '' : '<p class="muted">Excel preview is not available in the browser demo; showing sample data.</p>';
    if (!rows.length) rows = [['Milestone', 'Start', 'End', 'Progress %'], ['Ideation', '1/3/2026', '31/3/2026', '100'], ['Design', '1/4/2026', '30/4/2026', '60'], ['Development & Build', '1/5/2026', '30/6/2026', '20']];
    const body = kind === 'gantt'
      ? `<div class="gantt">${rows.slice(1).map((r) => `<div>${esc(r[0])}</div><div class="trk"><i style="left:0;width:${Math.min(100, Math.max(0, parseFloat(r[3]) || 0))}%"></i></div>`).join('')}</div>`
      : `<div class="scroll"><table class="tbl"><thead><tr>${rows[0].map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    modal(`<h2>${title}: ${esc(file.name)}</h2>${note}${body}<br><div class="row"><button class="btn alt" data-close>Close</button><button class="btn" id="dl">Download</button></div>`, () => {
      $('#dl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; a.click(); URL.revokeObjectURL(a.href); };
    });
  }

  function jiraPage() {
    app.innerHTML = `<p><a href="javascript:history.back()">← Back</a></p><h1>MSAA-1603: Parramatta Council Improvement Meeting</h1><div class="jira"><div>
    <div class="panel"><h2>Agenda</h2><div class="body"><table class="tbl"><thead><tr><th>Time</th><th>Item</th><th>Owner</th></tr></thead><tbody><tr><td>10:00</td><td>Welcome and apologies</td><td>Chair</td></tr><tr><td>10:10</td><td>Bridge maintenance program update</td><td>John Doe</td></tr><tr><td>10:40</td><td>Funding and grants</td><td>Jane Smith</td></tr><tr><td>11:10</td><td>Next steps</td><td>All</td></tr></tbody></table></div></div>
    <div class="panel"><h2>Meeting Minutes</h2><div class="body"><textarea>Minutes to be recorded…</textarea></div></div></div>
    <div class="panel"><h2>Details</h2><div class="body f"><p><b>Status:</b> In Progress</p><p><b>Assignee:</b> C James</p><p><b>Reporter:</b> John Doe</p><p><b>Priority:</b> High</p><p><b>Created:</b> 1 Dec 2025</p></div></div></div>`;
  }
  function amdPage() {
    const sub = sessionStorage.getItem('amd') || 'Location';
    app.innerHTML = `<p><a href="javascript:history.back()">← Back</a></p><h1>Asset Maintenance Data App</h1><div class="tbar">${['Location', 'Asset Details', 'Crash Data'].map((s) => `<button data-s="${s}" class="${s === sub ? 'on' : ''}">${s}</button>`).join('')}</div><div id="am"></div>`;
    $$('[data-s]').forEach((b) => (b.onclick = () => { sessionStorage.setItem('amd', b.dataset.s); amdPage(); }));
    if (sub === 'Location') {
      $('#am').innerHTML = `<div class="cols"><div class="panel"><h2>Directions</h2><div class="body f"><label>From</label><input value="Parramatta Station"><br><br><label>To</label><input value="Parramatta Bridge"><ol><li>Head east on Church St</li><li>Turn left onto Macarthur St</li><li>Arrive at Parramatta Bridge</li></ol></div></div><div id="amap" class="map"></div></div><button class="btn red" id="pm">Predict Maintenance</button>`;
      const m = L.map('amap').setView([-33.8136, 151.0034], 14); tiles(m); L.marker([-33.8136, 151.0034]).addTo(m);
      $('#pm').onclick = () => modal('<h2>Predicted Maintenance</h2><p>Recommended inspection within <b>6 months</b>; resurfacing within <b>18 months</b>. (Demo estimate)</p><button class="btn alt" data-close>Close</button>');
    } else if (sub === 'Asset Details') $('#am').innerHTML = '<div class="panel"><h2>Asset Details</h2><div class="body g2 f"><div><label>Asset</label><input readonly value="Parramatta Bridge"></div><div><label>Asset ID</label><input readonly value="BIS-9561"></div><div><label>Condition</label><input readonly value="Fair"></div><div><label>Last inspected</label><input readonly value="14/09/2025"></div></div></div>';
    else $('#am').innerHTML = '<div class="panel"><h2>Crash Data</h2><div class="body scroll"><table class="tbl"><thead><tr><th>Year</th><th>Crashes</th><th>Serious injuries</th></tr></thead><tbody><tr><td>2023</td><td>4</td><td>1</td></tr><tr><td>2024</td><td>3</td><td>0</td></tr><tr><td>2025</td><td>2</td><td>0</td></tr></tbody></table></div></div>';
  }
  views.survey = (id) => {
    app.innerHTML = `<div class="panel" style="max-width:560px;margin:20px auto"><h2>Customer Satisfaction Survey (${esc(id)})</h2><div class="body f"><label>Overall satisfaction</label><select><option>5 – Very satisfied</option><option>4</option><option>3</option><option>2</option><option>1 – Very dissatisfied</option></select><br><br><label>Comments</label><textarea></textarea><br><br><button class="btn" id="ok">Submit</button></div></div>`;
    $('#ok').onclick = () => { toast('Thank you for your feedback.'); location.hash = '#/'; };
  };

  views.assets = () => {
    const q = (sessionStorage.getItem('aq') || '').toLowerCase();
    const adv = sessionStorage.getItem('aadv') === '1', f = JSON.parse(sessionStorage.getItem('af') || '{}');
    const val = { id: (a) => a.id, type: (a) => typePlural(a.type), title: (a) => a.title, loc: (a) => a.loc, suburb: (a) => a.suburb };
    let rows = assets.filter((a) => !q || (a.id + a.title + a.loc + a.suburb + typePlural(a.type)).toLowerCase().includes(q));
    Object.entries(f).forEach(([k, v]) => { if (v) rows = rows.filter((a) => String(val[k](a) ?? '').toLowerCase().includes(v.toLowerCase())); });
    const advF = [['id', 'Asset ID'], ['type', 'Asset Type'], ['title', 'Asset Title'], ['loc', 'Location'], ['suburb', 'Suburb']];
    app.innerHTML = `<h1>List of Assets</h1><div class="row search"><input id="q" placeholder="Search by Asset ID, title, location or suburb" value="${esc(sessionStorage.getItem('aq') || '')}"><button class="btn" id="sq">Search</button><button class="btn alt" id="adv">Advanced Search ${adv ? '▲' : '▼'}</button></div>
    ${adv ? `<div class="panel" style="margin-top:14px"><h2>Advanced Search</h2><div class="body"><div class="g4 f">${advF.map(([k, l]) => `<div><label>${l}</label><input data-f="${k}" value="${esc(f[k] || '')}"></div>`).join('')}</div><div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn alt" id="asCancel">Cancel</button><button class="btn" id="asGo">Search</button></div></div></div>` : ''}
    <div class="scroll" style="margin-top:16px"><table class="tbl"><thead><tr><th>Asset ID</th><th>Asset Type</th><th>Asset Title</th><th>Location</th><th>Suburb</th><th>Action</th></tr></thead><tbody>${rows.map((a) => `<tr><td><a href="#/asset/${esc(a.id)}">${esc(a.id)}</a></td><td>${esc(typePlural(a.type))}</td><td>${esc(a.title)}</td><td>${esc(a.loc)}</td><td>${esc(a.suburb)}</td><td><a href="#/asset/${esc(a.id)}">View</a> | <a href="#/asset/${esc(a.id)}">Edit</a></td></tr>`).join('') || '<tr><td colspan="6">No data found</td></tr>'}</tbody></table></div><p class="muted">Showing ${rows.length} of ${assets.length} results</p>`;
    $('#sq').onclick = () => { sessionStorage.setItem('aq', $('#q').value); views.assets(); };
    $('#q').onkeydown = (e) => e.key === 'Enter' && $('#sq').click();
    $('#adv').onclick = () => { sessionStorage.setItem('aadv', adv ? '0' : '1'); views.assets(); };
    if (adv) {
      $('#asCancel').onclick = () => { sessionStorage.removeItem('af'); sessionStorage.setItem('aadv', '0'); views.assets(); };
      $('#asGo').onclick = () => { const o = {}; $$('[data-f]').forEach((i) => (o[i.dataset.f] = i.value)); sessionStorage.setItem('af', JSON.stringify(o)); views.assets(); };
    }
  };
  function assetTabs(host, st) {
    const { d, edit } = st, sub = sessionStorage.getItem('as') || 'details';
    const AF = (k, l) => `<div class="f"><label>${l}</label><input data-ak="${k}" value="${esc(d[k])}" ${k === 'id' || !edit ? 'readonly' : ''}></div>`;
    const typeSel = `<div class="f"><label>Asset Type</label><select data-ak="type" ${edit ? '' : 'disabled'}>${ASSET_TYPES.map((o) => `<option ${o === d.type ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
    const projPanel = (key, title) => {
      const ids = st[key], rows = st.pool.filter((x) => ids.has(x.id)), avail = st.pool.filter((x) => !ids.has(x.id) && x.id);
      return `<div class="panel"><h2>${title}</h2><div class="body">${edit ? `<div class="row"><div class="f" style="flex:1"><label>Link an existing project (search by name or ID)</label><input data-lk="${key}" list="pl-${key}" autocomplete="off" placeholder="Search projects…"><datalist id="pl-${key}">${avail.map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</datalist></div><button class="btn" data-link="${key}" style="align-self:flex-end">Link Project</button></div>` : ''}
        <div class="scroll" style="margin-top:12px"><table class="tbl"><thead><tr>${['Project Name', 'Project ID', 'P50', 'P90', 'Slippage', 'Gate Status', 'PM', 'Action'].map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((x) => `<tr><td><a href="#/project/${esc(x.id)}/project">${esc(x.name)}</a></td><td>${esc(x.id)}</td><td>${esc(x.p50)}</td><td>${esc(x.p90)}</td><td>${esc(x.slip)}</td><td>${esc(x.gate)}</td><td>${esc(x.pm)}</td><td>${edit ? `<a href="#" data-unlink="${key}" data-id="${esc(x.id)}">Unlink</a>` : `<a href="#/project/${esc(x.id)}/project">View</a>`}</td></tr>`).join('') || '<tr><td colspan="8">No data found</td></tr>'}</tbody></table></div></div></div>`;
    };
    const grantTbl = (title, list) => `<div class="panel"><h2>${title}</h2><div class="body scroll"><table class="tbl"><thead><tr><th>Grant Name</th><th>Grant ID</th><th>Status</th></tr></thead><tbody>${list.map((g) => `<tr><td>${esc(g.name)}</td><td>${esc(g.id)}</td><td>${esc(g.status)}</td></tr>`).join('') || '<tr><td colspan="3">No data found</td></tr>'}</tbody></table></div></div>`;
    const grants = d.grants || [];
    const riskPanel = () => {
      const rows = RISKS.filter((r) => st.risks.has(r.id)), avail = RISKS.filter((r) => !st.risks.has(r.id));
      return `<div class="panel"><h2>Risks</h2><div class="body">${edit ? `<div class="row"><div class="f" style="flex:1"><label>Link an existing risk</label><select data-rl><option value="">Select risk</option>${avail.map((r) => `<option value="${esc(r.id)}">${esc(r.id)} – ${esc(r.title)}${r.assetId ? ' (linked to ' + esc(r.assetId) + ')' : ''}</option>`).join('')}</select></div><button class="btn" data-rlink style="align-self:flex-end">Link Risk</button><button class="btn green" data-rnew style="align-self:flex-end">＋ Raise New Risk</button></div>` : ''}
        <div class="scroll" style="margin-top:12px"><table class="tbl"><thead><tr>${['Risk ID', 'Risk Title', 'Risk Type', 'Risk Priority', 'Risk Owner', 'Risk Action Owner', 'Action'].map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.id)}</td><td>${esc(r.title)}</td><td>${esc(r.type)}</td><td>${esc(r.priority)}</td><td>${esc(r.owner)}</td><td>${esc(r.actionOwner)}</td><td>${edit ? `<a href="#" data-runlink="${esc(r.id)}">Unlink</a>` : `<a href="#/risk/${esc(r.id)}">View</a>`}</td></tr>`).join('') || `<tr><td colspan="7">No risks linked to this asset.${edit ? ' Link an existing risk or raise a new one.' : ''}</td></tr>`}</tbody></table></div></div></div>`;
    };
    const body = {
      details: `<div class="cols"><div><div class="panel"><h2>Asset Details</h2><div class="body g2 f">${AF('id', 'Asset ID')}${AF('title', 'Asset Title')}${typeSel}${AF('loc', 'Location')}${AF('suburb', 'Suburb')}${AF('state', 'State')}${AF('postcode', 'Postcode')}${AF('intersection', 'Closest Intersection')}${AF('lat', 'Latitude')}${AF('lng', 'Longitude')}</div></div></div>
        <div><div id="amap" class="map" style="height:300px"></div><br><a class="btn" href="#/amd">View Asset Maintenance Data App</a></div></div>`,
      projects: projPanel('inflight', 'In-Flight Projects') + projPanel('future', 'Future Projects'),
      risks: riskPanel(),
      grants: grantTbl('In-flight Projects based on Grants Approval', grants.filter((g) => g.status === 'Approved')) + grantTbl('Pipeline Grants Submission', grants.filter((g) => g.status !== 'Approved')),
    }[sub];
    host.innerHTML = `<div class="tbar">${['details', 'projects', 'risks', 'grants'].map((s) => `<button data-s="${s}" class="${s === sub ? 'on' : ''}">${s === 'risks' ? 'Risk' : s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div>${body}${st.footer || ''}`;
    st.read = () => { if (edit) $$('[data-ak]', host).forEach((i) => { if (i.dataset.ak !== 'id') d[i.dataset.ak] = i.value; }); };
    $$('[data-s]', host).forEach((b) => (b.onclick = () => { st.read(); sessionStorage.setItem('as', b.dataset.s); assetTabs(host, st); }));
    if (sub === 'details') {
      const ok = validCoords(d), pos = ok ? [+d.lat, +d.lng] : [-33.87, 151.21];
      const m = L.map($('#amap', host)).setView(pos, 15); tiles(m); if (ok) L.marker(pos).addTo(m);
    }
    $$('[data-link]', host).forEach((b) => (b.onclick = () => {
      const key = b.dataset.link, v = $(`[data-lk="${key}"]`, host).value.trim().toLowerCase();
      const x = st.pool.find((y) => y.id.toLowerCase() === v || y.name.toLowerCase() === v);
      if (!x) return toast('Project not found. Pick an existing project.', 'err');
      st[key].add(x.id); assetTabs(host, st);
    }));
    $$('[data-unlink]', host).forEach((b) => (b.onclick = (e) => { e.preventDefault(); st[b.dataset.unlink].delete(b.dataset.id); assetTabs(host, st); }));
    $$('[data-runlink]', host).forEach((b) => (b.onclick = (e) => { e.preventDefault(); st.risks.delete(b.dataset.runlink); assetTabs(host, st); }));
    const rl = $('[data-rlink]', host); if (rl) rl.onclick = () => { const v = $('[data-rl]', host).value; if (!v) return toast('Select a risk to link.', 'err'); st.risks.add(v); assetTabs(host, st); };
    const rn = $('[data-rnew]', host); if (rn) rn.onclick = () => riskModal({ assetId: d.id, type: d.type }, (r) => { st.risks.add(r.id); assetTabs(host, st); });
  }
  const riskFields = (r) => `<div class="g2 f"><div class="f"><label>Risk ID</label><input value="${esc(r.id || 'Auto-generated on save')}" readonly></div>
    <div class="f"><label>Risk Title</label><input data-rk="title" value="${esc(r.title || '')}"></div>
    <div class="f"><label>Risk Type</label><select data-rk="type">${RISK_TYPES.map((o) => `<option ${o === r.type ? 'selected' : ''}>${o}</option>`).join('')}</select></div>
    <div class="f"><label>Risk Priority</label><select data-rk="priority">${PRIORITIES.map((o) => `<option ${o === (r.priority || 'Medium') ? 'selected' : ''}>${o}</option>`).join('')}</select></div>
    <div class="f"><label>Risk Owner</label>${userSel('data-rk="owner"', r.owner)}</div>
    <div class="f"><label>Risk Action Owner</label>${userSel('data-rk="actionOwner"', r.actionOwner)}</div>
    <div class="f"><label>Linked Asset</label><select data-rk="assetId"><option value="">None</option>${assets.map((a) => `<option value="${esc(a.id)}" ${a.id === r.assetId ? 'selected' : ''}>${esc(a.id)} – ${esc(a.title)}</option>`).join('')}</select></div></div>`;
  function readRisk(root, r) {
    $$('[data-rk]', root).forEach((i) => { r[i.dataset.rk] = i.value; });
    if (!String(r.title || '').trim()) { toast('Risk Title is required.', 'err'); return false; }
    if (!r.owner) { toast('Select a Risk Owner.', 'err'); return false; }
    if (!r.actionOwner) { toast('Select a Risk Action Owner.', 'err'); return false; }
    return true;
  }
  function riskModal(defaults, done) {
    modal(`<h2>Raise New Risk</h2>${riskFields(defaults)}<div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn alt" data-close>Cancel</button><button class="btn" id="rsave">Save</button></div>`, () => {
      $('#rsave').onclick = () => {
        const r = { ...defaults, id: nextRiskId() };
        if (!readRisk($('#modal'), r)) return;
        RISKS.push(r); saveRisks(); closeModal(); toast('Risk ' + r.id + ' raised.'); done(r);
      };
    });
  }
  const riskAdv = [['id', 'Risk ID'], ['title', 'Risk Title'], ['type', 'Risk Type'], ['priority', 'Risk Priority'], ['owner', 'Risk Owner'], ['actionOwner', 'Risk Action Owner'], ['assetId', 'Asset ID']];
  views.risks = () => {
    const adv = sessionStorage.getItem('radv') === '1', q = (sessionStorage.getItem('rq') || '').toLowerCase(), f = JSON.parse(sessionStorage.getItem('rf') || '{}');
    let rows = RISKS.filter((r) => !q || Object.values(r).join(' ').toLowerCase().includes(q));
    Object.entries(f).forEach(([k, v]) => { if (v) rows = rows.filter((r) => String(r[k] ?? '').toLowerCase().includes(v.toLowerCase())); });
    app.innerHTML = `<h1>List of Risks</h1><div class="row sp"><div class="row search"><input id="q" placeholder="Search risks" value="${esc(sessionStorage.getItem('rq') || '')}"><button class="btn" id="sq">Search</button><button class="btn alt" id="adv">Advanced Search ${adv ? '▲' : '▼'}</button></div><a class="btn green" href="#/risk/new">＋ Raise Risk</a></div>
    ${adv ? `<div class="panel" style="margin-top:14px"><h2>Advanced Search</h2><div class="body"><div class="g4 f">${riskAdv.map(([k, l]) => `<div><label>${l}</label><input data-f="${k}" value="${esc(f[k] || '')}"></div>`).join('')}</div><div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn alt" id="asCancel">Cancel</button><button class="btn" id="asGo">Search</button></div></div></div>` : ''}
    <div class="scroll" style="margin-top:16px"><table class="tbl"><thead><tr>${['Risk ID', 'Risk Title', 'Risk Type', 'Risk Priority', 'Risk Owner', 'Risk Action Owner', 'Asset ID', 'Action'].map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><td><a href="#/risk/${esc(r.id)}">${esc(r.id)}</a></td><td>${esc(r.title)}</td><td>${esc(r.type)}</td><td>${esc(r.priority)}</td><td>${esc(r.owner)}</td><td>${esc(r.actionOwner)}</td><td>${esc(r.assetId)}</td><td><a href="#/risk/${esc(r.id)}">View</a> | <a href="#/risk/${esc(r.id)}">Edit</a></td></tr>`).join('') || '<tr><td colspan="8">No data found</td></tr>'}</tbody></table></div><p class="muted">Showing ${rows.length} of ${RISKS.length} results</p>`;
    $('#sq').onclick = () => { sessionStorage.setItem('rq', $('#q').value); views.risks(); };
    $('#q').onkeydown = (e) => e.key === 'Enter' && $('#sq').click();
    $('#adv').onclick = () => { sessionStorage.setItem('radv', adv ? '0' : '1'); views.risks(); };
    if (adv) {
      $('#asCancel').onclick = () => { sessionStorage.removeItem('rf'); sessionStorage.setItem('radv', '0'); views.risks(); };
      $('#asGo').onclick = () => { const o = {}; $$('[data-f]').forEach((i) => (o[i.dataset.f] = i.value)); sessionStorage.setItem('rf', JSON.stringify(o)); views.risks(); };
    }
  };
  views.risk = (id) => {
    const isNew = id === 'new', r = isNew ? { type: 'Road', priority: 'Medium' } : RISKS.find((x) => x.id === decodeURIComponent(id || ''));
    if (!r) { app.innerHTML = '<h1>Risk not found</h1><a class="btn" href="#/risks">Back</a>'; return; }
    const copy = { ...r };
    app.innerHTML = `<h1>${isNew ? 'Raise New Risk' : esc(r.id)}</h1><div class="panel"><div class="body">${riskFields(r)}</div></div><div class="row" style="justify-content:flex-end;margin-top:16px"><a class="btn alt" href="#/risks">Cancel</a><button class="btn" id="rsv">Save</button></div>`;
    $('#rsv').onclick = () => {
      if (!readRisk(app, copy)) return;
      if (isNew) { copy.id = nextRiskId(); RISKS.push(copy); } else Object.assign(r, copy);
      saveRisks(); toast('Risk saved successfully.'); location.hash = '#/risks';
    };
  };
  const validCoords = (o) => String(o.lat).trim() !== '' && String(o.lng).trim() !== '' && !isNaN(+o.lat) && !isNaN(+o.lng) && Math.abs(+o.lat) <= 90 && Math.abs(+o.lng) <= 180;
  views.asset = (id) => {
    const a = findAsset(decodeURIComponent(id || ''));
    if (!a) { app.innerHTML = '<h1>Asset not found</h1><a class="btn" href="#/assets">Back</a>'; return; }
    const st = { edit: true, d: { ...a }, pool: projects, inflight: new Set(a.inflight), future: new Set(a.future), risks: new Set(RISKS.filter((r) => r.assetId === a.id).map((r) => r.id)) };
    app.innerHTML = `<div class="row sp"><h1>${esc(a.title)} <small class="muted">${esc(a.id)}</small></h1><a class="btn alt" href="#/assets">Back to list</a></div><div id="atabs"></div>
      <div class="row" style="justify-content:flex-end;margin-top:16px"><a class="btn alt" href="#/assets">Cancel</a><button class="btn" id="saveA">Save</button></div>`;
    assetTabs($('#atabs'), st);
    $('#saveA').onclick = () => {
      st.read();
      const d = st.d;
      if (!d.title.trim()) return toast('Asset Title is required.', 'err');
      if (!validCoords(d)) return toast('Invalid coordinates.', 'err');
      const all = new Set([...st.inflight, ...st.future]);
      assets.forEach((o) => { if (o !== a) { o.inflight = o.inflight.filter((i) => !all.has(i)); o.future = o.future.filter((i) => !all.has(i)); } });
      Object.assign(a, d, { lat: +d.lat, lng: +d.lng, inflight: [...st.inflight], future: [...st.future] }); saveAssets();
      projects.forEach((x) => { if (all.has(x.id)) { x.assetId = a.id; x.assetType = a.type; } else if (x.assetId === a.id) x.assetId = ''; });
      RISKS.forEach((r) => { if (st.risks.has(r.id)) r.assetId = a.id; else if (r.assetId === a.id) r.assetId = ''; }); saveRisks();
      save(); toast('Asset saved successfully.'); location.hash = '#/assets';
    };
  };

  function route() {
    closeModal();
    const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
    const [name = 'home', a, b] = parts;
    const pub = ['home', 'login', 'survey', 'contact', 'help'];
    renderUser();
    if (!pub.includes(name) && !user()) { location.hash = '#/login'; return; }
    (views[name] || views.home)(a, b);
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();
})();
