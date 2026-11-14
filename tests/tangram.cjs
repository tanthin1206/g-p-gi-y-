const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8');
const outlines=vm.runInNewContext(source.split('\n').find(s=>s.startsWith('const silhouettes='))+'silhouettes');
assert.equal(outlines.length,3);
const arrow=outlines[2];assert.deepEqual(JSON.parse(JSON.stringify(arrow)),[[0,3],[2,1],[1,0],[5,0],[5,4],[4,3],[2,5]]);
// An exact solution: two large triangles form the arrow head; the other five fill its stem.
const solution=[[[2,0],[4,2],[2,2]],[[2,2],[4,2],[2,4]],[[0,1],[1,2],[0,3]],[[1,1],[2,1],[2,2],[1,2]],[[2,2],[1,2],[0,3],[1,3]],[[1,1],[1,2],[0,1]],[[2,3],[1,3],[2,2]]].map(p=>p.map(([x,y])=>[x+y-1,y-x+2]));
function area(p){return Math.abs(p.reduce((v,a,i)=>{let b=p[(i+1)%p.length];return v+a[0]*b[1]-b[0]*a[1]},0)/2)}
function inside(x,y,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){let a=p[i],b=p[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
assert.equal(area(arrow),16);assert.deepEqual(solution.map(area),[4,4,2,2,2,1,1]);
for(let x=.037;x<5;x+=.1)for(let y=.061;y<5;y+=.1){const count=solution.filter(p=>inside(x,y,p)).length;assert.equal(count,inside(x,y,arrow)?1:0,'Seven pieces must exactly cover the arrow without overlap or holes');}
const workshop=fs.readFileSync(path.join(__dirname,'../dist/workshop.js'),'utf8');
assert(workshop.includes("setAttribute('fill',current===3?'#fffdf2':'url(#grid)')"));
assert(workshop.includes("current===3?'#fffdf2':'url(#model-grid)'"));
console.log('PASS: third target is a diagonal arrow, an exact seven-piece solution exists, and Tangram uses plain backgrounds.');
