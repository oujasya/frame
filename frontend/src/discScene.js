import * as THREE from 'three';
import {damp} from './cinemaPhysics';

const vertexShader=`
 varying vec2 v_position;
 varying vec3 v_normal;
 varying vec3 v_view;
 void main(){
  v_position=position.xy;
  vec4 mv=modelViewMatrix*vec4(position,1.0);
  v_normal=normalize(normalMatrix*normal);
  v_view=normalize(-mv.xyz);
  gl_Position=projectionMatrix*mv;
 }
`;
const fragmentShader=`
 precision highp float;
 uniform float u_time;
 uniform float u_rim;
 uniform vec2 u_mouse;
 varying vec2 v_position;
 varying vec3 v_normal;
 varying vec3 v_view;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){
  float radius=length(v_position);
  float angle=atan(v_position.y,v_position.x);
  vec3 normal=normalize(v_normal),view=normalize(v_view);
  vec3 light=normalize(vec3(-.35+u_mouse.x*.25,.6+u_mouse.y*.25,1.4));
  float facing=clamp(dot(normal,normalize(light+view)),0.0,1.0);
  float sweep=pow(.5+.5*cos(angle-u_time*.13-u_mouse.x*.65),20.0);
  float grain=(hash(floor(v_position*480.0))-.5)*.025;
  float attenuation=1.0-smoothstep(.4,1.2,fwidth(radius)*430.0);
  float grooves=sin(radius*430.0)*attenuation;
  vec3 silver=vec3(.78,.81,.79)+grooves*.016+grain;
  vec3 foil=.68+.2*cos(6.28318*(radius*.8+angle*.08+u_mouse.x*.12+vec3(0.0,.18,.36)));
  vec3 color=mix(silver,foil,.2+sweep*.16)+sweep*.14*facing;
  float alpha=mix(.025+sweep*.095, .52+sweep*.25,u_rim);
  gl_FragColor=vec4(clamp(color,0.0,1.0),alpha);
 }
`;

export function createDiscScene(host,{freezeTime=null,onDiagnostics=()=>{}}={}){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.debug.onShaderError=()=>{throw new Error('Disc material could not compile')};
 renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),group=new THREE.Group();scene.add(group);
 const camera=new THREE.PerspectiveCamera(40,1,.1,20);camera.position.z=2.78;
 const uniforms={u_time:{value:0},u_rim:{value:0},u_mouse:{value:new THREE.Vector2()}};
 const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 const rimMaterial=material.clone();rimMaterial.uniforms.u_rim.value=1;
 const geometries=[new THREE.RingGeometry(.22,.985,128,3),new THREE.TorusGeometry(.976,.008,8,128),new THREE.TorusGeometry(.205,.008,8,96)];
 const face=new THREE.Mesh(geometries[0],material),outer=new THREE.Mesh(geometries[1],rimMaterial),hub=new THREE.Mesh(geometries[2],rimMaterial);
 outer.position.z=.003;hub.position.z=.005;group.add(face,outer,hub);
 let elapsed=0,last=null,running=false,disposed=false,targetX=0,targetY=0;
 function diagnostics(state){onDiagnostics({state,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs?.length||0})}
 function frame(time){
  if(disposed)return;
  const dt=last===null?1/60:Math.max(0,Math.min((time-last)/1000,1/30));if(last!==null)elapsed+=dt;last=time;
  const pinned=freezeTime!==null?freezeTime:elapsed;
  uniforms.u_time.value=pinned;rimMaterial.uniforms.u_time.value=pinned;
  uniforms.u_mouse.value.x=damp(uniforms.u_mouse.value.x,targetX,7,dt);uniforms.u_mouse.value.y=damp(uniforms.u_mouse.value.y,targetY,7,dt);
  rimMaterial.uniforms.u_mouse.value.copy(uniforms.u_mouse.value);
  group.rotation.x=freezeTime!==null?Math.sin(pinned*.4)*.018:damp(group.rotation.x,-targetY*.045,7,dt);
  group.rotation.y=freezeTime!==null?Math.sin(pinned*.3)*.025:damp(group.rotation.y,targetX*.045,7,dt);
  camera.position.x=freezeTime!==null?0:damp(camera.position.x,targetX*.015,5,dt);camera.lookAt(0,0,0);
  renderer.render(scene,camera);
 }
 function setRunning(value){
  running=Boolean(value)&&freezeTime===null;last=null;
  renderer.setAnimationLoop(running?frame:null);
  host.dataset.renderState=running?'running':freezeTime!==null?'frozen':'paused';
 }
 function resize(){
  if(disposed)return;const box=host.getBoundingClientRect();if(!box.width||!box.height)return;
  const small=matchMedia('(max-width:700px)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,small?1:1.5));
  renderer.setSize(box.width,box.height,false);camera.aspect=box.width/box.height;camera.updateProjectionMatrix();
  frame(0);last=null;
 }
 try{resize();host.dataset.materialReady='true';diagnostics('ready')}catch(error){dispose();throw error}
 function dispose(){
  if(disposed)return;disposed=true;renderer.setAnimationLoop(null);running=false;
  geometries.forEach(g=>g.dispose());material.dispose();rimMaterial.dispose();scene.clear();
  renderer.renderLists.dispose();renderer.dispose();diagnostics('disposed');renderer.forceContextLoss();renderer.domElement.remove();
  delete host.dataset.materialReady;host.dataset.renderState='disposed';
 }
 return {resize,setRunning,setPointer:(x,y)=>{if(freezeTime!==null)return;targetX=Math.max(-1,Math.min(1,x));targetY=Math.max(-1,Math.min(1,y))},dispose};
}
