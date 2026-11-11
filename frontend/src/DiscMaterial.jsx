import React,{useEffect,useRef} from 'react';

export default function DiscMaterial({freezeTime=null,onDiagnostics}){
 const ref=useRef(null),callback=useRef(onDiagnostics);callback.current=onDiagnostics;
 useEffect(()=>{
  const host=ref.current,reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let engine=null,visible=false,disposed=false,loading=false,failed=false;
  const owner=host.closest('.film-disc,.movie-disc-shell')||host.parentElement;
  function emit(value){callback.current?.(value)}
  function release(){engine?.dispose();engine=null}
  async function sync(){
   if(disposed)return;
   if(reduced.matches){release();host.dataset.renderState='reduced';return}
   if(visible&&!document.hidden&&!engine&&!loading&&!failed){
    loading=true;
    try{
     const {createDiscScene}=await import('./discScene');
     if(disposed||reduced.matches||!visible)return;
     engine=createDiscScene(host,{freezeTime,onDiagnostics:emit});
    }catch{failed=true;host.dataset.renderState='fallback';emit({state:'fallback',geometries:0,textures:0,programs:0})}
    finally{loading=false}
   }
   engine?.setRunning(visible&&!document.hidden);
  }
  const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()});intersection.observe(host);
  const resize=new ResizeObserver(()=>engine?.resize());resize.observe(host);
  function move(event){if(!engine||event.pointerType==='touch')return;const r=owner.getBoundingClientRect();if(r.width&&r.height)engine.setPointer((event.clientX-r.left)/r.width*2-1,1-(event.clientY-r.top)/r.height*2)}
  function leave(){engine?.setPointer(0,0)}
  function lost(event){event.preventDefault();failed=true;release();host.dataset.renderState='fallback';emit({state:'fallback',geometries:0,textures:0,programs:0})}
  owner.addEventListener('pointermove',move,{passive:true});owner.addEventListener('pointerleave',leave);host.addEventListener('webglcontextlost',lost,true);
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);sync();
  return()=>{disposed=true;intersection.disconnect();resize.disconnect();owner.removeEventListener('pointermove',move);owner.removeEventListener('pointerleave',leave);host.removeEventListener('webglcontextlost',lost,true);document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);release()};
 },[freezeTime]);
 return <span ref={ref} className="disc-gpu-material" aria-hidden="true" data-render-state="pending"/>;
}
