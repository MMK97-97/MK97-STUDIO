
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const canvas=$('#videoCanvas'),ctx=canvas.getContext('2d'),timeline=$('#timelineScroll');
const store={get(k,d=null){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
const uid=()=>Math.random().toString(36).slice(2,9),clone=o=>JSON.parse(JSON.stringify(o));
let state={w:1080,h:1920,duration:15,time:0,playing:false,zoom:1,clips:[],selected:null,effect:'none'},history=[],future=[],raf=null,media=new Map(),drag=null;
const tracks=['Video','Overlay','Text','Audio'],colors={Video:'video',Overlay:'image',Text:'text',Audio:'audio'};
function toast(m){let t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),1600)}
function bump(k){const a=store.get('mk97.analytics',{templatesUsed:0,exports:0,projects:0,aiActions:0,videoEdits:0});a[k]=(a[k]||0)+1;store.set('mk97.analytics',a)}
function push(){history.push(clone(state));if(history.length>35)history.shift();future=[]}
function undo(){if(!history.length)return;future.push(clone(state));state=history.pop();sync()}
function redo(){if(!future.length)return;history.push(clone(state));state=future.pop();sync()}
function selected(){return state.clips.find(c=>c.id===state.selected)||null}
function fmt(t){const m=Math.floor(t/60),s=(t%60).toFixed(1).padStart(4,'0');return `${String(m).padStart(2,'0')}:${s}`}
function pxPerSec(){return 72*state.zoom}
function getMedia(c){if(!c.src)return null;if(media.has(c.id))return media.get(c.id);let el;if(c.kind==='video'){el=document.createElement('video');el.src=c.src;el.muted=true;el.playsInline=true;el.preload='auto'}else if(c.kind==='image'){el=new Image();el.src=c.src}else if(c.kind==='audio'){el=document.createElement('audio');el.src=c.src;el.preload='auto'}media.set(c.id,el);return el}
function activeClips(){return state.clips.filter(c=>state.time>=c.start&&state.time<=c.start+c.duration)}
function renderPreview(){
 ctx.fillStyle='#070c12';ctx.fillRect(0,0,state.w,state.h);
 if(state.effect==='warm'){ctx.fillStyle='rgba(255,130,40,.08)';ctx.fillRect(0,0,state.w,state.h)}
 for(const c of activeClips()){
   if(c.track==='Audio')continue;ctx.save();ctx.globalAlpha=c.opacity??1;
   if(c.kind==='image'){const im=getMedia(c);if(im?.complete){const r=Math.max(state.w/im.naturalWidth,state.h/im.naturalHeight),dw=im.naturalWidth*r*(c.scale||1),dh=im.naturalHeight*r*(c.scale||1);ctx.translate(state.w/2+(c.x||0),state.h/2+(c.y||0));ctx.rotate((c.rotation||0)*Math.PI/180);ctx.filter=state.effect==='mono'?'grayscale(1)':state.effect==='cinematic'?'contrast(1.12) saturate(.86)':'none';ctx.drawImage(im,-dw/2,-dh/2,dw,dh)}}
   if(c.kind==='video'){const v=getMedia(c);if(v?.readyState>=2){const local=(state.time-c.start)*(c.speed||1);if(Math.abs(v.currentTime-local)>.12)try{v.currentTime=Math.min(local,v.duration||local)}catch{}const r=Math.max(state.w/v.videoWidth,state.h/v.videoHeight),dw=v.videoWidth*r*(c.scale||1),dh=v.videoHeight*r*(c.scale||1);ctx.translate(state.w/2+(c.x||0),state.h/2+(c.y||0));ctx.rotate((c.rotation||0)*Math.PI/180);ctx.filter=state.effect==='mono'?'grayscale(1)':state.effect==='cinematic'?'contrast(1.12) saturate(.86)':'none';ctx.drawImage(v,-dw/2,-dh/2,dw,dh)}}
   if(c.kind==='text'){ctx.translate(state.w/2+(c.x||0),state.h/2+(c.y||0));ctx.rotate((c.rotation||0)*Math.PI/180);ctx.fillStyle=c.color||'#fff';ctx.font=`900 ${c.size||110}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=20;ctx.fillText(c.text||'YOUR TEXT',0,0,state.w*.8)}
   ctx.restore();
 }
 fitCanvas();updateTime();
}
function fitCanvas(){const stage=$('#videoStage'),maxW=Math.max(240,stage.clientWidth-18),maxH=Math.max(220,stage.clientHeight-18),fit=Math.min(maxW/state.w,maxH/state.h);canvas.style.width=`${state.w*fit}px`;canvas.style.height=`${state.h*fit}px`}
function updateTime(){$('#timeLabel').textContent=`${fmt(state.time)} / ${fmt(state.duration)}`;$('#playhead').style.left=`${58+state.time*pxPerSec()}px`}
function renderRuler(){const r=$('#ruler'),pps=pxPerSec();r.style.width=`${state.duration*pps}px`;r.innerHTML=Array.from({length:Math.floor(state.duration)+1},(_,i)=>`<i style="left:${i*pps}px">${i}s</i>`).join('')}
function renderTimeline(){
 renderRuler();
 $('#tracks').innerHTML=tracks.map(tr=>`<div class="track-row"><div class="track-label">${tr}</div><div class="track-lane" data-track="${tr}" style="width:${state.duration*pxPerSec()}px">${state.clips.filter(c=>c.track===tr).map(c=>`<div class="clip ${colors[tr]} ${c.id===state.selected?'selected':''}" data-id="${c.id}" style="left:${c.start*pxPerSec()}px;width:${Math.max(24,c.duration*pxPerSec())}px"><i class="trim left" data-trim="left"></i>${c.name}<i class="trim right" data-trim="right"></i></div>`).join('')}</div></div>`).join('');
 $('#timelineZoomLabel').textContent=`${Math.round(state.zoom*100)}%`;updateTime();
}
function renderAssets(){$('#videoAssetList').innerHTML=state.clips.filter(c=>c.kind!=='text').map(c=>`<div class="layer-row" data-id="${c.id}"><span class="type">${c.kind==='audio'?'♫':c.kind==='video'?'▷':'▧'}</span><div><b>${c.name}</b><small>${c.duration.toFixed(1)}s</small></div></div>`).join('')}
function inspect(){
 const c=selected(),box=$('#videoInspector');$('#clipTitle').textContent=c?c.name:'Timeline';
 if(!c){box.innerHTML=`<section class="inspector-section"><h4>Timeline</h4><label class="control"><span>Duration</span><input id="durationControl" type="number" min="5" max="120" value="${state.duration}"></label><label class="control"><span>Global look</span><select id="effectControl"><option value="none">None</option><option value="cinematic">Cinematic</option><option value="warm">Warm</option><option value="mono">Mono</option></select></label></section>`;$('#effectControl').value=state.effect;$('#durationControl').onchange=e=>{push();state.duration=Math.max(5,Math.min(120,Number(e.target.value)||15));sync()};$('#effectControl').onchange=e=>{state.effect=e.target.value;renderPreview()};return}
 let h=`<section class="inspector-section"><h4>Clip</h4><label class="control"><span>Name</span><input data-k="name" value="${c.name}"></label><div class="row2"><label class="control"><span>Start</span><input data-k="start" type="number" step=".1" value="${c.start}"></label><label class="control"><span>Duration</span><input data-k="duration" type="number" step=".1" value="${c.duration}"></label></div><label class="control"><span>Opacity</span><input data-k="opacity" type="range" min="0" max="100" value="${Math.round((c.opacity??1)*100)}"></label></section>`;
 if(c.kind!=='audio')h+=`<section class="inspector-section"><h4>Transform</h4><div class="row2"><label class="control"><span>X</span><input data-k="x" type="number" value="${c.x||0}"></label><label class="control"><span>Y</span><input data-k="y" type="number" value="${c.y||0}"></label></div><label class="control"><span>Scale</span><input data-k="scale" type="range" min="20" max="220" value="${Math.round((c.scale||1)*100)}"></label><label class="control"><span>Rotation</span><input data-k="rotation" type="range" min="-180" max="180" value="${c.rotation||0}"></label></section>`;
 if(c.kind==='text')h+=`<section class="inspector-section"><h4>Text</h4><label class="control"><span>Content</span><textarea data-k="text">${c.text||''}</textarea></label><div class="row2"><label class="control"><span>Size</span><input data-k="size" type="number" value="${c.size||110}"></label><label class="control"><span>Color</span><input data-k="color" type="color" value="${c.color||'#ffffff'}"></label></div></section>`;
 if(c.kind==='audio'||c.kind==='video')h+=`<section class="inspector-section"><h4>Playback</h4><label class="control"><span>Volume</span><input data-k="volume" type="range" min="0" max="100" value="${Math.round((c.volume??1)*100)}"></label><label class="control"><span>Speed</span><input data-k="speed" type="range" min="25" max="300" value="${Math.round((c.speed||1)*100)}"></label></section>`;
 box.innerHTML=h;
 $$('[data-k]',box).forEach(el=>el.addEventListener(el.type==='range'||el.type==='color'?'input':'change',()=>{push();const k=el.dataset.k;let v=el.value;if(['start','duration','x','y','rotation','size'].includes(k))v=Number(v);if(k==='opacity'||k==='volume'||k==='scale'||k==='speed')v=Number(v)/100;c[k]=v;sync(false)}));
}
function sync(tl=true){renderPreview();if(tl)renderTimeline();renderAssets();inspect()}
function addText(){push();const c={id:uid(),kind:'text',track:'Text',name:'Title',start:state.time,duration:Math.min(4,state.duration-state.time),text:'YOUR TEXT',x:0,y:0,scale:1,rotation:0,opacity:1,size:110,color:'#ffffff'};state.clips.push(c);state.selected=c.id;sync();openEdit()}
function addFile(file){
 const url=URL.createObjectURL(file),kind=file.type.startsWith('video')?'video':file.type.startsWith('audio')?'audio':'image',track=kind==='audio'?'Audio':kind==='video'?'Video':'Overlay';
 const add=(duration)=>{push();const start=Math.max(0,Math.min(state.time,state.duration-.5)),remaining=Math.max(.5,state.duration-start);const c={id:uid(),kind,track,name:file.name,start,duration:Math.min(Math.max(.5,duration||5),remaining),src:url,opacity:1,scale:1,rotation:0,x:0,y:0,volume:1,speed:1};state.clips.push(c);state.selected=c.id;sync();bump('videoEdits');closeSheets()};
 if(kind==='image')add(5);else{const el=document.createElement(kind==='video'?'video':'audio');el.src=url;el.onloadedmetadata=()=>add(Math.min(el.duration||5,8));el.onerror=()=>add(5)}
}
$('#videoUploadBtn').onclick=()=>$('#videoMediaInput').click();$('#addVideoClip').onclick=()=>$('#videoMediaInput').click();$('#videoMediaInput').onchange=e=>{const f=e.target.files?.[0];if(f)addFile(f)};
$('#audioUploadBtn').onclick=()=>$('#audioInput').click();$('#audioInput').onchange=e=>{const f=e.target.files?.[0];if(f)addFile(f)};
$('#addVideoText').onclick=addText;$('#addTextClip').onclick=addText;
function split(){const c=selected();if(!c||state.time<=c.start+.05||state.time>=c.start+c.duration-.05){toast('Place playhead inside the selected clip');return}push();const second=clone(c),cut=state.time-c.start;second.id=uid();second.start=state.time;second.duration=c.duration-cut;second.name=c.name+' B';c.duration=cut;state.clips.push(second);state.selected=second.id;sync()}
function del(){const i=state.clips.findIndex(c=>c.id===state.selected);if(i<0)return;push();state.clips.splice(i,1);state.selected=null;sync()}
function duplicate(){const c=selected();if(!c)return;push();const n=clone(c);n.id=uid();n.start=Math.min(state.duration-n.duration,c.start+.4);n.name=c.name+' copy';state.clips.push(n);state.selected=n.id;sync()}
$('#splitBtn').onclick=split;$('#mobileSplit').onclick=split;$('#deleteClip').onclick=del;$('#duplicateClip').onclick=duplicate;
$('#tracks').addEventListener('pointerdown',e=>{const clip=e.target.closest('.clip');if(!clip)return;state.selected=clip.dataset.id;inspect();renderTimeline();const x=e.clientX,trim=e.target.dataset.trim,c=selected();push();drag={c,startX:x,start:c.start,dur:c.duration,trim};clip.setPointerCapture(e.pointerId)});
$('#tracks').addEventListener('pointermove',e=>{if(!drag)return;const dx=(e.clientX-drag.startX)/pxPerSec(),c=drag.c;if(drag.trim==='left'){const ns=Math.max(0,Math.min(drag.start+drag.dur-.2,drag.start+dx));c.duration=drag.dur+(drag.start-ns);c.start=ns}else if(drag.trim==='right'){c.duration=Math.max(.2,Math.min(state.duration-c.start,drag.dur+dx))}else c.start=Math.max(0,Math.min(state.duration-c.duration,drag.start+dx));renderTimeline();renderPreview()});
window.addEventListener('pointerup',()=>drag=null);
timeline.addEventListener('pointerdown',e=>{if(e.target.closest('.clip'))return;const lane=e.target.closest('.track-lane');if(!lane)return;const r=lane.getBoundingClientRect();state.time=Math.max(0,Math.min(state.duration,(e.clientX-r.left)/pxPerSec()));renderPreview();renderTimeline()});
function play(){state.playing=!state.playing;$('#playBtn').textContent=state.playing?'❚❚':'▶';if(!state.playing){cancelAnimationFrame(raf);return}let last=performance.now();const loop=now=>{if(!state.playing)return;const dt=(now-last)/1000;last=now;state.time+=dt;if(state.time>=state.duration){state.time=0;state.playing=false;$('#playBtn').textContent='▶'}renderPreview();renderTimeline();if(state.playing)raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop)}
$('#playBtn').onclick=play;$('#stepBack').onclick=()=>{state.time=Math.max(0,state.time-.1);sync()};$('#stepForward').onclick=()=>{state.time=Math.min(state.duration,state.time+.1);sync()};
$('#timelineZoomIn').onclick=()=>{state.zoom=Math.min(2.5,state.zoom+.15);renderTimeline()};$('#timelineZoomOut').onclick=()=>{state.zoom=Math.max(.5,state.zoom-.15);renderTimeline()};
$('#videoFormat').onchange=e=>{const map={story:[1080,1920],landscape:[1920,1080],square:[1080,1080]};[state.w,state.h]=map[e.target.value];canvas.width=state.w;canvas.height=state.h;renderPreview()};
$$('[data-effect]').forEach(b=>b.onclick=()=>{state.effect=b.dataset.effect;renderPreview()});
$('#videoUndo').onclick=undo;$('#videoRedo').onclick=redo;
function closeSheets(){$$('.bottom-sheet').forEach(s=>s.classList.remove('open'));$('#videoBackdrop').classList.remove('open')}
function openSheet(id){closeSheets();$(id).classList.add('open');$('#videoBackdrop').classList.add('open')}
function openAssetTab(name){openSheet('#videoAssetSheet');$$('[data-vtab]').forEach(x=>x.classList.toggle('active',x.dataset.vtab===name));$$('[data-vpanel]').forEach(p=>p.classList.toggle('hidden',p.dataset.vpanel!==name))}
function openEdit(){inspect();openSheet('#videoEditSheet')}
$('#videoBackdrop').onclick=closeSheets;$$('[data-vclose]').forEach(b=>b.onclick=closeSheets);$$('[data-vtab]').forEach(b=>b.onclick=()=>openAssetTab(b.dataset.vtab));
$$('[data-vtool]').forEach(b=>b.onclick=()=>{const t=b.dataset.vtool;if(['media','audio','effects'].includes(t))openAssetTab(t);else if(t==='edit'){if(!selected()){toast('Select a clip first');return}openEdit()}});
async function renderWebM(){
 if(!window.MediaRecorder||!canvas.captureStream){toast('WebM render is not supported in this browser');return}
 const oldTime=state.time,oldPlay=state.playing;state.playing=false;state.time=0;
 const stream=canvas.captureStream(30),types=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];let type=types.find(t=>MediaRecorder.isTypeSupported(t))||'video/webm',rec=new MediaRecorder(stream,{mimeType:type}),chunks=[];rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
 rec.onstop=()=>{const blob=new Blob(chunks,{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${($('#videoProjectName').value||'MK97-video').replace(/[^\w-]+/g,'-')}.webm`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);state.time=oldTime;state.playing=oldPlay;renderPreview();renderTimeline();bump('exports');toast('WebM render complete')};
 rec.start(250);const start=performance.now();const step=now=>{state.time=Math.min(state.duration,(now-start)/1000);renderPreview();renderTimeline();if(state.time>=state.duration){rec.stop();return}requestAnimationFrame(step)};requestAnimationFrame(step)
}
$('#videoExport').onclick=renderWebM;$('#mobileRender').onclick=renderWebM;
window.addEventListener('resize',fitCanvas);window.addEventListener('keydown',e=>{if(e.code==='Space'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();play()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}if(e.key==='Delete'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))del()});
sync();
})();
