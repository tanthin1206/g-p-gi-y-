/* Perspective paper panels: rigid flaps rotate about their actual crease axes. */
const paperView={tilt:.48,yaw:-.12};
function rotatePaper3D(points,a,b,t){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
  const mean=points.reduce((n,p)=>n+ux*(p[1]-a[1])-uy*(p[0]-a[0]),0);
  const angle=Math.PI*t*(mean>=0?1:-1),c=Math.cos(angle),s=Math.sin(angle);
  return points.map(p=>{const x=p[0]-a[0],y=p[1]-a[1],along=x*ux+y*uy,perp=x*(-uy)+y*ux;
    return[a[0]+along*ux-perp*uy*c,a[1]+along*uy+perp*ux*c,perp*s+(p[2]||0)];});
}
function projectPaper3D(p){
  const x=p[0]-300,y=p[1]-210,z=p[2]||0,cy=Math.cos(paperView.yaw),sy=Math.sin(paperView.yaw),ct=Math.cos(paperView.tilt),st=Math.sin(paperView.tilt);
  const xx=x*cy+z*sy,zz=z*cy-x*sy,yy=y*ct-zz*st,depth=y*st+zz*ct,k=850/(850-depth);
  return[300+xx*k,225+yy*k,depth];
}
function makePaperScene(n,t){
  const faces=[],creases=[];const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)},q=smooth(t);
  const add=(p,z=0)=>faces.push(p.map(v=>[v[0],v[1],(v[2]||0)+z]));
  const flap=(p,a,b,f,z=2)=>{add(rotatePaper3D(p,a,b,f),z);creases.push([a,b]);};
  if(n===0){
    add([[180,200],[420,200],[420,340],[180,340]]);
    flap([[180,60],[420,60],[420,200],[180,200]],[180,200],[420,200],q);
  }else if(n===1){
    add([[300,160],[420,280],[420,300],[180,300],[180,280]]);
    flap([[180,160],[300,160],[180,280]],[300,160],[180,280],smooth(t*1.6));
    flap([[300,160],[420,160],[420,280]],[300,160],[420,280],smooth((t-.35)*1.6),3);
  }else if(n===2){
    add([[180,280],[300,150],[420,280]]);
    flap([[180,280],[420,280],[420,310],[180,310]],[180,280],[420,280],q,3);
    // The back layer stays slightly separated so the two paper faces remain visible.
    add([[180,280],[420,280],[420,286],[180,286]],-1.5);
  }else if(n===3){
    add([[180,280],[300,150],[420,280]]);add([[210,250],[390,250],[420,280],[180,280]],2);
    flap([[180,250],[210,250],[180,280]],[210,250],[180,280],smooth(t*1.6),4);
    flap([[390,250],[420,250],[420,280]],[390,250],[420,280],smooth((t-.35)*1.6),5);
  }else if(n===4||n===6){
    // Open the pocket first, then flatten along the other diagonal.
    const p=smooth(Math.min(1,t*2)),close=smooth(Math.max(0,t*2-1));
    const height=110*Math.sin(Math.PI*t),spread=120*(.1+.9*p),collapse=1-close;
    const top=[300,80,0],bottom=[300,340,0],left=[300-spread,210,height*collapse],right=[300+spread,210,height*collapse];
    add([top,left,bottom]);add([top,bottom,right],1.5);
    const innerLeft=[300-35*Math.sin(Math.PI*t),210,height+3],innerRight=[300+35*Math.sin(Math.PI*t),210,height+3];
    add([top,innerLeft,bottom],3);add([top,bottom,innerRight],4);creases.push([top,bottom]);
  }else if(n===5){
    add([[300,70],[420,210],[180,210]]);
    flap([[180,210],[420,210],[300,350]],[180,210],[420,210],q,3);
  }else{
    // Pull apart the collapsed pocket into a hull with raised sides and an inner ridge.
    const bow=[300-190*q,205-20*q,55*q],stern=[300+190*q,205-20*q,55*q],keelLeft=[300-80*q,320-12*q,0],keelRight=[300+80*q,320-12*q,0],ridge=[300,90+100*q,70*q];
    add([bow,keelLeft,keelRight,stern],1);
    add([bow,[300,215,90*q],keelLeft],2);add([stern,keelRight,[300,215,90*q]],3);
    add([keelLeft,ridge,keelRight],4);add([bow,stern,ridge],-2);
    creases.push([ridge,[300,315,0]]);
  }
  return{faces,creases};
}
function shadePaper(hex,light){const rgb=hex.match(/\w\w/g).map(v=>parseInt(v,16));return'#'+rgb.map(v=>Math.max(0,Math.min(255,Math.round(v*light))).toString(16).padStart(2,'0')).join('')}
foldDrawing=function(n,t){
  const scene=makePaperScene(n,t),tilt=paperView.tilt;
  let out='<defs><filter id="paperShadow3D" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="7"/></filter><filter id="fiber3D"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".07"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/><feBlend in="SourceGraphic" mode="multiply"/></filter></defs>';
  const panels=scene.faces.map((p,i)=>({p,paperColor:scene.colors?.[i],screen:p.map(projectPaper3D)}));
  // A separate soft shadow falls onto the desk from each elevated flap.
  for(const {p}of panels){const pts=p.map(v=>projectPaper3D([v[0]+8+(v[2]||0)*.17,v[1]+12+(v[2]||0)*.12,0]));out+=`<polygon points="${pts.map(v=>v.slice(0,2).join(',')).join(' ')}" fill="#433346" opacity=".12" filter="url(#paperShadow3D)"/>`;}
  if(!scene.layered)panels.sort((a,b)=>a.screen.reduce((s,p)=>s+p[2],0)/a.screen.length-b.screen.reduce((s,p)=>s+p[2],0)/b.screen.length);
  panels.forEach(({p,screen,paperColor},i)=>{
    const a=p[0],b=p[1],c=p[2],u=b.map((v,j)=>v-a[j]),v=c.map((x,j)=>x-a[j]);
    const raw=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...raw)||1,normal=raw.map(x=>x/length);
    const facing=normal[2]*Math.cos(tilt)-normal[1]*Math.sin(tilt),back=facing<0,light=.77+.23*Math.abs(-.35*normal[0]-.45*normal[1]+.82*normal[2]);
    const base=paperColor||(back?'e6b6c8':'ae9ac9'),color=shadePaper(base,light),pale=shadePaper(base,Math.min(1.15,light+.14)),pts=screen.map(v=>v.slice(0,2).join(',')).join(' ');
    out+=`<defs><linearGradient id="paperFace${i}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${pale}"/><stop offset="1" stop-color="${color}"/></linearGradient></defs><polygon points="${screen.map(v=>`${v[0]},${v[1]+1.6}`).join(' ')}" fill="#9c859e"/><polygon points="${pts}" fill="url(#paperFace${i})" stroke="#756280" stroke-width="1.1" stroke-linejoin="round" filter="url(#fiber3D)"/><polyline points="${pts}" fill="none" stroke="#fff6" stroke-width=".6"/>`;
  });
  for(const[a,b]of scene.creases){const x=projectPaper3D([a[0],a[1],5]),y=projectPaper3D([b[0],b[1],5]);out+=`<path d="M${x[0]},${x[1]}L${y[0]},${y[1]}" fill="none" stroke="#685477" stroke-width="1" stroke-dasharray="5 4" opacity=".6"/>`;}
  out+=`<text x="24" y="385" fill="#92816b" stroke="none" font-size="11">GẤP GIẤY 3D · BƯỚC ${n+1}/8</text><text x="576" y="385" text-anchor="end" fill="#92816b" stroke="none" font-size="11">${Math.round(t*100)}%</text>`;
  return out;
};
const paper3DRender=renderFold;
renderFold=function(){
  paper3DRender();
  $('.fold-auto-bar').insertAdjacentHTML('beforeend','<label>Góc nhìn <select id="paperCamera"><option value="0.48">Nghiêng 3D</option><option value="0.85">Nhìn ngang hơn</option><option value="0.08">Nhìn từ trên</option></select></label>');
  $('#paperCamera').value=String(paperView.tilt);
  $('#paperCamera').onchange=e=>{paperView.tilt=+e.target.value;drawFoldFrame(foldMotion.elapsed)};
  $('.fold-picture > svg').style.filter='none';
};
