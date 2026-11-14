const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path'),root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'dist/app.js'),'utf8');
const source=fs.readFileSync(path.join(root,'dist/workshop.js'),'utf8');
const helper=source.slice(source.indexOf('function buildCutGeometry('),source.indexOf('function openCut('));
const context=vm.createContext({Math});
vm.runInContext(app.slice(0,app.indexOf('function svgEl('))+helper,context);
const shapes=vm.runInContext('[...house(),...garden(),...solids(),...tangrams()]',context);
for(const shape of shapes){
  context.points=shape.points;
  const g=vm.runInContext('buildCutGeometry(points)',context);
  assert(g.total>0,shape.name);
  assert.deepEqual(g.nodes[0],g.nodes.at(-1),'Cut must close exactly');
  for(const v of g.vertices){
    assert(g.nodes.some(n=>Math.hypot(n[0]-v[0],n[1]-v[1])<1e-7),'Every corner must be preserved');
    assert(v[0]>=89&&v[0]<=551&&v[1]>=64&&v[1]<=296,'Paper and scissors must fit the viewport');
  }
  for(let i=1;i<g.nodes.length;i++){
    const a=g.nodes[i-1],b=g.nodes[i];
    assert(Math.hypot(b[0]-a[0],b[1]-a[1])<=14.00001,'Touch tracing steps must remain reachable');
    const onEdge=g.vertices.some((u,j)=>{const v=g.vertices[(j+1)%g.vertices.length];return [a,b].every(p=>{
      const cross=(p[0]-u[0])*(v[1]-u[1])-(p[1]-u[1])*(v[0]-u[0]);
      const dot=(p[0]-u[0])*(p[0]-v[0])+(p[1]-u[1])*(p[1]-v[1]);
      return Math.abs(cross)<1e-6&&dot<1e-6;
    })});
    assert(onEdge,'No cut segment may take a shortcut across a corner');
    assert(g.lengths[i]>g.lengths[i-1],'Progress must advance monotonically');
  }
  assert(Math.abs(g.lengths.at(-1)-g.total)<1e-7,'Completion must reach 100%');
  assert.equal(g.corners.at(-1),g.nodes.length-1,'Button cutting must reach completion');
}
console.log(`PASS: ${shapes.length} paper shapes; exact corners, closed cuts, reachable steps and safe viewport bounds.`);
