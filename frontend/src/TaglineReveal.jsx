import React,{useRef} from 'react';
import {useScrollMaterial} from './CollectorMotion';

const lines=['Find your next favorite.','Keep the films that stay with you.'];
export default function TaglineReveal(){
 const ref=useRef(null);
 useScrollMaterial(ref,(el,rect,reduced)=>{
  const words=[...el.querySelectorAll('.tagline-word')];
  const progress=Math.max(0,Math.min(1,(innerHeight*.85-rect.top)/Math.max(1,innerHeight*.6)));
  words.forEach((word,i)=>word.style.setProperty('--word-opacity',reduced||progress>=i/Math.max(1,words.length-1)?'1':'.3'));
 },lines.length);
 return <section ref={ref} className="shell tagline-reveal" aria-label="A life in film"><h2 className="heading-2 tagline-heading" aria-label={lines.join(' ')}>{lines.map((line,i)=><span className="tagline-line" key={line}>{line.split(' ').map((word,n)=><React.Fragment key={n}><span className="tagline-word" aria-hidden="true">{word}</span>{' '}</React.Fragment>)}</span>)}</h2></section>;
}
