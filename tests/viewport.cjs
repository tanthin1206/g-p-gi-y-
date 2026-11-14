const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const buttons=Array.from({length:36},()=>({hidden:false}));
const tray={querySelectorAll:()=>buttons,style:{setProperty(){}}},pager={innerHTML:''},prev={},next={};
const context=vm.createContext({innerWidth:1366,innerHeight:768,$:s=>({'#pieces':tray,'#piecePager':pager,'#trayPrev':prev,'#trayNext':next})[s],Math});
const source=fs.readFileSync(path.join(__dirname,'../dist/viewport.js'),'utf8');
vm.runInContext(source.slice(0,source.indexOf('const viewportRender=')),context);
for(const[w,h]of[[1920,1080],[1366,768],[1024,600],[844,390],[390,844]]){
  context.innerWidth=w;context.innerHeight=h;vm.runInContext('trayPages.page=0;updateTrayPages()',context);
  const size=vm.runInContext('trayPages.size',context),seen=new Set();
  for(let page=0;page<Math.ceil(36/size);page++){
    const visible=buttons.map((b,i)=>b.hidden?-1:i).filter(i=>i>=0);
    assert(visible.length<=size,'A tray page must fit the fixed shelf');visible.forEach(i=>seen.add(i));
    if(page<Math.ceil(36/size)-1)next.onclick();
  }
  assert.equal(seen.size,36,'All 36 pieces must remain reachable without scrolling');
  for(let page=1;page<Math.ceil(36/size);page++)prev.onclick();
  assert.equal(vm.runInContext('trayPages.page',context),0);
}
console.log('PASS: 36-piece pagination at 5 viewport sizes, forward/back navigation and no unreachable pieces.');
