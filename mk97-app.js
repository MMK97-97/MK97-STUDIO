(()=>{
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const body=document.body;
  const drawer=$('#drawer'), sheet=$('#createSheet'), search=$('#searchPanel');
  const openDrawer=()=>drawer?.classList.add('open'), closeDrawer=()=>drawer?.classList.remove('open');
  const openSheet=()=>sheet?.classList.add('open'), closeSheet=()=>sheet?.classList.remove('open');
  const openSearch=()=>{search?.classList.add('open');setTimeout(()=>$('#searchInput')?.focus(),30)}, closeSearch=()=>search?.classList.remove('open');
  $('#menuBtn')?.addEventListener('click',openDrawer); $('#drawerBack')?.addEventListener('click',closeDrawer); $('#drawerClose')?.addEventListener('click',closeDrawer);
  $$('.createTrigger').forEach(b=>b.addEventListener('click',openSheet)); $('#sheetBack')?.addEventListener('click',closeSheet); $('#sheetClose')?.addEventListener('click',closeSheet);
  $('#searchBtn')?.addEventListener('click',openSearch); $('#searchClose')?.addEventListener('click',closeSearch);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDrawer();closeSheet();closeSearch();}});
  window.addEventListener('pageshow',()=>body.classList.remove('leaving'));
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]'); if(!a||a.target==='_blank'||a.hasAttribute('download'))return;
    const u=new URL(a.href,location.href); if(u.origin!==location.origin||u.pathname===location.pathname&&u.search===location.search)return;
    body.classList.add('leaving');
  });
  const recentKey='mk97_recent_projects_v2';
  const addRecent=(type,title,href)=>{let a=[];try{a=JSON.parse(localStorage.getItem(recentKey)||'[]')}catch{};a=[{type,title,href,ts:Date.now()},...a.filter(x=>x.href!==href)].slice(0,8);localStorage.setItem(recentKey,JSON.stringify(a));};
  if(location.pathname.endsWith('/poster.html')||location.pathname.endsWith('poster.html'))addRecent('POSTER','Poster project','poster.html');
  if(location.pathname.endsWith('/video.html')||location.pathname.endsWith('video.html'))addRecent('VIDEO','Video project','video.html');
  const recent=$('#recentProjects'); if(recent){let a=[];try{a=JSON.parse(localStorage.getItem(recentKey)||'[]')}catch{};if(!a.length)a=[{type:'VIDEO',title:'New video',href:'video.html'},{type:'POSTER',title:'New poster',href:'poster.html'}];recent.innerHTML=a.slice(0,5).map(x=>`<a class="projectcard" href="${x.href}"><div class="projectthumb ${x.type==='POSTER'?'poster':''}"><span class="type">${x.type}</span><b>${x.title}</b></div><div class="projectmeta"><strong>${x.title}</strong><span>${x.ts?'Continue editing':'Start editing'}</span></div></a>`).join('');}
  const projectList=$('#projectList'); if(projectList){let a=[];try{a=JSON.parse(localStorage.getItem(recentKey)||'[]')}catch{};if(!a.length)a=[{type:'VIDEO',title:'New video',href:'video.html'},{type:'POSTER',title:'New poster',href:'poster.html'}];projectList.innerHTML=a.map(x=>`<a class="rowcard" href="${x.href}"><div><strong>${x.title}</strong><p>${x.type} · ${x.ts?new Date(x.ts).toLocaleString():'Ready to create'}</p></div><span class="arrow">›</span></a>`).join('');}
  const data=[['Video editor','Create video projects','video.html'],['Poster editor','Create posters and social graphics','poster.html'],['Templates','Browse ready-made designs','templates.html'],['Projects','Continue recent work','projects.html'],['Media','Upload and use photos/videos','poster.html'],['Cutout','Open poster editor for background/cutout tools','poster.html'],['Brand','Open brand design tools','poster.html'],['Audio','Open video editor audio workspace','video.html']];
  $('#searchInput')?.addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();$('#searchResults').innerHTML=data.filter(x=>!q||x[0].toLowerCase().includes(q)||x[1].toLowerCase().includes(q)).map(x=>`<a class="searchresult" href="${x[2]}"><strong>${x[0]}</strong><span>${x[1]}</span></a>`).join('');});
  if($('#searchResults'))$('#searchResults').innerHTML=data.map(x=>`<a class="searchresult" href="${x[2]}"><strong>${x[0]}</strong><span>${x[1]}</span></a>`).join('');
  $$('.chip[data-filter]').forEach(c=>c.addEventListener('click',()=>{$$('.chip[data-filter]').forEach(x=>x.classList.remove('active'));c.classList.add('active');const f=c.dataset.filter;$$('.templatecard[data-cat]').forEach(card=>card.style.display=(f==='all'||card.dataset.cat===f)?'block':'none');}));
  const installBtns=$$('.installBtn,#installBtn'); let deferred; window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;installBtns.forEach(b=>b.removeAttribute('hidden'))}); installBtns.forEach(b=>b.addEventListener('click',async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;installBtns.forEach(x=>x.setAttribute('hidden',''))}));
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
