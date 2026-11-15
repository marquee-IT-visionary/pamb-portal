"use strict";
const $ = (s, r = document) => r.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const app = $("#app");
let META = { gates: [], statuses: [], user: "" };
let cur = null, orig = null, tab = "project", dirty = false;
let sub = { asset: "details" };
const TABS = ["project", "asset", "benefits", "risk", "financial", "schedule", "audit"];
const STAGES = ["Identification", "Analysis & Planning", "Delivery", "Transition", "Sustainment"];
const ASSET_TYPES = ["Road", "Bridge", "Rail", "Maritime", "Culvert"];

async function api(path, opts = {}) {
  const r = await fetch("/api" + path, { headers: { "Content-Type": "application/json" }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const j = await r.json();
  if (!r.ok) throw new Error((j.errors || ["Request failed"]).join(" "));
  return j;
}
function toast(msg, ok = true) {
  const t = $("#toast"); t.textContent = msg; t.className = "toast " + (ok ? "ok" : "err"); t.style.display = "block";
  clearTimeout(toast.h); toast.h = setTimeout(() => t.style.display = "none", 4000);
}
const get = (o, p) => p.split(".").reduce((a, k) => a?.[k], o);
function set(o, p, v) { const k = p.split("."); const l = k.pop(); k.reduce((a, x) => a[x], o)[l] = v; }
const f = (label, path, o = {}) => {
  const v = get(cur, path) ?? "";
  const id = "f_" + path.replace(/\W/g, "_");
  let el;
  if (o.options) el = `<select id="${id}" data-p="${path}"><option value=""></option>${o.options.map(x => `<option ${x === v ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>`;
  else if (o.area) el = `<textarea id="${id}" data-p="${path}">${esc(v)}</textarea>`;
  else if (o.check) el = `<input id="${id}" type="checkbox" data-p="${path}" data-t="bool" ${v ? "checked" : ""} style="width:auto">`;
  else el = `<input id="${id}" type="${o.type || "text"}" data-p="${path}" ${o.type === "number" ? 'data-t="num"' : ""} value="${esc(v)}" ${o.ro ? "readonly" : ""}>`;
  return `<div class="${o.wide ? "wide" : ""}"><label for="${id}">${esc(label)}</label>${el}</div>`;
};
const money = n => "$" + Number(n || 0).toLocaleString();
const pill = p => p.gate === "Pre-Gate0" ? `<span class="pill pre">Pre-Gate0</span>` : `<span class="pill g">${esc(p.gate)}</span>`;

/* ---------- routing ---------- */
async function route() {
  const h = location.hash.replace(/^#\/?/, "").split("/");
  try {
    if (!h[0]) return landing();
    if (h[0] === "tiles") return tiles();
    if (h[0] === "transport") return transport();
    if (h[0] === "stub") return stub(decodeURIComponent(h[1] || ""));
    if (h[0] === "contact" || h[0] === "help") return stub(h[0] === "help" ? "Help" : "Contact Us");
    if (h[0] === "projects" && !h[1]) return list();
    if (h[0] === "projects" && h[1] === "new") { cur = newProject(); orig = JSON.parse(JSON.stringify(cur)); tab = "project"; dirty = false; return detail(true); }
    if (h[0] === "projects") {
      if (!cur || String(cur.id) !== h[1]) { cur = await api("/projects/" + h[1]); orig = JSON.parse(JSON.stringify(cur)); tab = "project"; dirty = false; }
      if (h[2] && TABS.includes(h[2])) tab = h[2];
      return detail(false);
    }
    app.innerHTML = "<h1>Not found</h1>";
  } catch (e) { app.innerHTML = `<h1>Error</h1><p class="err">${esc(e.message)}</p><a href="#/projects">Back to projects</a>`; }
}
window.addEventListener("hashchange", route);

/* ---------- static pages ---------- */
function landing() {
  app.innerHTML = `<div class="hero"><div class="heroimg">Prioritising the right assets, together.</div><div>
  <div class="card"><h3>Latest News</h3><ul><li>Transport has secured $1.2B funds to pave 36 km in Newcastle</li><li>Line marking supplier sued by ACCC</li><li>TACP program has moved to Phase 2</li><li>RAISI Phase 2 &amp; 3 now may extend to end of 2028</li></ul></div>
  <div class="card"><h3>Announcements</h3><ul><li>Transport secretary bold claim: we are modernizing TFM</li><li>TFM unit just secured $1.2B funding to upskill</li></ul></div>
  <a class="btn" href="#/tiles">Transport User Login</a></div></div>`;
}
function tiles() {
  app.innerHTML = `<h1>Select the appropriate tile</h1><div class="tiles"><a class="tile" href="#/transport">Transport Assets</a><a class="tile" href="#/stub/Rail Assets">Rail Assets</a><a class="tile" href="#/stub/Maritime Assets">Maritime Assets</a></div>`;
}
function transport() {
  app.innerHTML = `<h1>Transport Assets</h1><div class="tiles"><a class="tile" href="#/projects">Projects</a>${["Grants", "Document Compliance", "Regional Map", "Asset Risk Management", "Grants Prioritization", "Freight Permits"].map(t => `<a class="tile off" href="#/stub/${encodeURIComponent(t)}">${t}</a>`).join("")}</div>`;
}
function stub(name) { app.innerHTML = `<h1>${esc(name)}</h1><p class="muted">This module is not part of the first release.</p><a class="btn ghost" href="#/transport">Back</a>`; }

/* ---------- project list ---------- */
const LS = { q: "", adv: false, f: {}, page: 1, size: 10, sort: "id", dir: "asc" };
async function list() {
  cur = null;
  app.innerHTML = `<h1>List of Projects</h1>
  <div class="bar"><input type="search" id="q" placeholder="Search by name, ID, asset, risk, milestone, PM..." aria-label="Search projects" value="${esc(LS.q)}">
  <button class="btn" id="go">Search</button><button class="btn ghost" id="advt">Advanced Search</button>
  <select id="stage" style="width:auto" aria-label="Stage"><option value="">All stages</option><option value="pre">Pre-Gate0 only</option><option value="gated">Gate 1-6 only</option></select>
  <span class="sp"></span><button class="btn ghost" id="pdf">Export PDF</button><a class="btn green" href="#/projects/new">Create Project</a></div>
  <div id="advbox"></div><div id="res"></div>`;
  $("#stage").value = LS.f.stage || "";
  $("#q").onkeydown = e => { if (e.key === "Enter") $("#go").click(); };
  $("#go").onclick = () => { LS.q = $("#q").value; LS.f.stage = $("#stage").value; LS.page = 1; load(); };
  $("#stage").onchange = $("#go").onclick;
  $("#advt").onclick = () => { LS.adv = !LS.adv; advForm(); };
  $("#pdf").onclick = () => window.print();
  advForm(); load();
}
function advForm() {
  const b = $("#advbox"); if (!LS.adv) { b.innerHTML = ""; return; }
  const v = k => esc(LS.f[k] || "");
  const inp = (k, l, t = "text") => `<div><label for="a_${k}">${l}</label><input id="a_${k}" type="${t}" value="${v(k)}"></div>`;
  const sel = (k, l, o) => `<div><label for="a_${k}">${l}</label><select id="a_${k}"><option value=""></option>${o.map(x => `<option ${LS.f[k] === (x[0] ?? x) ? "selected" : ""} value="${esc(x[0] ?? x)}">${esc(x[1] ?? x)}</option>`).join("")}</select></div>`;
  b.innerHTML = `<form class="adv"><div class="grid">
  ${inp("projectId", "Project ID (Pre-Gate0 or SAP)")}${inp("assetId", "Asset ID")}${inp("riskId", "Risk ID")}${sel("gate", "Gate Status", META.gates)}
  ${sel("status", "Project Status", META.statuses)}${inp("milestone", "Milestone")}${sel("milestoneStatus", "Milestone Status", ["Achieved", "In Progress", "Yet to be achieved"])}${sel("assetType", "Asset Type", ASSET_TYPES)}
  ${sel("councilGrant", "Council Grant", [["true", "Yes"], ["false", "No"]])}${sel("slippage", "Slippage", [["true", "Yes"], ["false", "No"]])}${inp("projectFocus", "Project Focus")}${inp("minScore", "Min Prioritization Score", "number")}
  ${inp("createdFrom", "Created From", "date")}${inp("createdTo", "Created To", "date")}${inp("finishBefore", "Forecast Finish By", "date")}${inp("pm", "Project Manager")}${inp("wbs", "WBS Code")}
  </div><div class="bar" style="margin-top:12px"><button type="button" class="btn ghost" id="acancel">Cancel</button><button class="btn">Search</button></div></form>`;
  $(".adv").onsubmit = e => {
    e.preventDefault();
    const keep = LS.f.stage; LS.f = { stage: keep };
    b.querySelectorAll("[id^=a_]").forEach(i => { if (i.value) LS.f[i.id.slice(2)] = i.value; });
    LS.page = 1; load();
  };
  $("#acancel").onclick = () => { const keep = LS.f.stage; LS.f = { stage: keep }; LS.adv = false; advForm(); load(); };
}
async function load() {
  const p = new URLSearchParams({ ...LS.f, q: LS.q, page: LS.page, size: LS.size, sort: LS.sort, dir: LS.dir });
  const d = await api("/projects?" + p);
  const cols = [["name", "Project Name"], ["preGateId", "Project ID"], ["assetType", "Asset Type"], ["p50", "P50 Date"], ["p90", "P90 Date"], ["slippage", "Slippage"], ["gate", "Gate Status"], ["status", "Status"], ["pm", "PM"], ["score", "Prioritization Score"]];
  const pages = Math.max(1, Math.ceil(d.total / d.size));
  $("#res").innerHTML = `<table><thead><tr>${cols.map(([k, l]) => `<th data-s="${k}" tabindex="0">${l}${LS.sort === k ? (LS.dir === "asc" ? " ▲" : " ▼") : ""}</th>`).join("")}<th>Action</th></tr></thead><tbody>
  ${d.items.map(p => `<tr><td><a href="#/projects/${p.id}">${esc(p.name)}</a></td><td><a href="#/projects/${p.id}">${esc(p.sapId || p.preGateId)}</a>${p.sapId ? `<br><small class="muted">${esc(p.preGateId)}</small>` : ""}</td>
  <td>${esc(p.assetType)}</td><td>${esc(p.p50)}</td><td>${esc(p.p90)}</td><td>${p.slippage ? "Yes" : "No"}</td><td>${pill(p)}</td><td><span class="pill ${esc(p.status)}">${esc(p.status)}</span></td><td>${esc(p.pm)}</td><td>${esc(p.score)}</td>
  <td><a href="#/projects/${p.id}" title="Edit" aria-label="Edit">✎</a> <a href="mailto:?subject=${encodeURIComponent(p.name)}" title="Email" aria-label="Email">✉</a> <a href="#/projects/${p.id}/financial" title="Documents" aria-label="Documents">📎</a> <a href="#/projects/${p.id}/risk" title="Comments" aria-label="Comments">💬</a></td></tr>`).join("") || `<tr><td colspan="11">No projects found.</td></tr>`}</tbody></table>
  <div class="bar" style="margin-top:10px"><span>Page size <select id="size" style="width:auto">${[10, 25, 50].map(n => `<option ${n === d.size ? "selected" : ""}>${n}</option>`).join("")}</select></span>
  <span class="sp">Showing ${d.items.length} of ${d.total} results</span><button class="btn ghost" id="prev" ${d.page <= 1 ? "disabled" : ""}>&lt;</button><span>${d.page} / ${pages}</span><button class="btn ghost" id="next" ${d.page >= pages ? "disabled" : ""}>&gt;</button></div>`;
  document.querySelectorAll("th[data-s]").forEach(th => th.onclick = () => { const k = th.dataset.s; LS.dir = LS.sort === k && LS.dir === "asc" ? "desc" : "asc"; LS.sort = k; load(); });
  $("#size").onchange = e => { LS.size = +e.target.value; LS.page = 1; load(); };
  $("#prev").onclick = () => { LS.page--; load(); }; $("#next").onclick = () => { LS.page++; load(); };
}

/* ---------- project detail ---------- */
function newProject() {
  return { name: "", preGateId: "(assigned on save)", sapId: "", assetType: "", assetId: "", riskId: "", ministerialAgenda: "", lat: "", lng: "", gate: "Pre-Gate0", status: "Active", pm: "", score: 0, p50: "", p90: "", forecastFinish: "", councilGrant: false, projectFocus: "", wbs: "",
    asset: { name: "", location: "", lga: "", description: "", details: "" }, benefits: { stages: {}, items: [] },
    risk: { title: "", category: "", owner: "", created: "", due: "", status: "", action: "", commentary: "" },
    financial: { projectCode: "", workOrder: "", wbs: "", purchaseOrder: "", totalFunding: 0, fy: "", spent: 0, milestones: [], documents: [] }, schedule: [], audit: [] };
}
function detail(isNew) {
  const tabs = isNew ? TABS.filter(t => t !== "schedule") : TABS;
  if (!tabs.includes(tab)) tab = "project";
  const base = isNew ? "#/projects/new" : "#/projects/" + cur.id;
  app.innerHTML = `<div class="bar"><a href="#/projects">&larr; Projects</a><span class="sp"></span>${isNew ? `<button class="btn ghost" onclick="window.print()">Export PDF</button>` : `<button class="btn red" id="close" ${["Closed", "Closure Initiated", "Cancelled"].includes(cur.status) ? "disabled" : ""}>Initiate Project Closure</button>`}</div>
  <h1>${esc(isNew ? "Create New Project" : cur.name)} ${isNew ? "" : pill(cur)}</h1>
  <nav class="tabs" role="tablist">${tabs.map(t => `<a role="tab" class="${t === tab ? "on" : ""}" href="${isNew ? "#/projects/new" : base + "/" + t}" data-t="${t}">${t[0].toUpperCase() + t.slice(1)}</a>`).join("")}</nav>
  <div id="tabbody"></div>
  <div class="footer-actions"><span id="dirty" class="muted"></span><button class="btn ghost" id="cancel">Cancel</button><button class="btn green" id="save">Save</button></div>`;
  if (isNew) document.querySelectorAll(".tabs a").forEach(a => a.onclick = e => { e.preventDefault(); tab = a.dataset.t; detail(true); });
  renderTab(isNew);
  $("#cancel").onclick = () => {
    if (dirty && !confirm("Discard unsaved changes?")) return;
    if (isNew) { cur = null; location.hash = "#/projects"; } else { cur = JSON.parse(JSON.stringify(orig)); dirty = false; detail(false); }
  };
  $("#save").onclick = () => save(isNew);
  const c = $("#close"); if (c) c.onclick = async () => {
    if (!confirm("Initiate closure for this project?")) return;
    try { cur = await api(`/projects/${cur.id}/closure`, { method: "POST" }); orig = JSON.parse(JSON.stringify(cur)); dirty = false; toast("Project closure initiated."); detail(false); } catch (e) { toast(e.message, false); }
  };
}
async function save(isNew) {
  try {
    const saved = isNew ? await api("/projects", { method: "POST", body: cur }) : await api("/projects/" + cur.id, { method: "PUT", body: cur });
    cur = saved; orig = JSON.parse(JSON.stringify(cur)); dirty = false;
    toast(`Project ${isNew ? "created" : "saved"} successfully.`);
    if (isNew) location.hash = "#/projects/" + cur.id; else detail(false);
  } catch (e) { toast(e.message, false); }
}
function bind() {
  document.querySelectorAll("#tabbody [data-p]").forEach(el => {
    const h = () => {
      let v = el.type === "checkbox" ? el.checked : el.value;
      if (el.dataset.t === "num") v = Number(v) || 0;
      set(cur, el.dataset.p, v); dirty = true; $("#dirty").textContent = "Unsaved changes";
    };
    el.addEventListener("change", h);
    if (el.tagName !== "SELECT") el.addEventListener("input", h);
  });
}
function touch() { dirty = true; $("#dirty").textContent = "Unsaved changes"; }
function renderTab(isNew) {
  const b = $("#tabbody");
  ({ project: tProject, asset: tAsset, benefits: tBenefits, risk: tRisk, financial: tFinancial, schedule: tSchedule, audit: tAudit })[tab](b, isNew);
  if (tab !== "audit") bind();
}
function mapPane() {
  const lat = parseFloat(cur.lat), lng = parseFloat(cur.lng);
  const ok = !isNaN(lat) && !isNaN(lng);
  const x = ok ? ((lng - 140.9) / (154 - 140.9)) * 100 : 0, y = ok ? ((-28 - lat) / (37.6 - 28)) * 100 : 0;
  return `<div><div class="map" id="map" aria-label="Map">${ok ? `<span class="pin" style="left:${Math.min(100, Math.max(0, x))}%;top:${Math.min(100, Math.max(0, y))}%"></span><small>${lat.toFixed(4)}, ${lng.toFixed(4)} (NSW extent)</small>` : "<small>Enter coordinates and Plot on Map</small>"}</div>${ok ? `<a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}" target="_blank" rel="noopener">Open in OpenStreetMap</a>` : ""}</div>`;
}
function tProject(b, isNew) {
  b.innerHTML = `<div class="split"><div class="panel"><div class="grid">
  ${f("Project Name *", "name", { wide: true })}
  ${f("Pre-Gate Project ID", "preGateId", { ro: true })}${f("Gated Project ID (SAP, e.g. PROJ-123456)", "sapId")}
  ${f("Gate Status", "gate", { options: META.gates })}${f("Project Status", "status", { options: META.statuses })}
  ${f("Asset Type", "assetType", { options: ASSET_TYPES })}${f("Asset ID (e.g. BIS-1234)", "assetId")}${f("Risk ID (e.g. JIRA-231)", "riskId")}
  ${f("Ministerial Agenda (Jira ID)", "ministerialAgenda")}${f("Project Manager", "pm")}${f("Prioritization Score", "score", { type: "number" })}
  ${f("P50 Date", "p50", { type: "date" })}${f("P90 Date", "p90", { type: "date" })}${f("Forecast Finish Date", "forecastFinish", { type: "date" })}
  ${f("Project Focus", "projectFocus")}${f("WBS Code", "wbs")}${f("Council Grant", "councilGrant", { check: true })}
  ${f("Longitude", "lng")}${f("Latitude", "lat")}<div style="align-self:end"><button type="button" class="btn ghost" id="plot">Plot on Map</button> ${cur.ministerialAgenda ? `<a class="btn ghost" href="#/jira/${esc(cur.ministerialAgenda)}" id="jira">Open Agenda</a>` : ""}</div>
  </div><p class="muted">Pre-Gate0 ID is assigned automatically when the project is created. Add the SAP Project ID and move to Gate 1+ once formalised in SAP; both IDs are retained.</p></div><div id="mapwrap">${mapPane()}</div></div>`;
  $("#plot").onclick = () => { $("#mapwrap").innerHTML = mapPane(); };
  const j = $("#jira"); if (j) j.onclick = e => { e.preventDefault(); agenda(); };
}
function agenda() {
  modal(`<h2>${esc(cur.ministerialAgenda)} - Ministerial Agenda</h2><p class="muted">Jira integration is simulated in this release.</p><table><tr><th>Item</th><th>Owner</th><th>Status</th></tr><tr><td>Review ${esc(cur.name)} funding</td><td>${esc(cur.pm)}</td><td>Open</td></tr></table><h3>Meeting minutes</h3><p>No minutes recorded.</p>`);
}
function modal(html, onclose) {
  $("#modal").innerHTML = `<div class="bg"><div class="box" role="dialog" aria-modal="true">${html}<div class="bar" style="margin-top:12px"><span class="sp"></span><button class="btn ghost" id="mclose">Close</button></div></div></div>`;
  $("#mclose").onclick = () => { $("#modal").innerHTML = ""; onclose && onclose(); };
}
function readFile(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file); }); }
function csv(t) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"' && t[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}
function uploader(title, hint, onrows, rerender) {
  modal(`<h2>${title}</h2><p class="muted">${hint} Accepted: .csv (Excel files must be saved as CSV first). Max 5MB.</p><input type="file" id="upf" accept=".csv,.xls,.xlsx" aria-label="Upload file"><p id="upm" class="err"></p><button class="btn" id="proc">Process File</button>`, rerender);
  $("#proc").onclick = async () => {
    const file = $("#upf").files[0], m = $("#upm");
    if (!file) { m.textContent = "Choose a file."; return; }
    if (file.size > 5 * 1024 * 1024) { m.textContent = "File exceeds 5MB."; return; }
    if (!/\.csv$/i.test(file.name)) { m.textContent = "Only CSV can be processed; please export your Excel sheet as CSV."; return; }
    const rows = csv(await readFile(file));
    try { onrows(rows); touch(); toast("File processed. Click Save to persist."); $("#modal").innerHTML = ""; rerender(); } catch (e) { m.textContent = e.message; }
  };
}
const objRows = (rows, keys) => {
  const hdr = rows[0].map(h => h.trim().toLowerCase());
  const miss = keys.filter(k => !hdr.includes(k.toLowerCase()));
  if (miss.length) throw new Error("Missing columns: " + miss.join(", "));
  return rows.slice(1).map(r => Object.fromEntries(hdr.map((h, i) => [h, (r[i] || "").trim()])));
};

/* Asset */
function tAsset(b, isNew) {
  const st = sub.asset;
  b.innerHTML = `<nav class="tabs">${["details", "projects", "grants"].map(s => `<a href="#" data-s="${s}" class="${s === st ? "on" : ""}">${s[0].toUpperCase() + s.slice(1)}</a>`).join("")}</nav><div id="subbody"></div>`;
  b.querySelectorAll("[data-s]").forEach(a => a.onclick = e => { e.preventDefault(); sub.asset = a.dataset.s; renderTab(isNew); });
  const sb = $("#subbody");
  if (st === "details") {
    sb.innerHTML = `<div class="panel"><h3>Asset Identification</h3><div class="grid">${f("Asset Name", "asset.name")}${f("Asset ID", "assetId")}${f("Location", "asset.location")}${f("LGA", "asset.lga")}${f("Asset Description", "asset.description", { area: true, wide: true })}${f("Additional Details", "asset.details", { area: true, wide: true })}</div>
    <p><button type="button" class="btn ghost" id="maint">View Asset Maintenance Data App</button></p></div>`;
    $("#maint").onclick = () => modal(`<h2>Asset Maintenance Data - ${esc(cur.assetId)}</h2><p class="muted">Maintenance analytics integration is simulated in this release.</p><div class="grid"><div class="panel"><b>Location</b><br>${esc(cur.asset.location)}</div><div class="panel"><b>Asset Details</b><br>${esc(cur.assetType)} ${esc(cur.assetId)}</div><div class="panel"><b>Crash Data</b><br>No data</div></div><button class="btn" disabled>Predict Maintenance</button>`);
  } else {
    const grants = st === "grants";
    const tbl = async (title, pred) => {
      const d = await api("/projects?assetId=" + encodeURIComponent(cur.assetId || "~~none~~") + "&size=100" + (grants ? "&councilGrant=true" : ""));
      const rows = d.items.filter(pred);
      return `<div class="panel"><h3>${title} <button class="btn ghost" type="button" data-r>↻</button></h3><table><tr><th>Project</th><th>ID</th><th>Gate</th><th>Status</th></tr>${rows.map(p => `<tr><td><a href="#/projects/${p.id}">${esc(p.name)}</a></td><td>${esc(p.sapId || p.preGateId)}</td><td>${esc(p.gate)}</td><td>${esc(p.status)}</td></tr>`).join("") || "<tr><td colspan=4>None</td></tr>"}</table></div>`;
    };
    Promise.all([tbl(grants ? "In-flight Projects based on Grants Approval" : "In-flight Projects", p => p.gate !== "Pre-Gate0"), tbl(grants ? "Pipeline Grants Submission" : "Pipeline Projects", p => p.gate === "Pre-Gate0")]).then(h => {
      sb.innerHTML = h.join(""); sb.querySelectorAll("[data-r]").forEach(x => x.onclick = () => renderTab(isNew));
    });
  }
}

/* Benefits */
function tBenefits(b) {
  const bn = cur.benefits;
  const draw = () => {
    b.innerHTML = `<div class="panel"><h3>Benefit Realization &nbsp; <small>Prioritization Score: ${esc(cur.score)}</small></h3><div class="stages">${STAGES.map(s => { const st = bn.stages[s] || { notes: "", status: "red" }; return `<div class="stage"><b>${s}<span class="dot ${st.status}" data-s="${esc(s)}" role="button" tabindex="0" title="Toggle status"></span></b><textarea data-n="${esc(s)}" aria-label="${esc(s)} notes">${esc(st.notes)}</textarea></div>`; }).join("")}</div></div>
    <div class="panel"><h3>Benefits Register</h3><table><tr><th>Ref</th><th>Benefit</th><th>Status</th><th>RAG</th><th>Target</th><th>Lead</th><th></th></tr>${bn.items.map((r, i) => `<tr><td>${esc(r.ref)}</td><td>${esc(r.name)}</td><td>${esc(r.status)}</td><td>${esc(r.rag)}</td><td>${esc(r.target)}</td><td>${esc(r.lead)}</td><td><button class="btn ghost" data-d="${i}" aria-label="Delete">🗑</button></td></tr>`).join("") || "<tr><td colspan=7>No benefits recorded.</td></tr>"}</table>
    <div class="bar" style="margin-top:10px"><button class="btn" id="addb">Add Benefit</button><button class="btn ghost" id="loadb">Load Benefit Realization Report</button><button class="btn ghost" id="survey">Create Customer Satisfaction Survey</button></div></div>`;
    b.querySelectorAll(".dot").forEach(d => d.onclick = () => { const s = d.dataset.s; bn.stages[s] = bn.stages[s] || { notes: "", status: "red" }; bn.stages[s].status = bn.stages[s].status === "green" ? "red" : "green"; touch(); draw(); });
    b.querySelectorAll("[data-n]").forEach(t => t.oninput = () => { const s = t.dataset.n; bn.stages[s] = bn.stages[s] || { notes: "", status: "red" }; bn.stages[s].notes = t.value; touch(); });
    b.querySelectorAll("[data-d]").forEach(x => x.onclick = () => { bn.items.splice(+x.dataset.d, 1); touch(); draw(); });
    $("#addb").onclick = () => modal(`<h2>Add Benefit</h2><div class="grid"><div><label>Ref No<input id="b_ref"></label></div><div><label>Benefit Name<input id="b_name"></label></div><div><label>Status<input id="b_status"></label></div><div><label>RAG<select id="b_rag"><option>Green</option><option>Amber</option><option>Red</option></select></label></div><div><label>Target completion<input type="date" id="b_target"></label></div><div><label>Lead<input id="b_lead"></label></div></div><button class="btn" id="b_ok">Add</button>`, draw) || ($("#b_ok").onclick = () => { if (!$("#b_name").value.trim()) return; bn.items.push({ ref: $("#b_ref").value, name: $("#b_name").value, status: $("#b_status").value, rag: $("#b_rag").value, target: $("#b_target").value, lead: $("#b_lead").value }); touch(); $("#modal").innerHTML = ""; draw(); });
    $("#loadb").onclick = () => uploader("Load Benefit Realization Report", "Columns: ref, name, status, rag, target, lead.", rows => { const o = objRows(rows, ["ref", "name"]); bn.items = o.map(r => ({ ref: r.ref, name: r.name, status: r.status || "", rag: r.rag || "", target: r.target || "", lead: r.lead || "" })); }, draw);
    $("#survey").onclick = () => { const link = `${location.origin}/survey/${esc(cur.sapId || cur.preGateId)}`; modal(`<h2>Customer Satisfaction Survey</h2><p>Share this link:</p><input readonly value="${link}" id="sl"><p><button class="btn" id="cp">Copy Link</button></p><p class="muted">Survey collection is not part of this release; the link is a placeholder.</p>`); $("#cp").onclick = () => { navigator.clipboard?.writeText($("#sl").value); toast("Link copied."); }; };
  };
  draw();
}

/* Risk */
function tRisk(b) {
  b.innerHTML = `<div class="panel"><h3>Risk Identification</h3><div class="grid">${f("Title", "risk.title", { wide: true })}${f("Risk ID", "riskId")}${f("Asset ID", "assetId", { ro: true })}${f("Category", "risk.category")}</div></div>
  <div class="panel"><h3>Additional Details</h3><div class="grid">${f("Owner", "risk.owner")}${f("Created", "risk.created", { type: "date" })}${f("Due date", "risk.due", { type: "date" })}${f("Status", "risk.status", { options: ["Open", "Mitigating", "Accepted", "Closed"] })}</div></div>
  <div class="panel"><div class="grid">${f("Risk Action", "risk.action", { area: true, wide: true })}${f("Risk Commentary", "risk.commentary", { area: true, wide: true })}</div></div>`;
}

/* Financial */
function tFinancial(b) {
  const fin = cur.financial;
  const draw = () => {
    const rem = (fin.totalFunding || 0) - (fin.spent || 0);
    b.innerHTML = `<div class="panel"><h3>Cost Details</h3><div class="grid">${f("Project Code", "financial.projectCode")}${f("Work Order", "financial.workOrder")}${f("WBS Code", "financial.wbs")}${f("Purchase Order", "financial.purchaseOrder")}</div><p><button class="btn" type="button" id="val">Validate</button></p></div>
    <div class="panel"><div class="grid">${f("Total Funding ($)", "financial.totalFunding", { type: "number" })}${f("Financial Year", "financial.fy")}${f("Current Spent ($)", "financial.spent", { type: "number" })}<div><label>Remaining</label><b id="rem" class="${rem < 0 ? "err" : ""}">${money(rem)}</b></div></div>
    <p><button class="btn ghost" type="button" id="ms">Open/Load Project Milestones</button></p></div>
    <div class="panel"><h3>Supporting Documents</h3><p class="muted">Word, Excel or PDF only, 5MB max per file. Metadata is recorded; file storage requires the document store integration.</p><input type="file" id="doc" multiple accept=".doc,.docx,.xls,.xlsx,.pdf" aria-label="Add document"><table>${fin.documents.map((d, i) => `<tr><td>${esc(d.name)}</td><td>${(d.size / 1024).toFixed(0)} KB</td><td>${esc((d.at || "").slice(0, 10))}</td><td><button class="btn ghost" data-d="${i}" aria-label="Delete">🗑</button></td></tr>`).join("")}</table></div>`;
    $("#val").onclick = async () => { try { const r = await api("/validate-cost", { method: "POST", body: { wbs: fin.wbs, projectCode: fin.projectCode, sapId: cur.sapId } }); toast(r.message, r.ok); } catch (e) { toast(e.message, false); } };
    $("#ms").onclick = milestones;
    $("#doc").onchange = e => { for (const file of e.target.files) { if (!/\.(docx?|xlsx?|pdf)$/i.test(file.name)) { toast(`${file.name}: only Word, Excel or PDF allowed.`, false); continue; } if (file.size > 5 * 1024 * 1024) { toast(`${file.name} exceeds 5MB.`, false); continue; } fin.documents.push({ name: file.name, size: file.size, at: new Date().toISOString() }); } touch(); draw(); };
    b.querySelectorAll("[data-d]").forEach(x => x.onclick = () => { fin.documents.splice(+x.dataset.d, 1); touch(); draw(); });
    bind();
    ["totalFunding", "spent"].forEach(k => { const el = $(`[data-p="financial.${k}"]`); el.addEventListener("input", () => { $("#rem").textContent = money(fin.totalFunding - fin.spent); }); });
  };
  const milestones = () => {
    const ms = fin.milestones;
    const dates = ms.flatMap(m => [Date.parse(m.start), Date.parse(m.end)]).filter(x => !isNaN(x));
    const lo = Math.min(...dates), hi = Math.max(...dates), span = Math.max(1, hi - lo);
    modal(`<h2>Project Milestones</h2><div class="gantt">${ms.map(m => { const s = Date.parse(m.start), e = Date.parse(m.end); const ok = !isNaN(s) && !isNaN(e); return `<div class="row"><span>${esc(m.name)}</span><div class="track" title="${esc(m.start)} - ${esc(m.end)}: ${esc(m.status)}">${ok ? `<div class="fill ${esc(m.status)}" style="left:${(s - lo) / span * 100}%;width:${Math.max(2, (e - s) / span * 100)}%"></div>` : ""}</div></div>`; }).join("") || "<p>No milestones.</p>"}</div>
    <p><span class="pill Achieved">Achieved</span> <span class="pill In\\ Progress">In Progress</span> <span class="pill Yet\\ to\\ be\\ achieved">Yet to be achieved</span></p>
    <table><tr><th>Milestone</th><th>Start</th><th>End</th><th>Status</th><th>Description</th></tr>${ms.map(m => `<tr><td>${esc(m.name)}</td><td>${esc(m.start)}</td><td>${esc(m.end)}</td><td>${esc(m.status)}</td><td>${esc(m.description)}</td></tr>`).join("")}</table>
    <div class="bar" style="margin-top:10px"><button class="btn" id="mload">Upload CSV</button><button class="btn ghost" id="mdl">Download</button></div>`, draw);
    $("#mload").onclick = () => uploader("Load Project Milestones", "Columns: name, start, end, status, description. Status: Achieved / In Progress / Yet to be achieved.", rows => {
      const o = objRows(rows, ["name", "start", "end", "status"]); const ok = ["Achieved", "In Progress", "Yet to be achieved"];
      o.forEach((r, i) => { if (!ok.includes(r.status)) throw new Error(`Row ${i + 2}: invalid status "${r.status}".`); });
      fin.milestones = o.map(r => ({ name: r.name, start: r.start, end: r.end, status: r.status, description: r.description || "" }));
    }, milestones);
    $("#mdl").onclick = () => { const t = "name,start,end,status,description\n" + ms.map(m => [m.name, m.start, m.end, m.status, m.description].map(x => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",")).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/csv" })); a.download = "milestones.csv"; a.click(); };
  };
  draw();
}

/* Schedule */
function tSchedule(b) {
  const sch = cur.schedule;
  const days = (s, e) => s && e ? Math.max(0, Math.round((Date.parse(e) - Date.parse(s)) / 864e5) + 1) : 0;
  const draw = () => {
    b.innerHTML = `<div class="panel"><h3>Main Task</h3><div class="grid"><div><label>Title<input id="mt"></label></div><div><label>Start<input type="date" id="ms"></label></div><div><label>End<input type="date" id="me"></label></div></div><p><button class="btn" id="cm">Create Main Task</button></p></div>
    <div class="panel"><h3>Sub Task</h3><div class="grid"><div><label>Main Task<select id="sp">${sch.map((t, i) => `<option value="${i}">${esc(t.title)}</option>`).join("")}</select></label></div><div><label>Title<input id="st"></label></div><div><label>Start<input type="date" id="ss"></label></div><div><label>End<input type="date" id="se"></label></div></div><p><button class="btn" id="cs">Create Sub Task</button></p></div>
    <div class="panel"><h3>Project Schedule</h3><table><tr><th>Task</th><th>Start</th><th>End</th><th>Days</th><th>Status</th><th></th></tr>${sch.map((t, i) => `<tr class="main-t"><td>${esc(t.title)}</td><td>${esc(t.start)}</td><td>${esc(t.end)}</td><td>${days(t.start, t.end)}</td><td>${esc(t.status)}</td><td><button class="btn ghost" data-m="${i}" aria-label="Delete">🗑</button></td></tr>${(t.subtasks || []).map((s, j) => `<tr class="sub-t"><td>&nbsp;&nbsp;↳ ${esc(s.title)}</td><td>${esc(s.start)}</td><td>${esc(s.end)}</td><td>${days(s.start, s.end)}</td><td>${esc(s.status)}</td><td><button class="btn ghost" data-m="${i}" data-s="${j}" aria-label="Delete">🗑</button></td></tr>`).join("")}`).join("") || "<tr><td colspan=6>No tasks.</td></tr>"}</table><p class="muted">Use the Save button below to save the schedule.</p></div>`;
    const chk = (t, s, e) => { if (!t.trim()) return toast("Title is required.", false), false; if (s && e && e < s) return toast("End date must not be before start date.", false), false; return true; };
    $("#cm").onclick = () => { if (!chk($("#mt").value, $("#ms").value, $("#me").value)) return; sch.push({ title: $("#mt").value, start: $("#ms").value, end: $("#me").value, status: "NEW", subtasks: [] }); touch(); draw(); };
    $("#cs").onclick = () => { if (!sch.length) return toast("Create a main task first.", false); if (!chk($("#st").value, $("#ss").value, $("#se").value)) return; sch[+$("#sp").value].subtasks.push({ title: $("#st").value, start: $("#ss").value, end: $("#se").value, status: "NEW" }); touch(); draw(); };
    b.querySelectorAll("[data-m]").forEach(x => x.onclick = () => { const i = +x.dataset.m; if (x.dataset.s !== undefined) sch[i].subtasks.splice(+x.dataset.s, 1); else sch.splice(i, 1); touch(); draw(); });
  };
  draw();
}

/* Audit */
function tAudit(b) {
  b.innerHTML = `<div class="panel"><h3>Audit Log</h3><table><tr><th>When (UTC)</th><th>User</th><th>Action</th><th>Field</th><th>From</th><th>To</th></tr>${[...cur.audit].reverse().map(a => `<tr><td>${esc(a.at.replace("T", " ").slice(0, 19))}</td><td>${esc(a.user)}</td><td>${esc(a.action)}</td><td>${esc(a.field)}</td><td>${esc(a.from)}</td><td>${esc(a.to)}</td></tr>`).join("") || "<tr><td colspan=6>No entries.</td></tr>"}</table></div>`;
}

(async () => {
  META = await api("/meta");
  $("#user").innerHTML = `<span>${esc(META.user)}</span><span class="av">${esc(META.user.split(" ").map(x => x[0]).join(""))}</span>`;
  route();
})();
