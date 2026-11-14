const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const elements=new Map(),tabs=Array.from({length:5},(_,i)=>({dataset:{lesson:String(i)},hidden:false}));let opened=-1,stopped=0;
function el(key){if(!elements.has(key))elements.set(key,{hidden:false,textContent:'',style:{setProperty(){}},setAttribute(){},focus(){},close(){},click(){}});return elements.get(key)}
const context=vm.createContext({$:el,load(n){opened=n;tabs.forEach(t=>t.hidden=false)},stopFoldDemo(){stopped++},workshop:{cutTimer:null},window:{},document:{body:{dataset:{}},querySelectorAll(){return tabs}},clearTimeout(){}});
const source=fs.readFileSync(path.join(__dirname,'../dist/home.js'),'utf8');vm.runInContext(source,context);
assert.equal(el('#homeScreen').hidden,false,'Home must be the first screen');assert.equal(el('#gameScreen').hidden,true,'Games must stay hidden until a card is selected');
for(const[group,first,visible]of[[0,0,[0,1]],[1,2,[2,3]],[2,4,[4]]]){
  vm.runInContext(`openActivity(${group})`,context);assert.equal(opened,first);assert.equal(el('#homeScreen').hidden,true);assert.equal(el('#gameScreen').hidden,false);
  assert.deepEqual(tabs.filter(t=>!t.hidden).map(t=>+t.dataset.lesson),visible,'Only this textbook page should expose game tabs');
  vm.runInContext('showHome()',context);assert.equal(el('#gameScreen').hidden,true);assert.equal(el('#homeScreen').hidden,false);
}
assert(stopped>=4,'Returning home must cancel the paper folding demonstration');
console.log('PASS: home-first launch, 3 activity cards, 2/2/1 game grouping and back-home cancellation.');
