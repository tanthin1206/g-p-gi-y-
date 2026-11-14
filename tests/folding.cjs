const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../dist/folding.js'),'utf8');
let now=0,id=0,complete=0;const frames=new Map(),elements=new Map();
function element(key){if(!elements.has(key))elements.set(key,{style:{},setAttribute(){},insertAdjacentHTML(){},querySelector(){return element('svg')},textContent:'',innerHTML:''});return elements.get(key)}
const context=vm.createContext({Math,performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++id,fn);return id},cancelAnimationFrame:i=>frames.delete(i),$:element,document:{addEventListener(){},querySelectorAll(){return[]}},soundNote(){},say(){},celebrate(){complete++},workshop:{reduced:false}});
vm.runInContext('let current=4,step=0;const steps=Array(8).fill("Gấp giấy"),foldCaptions=Array(8).fill("");function renderFold(){} function load(n){current=n}',context);
vm.runInContext(source,context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/paper3d.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/boat-lesson.js'),'utf8'),context);
for(const t of [0,.25,.5,.75,1]){
  const polygon=vm.runInContext(`rotatePaper3D([[0,0,0],[100,0,0],[100,60,0],[0,60,0]],[0,0],[100,0],${t})`,context);
  assert(Math.abs(Math.hypot(...polygon[2].map((v,i)=>v-polygon[1][i]))-60)<1e-7,'A folding flap must preserve its edge length in 3D');
  assert.deepEqual(Array.from(polygon[0]),[0,0,0],'Crease points must stay fixed');
  if(t>0&&t<1)assert(polygon[2][2]>0,'The moving flap must lift above the paper');
}
function state(){return vm.runInContext('({step,playing:foldMotion.playing,paused:foldMotion.paused,elapsed:foldMotion.elapsed})',context)}
function advance(ms){now+=ms;const jobs=[...frames.values()];frames.clear();jobs.forEach(fn=>fn(now))}
const reflected=vm.runInContext('hingeFold([[0,10],[10,10]],[0,0],[10,0],1)',context);
assert(Math.abs(reflected[0][1]+10)<1e-7,'Flap must reflect across its crease at 180 degrees');
for(let step=0;step<8;step++)for(const t of[0,.25,.5,.75,1])assert(!/NaN|Infinity|undefined/.test(vm.runInContext(`foldDrawing(${step},${t})`,context)),'Every animation frame must have finite geometry');
vm.runInContext('renderFold()',context);element('#autoFold').onclick();advance(1000);
assert.equal(state().playing,true);element('#autoFold').onclick();assert.equal(state().paused,true);assert.equal(frames.size,0);
const paused=state().elapsed;advance(20000);assert.equal(state().elapsed,paused,'Pause must freeze the animation');
element('#autoFold').onclick();assert.equal(state().playing,true);advance(5501);assert.equal(state().step,1,'Resume must continue without restarting');
for(let i=1;i<8;i++)advance(6501);
assert.equal(state().step,7);assert.equal(state().playing,false);assert.equal(complete,1,'Eight steps should complete once');
assert.equal(frames.size,0,'Completed demo must not keep scheduling frames');
element('#autoFold').onclick();assert.equal(state().step,0,'Replay must start at step one');
vm.runInContext('load(0)',context);assert.equal(frames.size,0,'Leaving the activity must cancel the demonstration');
vm.runInContext('load(4);renderFold()',context);
assert.equal(state().step,0);assert.equal(frames.size,0,'The initial paper must remain visible until the learner starts');
const initial=vm.runInContext('bookBoatScene(0,0)',context),vertices=initial.faces.flat();
assert.equal(Math.max(...vertices.map(v=>v[0]))-Math.min(...vertices.map(v=>v[0])),240);
assert.equal(Math.max(...vertices.map(v=>v[1]))-Math.min(...vertices.map(v=>v[1])),320);
assert(initial.colors.every(c=>c==='e6b6c8'),'The unfolded paper must show its pink face');
element('#autoFold').onclick();advance(6501);
assert.equal(state().step,1);
assert(!element('.fold-picture > svg').innerHTML.includes('opacity="0"'),'Sequential folds must not crossfade between disconnected paper models');
for(let n=0;n<7;n++){
 const bounds=scene=>[0,1].flatMap(k=>[Math.min(...scene.faces.flat().map(v=>v[k])),Math.max(...scene.faces.flat().map(v=>v[k]))]);
 const before=bounds(vm.runInContext(`bookBoatScene(${n},1)`,context));
 const after=bounds(vm.runInContext(`bookBoatScene(${n+1},0)`,context));
 before.forEach((value,i)=>assert(Math.abs(value-after[i])<.01,`Step ${n+1} must meet step ${n+2} without resizing or teleporting`));
}
const edgeLengths=scene=>scene.faces.flatMap(face=>face.map((p,i)=>Math.hypot(...p.map((v,k)=>v-face[(i+1)%face.length][k]))));
for(const n of [4,6]){
 const rest=edgeLengths(vm.runInContext(`bookBoatScene(${n},0)`,context));
 for(const t of [.1,.3,.5,.7,.9,1])edgeLengths(vm.runInContext(`bookBoatScene(${n},${t})`,context)).forEach((d,i)=>assert(Math.abs(d-rest[i])<1e-6,'Pocket panels must remain rigid throughout opening'));
}

element('#showInitialPaper').onclick();assert.equal(state().step,0);assert.equal(frames.size,0,'Return-to-paper must restore the stationary initial sheet');
const boat=vm.runInContext('bookBoatScene(7,1)',context);
assert(boat.layered,'Boat surfaces must keep their intended front/back drawing order');
assert(Math.max(...boat.faces.flat().map(v=>v[2]))<40,'The boat center must remain low instead of becoming a tall pyramid');
assert.equal(Math.min(...boat.faces.flat().map(v=>v[1])),200,'The boat must have a low central tip and raised ends');
fs.writeFileSync(require('node:path').join(__dirname,'../boat-frames.json'),JSON.stringify(vm.runInContext('[0,1,2,3,4,5,6,7].map(n=>[0,.5,1].map(t=>bookBoatScene(n,t)))',context)));
vm.runInContext('load(4);renderFold();workshop.reduced=true',context);
vm.runInContext('drawFoldFrame(1000)',context);const firstFrame=element('.fold-picture > svg').innerHTML;
vm.runInContext('drawFoldFrame(2600)',context);const middleFrame=element('.fold-picture > svg').innerHTML;
vm.runInContext('drawFoldFrame(6000)',context);const lastFrame=element('.fold-picture > svg').innerHTML;
assert.notEqual(firstFrame,middleFrame,'Educational folding must animate even when decorative motion is reduced');
assert.notEqual(middleFrame,lastFrame,'The lifted flap must differ from the flattened final sheet');
element('#foldScrub').oninput({target:{value:'500'}});
assert.equal(frames.size,0,'Scrubbing must pause the running animation');
assert(Math.abs(+element('#foldScrub').value-500)<=1,'Scrubbing must show the requested intermediate pose');
assert(vm.runInContext("foldDrawing(1,.25).includes('GẤP MẶT TRƯỚC')",context),'Step two must explicitly name the folding face');
assert(vm.runInContext("foldDrawing(1,.25).includes('stroke-width=\"2.8\"')",context),'Step two must outline both flaps clearly');
for(const [t,label]of [[0,'ĐỈNH TRÊN'],[.4,'Kéo hai lớp'],[.8,'Tách hai mạn'],[1,'Miết nhẹ đáy']])assert(vm.runInContext(`foldDrawing(7,${t})`,context).includes(label),'Final step must explain each separate motion');
console.log('PASS: initial-paper hold, 40 frames, eight-step autoplay, pause/resume, continuous step bounds, rigid pocket walls, return-to-paper and shallow boat.');

const grips=vm.runInContext('bookBoatScene(7,0).grips',context);for(const p of grips){assert.equal(p[0],300);assert.equal(p[1],140,'Boat opening must start at the TOP apex, not the side corners');}
assert(vm.runInContext('bookBoatScene(1,.2).faces.length',context)===3,'Step two must animate only the front flaps');

const initialLast=vm.runInContext('bookBoatScene(7,0)',context);for(const face of initialLast.faces)for(let i=0;i<face.length;i++){const a=face[i],b=face[(i+1)%face.length];assert(!(Math.abs(a[1]-200)<.01&&Math.abs(b[1]-200)<.01&&Math.abs(a[0]-b[0])>100),'Final diamond must not contain a horizontal edge');}

for(const t of [0,.12,.121,.15,.2,.3,.4,.5,.65,.8,1]){const scene=vm.runInContext(`bookBoatScene(7,${t})`,context);for(const face of scene.faces)for(let i=0;i<face.length;i++){const a=face[i],b=face[(i+1)%face.length];assert(!(a[0]<299&&b[0]>301||b[0]<299&&a[0]>301),'No crosswise triangulation edge may reappear while opening');}}

vm.runInContext('stopFoldDemo();current=4;step=5;foldMotion.restorePose={step:5,elapsed:2100,duration:9000,camera:.85};renderFold()',context);
assert.equal(state().step,5);assert.equal(state().elapsed,2100);assert.equal(frames.size,0,'Restoring must not start an intermediate replay');
assert.equal(element('#foldScrub').value,String(Math.round(2100/(9000*.76)*1000)),'First restored render must show the saved frame immediately');
vm.runInContext('delete foldMotion.restorePose',context);
