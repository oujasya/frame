import React from 'react';
import DiscSketch from './DiscSketch';
import DiscMaterial from './DiscMaterial';
import {trackMaterialLight,resetMaterialLight} from './materialLight';

// Shared film artwork: the surrounding button retains its action and accessible name.
export default function MovieDisc({children,movieId,enhanced=false}){
 return <span className="movie-disc-shell" data-movie-id={movieId} onPointerMove={trackMaterialLight} onPointerLeave={resetMaterialLight}><span className="movie-disc-art"><span className="movie-disc-label">{children}</span><span className="movie-disc-grooves" aria-hidden="true"/><span className="movie-disc-sheen" aria-hidden="true"/>{enhanced&&<DiscMaterial/>}<span className="movie-disc-centre" aria-hidden="true"/></span><DiscSketch/></span>;
}
