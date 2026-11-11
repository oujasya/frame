import React,{useEffect,useId,useRef,useState} from 'react';
import {AnimatedCollapse} from './Motion.jsx';

export function useReducedMotion(){
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(query.matches);query.addEventListener('change',change);return()=>query.removeEventListener('change',change)},[]);
 return reduced;
}

// A single update per frame, only while the scene intersects the viewport.
export function useScrollMaterial(ref,update,key){
 const reduced=useReducedMotion(),latest=useRef(update);latest.current=update;
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  let frame=null,visible=true;
  const draw=()=>{frame=null;if(el.isConnected&&visible)latest.current(el,el.getBoundingClientRect(),reduced)};
  const queue=()=>{if(frame===null)frame=requestAnimationFrame(draw)};
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)queue()},{rootMargin:'100px'});
  const resize=new ResizeObserver(queue);observer.observe(el);resize.observe(el);
  window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue);queue();
  return()=>{observer.disconnect();resize.disconnect();window.removeEventListener('scroll',queue);window.removeEventListener('resize',queue);if(frame!==null)cancelAnimationFrame(frame)};
 },[reduced,key]);
}

export function AnimatedNumber({value,decimals=0}){
 const ref=useRef(null),[seen,setSeen]=useState(false),reduced=useReducedMotion();
 const valid=value!==null&&value!==''&&Number.isFinite(Number(value));
 const format=n=>Number(n).toLocaleString(undefined,{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
 const target=valid?format(value):String(value??'—'),shown=target;
 useEffect(()=>{if(!ref.current||seen)return;const observer=new IntersectionObserver(([e])=>{if(e.isIntersecting){setSeen(true);observer.disconnect()}},{threshold:.1});observer.observe(ref.current);return()=>observer.disconnect()},[seen]);
 return <span className="collector-number" ref={ref} data-value={target}><span className="sr-only">{target}</span><span className="collector-number-visual" aria-hidden="true">{[...shown].map((digit,i)=>/\d/.test(digit)?<span className="number-window" key={`digit-${shown.length-i}`}><span className="number-strip" style={{transform:`translateY(-${(seen||reduced?Number(digit):0)}em)`}}>{Array.from({length:10},(_,n)=><span key={n}>{n}</span>)}</span></span>:<span key={`mark-${shown.length-i}`}>{digit}</span>)}</span></span>;
}

export function ReviewNote({text,children,label='Read full review',limit=220}){
 const [open,setOpen]=useState(false),id=useId();
 if(!text||text.length<=limit)return <>{children}</>;
 return <div className={`collector-note ${open?'is-open':''}`}><div className="collector-note-preview" hidden={open}>{text.slice(0,limit).trimEnd()}…</div><AnimatedCollapse open={open}><div id={id} className="collector-note-full">{children}</div></AnimatedCollapse><button className="text-button collector-note-toggle" aria-expanded={open} aria-controls={open?id:undefined} onClick={()=>setOpen(v=>!v)}>{open?'Fold review':label}<span aria-hidden="true">{open?'−':'+'}</span></button></div>;
}

export function CinemaBackdrop({movie,Artwork}){
 const ref=useRef(null);
 useScrollMaterial(ref,(el,rect,reduced)=>el.style.setProperty('--wall-parallax',`${reduced?0:Math.max(-30,Math.min(100,-rect.top*.13))}px`),movie.id);
 return <div ref={ref} className="movie-page-backdrop cinema-parallax" aria-hidden="true">{movie.backdrop_path&&<Artwork key={movie.backdrop_path} movie={movie} hero/>}</div>;
}

export function DiaryTimeline({children,revision}){
 const ref=useRef(null);
 useScrollMaterial(ref,(el,rect,reduced)=>{
  const progress=reduced?1:Math.max(0,Math.min(1,(innerHeight*.72-rect.top)/Math.max(1,rect.height)));
  el.style.setProperty('--diary-progress',String(progress));
 },revision);
 return <div ref={ref} className="diary-entries collector-timeline"><svg className="diary-ink-track" viewBox="0 0 20 1000" preserveAspectRatio="none" aria-hidden="true"><path className="diary-ink-guide" d="M10 1 C4 120 16 230 9 340 S14 550 9 680 S15 890 10 999"/><path className="diary-ink-progress" pathLength="1" d="M10 1 C4 120 16 230 9 340 S14 550 9 680 S15 890 10 999"/></svg>{children}</div>;
}

export function CollectionStack({collections,Artwork,onOpen}){
 const ref=useRef(null),items=collections.filter(c=>c.movies?.length).slice(0,3);
 useScrollMaterial(ref,(el,rect,reduced)=>{
  const progress=Math.max(0,Math.min(1,-(rect.top-100)/Math.max(1,rect.height-innerHeight*.55)));
  el.querySelectorAll('.collector-sleeve').forEach((card,i)=>card.style.setProperty('--sleeve-scale',String(reduced?1:1-Math.min(.055,Math.max(0,progress-i*.34)*.085))));
 },items.length);
 if(!items.length)return null;
 return <section id="featured-collections" className="shell section collector-curation" aria-label="Featured film collections"><div className="section-head"><div><p className="eyebrow">PULLED FROM THE SHELF</p><h2>Find your next collection.</h2></div></div><div ref={ref} className="collector-stack">{items.map((item,i)=><article className="collector-sleeve" key={item.id} style={{'--sleeve-index':i}}><div className="sleeve-copy"><span className="sleeve-edition">FRAME / SELECTION {String(i+1).padStart(2,'0')}</span><h3>{item.title}</h3><p>{item.description}</p><button className="secondary" onClick={()=>onOpen(item.id)}>Explore collection <span aria-hidden="true">↗</span></button></div><div className="sleeve-discs" aria-hidden="true">{item.movies.slice(0,3).map((movie,n)=><div className="sleeve-disc" key={movie.id} style={{'--sleeve-disc':n}}><Artwork movie={movie}/></div>)}</div><span className="sleeve-footer">HANDLE WITH CARE · KEEP DISCOVERING</span></article>)}</div></section>;
}

export function ChangingTitle({text,as:Tag='span',...props}){
 const previous=useRef(text),[departing,setDeparting]=useState(null),reduced=useReducedMotion();
 useEffect(()=>{if(previous.current===text)return;setDeparting(previous.current);previous.current=text;const timer=setTimeout(()=>setDeparting(null),450);return()=>clearTimeout(timer)},[text]);
 return <Tag {...props} className={`changing-title ${props.className||''}`} data-changing-title="true">{departing&&!reduced&&<span className="changing-title-old" aria-hidden="true" key={`old-${departing}`}>{departing}</span>}<span className="changing-title-new" key={text}>{text}</span></Tag>;
}
