const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8'),context=vm.createContext({Math});
vm.runInContext(app.slice(0,app.indexOf('function svgEl(')),context);
const [home,flowers,blocks]=vm.runInContext('[house(),garden(),solids()]',context);
function points(p){const r=p.angle*Math.PI/180;return p.points.split(' ').map(v=>{let[x,y]=v.split(',').map(Number);return[p.x+x*Math.cos(r)-y*Math.sin(r),p.y+x*Math.sin(r)+y*Math.cos(r)]})}
for(const [group,w,h]of [[home,750,350],[flowers,750,500],[blocks,400,175]])for(const p of group)for(const[x,y]of points(p)){
  assert(x>=-1e-7&&x<=w+1e-7&&y>=-1e-7&&y<=h+1e-7,`${p.name} must stay inside its textbook grid`);
}
for(const p of [...home,...blocks])for(const[x,y]of points(p)){
  assert(Math.abs(x/25-Math.round(x/25))<1e-7&&Math.abs(y/25-Math.round(y/25))<1e-7,`${p.name} vertices must meet grid intersections`);
}
assert.equal(home[0].x,8*25);assert.equal(home[0].y,7*25);
assert.equal(home[2].x,9*25);assert.equal(home[2].y,8*25);
assert.deepEqual(Array.from(flowers.filter(p=>p.name==='Nhụy hoa'),p=>[p.x+12.5,p.y+12.5]),[[125,425],[200,375],[250,450]]);
assert.deepEqual(Array.from(flowers.filter(p=>p.name==='Thân gà'),p=>[p.x+25,p.y+25]),[[550,350],[675,375],[600,450]]);
console.log('PASS: textbook grid positions, upright house and solids, flower/chicken anchors and paper boundaries.');
