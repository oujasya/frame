import {flushSync} from 'react-dom';
import './film-transition.css';

let origin=null,current=null;
const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const visible=node=>{if(!node?.isConnected||node.closest('[hidden]'))return false;const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth&&getComputedStyle(node).visibility!=='hidden'};

export function rememberFilmDisc(event){
 const hit=event.target.closest?.('.film-disc,.poster,.wall-frame,.pip-film,.autocomplete-option');
 const disc=hit?.matches('.film-disc')?hit:hit?.querySelector('.movie-disc-shell');
 if(disc)origin=disc;
}

function findDisc(movieId){
 const id=Number(movieId);
 if(!Number.isSafeInteger(id)||id<1)return null;
 if(origin?.dataset.movieId===String(id)&&visible(origin))return origin;
 const candidates=[...document.querySelectorAll(`.film-disc[data-movie-id="${id}"],.movie-disc-shell[data-movie-id="${id}"]`)];
 return candidates.find(node=>node.matches('.film-disc[tabindex="0"]')&&visible(node))||candidates.find(visible)||null;
}

function revealDetails(startDelay=100){
 if(reduce())return;
 document.querySelectorAll('.movie-page-intro > .eyebrow,.movie-page-intro > h1,.movie-page-intro > .movie-tagline,.movie-page-intro > .movie-facts,.movie-page-intro > .movie-genres,.movie-page-intro > .film-scores,.movie-page-intro > .movie-synopsis,.movie-page-intro > .journal-actions').forEach((node,i)=>{
  node.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,delay:startDelay+Math.min(i,5)*40,easing:'cubic-bezier(.22,.75,.22,1)',fill:'backwards'});
 });
}

// The browser snapshots the actual disc, including the gallery's perspective.
// Only one old and one new disc receive the shared name; hidden copies never do.
export function changeFilmView(movieId,update,{direction='open',scroll,skip=false}={}){
 if(current){current.transition?.skipTransition();current.clean?.()}
 const apply=()=>{flushSync(update);if(scroll!==undefined)window.scrollTo({top:scroll,behavior:'instant'})};
 const sourceDisc=direction==='close'?document.querySelector('.movie-page-poster .movie-disc-shell'):findDisc(movieId);
 const gallery=sourceDisc?.matches('.film-disc')||direction==='close'&&findDisc(movieId)?.matches('.film-disc');
 // Name the stable carrier, not the perspective element: naming the latter flattens its 3D children.
 const surface=node=>node?.matches('.film-disc')?node.closest('.disc-position'):node;
 const source=surface(sourceDisc);
 if(skip||reduce()||!document.startViewTransition||!visible(source)){
  apply();if(direction==='open'&&!skip)revealDetails();return true;
 }
 const op={source,target:null,transition:null};current=op;
 const html=document.documentElement;
 html.dataset.filmMotion=direction;if(gallery)html.dataset.filmOrigin='gallery';
 source.style.viewTransitionName='frame-film-disc';
 const clean=()=>{
  if(op.cleaned)return;op.cleaned=true;
  source.style.removeProperty('view-transition-name');op.target?.style.removeProperty('view-transition-name');
  if(current===op){current=null;delete html.dataset.filmMotion;delete html.dataset.filmMotionPhase;delete html.dataset.filmOrigin}
 };
 op.clean=clean;
 try{
  op.transition=document.startViewTransition(()=>{
   if(op.cleaned)return;
   source.style.removeProperty('view-transition-name');apply();
   op.target=surface(direction==='open'?document.querySelector('.movie-page-poster .movie-disc-shell'):findDisc(movieId));
   if(op.target?.classList.contains('disc-position'))html.dataset.filmOrigin='gallery';
   if(visible(op.target))op.target.style.viewTransitionName='frame-film-disc';
  });
  op.transition.ready.then(()=>{if(current!==op||op.cleaned)return;html.dataset.filmMotionPhase='animating';if(direction==='open')revealDetails(gallery?420:100)}).catch(()=>{});
  op.transition.finished.catch(()=>{}).finally(clean);
 }catch{
  clean();apply();if(direction==='open')revealDetails();
 }
 return true;
}
