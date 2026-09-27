/**
 * Render every UI surface across multiple states and emit the classes used.
 *
 * Support script for `scripts/check_css_coverage.py`. The goal is breadth:
 * exercise enough state combinations that conditional branches (watched /
 * partially watched / unwatched, filters on / off, every page, every nav
 * state) all contribute their classes.
 *
 * Usage: node scripts/render_all_surfaces.mjs <output.json>
 */
import {readFileSync} from 'fs';
import {fileURLToPath} from 'url';
import {dirname} from 'path';
const R=dirname(dirname(fileURLToPath(import.meta.url)))+'/';
const B=R+'modules/';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const raw=JSON.parse(readFileSync(R+'data/timeline-data.json','utf8'));

const td=await import(B+'timeline-data.js');
const tr=await import(B+'timeline-renderers.js');
const sh=await import(B+'shell.js');
const al=await import(B+'app-layout.js');
const ur=await import(B+'utility-renderers.js');
const cp=await import(B+'content-pages.js');

const data=td.prepareTimelineData(raw);
data.forEach(s=>s.entries.forEach(e=>{e._watchedArray=new Array(e.episodes).fill(false);e.watched=0;}));
const flat=[]; data.forEach(s=>s.entries.forEach(e=>flat.push(e)));

// Partially-watched + fully-watched variants exercise conditional branches.
const partial=JSON.parse(JSON.stringify(data));
partial.forEach(s=>s.entries.forEach(e=>{e._watchedArray=new Array(e.episodes).fill(false);if(e.episodes>1)e._watchedArray[0]=true;e.watched=e._watchedArray.filter(Boolean).length;}));
const done=JSON.parse(JSON.stringify(data));
done.forEach(s=>s.entries.forEach(e=>{e._watchedArray=new Array(e.episodes).fill(true);e.watched=e.episodes;}));

const prefsOn={displayBbyAbyDates:true,standardHoursRuntime:true,chronologicalSortLock:true,canonOnly:true,legendsIntegration:true,includeAnimatedShorts:true,audioEnabled:true,soundEffectsEnabled:true,scanlineIntensity:30,glowRadius:65,interfaceTheme:'sith-dark'};
const prefsOff={...prefsOn,displayBbyAbyDates:false,standardHoursRuntime:false,chronologicalSortLock:false,canonOnly:false,legendsIntegration:false,includeAnimatedShorts:false,audioEnabled:false,soundEffectsEnabled:false};
const stats={overallProgress:42,watchedEpisodes:120,totalEpisodes:563,completedEntries:6,remainingEntries:44,totalEntries:50,eraProgress:[],mediaDistribution:[]};

let html='';
const add=(s)=>{ if(typeof s==='string') html+=s; };

for(const set of [data,partial,done]){
  set.forEach((s,i)=>{ add(tr.renderDesktopSection(s,i,{escapeHtml:esc})); add(tr.renderMobileSection(s,{escapeHtml:esc})); });
  set.forEach(s=>s.entries.forEach((e,i)=>{ try{ add(tr.renderModal(e,0,i,{escapeHtml:esc})); }catch(err){} }));
}
for(const p of ['timeline','guide','stats','preferences','privacy','terms']){
  add(sh.renderStandardTopBar({currentPage:p,searchValue:'q'}));
  add(sh.renderStandardTopBar({currentPage:p,searchValue:'',isTimelineSearchEnabled:false}));
  add(sh.renderStandardFooter({activeLink:p}));
  add(sh.renderMobileBottomNav({currentPage:p,show:true}));
}
for(const c of [true,false]) add(sh.renderMobileAudioPlayer({show:true,compact:c}));
add(sh.renderDesktopSidebar('<div>x</div>'));
const fl=await import(B+'filters.js');
const eraNames=data.map(s=>s.era);
for(const variant of ['default','active']){
  const f=fl.createDefaultFilters(eraNames);
  if(variant==='active'){
    for(const k of Object.keys(f)){
      const v=f[k];
      if(typeof v==='boolean') f[k]=!v;
      else if(v instanceof Set){ eraNames.slice(0,2).forEach(n=>v.delete(n)); }
      else if(Array.isArray(v)&&v.length) f[k]=v.slice(0,1);
      else if(v&&typeof v==='object'){ for(const kk of Object.keys(v)) if(typeof v[kk]==='boolean') v[kk]=!v[kk]; }
    }
  }
  try{ add(ur.renderFilterPanel({isOpen:true,filters:f,eras:eraNames,escapeHtml:esc})); }
  catch(e){ console.error('filterPanel('+variant+'):',e.message); }
}

for(const prefs of [prefsOn,prefsOff]){
  for(const page of ['guide','privacy','terms','preferences']){
    try{ add(cp.renderContentPage(page,{timelineData:data,entries:flat,preferences:prefs,escapeHtml:esc,stats})); }catch(e){ console.error(page+':',e.message); }
  }
}
for(const open of [true,false]){
  for(const fc of [0,3]){
    for(const sections of [data,[]]){
      const fe=sections===data?flat:[];
      try{ add(al.renderAppMainContent({currentPage:'timeline',heroEntry:flat[0],flatEntries:flat,stats,activeFilterCount:fc,isFilterPanelOpen:open,filteredEntries:fe,filteredSections:sections,normalizedSections:data,timelineData:data,preferences:prefsOn,searchInputValue:'',escapeHtml:esc,renderDesktopSection:(s,i)=>tr.renderDesktopSection(s,i,{escapeHtml:esc}),renderMobileSection:(s)=>tr.renderMobileSection(s,{escapeHtml:esc})})); }catch(e){ console.error('main:',e.message); }
    }
  }
}

const classes=new Set();
for(const m of html.matchAll(/class="([^"]*)"/g)){
  for(const raw of m[1].split(/\s+/)){
    const c=raw.trim();
    if(!c||c.includes('${')) continue;
    classes.add(c);
  }
}
const outPath=process.argv[2];
if(!outPath){ console.error('usage: node render_all_surfaces.mjs <output.json>'); process.exit(1); }
console.log('rendered '+html.length+' chars, '+classes.size+' distinct classes');
const {writeFileSync}=await import('fs');
const payload={classes:[...classes].sort()};
if(process.argv.includes('--emit-html')) payload.html=html;
writeFileSync(outPath, JSON.stringify(payload));
