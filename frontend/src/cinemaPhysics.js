export function seededRandom(seed=1409){
 let state=seed>>>0;
 return ()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296};
}
export function createDustField(width,height,count=28,seed=1409){
 const rng=seededRandom(seed),field={width:Math.max(1,width),height:Math.max(1,height),time:0,particles:[]};
 function spawn(first=false){
  const life=9+rng()*12;
  return {x:rng()*field.width,y:first?rng()*field.height:field.height+3,vx:(rng()-.5)*5,vy:-3-rng()*4,age:first?rng()*life:0,life,phase:rng()*Math.PI*2,size:.45+rng()*.85,opacity:.1+rng()*.1};
 }
 field.particles=Array.from({length:count},()=>spawn(true));
 field.step=delta=>{
  const dt=Math.max(0,Math.min(Number.isFinite(delta)?delta:0,1/30));field.time+=dt;
  for(const p of field.particles){
   const ax=Math.sin(field.time*.21+p.phase)*1.5,ay=-1.3;
   p.vx=(p.vx+ax*dt)*Math.exp(-.35*dt);p.vy=(p.vy+ay*dt)*Math.exp(-.3*dt);
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.age+=dt;
   if(p.x<-4)p.x=field.width+3;if(p.x>field.width+4)p.x=-3;
   if(p.age>=p.life||p.y<-4)Object.assign(p,spawn());
  }
 };
 return field;
}
export function seekDust(field,seconds){
 const end=Math.max(0,Math.min(30,Number.isFinite(seconds)?seconds:0)),frames=Math.floor(end*60);
 for(let i=0;i<frames;i++)field.step(1/60);
 const remainder=end-frames/60;if(remainder>0)field.step(remainder);
 return field;
}
export function damp(current,target,lambda,delta){return current+(target-current)*(1-Math.exp(-lambda*Math.max(0,Math.min(delta,1/30))))}
