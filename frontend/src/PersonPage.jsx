import React,{useEffect,useRef,useState} from 'react';
import PersonBadge from './PersonBadge';
import {personSeed} from './personTransition';

export function collectFilmCredits(credits,filter='all'){
 const films=new Map();
 for(const type of ['cast','crew']){
  if(filter!=='all'&&filter!==type)continue;
  for(const credit of credits?.[type]||[]){
   if(!credit.id||credit.adult)continue;
   const role=type==='cast'?(credit.character||'Cast'):(credit.job||credit.department||'Crew');
   if(!films.has(credit.id))films.set(credit.id,{...credit,roles:[]});
   const movie=films.get(credit.id);if(!movie.roles.includes(role))movie.roles.push(role);
  }
 }
 return [...films.values()];
}
export default function PersonPage({id,api,renderCards,onBrowse}){
 const [person,setPerson]=useState(()=>personSeed(id)),[error,setError]=useState(''),[retry,setRetry]=useState(0),[filter,setFilter]=useState('all'),[sort,setSort]=useState('popular'),[limit,setLimit]=useState(24);
 const [loading,setLoading]=useState(true);
 const heading=useRef(null);
 useEffect(()=>{let active=true;const controller=new AbortController();setError('');setLoading(true);setPerson(personSeed(id));api(`/people/${id}`,{signal:controller.signal}).then(data=>{if(active)setPerson(data)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false;controller.abort()}},[id,retry,api]);
 useEffect(()=>{const old=document.title;document.title=person?`${person.name} — FRAME`:'Film people — FRAME';return()=>{document.title=old}},[person?.name]);
 useEffect(()=>{if(person||error)heading.current?.focus({preventScroll:true})},[person,error]);
 const films=collectFilmCredits(person?.movie_credits,filter).sort((a,b)=>sort==='recent'?(b.release_date||'').localeCompare(a.release_date||''):(b.popularity||0)-(a.popularity||0));
 function back(){if(history.length>1)history.back();else onBrowse()}
 return <section className="person-page" data-person-id={id}><div className="shell section"><button className="secondary person-back" onClick={back}>← Back to films</button>{!person?<div className="person-loading" role="status"><h1 ref={heading} tabIndex={-1}>{error?'This profile could not load.':'Opening the archive…'}</h1>{error&&<><p role="alert">{error}</p><button className="primary" onClick={()=>setRetry(v=>v+1)}>Retry profile</button></>}</div>:<><div className="person-dossier"><PersonBadge person={person} large role={personSeed(id)?._badgeRole} kind={personSeed(id)?._badgeKind||(person.known_for_department==='Acting'?'Cast':'Crew')}/><div className="person-paper"><p className="eyebrow">THE PEOPLE BEHIND THE PICTURE</p><h1 ref={heading} tabIndex={-1}>{person.name}</h1><p className="person-specialty">{person.known_for_department||'Film contributor'}</p><dl className="person-facts">{person.birthday&&<div><dt>Born</dt><dd>{new Date(person.birthday+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'})}</dd></div>}{person.place_of_birth&&<div><dt>From</dt><dd>{person.place_of_birth}</dd></div>}{person.deathday&&<div><dt>Died</dt><dd>{person.deathday}</dd></div>}<div><dt>Film credits</dt><dd>{loading?'…':collectFilmCredits(person.movie_credits).length}</dd></div></dl><h2>About</h2><div className="person-biography">{person.biography||(loading?'Loading biography…':'A biography is not available for this person yet.')}</div>{error&&<div role="alert"><p>{error}</p><button className="secondary" onClick={()=>setRetry(v=>v+1)}>Retry profile</button></div>}</div></div><section className="person-filmography"><div className="person-credits-heading"><div><p className="eyebrow">THE WORK, ON DISC</p><h2>Filmography <small>({loading?'…':films.length})</small></h2></div><label>Sort films<select value={sort} onChange={e=>{setSort(e.target.value);setLimit(24)}}><option value="popular">Most popular</option><option value="recent">Newest first</option></select></label></div><div className="person-credit-tabs" role="group" aria-label="Film credit type">{[['all','All films'],['cast','On screen'],['crew','Behind the camera']].map(([value,label])=><button key={value} className="secondary" aria-pressed={filter===value} onClick={()=>{setFilter(value);setLimit(24)}}>{label}</button>)}</div>{loading?<p role="status">Loading film credits…</p>:films.length?<>{renderCards(films.slice(0,limit))}<details className="person-credit-details"><summary>Read roles & credits</summary><ul>{films.slice(0,limit).map(f=><li key={f.id}><a href={`#/movie/${f.id}`}>{f.title}</a><span>{f.roles.join(' · ')}</span></li>)}</ul></details>{films.length>limit&&<button className="secondary" onClick={()=>setLimit(v=>v+24)}>Show more films</button>}</>:<p>No films are listed in this category.</p>}</section></>}</div></section>;
}
