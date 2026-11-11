import React,{useEffect,useRef,useState} from 'react';
import PersonBadge from './PersonBadge';
export function deckStep(index,change,length){return Math.max(0,Math.min(length-1,index+change))}
export default function PeopleDeck({people,kind='Cast',role}){
 const [mobile,setMobile]=useState(()=>matchMedia('(max-width:700px)').matches),[index,setIndex]=useState(0);
 const drag=useRef(null),blocked=useRef(false),scene=useRef(null);
 useEffect(()=>{const query=matchMedia('(max-width:700px)'),change=()=>setMobile(query.matches);query.addEventListener('change',change);return()=>query.removeEventListener('change',change)},[]);
 useEffect(()=>{setIndex(i=>Math.min(i,Math.max(0,people.length-1)))},[people.length]);
 function step(by){setIndex(i=>deckStep(i,by,people.length))}
 function down(e){if(e.button!==0)return;drag.current={x:e.clientX,y:e.clientY,id:e.pointerId,moved:false};blocked.current=false}
 function move(e){const d=drag.current;if(!d)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(!d.moved&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>12){drag.current=null;return}if(Math.abs(dx)>12){d.moved=true;blocked.current=true;e.currentTarget.setPointerCapture(e.pointerId);e.currentTarget.style.setProperty('--deck-drag',`${Math.max(-100,Math.min(100,dx))}px`);e.currentTarget.dataset.dragging='true'}}
 function finish(e){const d=drag.current;drag.current=null;scene.current?.style.removeProperty('--deck-drag');if(scene.current)delete scene.current.dataset.dragging;if(d?.moved&&Math.abs(e.clientX-d.x)>45)step(e.clientX<d.x?1:-1)}
 function cancel(){drag.current=null;scene.current?.style.removeProperty('--deck-drag');if(scene.current)delete scene.current.dataset.dragging}
 const badge=person=><PersonBadge person={person} role={role(person)} kind={kind}/>;
 if(!mobile)return <div className="people-badge-grid">{people.map(person=><React.Fragment key={person.credit_id||person.id}>{badge(person)}</React.Fragment>)}</div>;
 return <div className="people-deck" role="region" aria-label={`${kind} ID cards`}><div ref={scene} className="people-deck-scene" onDragStart={e=>e.preventDefault()} onPointerDown={down} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel} onClickCapture={e=>{if(blocked.current){e.preventDefault();e.stopPropagation();blocked.current=false}}}>{people.map((person,i)=>{const depth=i-index;return <div key={person.credit_id||person.id} className="people-deck-card" data-active={i===index?'true':'false'} inert={i!==index} aria-hidden={i!==index} style={{'--deck-depth':Math.max(0,Math.min(3,depth)),zIndex:people.length-i,visibility:depth<0||depth>2?'hidden':'visible'}}>{badge(person)}</div>})}</div><div className="people-deck-controls"><button className="secondary" disabled={index===0} onClick={()=>step(-1)} aria-label={`Previous ${kind.toLowerCase()} member`}>←</button><span aria-live="polite">{index+1} / {people.length}</span><button className="secondary" disabled={index===people.length-1} onClick={()=>step(1)} aria-label={`Next ${kind.toLowerCase()} member`}>→</button></div><p className="people-deck-hint">Swipe to browse · Tap an ID to meet them</p></div>;
}
