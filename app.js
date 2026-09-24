
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const T=window.MK97_TEMPLATES||[];
const store={
  get(k,d=null){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},
  set(k,v){localStorage.setItem(k,JSON.stringify(v))}
};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function toast(msg){
  let t=$('.toast'); if(t)t.remove();
  t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);
  setTimeout(()=>t.remove(),1700);
}
window.MK97={store,toast,templates:T,bump(k){const a=store.get('mk97.analytics',{templatesUsed:0,exports:0,projects:0,aiActions:0,videoEdits:0});a[k]=(a[k]||0)+1;store.set('mk97.analytics',a)}};
function nav(){
 const active=document.body.dataset.nav||'';
 const items=[['index.html','⌂','Home','home',''],['templates.html','▦','Templates','templates',''],['poster-editor.html','＋','Create','create','create'],['projects.html','▧','Projects','projects',''],['more.html','☷','More','more','']];
 return `<nav class="bottomnav">${items.map(([h,i,l,k,c])=>`<a href="${h}" class="navitem ${active===k?'active':''} ${c}"><span>${i}</span>${l}</a>`).join('')}</nav>`;
}
$$('[data-bottomnav]').forEach(x=>x.innerHTML=nav());
function templateCard(t){
 return `<a class="template-card" href="template-detail.html?id=${encodeURIComponent(t.id)}">
  <div class="template-art" style="--a:${t.palette[0]};--b:${t.palette[1]};--accent:${t.palette[2]}">
   <span class="pro-badge">PRO</span>
   <div class="template-copy"><span>${esc(t.kicker)}</span><h3 style="color:${t.titleColor||'#fff'};font-family:${esc(t.font||'Arial')}">${esc(t.title)}</h3><small>${esc(t.detail)}</small></div>
  </div><div class="template-meta"><strong>${esc(t.name)}</strong><em>${esc(t.category)}</em></div></a>`;
}
window.MK97.templateCard=templateCard;
const trending=$('#trendingTemplates'); if(trending)trending.innerHTML=T.slice(0,8).map(templateCard).join('');
const grid=$('#templateGrid'),search=$('#templateSearch'),chips=$('#categoryChips'),count=$('#templateCount');
if(grid){
 let cat='all'; const cats=['all',...new Set(T.map(x=>x.category))];
 chips.innerHTML=cats.map(c=>`<button class="chip ${c==='all'?'active':''}" data-cat="${esc(c)}">${c==='all'?'All':c.replace(/(^|-)\w/g,m=>m.toUpperCase())}</button>`).join('');
 const render=()=>{const q=(search?.value||'').trim().toLowerCase();const list=T.filter(t=>(cat==='all'||t.category===cat)&&(!q||`${t.name} ${t.title} ${t.kicker} ${t.detail} ${t.style}`.toLowerCase().includes(q)));grid.innerHTML=list.map(templateCard).join('');if(count)count.textContent=`${list.length} templates`;};
 search?.addEventListener('input',render);
 chips?.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;cat=b.dataset.cat;$$('.chip',chips).forEach(x=>x.classList.toggle('active',x===b));render();});
 render();
}
if($('#templateDetail')){
 const id=new URLSearchParams(location.search).get('id')||store.get('mk97.selectedTemplate','match-day');
 const t=T.find(x=>x.id===id)||T[0];
 if(t){
   $('#detailName').textContent=t.name;$('#detailCategory').textContent=t.category.toUpperCase();
   $('#detailPreview').innerHTML=templateCard(t);
   $('#useTemplate').addEventListener('click',()=>{store.set('mk97.selectedTemplate',t.id);window.MK97.bump('templatesUsed')});
   $('#similarTemplates').innerHTML=T.filter(x=>x.category===t.category&&x.id!==t.id).slice(0,4).map(templateCard).join('');
 }
}
const intro=$('.logo-transition');
if(intro){
 if(sessionStorage.getItem('mk97.introSeen'))intro.remove();
 else setTimeout(()=>{intro.classList.add('hide');sessionStorage.setItem('mk97.introSeen','1');setTimeout(()=>intro.remove(),750)},1700);
}
if($('#mediaUpload')){
 const p=store.get('mk97.pendingImage');if(p&&$('#uploadedPreview')){$('#uploadedPreview').src=p;$('#uploadedPreview').classList.remove('hidden')}
 $('#mediaUpload').addEventListener('change',e=>{
   const f=e.target.files?.[0];if(!f)return;if(f.size>3000000){toast('Use an image under 3 MB for cross-page transfer.');return}
   const r=new FileReader();r.onload=()=>{store.set('mk97.pendingImage',r.result);if($('#uploadedPreview')){$('#uploadedPreview').src=r.result;$('#uploadedPreview').classList.remove('hidden')}toast('Image ready for Poster Studio');};r.readAsDataURL(f);
 });
}
if($('#brandForm')){
 const b=store.get('mk97.brand',{name:'FWCWL',accent:'#f3c95b',background:'#080d13',showLogo:true});
 $('#brandName').value=b.name;$('#brandAccent').value=b.accent;$('#brandBackground').value=b.background;$('#brandLogo').checked=b.showLogo;
 $('#saveBrand').onclick=()=>{b.name=$('#brandName').value;b.accent=$('#brandAccent').value;b.background=$('#brandBackground').value;b.showLogo=$('#brandLogo').checked;store.set('mk97.brand',b);toast('Brand kit saved');};
}
if($('#aiUpload')){
 let src=null;
 $('#aiUpload').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{src=r.result;$('#aiOriginal').src=src;$('#aiOriginal').classList.remove('hidden')};r.readAsDataURL(f)});
 $('#removeBackground').onclick=()=>{if(!src){toast('Upload an image first');return}
   const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);const d=x.getImageData(0,0,c.width,c.height),p=d.data,pts=[[2,2],[c.width-3,2],[2,c.height-3],[c.width-3,c.height-3]];let rr=0,gg=0,bb=0;for(const [px,py] of pts){const i=(py*c.width+px)*4;rr+=p[i];gg+=p[i+1];bb+=p[i+2]}rr/=4;gg/=4;bb/=4;for(let i=0;i<p.length;i+=4){const dist=Math.hypot(p[i]-rr,p[i+1]-gg,p[i+2]-bb)/1.732;if(dist<32)p[i+3]=0;else if(dist<62)p[i+3]=Math.round(p[i+3]*(dist-32)/30)}x.putImageData(d,0,0);const url=c.toDataURL('image/png');$('#aiResult').src=url;$('#aiResult').classList.remove('hidden');store.set('mk97.pendingImage',url);window.MK97.bump('aiActions');toast('Cutout ready for Poster Studio');};img.src=src;
 };
}
if($('#projectGrid')){
 const projects=store.get('mk97.projects',[]);
 $('#projectGrid').innerHTML=projects.length?projects.slice().reverse().map(p=>`<article class="project-card"><div class="template-art" style="--a:#07131b;--b:#402026;--accent:#f3c95b;aspect-ratio:4/3"><div class="template-copy"><span>${esc(p.type||'PROJECT')}</span><h3>${esc(p.name||'MK97 Project')}</h3><small>${esc(p.saved||'')}</small></div></div></article>`).join(''):`<div class="panel empty" style="grid-column:1/-1">No saved projects yet.<br><a href="poster-editor.html" class="gold-btn" style="margin-top:14px">Create a project</a></div>`;
}
if($('#analyticsMetrics')){
 const a=store.get('mk97.analytics',{templatesUsed:0,exports:0,projects:0,aiActions:0,videoEdits:0});
 $('#analyticsMetrics').innerHTML=[['Templates Used',a.templatesUsed],['Exports',a.exports],['Saved Projects',a.projects],['AI Actions',a.aiActions]].map(([l,v])=>`<div class="metric"><strong>${v||0}</strong><span>${l}</span></div>`).join('');
}
if($('#saveSchedule'))$('#saveSchedule').onclick=()=>{store.set('mk97.schedule',{date:$('#scheduleDate').value,time:$('#scheduleTime').value,platform:$('#schedulePlatform').value});toast('Schedule saved locally')};
})();
