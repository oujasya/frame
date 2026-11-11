import React,{useState} from 'react';
import {API} from './api';
import {useBadgeMotion} from './badgeMotion';
import {rememberPersonBadge} from './personTransition';
export default function PersonBadge({person,role,kind='Cast',large=false}){
 const motion=useBadgeMotion();
 const [failed,setFailed]=useState(false);
 const portrait=person.profile_path&&/^\/[a-zA-Z0-9_.-]+$/.test(person.profile_path);
 const initials=(person.name||'?').split(' ').map(n=>n[0]).slice(0,2).join('');
 const contents=<span className="badge-solid"><span className="badge-card-back" aria-hidden="true"/><span className="badge-edge" aria-hidden="true"/><span className="badge-card-face"><span className="badge-sheen" aria-hidden="true"/><span className="badge-security" aria-hidden="true">F</span><div className="badge-slot" aria-hidden="true"/><header className="badge-header"><b>FRAME</b><span>{kind} / FILM ARCHIVE</span></header><div className="badge-portrait">{portrait&&!failed?<img draggable={false} src={`${API}/api/artwork/tmdb/w500${person.profile_path}`} alt="" loading={large?'eager':'lazy'} onError={()=>setFailed(true)}/>:<span className="badge-initials" aria-hidden="true">{initials}</span>}<span className="badge-stamp" aria-hidden="true">{kind}</span></div><div className="badge-name"><strong>{person.name||'Name unavailable'}</strong><span>{role||person.known_for_department||'Film contributor'}</span></div><footer className="badge-footer"><span className="badge-barcode" aria-hidden="true"/><small>PERSON / {String(person.id).padStart(7,'0')}</small>{!large&&<span aria-hidden="true">↗</span>}</footer><span className="badge-laminate" aria-hidden="true"/></span></span>;
 return large?<div className="person-badge person-badge-large" data-person-id={person.id} {...motion}>{contents}</div>:<a className="person-badge" data-person-id={person.id} {...motion} onClick={event=>rememberPersonBadge(event,person,role,kind)} href={`#/person/${person.id}`} aria-label={`View ${person.name}, ${role||kind}`}>{contents}</a>;
}
