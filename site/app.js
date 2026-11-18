(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEY = 'pamb.projects.v1', AUTH = 'pamb.user';
  const app = $('#app');

  const seed = () => [
    mk('PROJ-1234', 'Parramatta Rd Maint', { preGate: 'PRE-23', assetType: 'Road', assetId: 'BIS-9561', riskId: 'RISKHUB-123', agenda: 'JIRA-12345', p50: '12/12/2025', p90: '25/2/2026', slip: 'Yes', gate: 'Gate 2', pm: 'John Doe', score: 7, lat: -33.8150, lng: 151.0011 }),
    mk('PROJ-5678', 'Parramatta Bridge Maintenance', { preGate: 'PRE-24', assetType: 'Bridge', assetId: 'BIS-9561', riskId: 'RISKHUB-456', agenda: 'JIRA-12345', p50: '1/3/2026', p90: '30/6/2026', slip: 'No', gate: 'Gate 1', pm: 'Jane Smith', score: 8, lat: -33.8136, lng: 151.0034 }),
  ];
  function mk(id, name, o) {
    return {
      id, name, preGate: o.preGate || '', preChk: true, gatedChk: true, assetType: o.assetType || '', assetId: o.assetId || '', riskId: o.riskId || '',
      agenda: o.agenda || '', lat: o.lat ?? -33.8688, lng: o.lng ?? 151.2093, p50: o.p50 || '', p90: o.p90 || '', slip: o.slip || 'No', gate: o.gate || 'Pre-Gate 0',
      pm: o.pm || '', score: o.score ?? '', created: '2025-12-01', active: 'Yes', council: 'No', focus: 'Maintenance', wbs: 'WBS-001',
      benefits: { identification: ['Address lack of maintenance for the last few years', 'Address concerns raised by the public'], analysis: ['Address lack of maintenance for the last few years', 'Address concerns raised by the public'], delivery: ['Address lack of maintenance for the last few years', 'Address concerns raised by the public'], transition: [], sustainment: [] },
      risk: { title: 'Structural fatigue', rid: o.riskId || '', asset: o.assetId || '', cat: 'Safety', owner: o.pm || '', created: '01/12/2025', due: '30/06/2026', status: 'Open', action: '', comment: '' },
      fin: { code: 'PC-100', wo: 'WO-2001', wbs: 'WBS-001', po: 'PO-7788', total: 750000, fy: 'FY26', spent: 550000 },
      docs: [{ name: 'Project_estimate.pdf', date: '15/12/2025' }, { name: 'Design v11.pdf', date: '15/12/2025' }],
      schedule: [
        ['M', 'Ideation', '', '1/3/2026', '31/3/2026', 24], ['S', 'Concept Paper', '', '1/3/2026', '14/3/2026', 9], ['S', 'PSAD', '', '15/3/2026', '31/3/2026', 15],
        ['M', 'Design', '', '1/4/2026', '30/4/2026', 20], ['M', 'Development & Build', '', '1/5/2026', '30/6/2026', 40], ['S', 'Development', '', '1/5/2026', '15/6/2026', 35],
      ].map(([t, a, b, s, e, d]) => ({ type: t, title: a, sub: b, start: s, end: e, days: d, status: 'NEW' })),
    };
  }
  let projects;
  try { projects = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { projects = seed(); }
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
  function renderUser() {
    $('#userbox').innerHTML = user() ? `<button class="user" id="logout" title="Click to sign out">C James ${userSvg}</button>` : '';
    const b = $('#logout'); if (b) b.onclick = () => { localStorage.removeItem(AUTH); location.hash = '#/'; };
  }

  const heroSvg = `<svg viewBox="0 0 600 380" preserveAspectRatio="xMidYMid slice"><circle cx="420" cy="170" r="46" fill="#ffd9a0" opacity=".9"/><path d="M-20 300 Q300 120 620 290" stroke="#fff" stroke-width="10" fill="none"/><path d="M-20 330 Q300 150 620 320" stroke="#e8e8f5" stroke-width="6" fill="none"/>${Array.from({ length: 14 }, (_, i) => { const x = 20 + i * 42; const y = 300 - 175 * Math.sin((x + 20) / 640 * Math.PI) * 0.97; return `<line x1="${x}" y1="${y + 14}" x2="${x}" y2="${y + 40}" stroke="#fff" stroke-width="2"/>`; }).join('')}<rect y="330" width="600" height="50" fill="#1b2a52"/></svg>`;

  const views = {
    home() {
      app.innerHTML = `<div class="home"><div><div class="hero">${heroSvg}</div><a class="btn" href="#/login">Transport User Login</a></div><div>
      <div class="card"><h2>📰 Latest News</h2><ul><li>Transport has secured $1.2B funds to pave 36 km in Newcastle</li><li>Line marking supplier sued by ACCC</li><li>TACP program has moved to Phase 2</li><li>RAISI Phase 2 &amp; 3 now may extend to end of 2028</li></ul></div>
      <div class="card"><h2>📅 Announcements</h2><ul><li>Transport secretary bold claim: we are modernizing TFM</li><li>TFM unit just secured $1.2B funding to upskill</li></ul></div></div></div>`;
    },
    login() {
      app.innerHTML = `<div class="panel" style="max-width:420px;margin:30px auto"><h2>Transport User Login</h2><div class="body f"><p class="muted">Demo sign-in – no credentials are checked.</p><label>Username</label><input id="u" value="C James"><br><br><label>Password</label><input id="p" type="password" value="demo"><br><br><button class="btn" id="go">Sign in</button></div></div>`;
      $('#go').onclick = () => { localStorage.setItem(AUTH, $('#u').value || 'C James'); location.hash = '#/tiles'; };
    },
    tiles() {
      app.innerHTML = `<div class="banner"><h1>Select the appropriate tile</h1><div class="tiles">${['Transport Assets|#/transport', 'Rail Assets|#/soon/Rail Assets', 'Maritime Assets|#/soon/Maritime Assets'].map((t) => { const [n, h] = t.split('|'); return `<a class="tile" href="${h}">${n}<span>➜</span></a>`; }).join('')}</div></div>`;
    },
    transport() {
      const t = [['Projects', '#/projects'], ['Grants', '#/soon/Grants'], ['Document Compliance', '#/soon/Document Compliance'], ['Regional Map', '#/map'], ['Asset Risk Management', '#/soon/Asset Risk Management'], ['Grants Prioritization', '#/soon/Grants Prioritization'], ['Freight Permits', '#/soon/Freight Permits']];
      app.innerHTML = `<div class="banner"><h1>Transport Assets</h1><div class="tiles">${t.map(([n, h]) => `<a class="tile" href="${h}">${n}<span>➜</span></a>`).join('')}</div></div>`;
    },
    soon(name) { app.innerHTML = `<h1>${esc(decodeURIComponent(name))}</h1><p class="muted">This module is not part of the current design.</p><a class="btn" href="#/tiles">Back</a>`; },
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
      ${shown.map((p) => `<tr><td><a href="#/project/${p.id}/project">${esc(p.name)}</a></td><td><a href="#/project/${p.id}/project">${esc(p.id)}</a></td><td>${esc(p.assetType)}</td><td>${esc(p.p50)}</td><td>${esc(p.p90)}</td><td>${esc(p.slip)}</td><td>${esc(p.gate)}</td><td>${esc(p.pm)}</td><td>${esc(p.score)}</td><td><button class="ic" title="Edit" data-a="edit" data-id="${p.id}">✏️</button><button class="ic" title="Email" data-a="mail" data-id="${p.id}">✉️</button><button class="ic" title="Add document" data-a="doc" data-id="${p.id}">📎</button><button class="ic" title="Comment" data-a="cmt" data-id="${p.id}">💬</button></td></tr>`).join('') || '<tr><td colspan="10">No data found</td></tr>'}
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
      $$('[data-a]').forEach((b) => (b.onclick = () => rowAction(b.dataset.a, projects.find((p) => p.id === b.dataset.id))));
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
  function rowAction(a, p) {
    if (a === 'edit') location.hash = `#/project/${p.id}/project`;
    if (a === 'mail') modal(`<h2>Email project owner</h2><div class="f"><label>To</label><input value="${esc(p.pm)}@transport.nsw.gov.au"><br><br><label>Message</label><textarea>Re: ${esc(p.name)} (${esc(p.id)})</textarea></div><br><div class="row"><button class="btn alt" data-close>Cancel</button><button class="btn" id="ok">Send</button></div>`, () => ($('#ok').onclick = () => { closeModal(); toast('Email sent.'); }));
    if (a === 'doc') location.hash = `#/project/${p.id}/financial`;
    if (a === 'cmt') modal(`<h2>Comment on ${esc(p.id)}</h2><textarea id="c"></textarea><br><br><div class="row"><button class="btn alt" data-close>Cancel</button><button class="btn" id="ok">Post</button></div>`, () => ($('#ok').onclick = () => { closeModal(); toast('Comment posted.'); }));
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
      if (isNew) {
        if (!p.name || !p.id) { toast('Project Name and Gated Project ID are required.', 'err'); return; }
        if (projects.some((x) => x.id === p.id)) { toast('A project with that ID already exists.', 'err'); return; }
        projects.push(p); save(); toast('Project created.'); location.hash = `#/project/${p.id}/project`; return;
      }
      save(); toast(msg);
    };
  }

  const tabs_ = {
    project(p, isNew) {
      $('#tab').innerHTML = `<div class="cols"><div class="panel"><div class="body">
      ${F('name', 'Project Name', p.name)}
      <div class="f"><label>Pre-Gate Project ID</label><div class="inl"><input data-k="preChk" type="checkbox" ${p.preChk ? 'checked' : ''}><input data-k="preGate" value="${esc(p.preGate)}"><span class="tick">✔</span></div></div><br>
      <div class="f"><label>Gated Project ID</label><div class="inl"><input data-k="gatedChk" type="checkbox" ${p.gatedChk ? 'checked' : ''}><input data-k="id" value="${esc(p.id)}" ${isNew ? '' : 'readonly'}><span class="tick">✔</span></div></div><br>
      <div class="f"><label>Asset Type</label><select data-k="assetType">${['', 'Road', 'Bridge', 'Rail', 'Maritime'].map((o) => `<option ${o === p.assetType ? 'selected' : ''}>${o}</option>`).join('')}</select></div><br>
      ${F('assetId', 'Asset ID', p.assetId)}<br>${F('riskId', 'Risk ID', p.riskId)}<br>
      <div class="f"><label>Ministerial Agenda</label><div class="inl"><input data-k="agenda" value="${esc(p.agenda)}"><button class="btn sm" id="play" title="Open agenda">▶</button></div></div>
      </div></div><div><div id="map" class="map"></div>
      ${isNew ? `<div class="row f" style="margin-top:10px"><div><label>Longitude</label><input id="lng" type="number" step="any" value="${p.lng}"></div><div><label>Latitude</label><input id="lat" type="number" step="any" value="${p.lat}"></div><button class="btn" id="plot" style="align-self:flex-end">Plot on Map</button></div>` : '<p class="muted">Live traffic map (OpenStreetMap).</p>'}</div></div>${saveBar(p, isNew)}`;
      const m = L.map('map').setView([p.lat, p.lng], 14); tiles(m); const mk_ = L.marker([p.lat, p.lng]).addTo(m);
      if (isNew) $('#plot').onclick = () => { const la = +$('#lat').value, lo = +$('#lng').value; if (isNaN(la) || isNaN(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) return toast('Invalid coordinates.', 'err'); p.lat = la; p.lng = lo; mk_.setLatLng([la, lo]); m.setView([la, lo], 14); };
      $('#play').onclick = () => (location.hash = '#/agenda');
      bindSave(p, isNew);
    },
    asset(p) {
      const sub = sessionStorage.getItem('as') || 'details';
      const inflight = projects.filter((x) => x.assetId === p.assetId);
      const body = {
        details: `<div class="cols"><div><div class="panel"><h2>Asset Identification</h2><div class="body g2 f">${F('assetName', 'Asset Name', p.assetName || 'Parramatta Bridge')}${F('assetId', 'Asset ID', p.assetId)}<div><label>Location</label><select><option>Parramatta</option><option>Newcastle</option><option>Sydney</option></select></div>${F('lga', 'LGA', p.lga || 'City of Parramatta')}</div></div>
          <div class="panel"><h2>Additional Details</h2><div class="body g2 f">${F('built', 'Year Built', p.built || '1965')}${F('cond', 'Condition', p.cond || 'Fair')}</div></div>
          <div class="panel"><h2>Asset Description</h2><div class="body"><textarea data-k="assetDesc">${esc(p.assetDesc || 'Concrete road bridge over the Parramatta River.')}</textarea></div></div></div>
          <div><div class="map" style="height:240px;background:linear-gradient(135deg,#8aa6c8,#cfd9e6);display:grid;place-items:center;font-size:60px">🌉</div><br><a class="btn" href="#/amd">View Asset Maintenance Data App</a></div></div>`,
        projects: `<div class="panel"><h2>In-flight Projects</h2><div class="body scroll"><table class="tbl"><thead><tr>${['Project Name', 'Project ID', 'Asset ID', 'P50', 'P90', 'Slippage', 'Gate Status', 'PM', 'Action'].map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${inflight.map((x) => `<tr><td><a href="#/project/${x.id}/project">${esc(x.name)}</a></td><td>${esc(x.id)}</td><td>${esc(x.assetId)}</td><td>${esc(x.p50)}</td><td>${esc(x.p90)}</td><td>${esc(x.slip)}</td><td>${esc(x.gate)}</td><td>${esc(x.pm)}</td><td>✏️</td></tr>`).join('') || '<tr><td colspan="9">No data found</td></tr>'}</tbody></table></div></div><div class="panel"><h2>Pipeline Projects</h2><div class="body">No data found</div></div>`,
        grants: '<div class="panel"><h2>In-flight Projects based on Grants Approval</h2><div class="body scroll"><table class="tbl"><thead><tr><th>Grant Name</th><th>Grant ID</th><th>Status</th></tr></thead><tbody><tr><td colspan="3">No data found</td></tr></tbody></table></div></div><div class="panel"><h2>Pipeline Grants Submission</h2><div class="body">No data found</div></div>',
      }[sub];
      $('#tab').innerHTML = `<div class="tbar">${['details', 'projects', 'grants'].map((s) => `<button data-s="${s}" class="${s === sub ? 'on' : ''}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div>${body}<div class="row" style="justify-content:flex-end"><button class="btn" id="save">Save</button></div>`;
      $$('[data-s]').forEach((b) => (b.onclick = () => { collect(p); sessionStorage.setItem('as', b.dataset.s); tabs_.asset(p); }));
      bindSave(p, false, 'Asset saved successfully.');
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
      $('#tab').innerHTML = `<div class="panel"><h2>Risk Identification</h2><div class="body g4 f">${F('risk.title', 'Risk Title', r.title)}${F('risk.rid', 'Risk ID', r.rid)}${F('risk.asset', 'Asset ID', r.asset)}${F('risk.cat', 'Risk Category', r.cat)}</div></div>
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
