"""
Baut ein eigenstaendiges HTML-Dashboard mit eingebetteten Daten.
Weil die Stellen direkt in die HTML-Datei geschrieben werden, funktioniert
das Dashboard per einfachem Doppelklick -- ganz ohne lokalen Server.
"""

import json

TEMPLATE = """<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pflege-Stellen Schweiz</title>
<style>
  :root { --bg:#0f1419; --card:#1a2230; --line:#2a3548; --txt:#e6edf3;
          --muted:#8b98a9; --accent:#4f9cf9; --green:#2ea043; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--txt);
         font-family:system-ui,Segoe UI,Roboto,sans-serif; }
  header { padding:20px 24px; border-bottom:1px solid var(--line);
           position:sticky; top:0; background:var(--bg); z-index:5; }
  h1 { margin:0 0 4px; font-size:20px; }
  .sub { color:var(--muted); font-size:13px; }
  .controls { display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }
  input, select { background:var(--card); color:var(--txt);
    border:1px solid var(--line); border-radius:8px; padding:9px 12px; font-size:14px; }
  input[type=text] { flex:1; min-width:200px; }
  .wrap { padding:18px 24px; display:grid; gap:12px;
          grid-template-columns:repeat(auto-fill,minmax(330px,1fr)); }
  .card { background:var(--card); border:1px solid var(--line);
          border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:8px; }
  .card h3 { margin:0; font-size:15px; line-height:1.3; }
  .card h3 a { color:var(--txt); text-decoration:none; }
  .card h3 a:hover { color:var(--accent); }
  .row { color:var(--muted); font-size:13px; }
  .tags { display:flex; gap:6px; flex-wrap:wrap; margin-top:2px; }
  .tag { font-size:11px; padding:3px 8px; border-radius:20px;
         background:#22304a; color:#bcd2f0; }
  .tag.src { background:#13351f; color:#8fe3ab; }
  .tag.rmp { background:#3a2a13; color:#f0cf8f; }
  .btn { margin-top:auto; align-self:flex-start; background:var(--accent);
         color:#031227; text-decoration:none; font-weight:600; font-size:13px;
         padding:8px 14px; border-radius:8px; }
  .empty { padding:40px; text-align:center; color:var(--muted); }
  footer { padding:16px 24px; color:var(--muted); font-size:12px;
           border-top:1px solid var(--line); }
</style>
</head>
<body>
<header>
  <h1>Pflege-Stellen Schweiz</h1>
  <div class="sub">__COUNT__ Stellen &middot; aktualisiert __GENERATED__</div>
  <div class="controls">
    <input type="text" id="q" placeholder="Suche: Titel, Firma, Ort ...">
    <select id="src"><option value="">Alle Quellen</option></select>
    <select id="cant"><option value="">Alle Kantone</option></select>
    <select id="sort">
      <option value="date">Neueste zuerst</option>
      <option value="company">Firma A-Z</option>
    </select>
  </div>
</header>
<div class="wrap" id="wrap"></div>
<footer>Quellen: job-room.ch (Bund/SECO) + Indeed/LinkedIn/Google via JobSpy.
  Erzeugt von ch-pflege-jobs.</footer>
<script>
const JOBS = __DATA__;
const wrap = document.getElementById('wrap');
const q = document.getElementById('q');
const srcSel = document.getElementById('src');
const cantSel = document.getElementById('cant');
const sortSel = document.getElementById('sort');

[...new Set(JOBS.map(j=>j.source).filter(Boolean))].sort().forEach(s=>{
  const o=document.createElement('option'); o.value=s; o.textContent=s; srcSel.appendChild(o);
});
[...new Set(JOBS.map(j=>j.canton).filter(Boolean))].sort().forEach(c=>{
  const o=document.createElement('option'); o.value=c; o.textContent=c; cantSel.appendChild(o);
});

function esc(s){ return (s||'').replace(/[&<>"]/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }

function render(){
  const term = q.value.toLowerCase();
  const src = srcSel.value, cant = cantSel.value;
  let list = JOBS.filter(j=>{
    const hay = (j.title+' '+j.company+' '+j.location).toLowerCase();
    return (!term || hay.includes(term)) && (!src || j.source===src) && (!cant || j.canton===cant);
  });
  if (sortSel.value==='company') list.sort((a,b)=>(a.company||'').localeCompare(b.company||''));
  else list.sort((a,b)=>(b.date_posted||'').localeCompare(a.date_posted||''));

  wrap.innerHTML = list.length ? '' : '<div class="empty">Keine Treffer.</div>';
  list.forEach(j=>{
    const card=document.createElement('div'); card.className='card';
    const rmp = j.reporting_obligation ? '<span class="tag rmp">meldepflichtig</span>' : '';
    card.innerHTML =
      '<h3><a href="'+esc(j.url)+'" target="_blank" rel="noopener">'+esc(j.title||'(ohne Titel)')+'</a></h3>'+
      '<div class="row">'+esc(j.company||'')+(j.location?' &middot; '+esc(j.location):'')+'</div>'+
      '<div class="tags"><span class="tag src">'+esc(j.source)+'</span>'+
        (j.canton?'<span class="tag">'+esc(j.canton)+'</span>':'')+
        (j.workload?'<span class="tag">'+esc(j.workload)+'</span>':'')+
        (j.date_posted?'<span class="tag">'+esc(j.date_posted)+'</span>':'')+ rmp +'</div>'+
      '<a class="btn" href="'+esc(j.url)+'" target="_blank" rel="noopener">Stelle ansehen</a>';
    wrap.appendChild(card);
  });
}
[q,srcSel,cantSel,sortSel].forEach(el=>el.addEventListener('input',render));
render();
</script>
</body>
</html>
"""


def build_dashboard(meta, path):
    html = (TEMPLATE
            .replace("__COUNT__", str(meta["count"]))
            .replace("__GENERATED__", meta["generated_at"].replace("T", " "))
            .replace("__DATA__", json.dumps(meta["jobs"], ensure_ascii=False)))
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
