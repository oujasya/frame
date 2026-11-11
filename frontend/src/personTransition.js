import {flushSync} from 'react-dom';
import './person-transition.css';

const seeds=new Map();
let active=null,origin=null;
export const personSeed=id=>seeds.get(Number(id))||null;
const visible=node=>{if(!node?.isConnected||node.closest('[hidden]'))return false;const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&getComputedStyle(node).visibility!=='hidden'};
export function rememberPersonBadge(event,person,role,kind){
 if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 origin=event.currentTarget;
 seeds.set(Number(person.id),{...person,_badgeRole:role,_badgeKind:kind});
 while(seeds.size>40)seeds.delete(seeds.keys().next().value);
 history.replaceState({...history.state,scrollY:window.scrollY},'',location.href);
}
function gridBadge(id){
 if(origin?.dataset.personId===String(id)&&visible(origin))return origin;
 return [...document.querySelectorAll(`a.person-badge[data-person-id="${Number(id)}"]`)].find(visible);
}
export function changePersonView(id,update,{direction='open',scroll=0}={}){
 if(active){active.transition?.skipTransition();active.clean()}
 const apply=()=>{flushSync(update);window.scrollTo({top:scroll,behavior:'instant'})};
 const source=direction==='open'?gridBadge(id):document.querySelector('.person-badge-large');
 if(!document.startViewTransition||matchMedia('(prefers-reduced-motion:reduce)').matches||!visible(source)){apply();if(direction==='close')gridBadge(id)?.focus({preventScroll:true});return}
 const op={source,target:null};active=op;
 const html=document.documentElement;
 html.dataset.personMotion=direction;
 source.style.viewTransitionName='frame-person-badge';
 const clean=()=>{
  if(op.cleaned)return;op.cleaned=true;
  source.style.removeProperty('view-transition-name');op.target?.style.removeProperty('view-transition-name');
  if(active===op){active=null;delete html.dataset.personMotion;if(direction==='close'&&visible(op.target))op.target.focus({preventScroll:true})}
 };
 op.clean=clean;
 try{
  op.transition=document.startViewTransition(()=>{
   if(op.cleaned)return;
   source.style.removeProperty('view-transition-name');apply();
   op.target=direction==='open'?document.querySelector('.person-badge-large'):gridBadge(id);
   if(visible(op.target))op.target.style.viewTransitionName='frame-person-badge';
  });
  op.transition.ready.catch(()=>{});
  op.transition.finished.catch(()=>{}).finally(clean);
 }catch{clean();apply()}
}
