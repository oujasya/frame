import React,{useEffect,useRef} from 'react';
import {createDustField,seekDust} from './cinemaPhysics';

export default function ProjectorDust({freezeTime=null,seed=1409,strength=1}){
 const ref=useRef(null);
 useEffect(()=>{
  const canvas=ref.current,ctx=canvas.getContext('2d');if(!ctx)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),mobile=matchMedia('(max-width:700px)');
  let field=null,frame=null,visible=false,last=0,disposed=false;
  function draw(){
   if(!field)return;ctx.clearRect(0,0,field.width,field.height);
   ctx.fillStyle='#66533e';
   for(const p of field.particles){ctx.globalAlpha=Math.min(.65,p.opacity*strength)*Math.sin(Math.PI*Math.min(1,p.age/p.life));ctx.beginPath();ctx.ellipse(p.x,p.y,p.size,p.size*.75,p.phase,0,Math.PI*2);ctx.fill()}
   ctx.globalAlpha=1;
  }
  function stop(){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0}
  function loop(now){
   if(disposed)return;frame=null;
   if(last)field?.step((now-last)/1000);last=now;draw();
   frame=requestAnimationFrame(loop);
  }
  function sync(){
   stop();if(reduced.matches){ctx.clearRect(0,0,canvas.width,canvas.height);canvas.dataset.renderState='reduced';return}
   if(freezeTime!==null){draw();canvas.dataset.renderState='frozen';return}
   if(visible&&!document.hidden){canvas.dataset.renderState='running';frame=requestAnimationFrame(loop)}else canvas.dataset.renderState='paused';
  }
  function resize(){
   const box=canvas.getBoundingClientRect();if(!box.width||!box.height){stop();return}
   const ratio=Math.min(devicePixelRatio||1,mobile.matches?1:1.5);
   canvas.width=Math.round(box.width*ratio);canvas.height=Math.round(box.height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
   field=createDustField(box.width,box.height,mobile.matches?12:28,seed);
   if(freezeTime!==null)seekDust(field,freezeTime);
   canvas.dataset.particleCount=String(field.particles.length);sync();
  }
  const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()});intersection.observe(canvas);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);mobile.addEventListener('change',resize);resize();
  return()=>{disposed=true;stop();intersection.disconnect();resizeObserver.disconnect();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);mobile.removeEventListener('change',resize);ctx.clearRect(0,0,canvas.width,canvas.height)};
 },[freezeTime,seed,strength]);
 return <canvas ref={ref} className="projector-dust" aria-hidden="true"/>;
}
