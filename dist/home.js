const activityGroups=[{page:113,name:'Ngôi nhà của em',lessons:[0,1]},{page:114,name:'Bé khéo xếp hình',lessons:[2,3]},{page:115,name:'Gấp thuyền buồm',lessons:[4]}];
let activeActivity=null;
const homeLoadActivity=load;
function groupForLesson(n){return activityGroups.findIndex(group=>group.lessons.includes(n))}
function filterActivityTabs(){
  const group=activityGroups[activeActivity];if(!group)return;
  document.querySelectorAll('#lessons [data-lesson]').forEach(button=>button.hidden=!group.lessons.includes(+button.dataset.lesson));
  $('#lessons').style.setProperty('--activity-tabs',group.lessons.length);
  $('#activeGroupLabel').textContent=`Hoạt động ${activeActivity+1} · Trang ${group.page}`;
}
load=function(n){
  activeActivity=groupForLesson(n);homeLoadActivity(n);
  $('#homeScreen').hidden=true;$('#gameScreen').hidden=false;$('#backHome').hidden=false;$('#activeGroupLabel').hidden=false;
  document.body.dataset.screen='game';filterActivityTabs();
};
function openActivity(i){if(!activityGroups[i])return;load(activityGroups[i].lessons[0]);$('#title').setAttribute('tabindex','-1');$('#title').focus({preventScroll:true});}
function showHome(){
  stopFoldDemo();if('speechSynthesis'in window)speechSynthesis.cancel();
  $('#cutDialog').close();if(workshop.cutTimer)clearTimeout(workshop.cutTimer);workshop.cutTimer=null;workshop.cutBusy=false;workshop.cutId=null;
  $('#homeScreen').hidden=false;$('#gameScreen').hidden=true;$('#backHome').hidden=true;$('#activeGroupLabel').hidden=true;document.body.dataset.screen='home';
  if(activeActivity!==null)$(`[data-activity="${activeActivity}"]`).focus({preventScroll:true});
}
$('.activity-cards').onclick=e=>{const card=e.target.closest('[data-activity]');if(card)openActivity(+card.dataset.activity);};
$('#backHome').onclick=showHome;
$('.brand').onclick=e=>{e.preventDefault();showHome();};
$('#homeFullscreen').onclick=()=>$('#focus').click();
showHome();
