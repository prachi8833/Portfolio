/* Deep-dive renderer: builds UI previews, tech stacks, API tables, flow diagrams and code blocks
   from the data in deep-data.js, and wires them into the existing single-page portfolio. */
(function () {
  const D = window.PF_DATA;
  if (!D) return;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- tiny syntax highlighter ---------- */
  const KW = 'const|let|var|function|return|async|await|if|else|for|foreach|while|new|try|catch|throw|true|false|null|typeof|of|in|param|switch|case|break|import|from|export|class|this|process|exports|handler|Where-Object|ForEach-Object|Select-Object|Connect-MgGraph|Invoke-MgGraphRequest|Get-AppxPackage|Set-ItemProperty|Test-Path|Out-File';
  const RX = new RegExp('(\\/\\/.*|^\\s*#.*|&lt;!--.*?--&gt;)|("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'|`[^`]*`)|\\b(' + KW + ')\\b|\\b(\\d+)\\b', 'gm');
  const hl = code => esc(code).replace(RX, (m, c, s, k, n) =>
    c ? `<span class="tk-c">${c}</span>` : s ? `<span class="tk-s">${s}</span>` : k ? `<span class="tk-k">${k}</span>` : `<span class="tk-n">${n}</span>`);
  const codeBlock = c => `<div class="cb"><div class="cb-h"><span>${esc(c.title)}</span><span>${esc(c.lang)}</span></div><pre>${hl(c.src)}</pre></div>`;

  /* ---------- UI mockups (sample data only) ---------- */
  const chrome = (url, inner, light) => `<div class="mk${light ? ' light' : ''}"><div class="mk-bar"><i></i><i></i><i></i><div class="mk-url">${esc(url)}</div></div>${inner}</div>`;
  const cell = c => {
    c = String(c);
    if (c[0] === '@') { const [k, t] = c.slice(1).split('|'); return `<span class="bd ${k}">${esc(t)}</span>`; }
    if (c[0] === '#') { const [k, t] = c.slice(1).split('|'); return `<span class="mk-chip ${k === 'chip' ? '' : k}">${esc(t)}</span>`; }
    return esc(c);
  };
  const MOCK = {
    dash(m) {
      const nav = m.nav.map((n, i) => `<div class="mk-nav${i === m.active ? ' on' : ''}">${esc(n[0])}${n[1] ? `<em>${n[1]}</em>` : ''}</div>`).join('');
      const kp = (m.kpis || []).map(k => `<div class="mk-kpi" style="--c:${k[2] || '#4a8fd4'}"><b>${esc(k[0])}</b><span>${esc(k[1])}</span></div>`).join('');
      const steps = m.steps ? `<div class="mk-steps">${m.steps[0].map((s, i) => `<div class="mk-step ${i < m.steps[1] ? 'done' : i === m.steps[1] ? 'now' : ''}">${esc(s)}</div>`).join('')}</div>` : '';
      const tbl = m.rows ? `<table class="mk-tbl"><thead><tr>${m.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${m.rows.map(r => `<tr>${r.map(c => `<td>${cell(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '';
      const bars = m.bars ? `<div class="mk-bars" style="margin-top:14px">${m.bars.map(b => `<div class="mk-bar-row"><span>${esc(b[0])}</span><div><i style="width:${b[1]}%"></i></div><span>${esc(b[2])}</span></div>`).join('')}</div>` : '';
      const cal = m.cal ? `<div class="mk-cal" style="margin-top:12px">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<span class="h">${d}</span>`).join('')}${m.cal.map(v => `<span>${v[0]}${v[1] ? `<b>${v[1]}</b>` : ''}</span>`).join('')}</div>` : '';
      return chrome(m.url, `<div class="mk-body"><div class="mk-side"><div class="mk-brand"><b></b>${esc(m.brand)}</div>${nav}</div><div class="mk-main"><div class="mk-top"><h5>${esc(m.title)}</h5><div style="display:flex;gap:6px"><span class="mk-btn ghost">${esc(m.btn2 || 'Export')}</span><span class="mk-btn">${esc(m.btn || '+ New')}</span></div></div>${kp ? `<div class="mk-kpis">${kp}</div>` : ''}${steps}${tbl}${bars}${cal}</div></div>`);
    },
    site(m) {
      return chrome(m.url, `<div class="mk-site"><div class="mk-site-l"><h6>${esc(m.h)}</h6><p>${esc(m.p)}</p><b>${esc(m.cta)}</b></div><div class="mk-site-r"></div></div><div class="mk-site-form">${m.fields.map(f => `<span>${esc(f)}</span>`).join('')}<b>${esc(m.submit)}</b></div>`, true);
    },
    kids(m) {
      return chrome(m.url, `<div class="mk-kids"><h5>${esc(m.h)}</h5><p>${esc(m.p)}</p><div class="mk-kids-grid">${m.tiles.map(t => `<span><i>${t[0]}</i>${esc(t[1])}</span>`).join('')}</div><div class="mk-kids-q"><span>${esc(m.q)}</span><span class="mk-btn" style="background:#f0c46a;color:#2a1c00">${esc(m.qb)}</span></div></div>`);
    },
    wiki(m) {
      return chrome(m.url, `<div class="mk-wiki"><div class="mk-wiki-l"><div class="s">🔍 ${esc(m.search)}</div>${m.cats.map((c, i) => `<div class="c${i === m.active ? ' on' : ''}">${esc(c)}</div>`).join('')}</div><div class="mk-wiki-r"><h5>${esc(m.h)}</h5><span class="bd in">${esc(m.badge)}</span><div class="ln" style="width:92%"></div><div class="ln" style="width:78%"></div><div class="box">${esc(m.box)}</div><div class="ln" style="width:85%"></div><div class="sig"><span class="mk-btn">${esc(m.sign)}</span><span style="color:#8da2c6">${esc(m.signNote)}</span></div></div></div>`);
    },
    mail(m) {
      const p = m.panel;
      const panel = p ? `<div class="ml-panel"><div class="ml-ph"><span class="ml-dot"></span>${esc(p.title)}</div><div class="ml-sub">${esc(p.sub)}</div>${p.rows.map(r => `<div class="ml-row${r[1] === 'new' ? ' hot' : ''}"><span>${esc(r[0])}</span>${r[1] === 'text' ? `<b class="ml-val">${esc(r[2])}</b>` : `<i class="ml-tg${r[1] ? ' on' : ''}"></i>`}</div>`).join('')}${p.foot ? `<div class="ml-foot">${esc(p.foot)}</div>` : ''}</div><div class="ml-arrow"><span>${esc(m.trigger || 'triggers')}</span><svg viewBox="0 0 60 24"><path d="M2 12h50m-8-7 8 7-8 7" fill="none" stroke="#4a8fd4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>` : '';
      const mail = `<div class="ml-mail"><div class="ml-mh"><div class="ml-av">${esc(m.from[0])}</div><div><b>${esc(m.from)}</b><span>to ${esc(m.to)} · just now</span></div></div><div class="ml-subj">${esc(m.subject)}</div><div class="ml-card"><div class="ml-hero"><small>${esc(m.kicker)}</small>${esc(m.h)}<em>${esc(m.sub)}</em></div><div class="ml-body">${m.body.map(b => b[0] === 'row' ? `<div class="ml-step"><span>${esc(b[1])}</span><p>${esc(b[2] || '')}</p></div>` : `<p>${esc(b[1])}</p>`).join('')}${m.cta ? `<div class="ml-cta">${esc(m.cta)}</div>` : ''}</div><div class="ml-ft">${esc(m.footer)}</div></div></div>`;
      return chrome(m.url, `<div class="ml">${panel}${mail}</div>`);
    },
    term(m) {
      return chrome(m.url, `<div class="mk-term">${m.lines.map(l => `<div class="${l[0]}">${esc(l[1])}</div>`).join('')}</div>`);
    },
    home(m) {
      const col = c => `<div style="background:#0f1c35;border:1px solid var(--border);border-radius:8px;padding:11px"><div style="font-weight:700;color:#fff;margin-bottom:8px;font-size:11.5px">${esc(c[0])}</div>${c[1].map(r => `<div style="padding:7px 0;border-top:1px solid rgba(74,143,212,.1);display:flex;justify-content:space-between;gap:8px;color:#cfd9ea"><span>${esc(r[0])}</span>${r[1] ? `<span class="bd ${r[2] || 'in'}">${esc(r[1])}</span>` : ''}</div>`).join('')}</div>`;
      return chrome(m.url, `<div style="background:linear-gradient(135deg,#1d4f91,#4a8fd4);padding:20px;color:#fff;font-weight:800;font-size:15px">${esc(m.hero)}</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px">${m.cols.map(col).join('')}</div>`);
    }
  };
  const mockHTML = m => MOCK[m.type](m);

  /* ---------- Power Automate flow diagrams ---------- */
  const NK = { trigger: 'Trigger', sp: 'SharePoint', http: 'HTTP', cond: 'Condition', email: 'Outlook', var: 'Variable', dv: 'Dataverse', xl: 'Excel', loop: 'Apply to each', resp: 'Response' };
  function nodes(list) {
    return list.map((n, i) => {
      const line = i < list.length - 1 ? '<div class="fl-line"></div>' : '';
      if (n.chips) return `<div class="fl-n var"><i>Parallel branches</i><b>${esc(n.title)}</b><div class="mk-chips" style="margin-top:8px">${n.chips.map(c => `<span class="mk-chip">${esc(c)}</span>`).join('')}</div></div>${line}`;
      if (n.split) {
        const cols = n.split.map(s => `<div><div class="fl-lbl ${s.cls || 'c'}">${esc(s.label)}</div><div class="fl-col">${nodes(s.nodes)}</div></div>`).join('');
        return `<div class="fl-n cond"><i>${n.k === 'sw' ? 'Switch' : 'Condition'}</i><b>${esc(n.title)}</b>${n.d ? `<span>${esc(n.d)}</span>` : ''}</div><div class="fl-line"></div><div class="fl-split" style="grid-template-columns:repeat(${n.split.length},1fr)">${cols}</div>${line}`;
      }
      return `<div class="fl-n ${n.k}"><i>${NK[n.k]}</i><b>${esc(n.t)}</b>${n.d ? `<span>${esc(n.d)}</span>` : ''}</div>${line}`;
    }).join('');
  }
  const flowHTML = f => `<div class="flow"><div class="flow-h"><h4>${esc(f.name)}</h4><span class="fl-env">${esc(f.env)}</span></div><p class="flow-d">${esc(f.desc)}</p><div class="mf-lbl">At a glance</div>${miniFlow(f)}<details class="fl-det"><summary>Show full step-by-step diagram</summary><div class="fl-col" style="margin-top:14px">${nodes(f.nodes)}</div></details></div>`;
  const legend = `<div class="fl-legend">${[['trigger', '#4ade80'], ['sp', '#a78bfa'], ['http', '#5fa0e8'], ['cond', '#f0c46a'], ['email', '#2dd4bf'], ['dv', '#fb923c'], ['xl', '#34d399'], ['var', '#94a3b8']].map(l => `<span style="--c:${l[1]}">${NK[l[0]]}</span>`).join('')}</div>`;


  /* ---------- architecture diagram (inline SVG) ---------- */
  const KC = { ui: '#5fa0e8', sp: '#a78bfa', flow: '#2dd4bf', ext: '#fb923c', data: '#94a3b8', email: '#4ade80' };
  const KT = { ui: 'Front end', sp: 'SharePoint / host', flow: 'Power Automate', ext: 'External / API', data: 'Data', email: 'Email / Teams' };
  function sysSVG(sys) {
    const n = sys.length, w = 150, gap = 76, h = 96, W = n * w + (n - 1) * gap + 20;
    let s = `<svg viewBox="0 0 ${W} 150" class="sys-svg" xmlns="http://www.w3.org/2000/svg"><defs><marker id="ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#4a8fd4"/></marker></defs>`;
    sys.forEach((x, i) => {
      const X = 10 + i * (w + gap), c = KC[x[1]];
      s += `<g><rect x="${X}" y="20" width="${w}" height="${h}" rx="12" fill="#0a1628" stroke="${c}" stroke-opacity=".7" stroke-width="1.5"/><rect x="${X}" y="20" width="${w}" height="6" rx="3" fill="${c}" fill-opacity=".9"/>`;
      const words = x[0].split(' '); const lines = [], max = 16; let cur = '';
      words.forEach(wd => { if ((cur + ' ' + wd).trim().length > max) { lines.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim(); }); lines.push(cur);
      lines.slice(0, 3).forEach((l, k) => { s += `<text x="${X + w / 2}" y="${62 + (k - (lines.length - 1) / 2) * 16}" text-anchor="middle" font-size="13" font-weight="700" fill="#f0f5ff" font-family="Inter,sans-serif">${esc(l)}</text>`; });
      s += `<text x="${X + w / 2}" y="${20 + h - 10}" text-anchor="middle" font-size="9" fill="${c}" font-family="Inter,sans-serif" letter-spacing=".08em">${KT[x[1]].toUpperCase()}</text></g>`;
      if (i < n - 1) {
        const x1 = X + w + 4, x2 = X + w + gap - 4;
        s += `<line x1="${x1}" y1="68" x2="${x2}" y2="68" stroke="#4a8fd4" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#ar)"><animate attributeName="stroke-dashoffset" from="18" to="0" dur="1.2s" repeatCount="indefinite"/></line>`;
        if (x[2]) s += `<text x="${(x1 + x2) / 2}" y="58" text-anchor="middle" font-size="9.5" fill="#8a9bbb" font-family="Inter,sans-serif">${esc(x[2])}</text>`;
      }
    });
    return s + '</svg>';
  }
  const sysFor = p => (p.sys || D.sys[p.id || p.target]);
  const miniPipe = p => { const s = sysFor(p); return s ? `<div class="mini-pipe">${s.map((x, i) => `<span style="--c:${KC[x[1]]}" title="${esc(x[0])}"></span>${i < s.length - 1 ? '<em></em>' : ''}`).join('')}</div>` : ''; };

  /* ---------- "at a glance" strip for a flow ---------- */
  function miniFlow(f) {
    const short = t => (t.length > 26 ? t.slice(0, 25) + '…' : t);
    const items = f.nodes.map(n => n.chips ? { k: 'var', t: n.title } : n.split ? { k: 'cond', t: n.title, d: n.split.length } : { k: n.k, t: n.t });
    return `<div class="mf">${items.map((x, i) => `<div class="mf-n ${x.k}"><i>${x.d ? '◆' : (i + 1)}</i><span>${esc(short(x.t))}</span>${x.d ? `<em>${x.d} paths</em>` : ''}</div>${i < items.length - 1 ? '<b>›</b>' : ''}`).join('')}</div>`;
  }

  /* ---------- deep-dive tabs for a project ---------- */
  let uid = 0;
  function deepHTML(p) {
    const id = 'dd' + (++uid);
    const tabs = [];
    const sy = sysFor(p);
    if (sy && !p.id) tabs.push(['Architecture', `<div class="dd-h">System architecture</div><div class="sys-wrap">${sysSVG(sy)}</div><div class="sys-key">${Object.keys(KC).filter(k => sy.some(x => x[1] === k)).map(k => `<span style="--c:${KC[k]}">${KT[k]}</span>`).join('')}</div>${p.flows && p.flows.length ? `<div class="dd-h">Flows at a glance</div>${p.flows.map(k => `<div class="mf-lbl">${esc(D.flows[k].name)}</div>${miniFlow(D.flows[k])}`).join('')}` : ''}`]);
    if (p.mock) tabs.push(['UI Preview', `<div class="dd-h">Interface preview</div>${mockHTML(p.mock)}<p class="dd-note">Illustrative recreation built with sample data — real employee, tenant and financial data is never shown on this site.</p>${p.features2 ? '' : ''}`]);
    if (p.stack) {
      const s = p.stack;
      const card = (t, arr) => `<div class="stk-card"><h4>${t}</h4>${arr.map(r => `<div class="stk-row"><b>${esc(r[0])}</b><span>${esc(r[1])}</span></div>`).join('')}</div>`;
      let h = `<div class="dd-h">Technology stack</div><div class="stk-grid">${card('Languages', s.lang)}${card('Platforms &amp; services', s.plat)}${card('Data &amp; storage', s.data)}</div>`;
      if (p.apis) h += `<div class="dd-h">APIs &amp; integrations</div><table class="api-tbl"><thead><tr><th>API</th><th>Endpoint / operation</th><th>Used for</th></tr></thead><tbody>${p.apis.map(a => `<tr><td>${esc(a[0])}</td><td><code>${esc(a[1])}</code></td><td>${esc(a[2])}</td></tr>`).join('')}</tbody></table>`;
      if (p.fns) h += `<div class="dd-h">Key functions &amp; modules</div><div class="fn-list">${p.fns.map(f => `<div class="fn-item"><code>${esc(f[0])}</code>${esc(f[1])}</div>`).join('')}</div>`;
      tabs.push(['Tech &amp; APIs', h]);
    }
    if (p.flows && p.flows.length) tabs.push([`Power Automate (${p.flows.length})`, `<div class="dd-h">Cloud flows built for this project</div>${legend}${p.flows.map(k => flowHTML(D.flows[k])).join('')}`]);
    if (p.code && p.code.length) tabs.push(['Code', `<div class="dd-h">Representative snippets</div>${p.code.map(codeBlock).join('')}<p class="dd-note">Simplified excerpts — identifiers, tenant URLs and credentials removed.</p>`]);
    return `<div class="dd" id="${id}"><div class="wf-title">Under the Hood</div><div class="dd-tabs">${tabs.map((t, i) => `<button class="dd-tab${i ? '' : ' on'}" data-i="${i}">${t[0]}</button>`).join('')}</div>${tabs.map((t, i) => `<div class="dd-pane${i ? '' : ' on'}" data-i="${i}">${t[1]}</div>`).join('')}</div>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.dd-tab'); if (!b) return;
    const dd = b.closest('.dd'); const i = b.dataset.i;
    dd.querySelectorAll('.dd-tab').forEach(x => x.classList.toggle('on', x.dataset.i === i));
    dd.querySelectorAll('.dd-pane').forEach(x => x.classList.toggle('on', x.dataset.i === i));
  });

  /* ---------- new case-study pages ---------- */
  const li = a => a.map(x => `<li>${esc(x)}</li>`).join('');
  function pageHTML(p, prev, next) {
    return `<div id="${p.id}" class="page"><div class="cs-wrap">
<div class="cs-sig"><img class="cs-sig-img" src="https://raw.githubusercontent.com/prachi8833/Portfolio/main/initial%20logo%20PP%20Lion.png" alt="PP"/><span class="cs-sig-name">Prachi Patel</span></div>
<div><span class="cs-num">PROJECT ${p.num}</span><span class="cs-cat-tag">${esc(p.catLabel)}</span></div>
<div class="cs-title">${p.title[0]}<br><span class="blue">${p.title[1]}</span></div>
<div class="cs-tagline">${p.tagline.map(esc).join('<span class="tdot">•</span>')}</div>
<p class="cs-desc">${esc(p.desc)}</p>
<div class="cs-badges">${p.badges.map(b => `<div class="cs-badge">${b}</div>`).join('')}</div>
<div class="reveal visible" style="margin-bottom:28px"><div class="dd-h">Architecture at a glance</div><div class="sys-wrap">${sysSVG(sysFor(p))}</div><div class="sys-key">${Object.keys(KC).filter(k => sysFor(p).some(x => x[1] === k)).map(k => `<span style="--c:${KC[k]}">${KT[k]}</span>`).join('')}</div></div>
<div class="psa-grid"><div class="psa-card"><div class="psa-head prob">✗ The Problem</div><ul>${li(p.problem)}</ul></div><div class="psa-card"><div class="psa-head sol">✓ The Solution</div><ul>${li(p.solution)}</ul></div><div class="psa-card"><div class="psa-head arch">⬡ Architecture</div><ul>${li(p.arch)}</ul></div></div>
<div class="workflow-section"><div class="wf-title">How It Works</div><div class="wf-steps cols-${p.steps.length}">${p.steps.map((s, i) => `<div class="wf-step"><div class="wf-n">${i + 1}</div><h4>${esc(s[0])}</h4><p>${esc(s[1])}</p></div>`).join('')}</div></div>
${deepHTML(p)}
<div class="fi-grid"><div><div class="wf-title">Key Features</div><div class="feat-grid">${p.features.map(f => `<div class="feat-item"><div class="feat-icon">${f[0]}</div><div><h4>${esc(f[1])}</h4><p>${esc(f[2])}</p></div></div>`).join('')}</div></div>
<div><div class="wf-title">Outcomes</div><div class="impact-grid">${p.impact.map(i => `<div class="imp-card"><div class="imp-num">${esc(i[0])}</div><div class="imp-label">${esc(i[1])}</div></div>`).join('')}</div></div></div>
<div class="ts-grid"><div class="tech-pills-section"><h4>Tools &amp; Tech</h4><div class="tech-pills">${p.pills.map(t => `<span class="t-pill">${esc(t)}</span>`).join('')}</div></div><div class="summary-section"><h4>Project Summary</h4><div class="summary-box"><p>${esc(p.summary)}</p><div class="cs-quote">${esc(p.quote)}</div></div></div></div>
<div class="cs-nav"><a onclick="showCS('${prev}')">← Previous Project</a>${next ? `<a onclick="showCS('${next}')">Next Project →</a>` : `<a onclick="showPage('projects')">Back to Projects →</a>`}</div>
</div></div>`;
  }
  const cardHTML = p => `<div class="proj-card is-new" data-cat="${p.cat}" onclick="showCS('${p.id}')"><div class="proj-cat"><span class="tab-icon">${p.icon}</span>${esc(p.catLabel)}</div><h3>${esc(p.cardTitle || p.title.join(' ').replace(/<[^>]+>/g, ''))}</h3><p>${esc(p.blurb)}</p>${miniPipe(p)}<div class="proj-pills">${p.pills.slice(0, 4).map(t => `<span class="pp">${esc(t)}</span>`).join('')}</div><a class="view-cs">View Case Study →</a></div>`;

  /* ---------- Tech & Flows page ---------- */
  function stackPage() {
    const all = D.projects.concat(D.extend);
    const apiMap = new Map();
    all.forEach(p => (p.apis || []).forEach(a => { const k = a[0]; if (!apiMap.has(k)) apiMap.set(k, { a, n: [] }); apiMap.get(k).n.push(p.short || p.cardTitle); }));
    const flowKeys = Object.keys(D.flows);
    const langs = D.languages.map(l => `<div class="stk-row"><b>${esc(l[0])}</b><span>${esc(l[1])}</span></div>`).join('');
    const stats = [[14 + D.projects.length + D.also.length, 'Builds documented'], [flowKeys.length, 'Power Automate flows diagrammed'], [apiMap.size, 'APIs integrated'], [D.languages.length, 'Languages & formats']];
    return `<div id="stack" class="page"><div class="pw">
<div class="skills-hero reveal"><div class="sec-tag" style="justify-content:center;">Under the Hood</div><div class="sec-title">Tech, APIs &amp; Automation</div><p class="sec-sub" style="margin:0 auto;">Every dashboard on this site is hand-built — no templates, no low-code shells. Here is the language mix, the APIs wired together, and every Power Automate flow behind them.</p></div>
<div class="stat-big">${stats.map(s => `<div class="imp-card"><div class="imp-num">${s[0]}</div><div class="imp-label">${s[1]}</div></div>`).join('')}</div>
<div class="dd-h">Architecture pattern behind the dashboards</div>
<div class="wf-steps cols-5" style="margin-bottom:8px">${D.pattern.map((s, i) => `<div class="wf-step"><div class="wf-n">${i + 1}</div><h4>${esc(s[0])}</h4><p>${esc(s[1])}</p></div>`).join('')}</div>
<div class="dd-h">Languages, formats &amp; runtimes</div><div class="stk-card" style="columns:2;column-gap:36px">${langs}</div>
<div class="dd-h">API catalog</div>
<table class="api-tbl"><thead><tr><th>API / service</th><th>Operations</th><th>Used in</th></tr></thead><tbody>${[...apiMap.values()].map(v => `<tr><td>${esc(v.a[0])}</td><td><code>${esc(v.a[1])}</code></td><td>${[...new Set(v.n)].map(n => `<span class="api-tag">${esc(n)}</span>`).join('')}</td></tr>`).join('')}</tbody></table>
<div class="dd-h">Power Automate flow gallery</div>${legend}
${flowKeys.map(k => flowHTML(D.flows[k])).join('')}
<div class="dd-h">Core code patterns</div>${D.patterns.map(codeBlock).join('')}
<div class="hire-banner reveal" style="margin-top:36px"><div><h3>Want to see one of these live?</h3><p>Walkthroughs of any dashboard are available on request.</p></div><a class="btn-p" onclick="showPage('contact')">Let's Connect ↗</a></div>
</div></div>`;
  }

  /* ---------- wire everything in ---------- */
  function init() {
    const grid = $('#projGrid');
    const host = $('#cs14').parentNode;
    // 1. new projects: cards + pages
    D.projects.forEach((p, i) => {
      grid.insertAdjacentHTML('beforeend', cardHTML(p));
      const prev = i === 0 ? 'cs14' : D.projects[i - 1].id;
      const next = D.projects[i + 1] ? D.projects[i + 1].id : null;
      $('#certifications').insertAdjacentHTML('beforebegin', pageHTML(p, prev, next));
    });
    // fix "Next" link on the former last page
    const nav14 = $('#cs14 .cs-nav'); if (nav14) nav14.lastElementChild.outerHTML = `<a onclick="showCS('${D.projects[0].id}')">Next Project →</a>`;
    // 2. deep-dives injected into existing case studies
    D.extend.forEach(p => { const pg = document.getElementById(p.target); const nav = pg && pg.querySelector('.cs-nav'); if (nav) nav.insertAdjacentHTML('beforebegin', deepHTML(p)); });
    // 3. filter tab for the new category
    $('#filterTabs').insertAdjacentHTML('beforeend', `<button class="f-tab" onclick="filterProj(event,'web')"><span class="tab-icon">WEB</span>Web &amp; Apps</button>`);
    // 4. "also built" strip
    const personal = Array.from(document.querySelectorAll('#projects .sec-tag')).find(e => /Outside of Work/.test(e.textContent));
    if (personal) personal.insertAdjacentHTML('beforebegin', `<div class="sec-tag reveal" style="margin-top:56px;">More Builds</div><div class="sec-title reveal" style="font-size:1.6rem;margin-bottom:8px;">Also Built</div><p class="sec-sub reveal" style="margin-bottom:24px;">Smaller internal tools and automations that round out the platform.</p><div class="also-grid reveal">${D.also.map(a => `<div class="also-card"><div class="proj-cat">${esc(a.cat)}</div><h4>${esc(a.t)}</h4><p>${esc(a.d)}</p><div class="proj-pills">${a.pills.map(t => `<span class="pp">${esc(t)}</span>`).join('')}</div></div>`).join('')}</div>`);
    // 5. tech & flows page + nav item
    $('#certifications').insertAdjacentHTML('beforebegin', stackPage());
    const projLi = Array.from(document.querySelectorAll('.nav-links li')).find(l => /Projects/.test(l.textContent));
    projLi.insertAdjacentHTML('afterend', `<li><a href="#" onclick="nav(event,'stack')">Tech &amp; Flows</a></li>`);
    // nav highlight for the new page
    const orig = window.showPage;
    window.showPage = function (id) {
      orig(id);
      if (id === 'stack') document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.textContent.trim() === 'Tech & Flows'));
    };
    // 6. headline counts on projects hero
    const sub = $('.proj-hero-sub'); if (sub) sub.insertAdjacentHTML('afterend', `<p class="sec-sub" style="margin-top:-6px"><b style="color:var(--blue2)">${14 + D.projects.length}</b> case studies · <b style="color:var(--blue2)">${Object.keys(D.flows).length}</b> documented Power Automate flows · built end-to-end in JavaScript, PowerShell &amp; the Microsoft Graph. <a onclick="showPage('stack')" style="color:var(--blue2);cursor:pointer">See the full stack →</a></p>`);
    if (window.initReveal) setTimeout(initReveal, 100);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
