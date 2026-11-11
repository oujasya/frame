// Move the reflected light, rather than moving the whole object under the pointer.
const frames=new WeakMap(),positions=new WeakMap();
export function trackMaterialLight(event){
 if(event.pointerType==='touch'||matchMedia('(prefers-reduced-motion: reduce)').matches||!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
 const node=event.currentTarget,r=node.getBoundingClientRect();
 if(!r.width||!r.height)return;
 positions.set(node,{x:Math.max(0,Math.min(100,(event.clientX-r.left)/r.width*100)),y:Math.max(0,Math.min(100,(event.clientY-r.top)/r.height*100))});
 if(frames.has(node))return;
 frames.set(node,requestAnimationFrame(()=>{
  frames.delete(node);if(!node.isConnected)return;
  const point=positions.get(node);if(!point)return;
  node.style.setProperty('--light-x',`${point.x}%`);node.style.setProperty('--light-y',`${point.y}%`);
  node.style.setProperty('--light-angle',`${112+(point.x-50)*.32}deg`);
 }));
}
export function resetMaterialLight(event){
 const node=event.currentTarget,frame=frames.get(node);if(frame!==undefined)cancelAnimationFrame(frame);
 frames.delete(node);positions.delete(node);
 node.style.removeProperty('--light-x');node.style.removeProperty('--light-y');node.style.removeProperty('--light-angle');
}
