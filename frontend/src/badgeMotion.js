import {useEffect,useRef} from 'react';

// One damped animation loop per hovered card; the deck keeps its own transform.
export function useBadgeMotion(){
 const state=useRef({node:null,frame:null,x:.5,y:.5,tx:.5,ty:.5,last:0});
 useEffect(()=>()=>{cancelAnimationFrame(state.current.frame)},[]);
 function animate(now){
  const s=state.current;if(!s.node?.isConnected){s.frame=null;return}
  const dt=s.last?Math.min((now-s.last)/1000,1/30):1/60;s.last=now;
  const blend=1-Math.exp(-12*dt);s.x+=(s.tx-s.x)*blend;s.y+=(s.ty-s.y)*blend;
  s.node.style.setProperty('--badge-rx',`${(.5-s.y)*18}deg`);
  s.node.style.setProperty('--badge-ry',`${(s.x-.5)*22}deg`);
  s.node.style.setProperty('--badge-light-x',`${s.x*100}%`);
  s.node.style.setProperty('--badge-light-y',`${s.y*100}%`);
  if(Math.abs(s.tx-s.x)+Math.abs(s.ty-s.y)>.0003)s.frame=requestAnimationFrame(animate);else{s.frame=null;s.last=0}
 }
 function move(event){
  if(event.pointerType==='touch'||!matchMedia('(hover:hover) and (pointer:fine)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const s=state.current,node=event.currentTarget,r=node.getBoundingClientRect();if(!r.width||!r.height)return;
  s.node=node;s.tx=Math.max(0,Math.min(1,(event.clientX-r.left)/r.width));s.ty=Math.max(0,Math.min(1,(event.clientY-r.top)/r.height));
  if(s.frame===null)s.frame=requestAnimationFrame(animate);
 }
 function reset(event){const s=state.current;s.node=event.currentTarget;s.tx=.5;s.ty=.5;if(s.frame===null)s.frame=requestAnimationFrame(animate)}
 return {onPointerMove:move,onPointerLeave:reset,onPointerCancel:reset,onBlur:reset};
}
