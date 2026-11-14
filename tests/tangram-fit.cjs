const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const context=vm.createContext({Math});vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/tangram-model.js'),'utf8'),context);
const evalIn=code=>vm.runInContext(code,context);
const area=p=>Math.abs(p.reduce((s,a,i)=>{let b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1]},0)/2);
const signed=p=>p.reduce((s,a,i)=>{let b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1]},0);
function clip(subject,other){let result=subject.map(p=>[...p]),direction=Math.sign(signed(other));for(let i=0;i<other.length;i++){const a=other[i],b=other[(i+1)%other.length],cross=p=>direction*((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]));let next=[];for(let j=0;j<result.length;j++){const p=result[j],q=result[(j+1)%result.length],d=cross(p),e=cross(q),pin=d>=-1e-8,qin=e>=-1e-8;if(pin)next.push(p);if(pin!==qin){const t=d/(d-e);next.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}}result=next;if(!result.length)break;}return result;}
for(let index=0;index<3;index++){
 const model=evalIn(`makeTangramModel(${index})`);context.model=model;
 assert.equal(model.polygons.length,7);let total=0;
 model.polygons.forEach((p,i)=>{const expected=area(model.local[i]);assert(Math.abs(area(p)-expected)<1e-6,'Each rigid piece must retain its exact area');if(index<2)assert(Math.abs(expected-[2,2,1,1,1,.5,.5][i]*model.unit**2)<1e-6);total+=area(p);for(const[x,y]of p)assert(x>=300&&x<=750&&y>=30&&y<=490,'Target must fit beside the staging area');for(let j=0;j<i;j++)assert(area(clip(p,model.polygons[j]))<1e-5,`No overlapping solution pieces in target ${index+1}`);});
 const expectedTotal=(index===2?10.46875:8)*model.unit**2;assert(Math.abs(total-expectedTotal)<1e-6);
 for(let i=0;i<7;i++){
  context.i=i;const match=evalIn('tgFindMatch(model,i,model.targets[i])');assert.equal(match.slot,i);assert(match.error<1e-6);
  const perturbed=evalIn('tgFindMatch(model,i,{...model.targets[i],x:model.targets[i].x+8,y:model.targets[i].y-6})');assert(perturbed.error<Math.max(18,model.unit*.22),'Every solution piece must auto-snap from a nearby drop');
  const blocked=evalIn('tgFindMatch(model,i,model.targets[i],[i])');assert(blocked.slot!==i,'Occupied slots must reject a second piece');
  const rotated=evalIn('tgRotateAtCenter(model.local[i],model.targets[i],model.targets[i].a+137)');context.rotated=rotated;
  const magnet=evalIn('tgMagnetAngle(model,i,tgRotateAtCenter(model.local[i],model.targets[i],model.targets[i].a+5))');context.magnet=magnet;
  const magnetError=evalIn('tgVertexError(tgTransform(model.local[i],magnet),model.polygons[i])');assert(magnetError<1e-6,'Angle assistance must preserve arbitrary reference angles, including the rabbit ear');
  const delta=evalIn('(()=>{const a=tgCenter(model.local[i],model.targets[i]),b=tgCenter(model.local[i],rotated);return Math.hypot(a[0]-b[0],a[1]-b[1])})()');assert(delta<1e-7,'Mouse/touch rotation must preserve the piece center');
 }
 for(const[a,b]of(index<2?[[0,1],[1,0],[5,6],[6,5]]:[])){const swapped=evalIn(`tgFindMatch(model,${a},model.targets[${b}])`);assert.equal(swapped.slot,b,'Congruent triangles must be interchangeable');}
}
console.log('PASS: all 3 targets have exact non-overlapping 7-piece solutions, proportional sizing, snapping, occupied-slot protection and stable rotation centers.');
