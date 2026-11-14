/* Every target is the union of these same seven rigid pieces. */
const TG_SHAPES=[[[0,0],[2,0],[0,2]],[[0,0],[2,0],[0,2]],[[0,0],[1,1],[0,2]],[[0,0],[1,0],[1,1],[0,1]],[[0,0],[1,0],[2,1],[1,1]],[[0,0],[1,0],[0,1]],[[0,0],[1,0],[0,1]]];
const TG_NAMES=['Tam giác lớn 1','Tam giác lớn 2','Tam giác vừa','Hình vuông','Hình bình hành','Tam giác nhỏ 1','Tam giác nhỏ 2'];
const TG_TYPES=[0,0,1,2,3,4,4];
const TG_S=Math.SQRT2;
const TG_LAYOUTS=[
  [[-TG_S,1+TG_S,315,1],[-TG_S,3+TG_S,270,1],[0,-2,0,-1],[0,0,0,1],[0,0,160,-1],[TG_S/2,1+TG_S,135,1],[0,1+1.5*TG_S,315,1]],
  [[TG_S/4,TG_S/4,45,1],[2+TG_S/4,5*TG_S/4,90,1],[-1,0,270,1],[TG_S/4,5*TG_S/4,45,1],[3+TG_S/4,3+5*TG_S/4,90,-1],[TG_S/4,1+9*TG_S/4,270,1],[0,TG_S/2,225,1]],
  [[2,2,270,1],[2,2,0,1],[0,1,0,1],[1,1,0,1],[2,2,0,-1],[1,1,90,1],[2,3,180,1]].map(([x,y,a,f])=>[(x+y)/Math.SQRT2,(y-x)/Math.SQRT2,a-45,f])
];
// This reference is a green panel with an arrow-shaped notch, not a solid arrow.
// Its seven purpose-cut pieces are kept separate from the two standard Tangram sets.
const TG_FRAME_OUTLINE=[[0, 0], [3, 0], [3, 4], [0.25, 4], [2.25, 2], [2.5, 2.25], [2.5, 1.25], [1.5, 1.25], [2, 1.75], [0, 3.75]];
const TG_FRAME_PIECES=[[[0.0, 3.75], [0.0, 0.0], [1.5, 1.25]], [[0.0, 3.75], [1.5, 1.25], [2.0, 1.75]], [[0.25, 4.0], [2.25, 2.0], [2.5, 2.25]], [[0.25, 4.0], [2.5, 2.25], [3.0, 4.0]], [[3.0, 0.0], [2.5, 1.25], [1.5, 1.25]], [[3.0, 0.0], [1.5, 1.25], [0.0, 0.0]], [[2.5, 1.25], [2.5, 2.25], [3.0, 4.0], [3.0, 0.0]]];
function tgTransform(points,s){let r=s.a*Math.PI/180,c=Math.cos(r),n=Math.sin(r);return points.map(([x,y])=>[s.x+x*s.f*c-y*n,s.y+x*s.f*n+y*c]);}
function makeTangramModel(index){
  if(index===2){
    const unit=105,ox=372.5,oy=50,targets=[],local=[];
    TG_FRAME_PIECES.forEach(p=>{const x=Math.min(...p.map(v=>v[0])),y=Math.min(...p.map(v=>v[1]));targets.push({x:ox+x*unit,y:oy+y*unit,a:0,f:1,done:true});local.push(p.map(v=>[(v[0]-x)*unit,(v[1]-y)*unit]));});
    return{unit,targets,local,polygons:local.map((p,i)=>tgTransform(p,targets[i])),types:[0,1,2,3,4,5,6],names:Array.from({length:7},(_,i)=>`Miếng hình xanh ${i+1}`),customFrame:true};
  }
  const layout=TG_LAYOUTS[index]||TG_LAYOUTS[0],raw=layout.flatMap(([x,y,a,f],i)=>tgTransform(TG_SHAPES[i],{x,y,a,f}));
  const minX=Math.min(...raw.map(p=>p[0])),maxX=Math.max(...raw.map(p=>p[0])),minY=Math.min(...raw.map(p=>p[1])),maxY=Math.max(...raw.map(p=>p[1]));
  const unit=Math.min(105,360/(maxX-minX),440/(maxY-minY)),ox=530-(minX+maxX)*unit/2,oy=260-(minY+maxY)*unit/2;
  const targets=layout.map(([x,y,a,f])=>({x:x*unit+ox,y:y*unit+oy,a,f,done:true}));
  const local=TG_SHAPES.map(p=>p.map(([x,y])=>[x*unit,y*unit]));
  const polygons=local.map((p,i)=>tgTransform(p,targets[i]));
  return{unit,targets,local,polygons,types:TG_TYPES,names:TG_NAMES,customFrame:false};
}
function tgCenter(local,state){const c=local.reduce((s,p)=>[s[0]+p[0]/local.length,s[1]+p[1]/local.length],[0,0]);return tgTransform([c],state)[0];}
function tgRotateAtCenter(local,state,angle){const center=tgCenter(local,state),next={...state,a:angle,done:false};const moved=tgCenter(local,next);next.x+=center[0]-moved[0];next.y+=center[1]-moved[1];return next;}
function tgVertexError(a,b){return Math.max(...a.map(p=>Math.min(...b.map(q=>Math.hypot(p[0]-q[0],p[1]-q[1])))),...b.map(p=>Math.min(...a.map(q=>Math.hypot(p[0]-q[0],p[1]-q[1])))));}
function tgFindMatch(model,i,state,occupied=[]){const actual=tgTransform(model.local[i],state);let slot=-1,error=Infinity;model.polygons.forEach((p,j)=>{if(model.types[i]!==model.types[j]||occupied.includes(j))return;const d=tgVertexError(actual,p);if(d<error){error=d;slot=j;}});return{slot,error};}
function tgMagnetAngle(model,i,state){
  const angles=Array.from({length:8},(_,k)=>k*45);
  model.targets.forEach((s,j)=>{if(model.types[i]===model.types[j])angles.push(s.a,s.a+180);});
  let delta=Infinity;for(const angle of angles){const d=((angle-state.a+540)%360+360)%360-180;if(Math.abs(d)<Math.abs(delta))delta=d;}
  return Math.abs(delta)<=8?tgRotateAtCenter(model.local[i],state,state.a+delta):{...state,done:false};
}
