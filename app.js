const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const state = { packs: [], selected: 0, tab: 'details' };

function fmtBytes(n){ if(!Number.isFinite(n)) return '—'; const u=['B','KB','MB','GB']; let i=0; while(n>=1024&&i<u.length-1){n/=1024;i++;} return `${n.toFixed(i?1:0)} ${u[i]}`; }
function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function stableJSON(x){ return JSON.stringify(x, Object.keys(x || {}).sort()); }
function hashish(s){ let h=0; for(let i=0;i<s.length;i++) h=(Math.imul(31,h)+s.charCodeAt(i))|0; return (h>>>0).toString(16); }
function parseIds(entry){ const urls = entry.downloads || []; for(const url of urls){ const m = String(url).match(/\/data\/([^/]+)\/versions\/([^/]+)\//); if(m) return {projectId:m[1], versionId:m[2]}; } return {projectId:null, versionId:null}; }
function modNameFromPath(path){ return String(path||'').split('/').pop().replace(/\.jar$/i,'').replace(/[-_]?fabric[-_]?/ig,'').replace(/\+?mc?\d+(\.\d+|\.\d+\.\d+|\.\d+\.\d+\.\d+|\.\d+)?/ig,'').replace(/\s+/g,' ').trim(); }
function packDisplayName(p){ return String(p?.fileName||'').replace(/\.mrpack$/i,''); }
function modVersionLabel(v){ const ids=parseIds(v||{}); return ids.versionId || String(v?.path||'').split('/').pop().replace(/\.jar$/i,'') || '—'; }
function modDiffName(d){ const v=(d.vals||[]).find(Boolean); return v ? (v.displayName||modNameFromPath(v.path)||d.key) : d.key; }
function modDiffRank(d){ if((d.vals||[]).some(v=>!v)) return 0; const versions=new Set((d.vals||[]).map(v=>modVersionLabel(v))); return versions.size>1 ? 1 : 2; }
function modKey(entry){ const ids=parseIds(entry); if(ids.projectId) return `project:${ids.projectId}`; return `path:${String(entry.path||'').toLowerCase().replace(/[-_]?\d[\w.+-]*/g,'')}`; }
function additionalKey(file){ return file.path; }
function compactEntry(entry){ const ids=parseIds(entry); return {path:entry.path, fileSize:entry.fileSize, env:entry.env||{}, projectId:ids.projectId, versionId:ids.versionId, sha1:entry.hashes?.sha1, sha512:entry.hashes?.sha512, downloads:entry.downloads||[]}; }
function same(a,b){ return JSON.stringify(a)===JSON.stringify(b); }

async function loadPack(file){
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);
  const idxFile = zip.file('modrinth.index.json');
  if(!idxFile) throw new Error(`${file.name}: missing modrinth.index.json`);
  const index = JSON.parse(await idxFile.async('string'));
  const zipEntries = [];
  zip.forEach((path, zf) => { if(path !== 'modrinth.index.json') zipEntries.push({path, dir:zf.dir, size: zf._data?.uncompressedSize ?? null}); });
  const mods = (index.files||[]).filter(f => String(f.path||'').startsWith('mods/')).map(f => ({...f, ids:parseIds(f), displayName: modNameFromPath(f.path), key:modKey(f)}));
  const additionalIndexFiles = (index.files||[]).filter(f => !String(f.path||'').startsWith('mods/')).map(f => ({...f, key:additionalKey(f)}));
  const overrideFiles = zipEntries.filter(e => !e.dir).map(e => ({path:e.path, fileSize:e.size, source:'zip override', key:e.path}));
  return { fileName:file.name, fileSize:file.size, loadedAt:new Date(), index, rawIndex:index, mods, additionalFiles:[...additionalIndexFiles, ...overrideFiles], zipEntries };
}

async function handleFiles(files){
  const errors=[];
  for(const file of files){
    try{ state.packs.push(await loadPack(file)); }
    catch(e){ errors.push(e.message || String(e)); }
  }
  if(state.packs.length && state.selected >= state.packs.length) state.selected = state.packs.length-1;
  render();
  if(errors.length) showNotice(errors.map(esc).join('<br>'), 'err');
}

function showNotice(html, cls='ok'){
  const n=document.createElement('div'); n.className=cls; n.innerHTML=html; $('.main').prepend(n); setTimeout(()=>n.remove(), 6500);
}

function render(){ renderSidebar(); renderDetails(); renderCompare(); }
function renderSidebar(){
  const list=$('#packList');
  if(!state.packs.length){ list.innerHTML='<div class="empty">No packs loaded yet.</div>'; return; }
  list.innerHTML=state.packs.map((p,i)=>`<div class="pack ${i===state.selected?'active':''}" data-i="${i}">
    <div class="name">${esc(packDisplayName(p))}</div>
    <div class="meta"><span class="tag">${esc(p.index.dependencies?.minecraft||'unknown MC')}</span><span class="tag">${esc(p.index.dependencies?.['fabric-loader']||p.index.dependencies?.forge||'loader?')}</span><span class="tag">${p.mods.length} mods</span><span class="tag">${p.additionalFiles.length} extra</span></div>
  </div>`).join('');
  $$('.pack', list).forEach(el=>el.onclick=()=>{state.selected=Number(el.dataset.i); render();});
}

function metadataRows(p){
  const dep=p.index.dependencies||{};
  return [
    ['Pack name',p.index.name],['Version ID',p.index.versionId],['Game',p.index.game],['Format',p.index.formatVersion],
    ['Minecraft',dep.minecraft],['Fabric Loader',dep['fabric-loader']],['Forge',dep.forge],['NeoForge',dep.neoforge],
    ['Uploaded file',packDisplayName(p)],['File size',fmtBytes(p.fileSize)],['Mods',p.mods.length],['Additional files',p.additionalFiles.length]
  ].filter(r=>r[1]!=null&&r[1] !== '');
}
function metaDisplayValue(v){ return typeof v==='object' ? JSON.stringify(v) : String(v ?? '—'); }
function metadataCards(p){
  const rows=metadataRows(p);
  return `<div class="metaSlimWrap"><table class="metadataTable"><thead><tr><th>Metadata</th><th>Value</th></tr></thead><tbody>${rows.map(([k,v])=>`<tr><td class="metaKey">${esc(k)}</td><td class="metaVal" title="${esc(metaDisplayValue(v))}">${esc(metaDisplayValue(v))}</td></tr>`).join('')}</tbody></table></div>`;
}
function renderDetails(){
  const root=$('#details');
  if(!state.packs.length){ root.innerHTML='<div class="empty">Upload a pack to inspect its metadata, mods, and additional files.</div>'; return; }
  const p=state.packs[state.selected];
  root.innerHTML=`
    <h2>${esc(packDisplayName(p))}</h2>
    <div class="tabs miniTabs">
      <button class="tab active" data-sub="meta">Overall metadata</button>
      <button class="tab" data-sub="mods">Mods <span class="muted">${p.mods.length}</span></button>
      <button class="tab" data-sub="files">Additional files <span class="muted">${p.additionalFiles.length}</span></button>
      <button class="tab" data-sub="raw">Raw index</button>
    </div>
    <div class="subsection" id="sub-meta">${metadataCards(p)}</div>
    <div class="subsection" id="sub-mods" style="display:none">${modsView(p)}</div>
    <div class="subsection" id="sub-files" style="display:none">${filesView(p)}</div>
    <div class="subsection" id="sub-raw" style="display:none"><pre class="raw">${esc(JSON.stringify(p.rawIndex,null,2))}</pre></div>`;
  $$('.miniTabs .tab', root).forEach(btn=>btn.onclick=()=>{
    $$('.miniTabs .tab', root).forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    $$('.subsection', root).forEach(s=>s.style.display='none'); $(`#sub-${btn.dataset.sub}`, root).style.display='block';
  });
  bindSearch(root);
}
function modsView(p){
  return `<div class="searchbar"><input class="input" data-filter="mods" placeholder="Filter mods by name, path, project/version id…"><span class="pill">${p.mods.length} mods</span></div><div class="fileList"><table data-table="mods"><thead><tr><th>Mod</th><th>Version</th><th>Details</th></tr></thead><tbody>${p.mods.map(m=>`<tr data-text="${esc([m.displayName,m.path,m.ids.projectId,m.ids.versionId].join(' ').toLowerCase())}"><td><strong>${esc(m.displayName)}</strong></td><td><span class="tag">${esc(modVersionLabel(m))}</span></td><td><details><summary>Expand info</summary>${modInfoList(m)}</details></td></tr>`).join('')}</tbody></table></div>`;
}
function filesView(p){
  const files=p.additionalFiles;
  if(!files.length) return '<div class="empty">No additional/index files or override files found.</div>';
  return `<div class="searchbar"><input class="input" data-filter="files" placeholder="Filter additional files…"><span class="pill">${files.length} files</span></div><div class="fileList"><table data-table="files"><thead><tr><th>Path</th><th>Source / Env</th><th>Size</th><th>Details</th></tr></thead><tbody>${files.map(f=>`<tr data-text="${esc(String(f.path).toLowerCase())}"><td class="mono">${esc(f.path)}</td><td>${f.source?`<span class="tag">${esc(f.source)}</span>`:envTags(f.env)}</td><td>${fmtBytes(f.fileSize)}</td><td><details><summary>Details</summary><pre class="raw">${esc(JSON.stringify(f,null,2))}</pre></details></td></tr>`).join('')}</tbody></table></div>`;
}
function envTags(env={}){ return Object.entries(env).map(([k,v])=>`<span class="tag ${v==='required'?'good':v==='unsupported'?'bad':'warn'}">${esc(k)}: ${esc(v)}</span>`).join('') || '<span class="muted">—</span>'; }
function envList(env={}){ const entries=Object.entries(env); return entries.length ? `<span class="envList">${entries.map(([k,v])=>`<span class="envItem">${esc(k)}: ${esc(v)}</span>`).join('')}</span>` : '—'; }
function modInfoList(v){
  const ids=parseIds(v||{}), downloads=v.downloads||[];
  const rows=[['path',esc(v.path||'—')],['project',esc(ids.projectId||'—')],['version',esc(ids.versionId||'—')],['env',envList(v.env||{})],['size',fmtBytes(v.fileSize)],['sha1',esc(v.hashes?.sha1||'—')],['sha512',esc(v.hashes?.sha512||'—')],['downloads',downloads.length?downloads.map(u=>`<a href="${esc(u)}" title="${esc(u)}">${esc(String(u).split('/').pop()||u)}</a>`).join(''):'—']];
  return `<div class="modInfo"><dl class="infoList">${rows.map(([k,val])=>`<dt>${k}</dt><dd>${val}</dd>`).join('')}</dl></div>`;
}
function bindSearch(root){
  $$('input[data-filter]', root).forEach(inp=>inp.oninput=()=>{
    const q=inp.value.trim().toLowerCase();
    const table=$(`table[data-table="${inp.dataset.filter}"]`, root); if(!table) return;
    $$('tbody tr', table).forEach(tr=>tr.style.display=tr.dataset.text.includes(q)?'':'none');
  });
}

function getMetaDiffs(packs){
  const labels=[...new Set(packs.flatMap(p=>metadataRows(p).map(([k])=>k)))];
  const rows=[];
  for(const key of labels){
    const vals=packs.map(p=>{
      const row=metadataRows(p).find(([k])=>k===key);
      return row ? row[1] : null;
    });
    if(new Set(vals.map(v=>JSON.stringify(v))).size>1) rows.push({key, vals});
  }
  return rows;
}
function collectionDiff(packs, kind){
  const maps=packs.map(p=>{
    const arr=kind==='mods'?p.mods:p.additionalFiles;
    const map=new Map(); arr.forEach(item=>map.set(kind==='mods'?item.key:item.key, item)); return map;
  });
  const keys=[...new Set(maps.flatMap(m=>[...m.keys()]))].sort();
  const diffs=[];
  for(const key of keys){
    const vals=maps.map(m=>m.get(key));
    const sigs=vals.map(v=> v ? JSON.stringify(kind==='mods'?compactEntry(v):v) : '∅');
    if(new Set(sigs).size>1) diffs.push({key, vals});
  }
  if(kind==='mods') diffs.sort((a,b)=>modDiffRank(a)-modDiffRank(b) || modDiffName(a).localeCompare(modDiffName(b)));
  return diffs;
}
function renderCompare(){
  const root=$('#compare');
  if(state.packs.length<2){ root.innerHTML='<div class="empty">Upload at least two .mrpack files to compare. Differences only will be shown here.</div>'; return; }
  const meta=getMetaDiffs(state.packs), modDiffs=collectionDiff(state.packs,'mods'), fileDiffs=collectionDiff(state.packs,'files');
  root.innerHTML=`<h2>Differences only</h2><div class="toolbar"><span class="pill">${state.packs.length} packs</span><span class="pill">${meta.length} metadata diffs</span><span class="pill">${modDiffs.length} mod diffs</span><span class="pill">${fileDiffs.length} additional file diffs</span></div>
    <details open><summary>Overall metadata differences</summary>${diffList(meta, 'meta')}</details>
    <details open><summary>Mod differences</summary>${diffList(modDiffs, 'mods')}</details>
    <details open><summary>Additional file differences</summary>${diffList(fileDiffs, 'files')}</details>`;
}
function diffList(diffs, kind){
  if(!diffs.length) return '<div class="ok">No differences in this section.</div>';
  if(kind==='meta') return metaDiffTable(diffs);
  return diffs.map(d=>`<div class="card" style="margin:10px 0"><div class="k">${kind==='mods'?(modDiffRank(d)===0?'Missing mod':'Different version'):'File path'}</div><div class="v ${kind==='mods'?'':'mono'}">${esc(kind==='mods'?modDiffName(d):d.key)}</div><div class="diffGrid">${state.packs.map((p,i)=>`<div class="diffCell"><div class="packName">${esc(packDisplayName(p))}</div>${renderDiffValue(d.vals[i], kind)}</div>`).join('')}</div></div>`).join('');
}
function metaDiffTable(diffs){
  return `<p class="metaNote">One row per changed metadata type. Scroll sideways if pack names or values are long.</p><div class="metaSlimWrap"><table class="metaDiffTable"><thead><tr><th>Metadata</th>${state.packs.map(p=>`<th class="packHead" title="${esc(packDisplayName(p))}">${esc(packDisplayName(p))}</th>`).join('')}</tr></thead><tbody>${diffs.map(d=>`<tr><td class="metaKey">${esc(d.key)}</td>${d.vals.map(v=>`<td class="metaVal" title="${esc(metaDisplayValue(v))}">${esc(metaDisplayValue(v))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function renderDiffValue(v, kind){
  if(v==null) return '<span class="removed">Missing</span>';
  if(kind==='meta') return `<div class="mono">${esc(typeof v==='object'?JSON.stringify(v,null,2):v)}</div>`;
  if(kind==='mods'){
    return `<strong>${esc(v.displayName||modNameFromPath(v.path))}</strong><div><span class="tag">${esc(modVersionLabel(v))}</span></div><details><summary>Expand info</summary>${modInfoList(v)}</details>`;
  }
  return `<div class="mono small">${esc(v.path)}</div><div>${v.source?`<span class="tag">${esc(v.source)}</span>`:envTags(v.env)}</div><div class="small muted">${fmtBytes(v.fileSize)}</div>`;
}

// Events
$('#fileInput').addEventListener('change', e=>handleFiles([...e.target.files]));
const drop=$('#drop');
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag');}));
['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag');}));
drop.addEventListener('drop', e=>handleFiles([...e.dataTransfer.files].filter(f=>/\.(mrpack|zip)$/i.test(f.name))));
$('#clearBtn').onclick=()=>{state.packs=[];state.selected=0;render();};
$$('.tabs > .tab[data-tab]').forEach(btn=>btn.onclick=()=>{state.tab=btn.dataset.tab; $$('.tabs > .tab[data-tab]').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); $$('.section').forEach(s=>s.classList.remove('active')); $('#'+state.tab).classList.add('active'); render();});
$('#demoBtn').onclick=async()=>{
  function fake(name, version, mods){ return {fileName:name,fileSize:1234,loadedAt:new Date(),index:{formatVersion:1,game:'minecraft',name:'Demo',versionId:version,dependencies:{minecraft:'26.1.2','fabric-loader':'0.19.2'},files:mods},rawIndex:{formatVersion:1,game:'minecraft',name:'Demo',versionId:version,dependencies:{minecraft:'26.1.2','fabric-loader':'0.19.2'},files:mods},mods:mods.map(f=>({...f,ids:parseIds(f),displayName:modNameFromPath(f.path),key:modKey(f)})),additionalFiles:[],zipEntries:[]}; }
  const a=[{path:'mods/sodium-1.jar',hashes:{sha1:'a'},env:{client:'required',server:'unsupported'},downloads:['https://cdn.modrinth.com/data/A/versions/V1/sodium.jar'],fileSize:100}];
  const b=[{path:'mods/sodium-2.jar',hashes:{sha1:'b'},env:{client:'required',server:'unsupported'},downloads:['https://cdn.modrinth.com/data/A/versions/V2/sodium.jar'],fileSize:120},{path:'mods/iris.jar',hashes:{sha1:'c'},env:{client:'required',server:'unsupported'},downloads:['https://cdn.modrinth.com/data/B/versions/V1/iris.jar'],fileSize:50}];
  state.packs=[fake('regular.mrpack','demo-1',a),fake('voxy.mrpack','demo-2',b)]; state.selected=0; render();
};
render();
