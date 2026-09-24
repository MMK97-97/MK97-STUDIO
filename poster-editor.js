
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],T=window.MK97_TEMPLATES||[];
const canvas=$('#posterCanvas'),ctx=canvas.getContext('2d'),stage=$('#stage'),frame=$('#canvasFrame');
const store={get(k,d=null){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
const uid=()=>Math.random().toString(36).slice(2,9),clone=o=>JSON.parse(JSON.stringify(o));
let state={w:1080,h:1350,bg:'#0a0e13',layers:[],selected:null,zoom:1,grid:false,templateId:null};
let history=[],future=[],drag=null,imageCache=new Map();
const sizes={portrait:[1080,1350],square:[1080,1080],story:[1080,1920]};
function toast(m){let t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),1500)}
function bump(k){const a=store.get('mk97.analytics',{templatesUsed:0,exports:0,projects:0,aiActions:0,videoEdits:0});a[k]=(a[k]||0)+1;store.set('mk97.analytics',a)}
function push(){history.push(clone(state));if(history.length>40)history.shift();future=[]}
function undo(){if(!history.length)return;future.push(clone(state));state=history.pop();syncAll()}
function redo(){if(!future.length)return;history.push(clone(state));state=future.pop();syncAll()}
function fontName(f){return /bebas/i.test(f)?'Impact':/playfair/i.test(f)?'Georgia':'Arial'}
function defaultTemplate(t){
 state.templateId=t.id;state.bg=t.palette[0];
 state.layers=[
  {id:uid(),type:'shape',name:'Accent',x:700,y:80,w:430,h:1350,color:t.palette[1],opacity:.86,rotation:-12,visible:true,locked:false},
  {id:uid(),type:'text',name:'Kicker',text:t.kicker,x:80,y:140,w:850,h:70,font:fontName(t.font),size:38,weight:800,color:t.kickerColor||t.palette[2],align:t.align||'left',opacity:1,rotation:0,visible:true,locked:false},
  {id:uid(),type:'text',name:'Headline',text:t.title,x:80,y:520,w:880,h:390,font:fontName(t.font),size:Math.min(170,t.titleSize||130),weight:900,color:t.titleColor||'#fff',align:t.align||'left',opacity:1,rotation:0,visible:true,locked:false,stroke:'#000000',strokeWidth:0,shadow:18},
  {id:uid(),type:'text',name:'Details',text:t.detail,x:80,y:1030,w:870,h:80,font:'Arial',size:34,weight:700,color:t.detailColor||'#d2d8dd',align:t.align||'left',opacity:1,rotation:0,visible:true,locked:false},
  {id:uid(),type:'text',name:'Footer',text:t.cta||'FWCWL',x:80,y:1225,w:860,h:70,font:'Arial',size:28,weight:900,color:t.footerColor||t.palette[2],align:t.align||'left',opacity:1,rotation:0,visible:true,locked:false}
 ];
 state.selected=state.layers[2].id;syncAll();
}
function selected(){return state.layers.find(x=>x.id===state.selected)||null}
function getImage(src){if(imageCache.has(src))return imageCache.get(src);const im=new Image();im.onload=render;im.src=src;imageCache.set(src,im);return im}
function drawText(l){
 ctx.save();ctx.globalAlpha=l.opacity??1;ctx.translate(l.x+l.w/2,l.y+l.h/2);ctx.rotate((l.rotation||0)*Math.PI/180);ctx.translate(-(l.x+l.w/2),-(l.y+l.h/2));
 ctx.font=`${l.weight||700} ${l.size||60}px ${l.font||'Arial'}`;ctx.textAlign=l.align||'left';ctx.textBaseline='top';ctx.fillStyle=l.color||'#fff';
 const ax=l.align==='center'?l.x+l.w/2:l.align==='right'?l.x+l.w:l.x, lines=String(l.text||'').split('\n');let y=l.y;
 for(const line of lines){if(l.shadow){ctx.shadowColor='rgba(0,0,0,.65)';ctx.shadowBlur=l.shadow;ctx.shadowOffsetY=Math.round(l.shadow*.35)}if(l.strokeWidth){ctx.lineWidth=l.strokeWidth;ctx.strokeStyle=l.stroke||'#000';ctx.strokeText(line,ax,y)}ctx.fillText(line,ax,y);y+=(l.size||60)*1.02}
 ctx.restore();
}
function drawLayer(l){
 if(l.visible===false)return;
 if(l.type==='shape'){ctx.save();ctx.globalAlpha=l.opacity??1;ctx.translate(l.x+l.w/2,l.y+l.h/2);ctx.rotate((l.rotation||0)*Math.PI/180);ctx.fillStyle=l.color||'#fff';ctx.fillRect(-l.w/2,-l.h/2,l.w,l.h);ctx.restore()}
 if(l.type==='text')drawText(l);
 if(l.type==='image'){const im=getImage(l.src);if(!im.complete)return;ctx.save();ctx.globalAlpha=l.opacity??1;ctx.translate(l.x+l.w/2,l.y+l.h/2);ctx.rotate((l.rotation||0)*Math.PI/180);ctx.filter=`brightness(${l.brightness||100}%) contrast(${l.contrast||100}%) saturate(${l.saturation||100}%) blur(${l.blur||0}px) hue-rotate(${l.hue||0}deg) sepia(${l.sepia||0}%)`;const r=Math.max(l.w/im.naturalWidth,l.h/im.naturalHeight),dw=im.naturalWidth*r,dh=im.naturalHeight*r;ctx.beginPath();ctx.rect(-l.w/2,-l.h/2,l.w,l.h);ctx.clip();ctx.drawImage(im,-dw/2,-dh/2,dw,dh);ctx.restore()}
}
function drawSelection(l){
 if(!l||l.visible===false)return;ctx.save();ctx.strokeStyle='#ffffff';ctx.lineWidth=4;ctx.strokeRect(l.x,l.y,l.w,l.h);for(const [x,y] of [[l.x,l.y],[l.x+l.w,l.y],[l.x,l.y+l.h],[l.x+l.w,l.y+l.h]]){ctx.fillStyle='#fff';ctx.strokeStyle='#111';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill();ctx.stroke()}ctx.restore();
}
function render(){
 canvas.width=state.w;canvas.height=state.h;ctx.clearRect(0,0,state.w,state.h);ctx.fillStyle=state.bg;ctx.fillRect(0,0,state.w,state.h);
 if(state.grid){ctx.save();ctx.strokeStyle='rgba(255,255,255,.055)';ctx.lineWidth=1;for(let x=0;x<state.w;x+=90){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,state.h);ctx.stroke()}for(let y=0;y<state.h;y+=90){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(state.w,y);ctx.stroke()}ctx.restore()}
 for(const l of state.layers)drawLayer(l);drawSelection(selected());fitCss();$('#quickSelected').classList.toggle('show',!!selected());
}
function fitCss(){
 const maxW=Math.max(250,stage.clientWidth-28),maxH=Math.max(280,stage.clientHeight-24),fit=Math.min(maxW/state.w,maxH/state.h),s=fit*state.zoom;
 canvas.style.width=`${state.w*s}px`;canvas.style.height=`${state.h*s}px`;frame.style.width=`${state.w*s}px`;frame.style.height=`${state.h*s}px`;$('#zoomLabel').textContent=`${Math.round(state.zoom*100)}%`;
}
function hit(x,y){for(let i=state.layers.length-1;i>=0;i--){const l=state.layers[i];if(l.visible!==false&&x>=l.x&&x<=l.x+l.w&&y>=l.y&&y<=l.y+l.h)return l}return null}
function pt(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*state.w/r.width,y:(e.clientY-r.top)*state.h/r.height}}
canvas.addEventListener('pointerdown',e=>{const p=pt(e),l=hit(p.x,p.y);if(l){state.selected=l.id;renderLayers();renderInspector();render();if(!l.locked){push();drag={id:l.id,sx:p.x,sy:p.y,x:l.x,y:l.y}}}else{state.selected=null;renderLayers();renderInspector();render()}canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=pt(e),l=selected();if(!l)return;l.x=Math.round(drag.x+p.x-drag.sx);l.y=Math.round(drag.y+p.y-drag.sy);render()});
canvas.addEventListener('pointerup',()=>drag=null);
function renderTemplates(){
 const q=($('#editorTemplateSearch').value||'').toLowerCase(),list=T.filter(t=>`${t.name} ${t.title} ${t.category}`.toLowerCase().includes(q));
 $('#editorTemplateCount').textContent=`${list.length} templates`;
 $('#editorTemplateGrid').innerHTML=list.map(t=>`<button class="template-mini" data-id="${t.id}"><div class="art" style="--a:${t.palette[0]};--b:${t.palette[1]}"><div class="copy">${t.title.replaceAll('\n','<br>')}</div></div><strong>${t.name}</strong></button>`).join('');
}
$('#editorTemplateSearch').oninput=renderTemplates;
$('#editorTemplateGrid').onclick=e=>{const b=e.target.closest('[data-id]');if(!b)return;push();const t=T.find(x=>x.id===b.dataset.id);if(t){defaultTemplate(t);store.set('mk97.selectedTemplate',t.id);bump('templatesUsed');closeSheets()}};
function renderLayers(){
 $('#layerList').innerHTML=[...state.layers].reverse().map(l=>`<div class="layer-row ${l.id===state.selected?'active':''}" data-id="${l.id}"><span class="type">${l.type==='text'?'T':l.type==='image'?'▧':'◆'}</span><div><b>${l.name||l.type}</b><small>${l.visible===false?'Hidden':l.locked?'Locked':'Editable'}</small></div><div><button data-act="vis">${l.visible===false?'○':'◉'}</button><button data-act="lock">${l.locked?'🔒':'🔓'}</button></div></div>`).join('');
}
$('#layerList').onclick=e=>{const row=e.target.closest('[data-id]');if(!row)return;const l=state.layers.find(x=>x.id===row.dataset.id),act=e.target.dataset.act;if(act==='vis'){push();l.visible=l.visible===false?true:false;renderLayers();render();return}if(act==='lock'){push();l.locked=!l.locked;renderLayers();return}state.selected=l.id;renderLayers();renderInspector();render();};
function ctrl(label,val,key,type='range',min=0,max=100,step=1){return `<label class="control"><span>${label}</span><input data-key="${key}" type="${type}" value="${val}" ${type==='range'?`min="${min}" max="${max}" step="${step}"`:''}></label>`}
function renderInspector(){
 const l=selected(),box=$('#inspector');$('#inspectorTitle').textContent=l?(l.name||l.type):'Canvas';
 if(!l){box.innerHTML=`<section class="inspector-section"><h4>Canvas</h4>${ctrl('Background',state.bg,'bg','color')}<div class="row3"><button class="small-btn" data-canvas="portrait">4:5</button><button class="small-btn" data-canvas="square">1:1</button><button class="small-btn" data-canvas="story">9:16</button></div></section>`;return}
 let html=`<section class="inspector-section"><h4>Transform</h4><div class="row2">${ctrl('X',l.x,'x','number')}${ctrl('Y',l.y,'y','number')}</div><div class="row2">${ctrl('Width',l.w,'w','number')}${ctrl('Height',l.h,'h','number')}</div>${ctrl('Rotation',l.rotation||0,'rotation','range',-180,180,1)}${ctrl('Opacity',Math.round((l.opacity??1)*100),'opacity','range',0,100,1)}</section>`;
 if(l.type==='text')html+=`<section class="inspector-section"><h4>Text</h4><label class="control"><span>Content</span><textarea data-key="text">${l.text||''}</textarea></label><div class="row2">${ctrl('Size',l.size,'size','number')}${ctrl('Color',l.color,'color','color')}</div><div class="row2"><label class="control"><span>Font</span><select data-key="font"><option>Arial</option><option>Impact</option><option>Georgia</option><option>Trebuchet MS</option></select></label><label class="control"><span>Align</span><select data-key="align"><option>left</option><option>center</option><option>right</option></select></label></div>${ctrl('Shadow',l.shadow||0,'shadow','range',0,40,1)}<div class="row2">${ctrl('Stroke',l.stroke||'#000000','stroke','color')}${ctrl('Stroke width',l.strokeWidth||0,'strokeWidth','number')}</div></section>`;
 if(l.type==='shape')html+=`<section class="inspector-section"><h4>Shape</h4>${ctrl('Color',l.color,'color','color')}</section>`;
 if(l.type==='image')html+=`<section class="inspector-section"><h4>Adjust</h4>${ctrl('Brightness',l.brightness||100,'brightness','range',0,200,1)}${ctrl('Contrast',l.contrast||100,'contrast','range',0,200,1)}${ctrl('Saturation',l.saturation||100,'saturation','range',0,200,1)}${ctrl('Hue',l.hue||0,'hue','range',-180,180,1)}${ctrl('Blur',l.blur||0,'blur','range',0,20,.5)}${ctrl('Sepia',l.sepia||0,'sepia','range',0,100,1)}</section>`;
 box.innerHTML=html;
 $$('[data-key]',box).forEach(el=>{if(el.tagName==='SELECT'&&l[el.dataset.key]!=null)el.value=l[el.dataset.key];el.addEventListener(el.type==='range'||el.type==='color'?'input':'change',()=>{const k=el.dataset.key;push();let v=el.value;if(['x','y','w','h','rotation','size','shadow','strokeWidth','brightness','contrast','saturation','hue','blur','sepia'].includes(k))v=Number(v);if(k==='opacity')v=Number(v)/100;l[k]=v;render();renderLayers()})});
}
$('#inspector').onclick=e=>{const b=e.target.closest('[data-canvas]');if(!b)return;$('#canvasSize').value=b.dataset.canvas;$('#canvasSize').dispatchEvent(new Event('change'))};
function addText(){push();const l={id:uid(),type:'text',name:'Text',text:'YOUR TEXT',x:110,y:300,w:850,h:170,font:'Arial',size:96,weight:900,color:'#ffffff',align:'left',opacity:1,rotation:0,visible:true,locked:false};state.layers.push(l);state.selected=l.id;syncAll()}
function addShape(){push();const l={id:uid(),type:'shape',name:'Shape',x:200,y:400,w:450,h:240,color:'#f3c95b',opacity:.9,rotation:0,visible:true,locked:false};state.layers.push(l);state.selected=l.id;syncAll()}
function addImage(src){push();const l={id:uid(),type:'image',name:'Photo',src,x:140,y:280,w:800,h:800,opacity:1,rotation:0,visible:true,locked:false,brightness:100,contrast:100,saturation:100,hue:0,blur:0,sepia:0};state.layers.push(l);state.selected=l.id;syncAll()}
$('#uploadImageBtn').onclick=()=>$('#imageInput').click();$('#imageInput').onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{addImage(r.result);closeSheets()};r.readAsDataURL(f)};
$('#addTextBtn').onclick=addText;$('#mediaAddText').onclick=()=>{addText();closeSheets()};$('#addShapeBtn').onclick=addShape;
$('#removeBgBtn').onclick=()=>{const l=selected();if(!l||l.type!=='image'){toast('Select an image layer first');return}const im=getImage(l.src);if(!im.complete){toast('Image is still loading');return}push();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height),p=d.data,pts=[[2,2],[c.width-3,2],[2,c.height-3],[c.width-3,c.height-3]];let rr=0,gg=0,bb=0;for(const [px,py] of pts){const i=(py*c.width+px)*4;rr+=p[i];gg+=p[i+1];bb+=p[i+2]}rr/=4;gg/=4;bb/=4;for(let i=0;i<p.length;i+=4){const dist=Math.hypot(p[i]-rr,p[i+1]-gg,p[i+2]-bb)/1.732;if(dist<30)p[i+3]=0;else if(dist<60)p[i+3]=Math.round(p[i+3]*(dist-30)/30)}x.putImageData(d,0,0);l.src=c.toDataURL('image/png');imageCache.clear();render();toast('Background removed')};
function del(){const i=state.layers.findIndex(x=>x.id===state.selected);if(i<0)return;push();state.layers.splice(i,1);state.selected=null;syncAll()}
function dup(){const l=selected();if(!l)return;push();const n=clone(l);n.id=uid();n.name=(n.name||n.type)+' copy';n.x+=28;n.y+=28;state.layers.push(n);state.selected=n.id;syncAll()}
$('#deleteBtn').onclick=del;$('#duplicateBtn').onclick=dup;$('#quickDelete').onclick=del;$('#quickDuplicate').onclick=dup;$('#quickEdit').onclick=()=>openEdit();
$('#undoBtn').onclick=undo;$('#redoBtn').onclick=redo;
$('#fitBtn').onclick=()=>{state.zoom=1;render()};$('#zoomIn').onclick=()=>{state.zoom=Math.min(2.2,state.zoom+.1);render()};$('#zoomOut').onclick=()=>{state.zoom=Math.max(.45,state.zoom-.1);render()};$('#gridBtn').onclick=()=>{state.grid=!state.grid;$('#gridBtn').classList.toggle('active',state.grid);render()};
$('#canvasSize').onchange=e=>{push();[state.w,state.h]=sizes[e.target.value];$('#posterDimensions').textContent=`${state.w} × ${state.h}`;render()};
function exportPoster(){const keep=state.selected;state.selected=null;render();const a=document.createElement('a');a.download=`${($('#projectName').value||'MK97-poster').replace(/[^\w-]+/g,'-')}.png`;a.href=canvas.toDataURL('image/png',1);a.click();state.selected=keep;render();bump('exports');toast('PNG exported')}
$('#exportBtn').onclick=exportPoster;$('#mobileExport').onclick=exportPoster;
function syncAll(){render();renderLayers();renderInspector()}
function closeSheets(){$$('.bottom-sheet').forEach(s=>s.classList.remove('open'));$('#sheetBackdrop').classList.remove('open')}
function openSheet(id){closeSheets();$(id).classList.add('open');$('#sheetBackdrop').classList.add('open')}
function openAssetTab(name){openSheet('#assetSheet');$$('.sheet-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));$$('[data-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.panel!==name))}
function openEdit(){renderInspector();openSheet('#editSheet')}
$('#sheetBackdrop').onclick=closeSheets;$$('[data-close]').forEach(b=>b.onclick=closeSheets);
$$('.sheet-tab').forEach(b=>b.onclick=()=>openAssetTab(b.dataset.tab));
$$('[data-tool]').forEach(b=>b.onclick=()=>{const t=b.dataset.tool;if(['templates','media','layers'].includes(t))openAssetTab(t);else if(t==='adjust'){if(!selected()){toast('Select a layer first');return}openEdit()}else if(t==='canvas'){state.selected=null;renderInspector();render();openEdit()}});
window.addEventListener('resize',render);
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();dup()}if(e.key==='Delete'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))del()});
renderTemplates();const chosen=T.find(x=>x.id===store.get('mk97.selectedTemplate','match-day'))||T[0];defaultTemplate(chosen);
const pending=store.get('mk97.pendingImage');if(pending){setTimeout(()=>addImage(pending),80);store.set('mk97.pendingImage',null)}
})();
