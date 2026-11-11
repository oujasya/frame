import React,{useEffect,useLayoutEffect,useRef,useState,useId} from 'react';
import './disc-gallery.css';
import DiscSketch from './DiscSketch';
import DiscMaterial from './DiscMaterial';
import ProjectorDust from './ProjectorDust';
import {ChangingTitle} from './CollectorMotion';
import {trackMaterialLight,resetMaterialLight} from './materialLight';

let galleryHintSeen=false;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

// Native page scrolling supplies the timeline. Only the disc transforms are interpolated.
export default function DiscGallery({loading=false,movies,Artwork,api,saved,busy,onOpenMovie,onToggle,onBrowse}){
 const root=useRef(null),discs=useRef([]),position=useRef(0),target=useRef(0),drag=useRef(null),blockClick=useRef(false);
 const [active,setActive]=useState(0),[flipped,setFlipped]=useState(false),[ready,setReady]=useState(false);
 const hintId=useId(),[hintHidden,setHintHidden]=useState(()=>galleryHintSeen);
 useEffect(()=>{if(!ready||hintHidden)return;galleryHintSeen=true;const timer=setTimeout(()=>setHintHidden(true),6500);return()=>clearTimeout(timer)},[ready,hintHidden]);
 const films=movies.slice(0,12),film=films[active];
 const activeRef=useRef(0);
 useEffect(()=>{
  if(loading&&!films.length)return;
  let cancelled=false,timer;
  const images=[...root.current.querySelectorAll('img')].slice(0,3);
  const tasks=images.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true})}));
  Promise.race([Promise.all(tasks),new Promise(resolve=>{timer=setTimeout(resolve,3500)})]).then(()=>{if(!cancelled){setReady(true)}});
  return()=>{cancelled=true;clearTimeout(timer)};
 },[films.length>0,loading]);
 useLayoutEffect(()=>{
  const el=root.current;let frame,updateFrame=null,visible=true,last=performance.now();
  const update=()=>{const rect=el.getBoundingClientRect(),distance=Math.max(1,el.offsetHeight-innerHeight);target.current=clamp(-rect.top/distance*(films.length-1),0,Math.max(0,films.length-1));visible=rect.bottom>0&&rect.top<innerHeight;el.style.setProperty('--gallery-ui-visibility',rect.top<=1&&rect.bottom>=innerHeight*.7?'visible':'hidden')};
  const draw=(now)=>{
   const dt=Math.min(40,now-last);last=now;
   if(visible&&document.documentElement.dataset.filmOrigin!=='gallery'){
    position.current+= (target.current-position.current)*(reduced()?1:1-Math.exp(-dt/105));
    const index=Math.round(position.current);
    if(index!==activeRef.current){activeRef.current=index;setActive(index);setFlipped(false)}
    const mobile=innerWidth<700,size=Math.min(innerWidth*(mobile?.78:.37),innerHeight*(mobile?.49:.68),560);
    discs.current.forEach((node,i)=>{
     if(!node)return;
     const d=i-position.current,scale=1/(1-clamp(d,-8,2.1)*.235);
     const x=d*size*(mobile?.95:.92)*scale,y=-d*size*.27*scale;
     node.style.setProperty('--disc-size',`${size}px`);
     node.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`;
     node.style.opacity=Math.abs(d)>4?'0':'1';
     node.style.visibility=Math.abs(d)>4?'hidden':'visible';
     node.style.zIndex=String(30+i);
     node.style.pointerEvents=Math.abs(d)<2?'auto':'none';
     node.style.setProperty('--spin',`${d*-18}deg`);
    });
   }
   frame=requestAnimationFrame(draw);
  };
  const queueUpdate=()=>{if(updateFrame===null)updateFrame=requestAnimationFrame(()=>{updateFrame=null;update()})};
  update();frame=requestAnimationFrame(draw);
  window.addEventListener('scroll',queueUpdate,{passive:true});window.addEventListener('resize',queueUpdate);
  const observer=new ResizeObserver(queueUpdate);observer.observe(el);
  return()=>{cancelAnimationFrame(frame);if(updateFrame!==null)cancelAnimationFrame(updateFrame);observer.disconnect();window.removeEventListener('scroll',queueUpdate);window.removeEventListener('resize',queueUpdate)};
 },[films.length]);
 function go(index){const el=root.current;if(!el)return;const distance=Math.max(1,el.offsetHeight-innerHeight);const top=el.getBoundingClientRect().top+scrollY+clamp(index,0,films.length-1)/Math.max(1,films.length-1)*distance;window.scrollTo({top,behavior:'instant'})}
 function keyboard(e){
  if(e.target.closest('input,select,textarea')||e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(active+(e.key==='ArrowRight'?1:-1))}
  else if(e.code==='Space'&&(e.target===e.currentTarget||e.target.closest('.film-disc'))){e.preventDefault();setFlipped(f=>!f)}
  else if(e.key==='Enter'&&e.target===e.currentTarget&&film){e.preventDefault();onOpenMovie(film)}
 }
 function startDrag(e){if(e.target.closest('button,a')&&!e.target.closest('.film-disc'))return;drag.current={x:e.clientX,y:scrollY,id:e.pointerId,moved:false};blockClick.current=false}
 function moveDrag(e){const d=drag.current;if(!d)return;if(Math.abs(d.x-e.clientX)>7&&!d.moved){d.moved=true;blockClick.current=true;e.currentTarget.setPointerCapture(e.pointerId)}if(d.moved)window.scrollTo({top:d.y+(d.x-e.clientX)*2.3,behavior:'instant'})}
 function endDrag(){const d=drag.current;drag.current=null;if(d?.moved)go(Math.round(target.current))}
 return <section ref={root} className={`disc-journey ${ready?'is-ready':''}`} style={{'--film-count':Math.max(2,films.length)}} aria-label="FRAME film disc gallery">
  <div className="disc-sticky" tabIndex={0} aria-describedby={hintId} onKeyDown={keyboard} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={()=>{drag.current=null;blockClick.current=false}} onClickCapture={e=>{if(blockClick.current){e.preventDefault();e.stopPropagation();blockClick.current=false}}}>

   {!ready&&<div className="disc-loader" role="status" aria-label="Preparing film gallery"><div className="gallery-loading-copy"><span className="eyebrow">Preparing your film collection</span><span className="loading-line loading-title"/><span className="loading-line"/><span className="loading-line loading-short"/></div><div className="gallery-loading-disc" aria-hidden="true"/></div>}
   <div className="disc-film-info"><div className="hero-message"><h1 className="heading-1 hero-heading">Your life.<br/>In film.</h1><p className="body-3 hero-subheading">Discover movies, keep a watchlist, and remember what you watched.</p></div>
    <ChangingTitle as="h2" className="title-1 hero-film-title" text={film?.title||'A life in film'}/>
    <div><span>YEAR</span><p>{film?.release_date?.slice(0,4)||'—'}</p></div>
    <div className="disc-meta-actions"><button onClick={()=>film&&onOpenMovie(film)} disabled={!film}>Explore this film ↗</button></div>
   </div>
   <ProjectorDust/><div className="disc-scene" aria-label="Movie discs">
    {films.map((m,i)=><div className="disc-position" key={m.id} ref={node=>{discs.current[i]=node}}>
     <button onPointerMove={trackMaterialLight} onPointerLeave={resetMaterialLight} data-movie-id={m.id} className={`film-disc ${i===active&&flipped?'is-flipped':''}`} aria-label={`${m.title}${i===active?' — open film':' — browse to film'}`} tabIndex={i===active?0:-1} onClick={()=>i===active?onOpenMovie(m):go(i)}>
      <span className="disc-spin"><span className="disc-body"><span className="disc-face disc-front"><span className="disc-art"><Artwork movie={m} disc={false}/></span><span className="disc-print"><small>FRAME ORIGINAL SELECTION</small><strong>{m.title}</strong><em>{m.release_date?.slice(0,4)} · FRAME</em></span><span className="disc-grooves"/>{ready&&i===active&&<DiscMaterial/>}</span><span className="disc-face disc-back"><span>FRAME<br/><small>A LIFE IN FILM</small></span></span><span className="disc-hub"/></span></span><DiscSketch/>
     </button>
    </div>)}
   </div>
   <div className="disc-controls"><span>{String(active+1).padStart(2,'0')} / {String(films.length).padStart(2,'0')}</span><div><button onClick={()=>go(active-1)} disabled={active===0} aria-label="Previous film">←</button><button className="disc-flip" onClick={()=>setFlipped(f=>!f)} aria-pressed={flipped}>Flip disc</button><button onClick={()=>go(active+1)} disabled={!films.length||active===films.length-1} aria-label="Next film">→</button></div><button onClick={onBrowse}>Browse collection ↓</button></div>
   <p id={hintId} className="disc-instructions" data-dismissed={hintHidden}>Scroll to explore · Drag to browse · ← → to navigate · Space to flip</p>
   {!films.length&&ready&&<div className="disc-unavailable"><h2>The projector is warming up.</h2><p>Movie artwork will appear when the movie service connects.</p><button onClick={onBrowse}>Browse FRAME ↓</button></div>}
  </div>
 </section>;
}
