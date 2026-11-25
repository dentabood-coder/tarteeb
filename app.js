document.documentElement.dir='rtl';document.documentElement.lang='ar';

const PAGE=document.body.dataset.page==='admin'?'admin':'player';
const READY_MS=2000;                    // short "get ready" screen before each question
const QUESTIONS_PER_ROUND=7;            // every round has 7 questions
const ROOM_ID='tarteeb-family-room-v2'; // fixed room, so the player link never changes
const ICE={iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:global.stun.twilio.com:3478'}]};
const MONTHS=['','يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const TEAMS={A:{name:'فريق الصقور',v:'var(--team-a)'},B:{name:'فريق النخيل',v:'var(--team-b)'}};

// ---------- helpers ----------
const $=s=>document.querySelector(s);
function h(tag,attrs={},...kids){const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs||{})){if(v==null||v===false)continue;if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else if(k==='text')e.textContent=v;else if(k==='style')e.style.cssText=v;else e.setAttribute(k,v===true?'':v)}for(const c of kids.flat()){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(String(c)))}return e}
const num=n=>Number(n).toLocaleString('ar-EG',{useGrouping:false});
const fmtDate=e=>(e.m?MONTHS[e.m]+' ':'')+num(e.y)+' م';
const cc=c=>`--cc:var(--c-${c})`;
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function store(k,v){try{localStorage.setItem('tz_'+k,v)}catch(e){}}
function load(k){try{return localStorage.getItem('tz_'+k)}catch(e){return null}}
let toastT;function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,3200)}
const cmp=(a,b)=>a.y-b.y||(a.m||0)-(b.m||0);
const clash=(a,b)=>a.y===b.y&&(!a.m||!b.m||a.m===b.m);
const correctOrder=evs=>evs.map((e,i)=>i).sort((i,j)=>cmp(evs[i],evs[j]));
function scoreOf(evs,order){const c=correctOrder(evs);let hits=0;order.forEach((ix,i)=>{if(ix===c[i])hits++});const perfect=hits===evs.length;return{hits,perfect,pts:hits+(perfect?3:0)}}
const rid=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),b=>'23456789abcdefghjkmnpqrstuvwxyz'[b%31]).join('');
const qkey=(r,q)=>r+'_'+q;
const playerUrl=()=>location.origin+location.pathname.replace(/[^/]*$/,'');

// ---------- state ----------
let S=null;               // shared game state (admin page owns it, players receive copies)
let removed=false,rejoining=false;
let myPid=null,peer=null,conns={},hostConn=null,clockOff=0,net='idle',connecting=false,joined=false;
let family=[];try{family=JSON.parse(load('family')||'[]')}catch(e){family=[]}
let nick=load('nick')||'';
let view='main';          // 'main' | 'family' (admin) | 'history'
let drafts={},sortable=null,builtKey=null,answering=null,sentFor={},revealFor={};
const isAdmin=()=>PAGE==='admin';
const hostNow=()=>Date.now()+clockOff;

function poolFor(cat){
  if(cat==='family')return family.map(f=>({t:f.title,y:+f.year,m:+f.month||0,c:'family',n:f.note||''}));
  return EVENTS[cat].map(([t,y])=>({t,y,m:0,c:cat}));
}
function pickQuestion(cat,n,used){
  if(cat==='islam'&&Math.random()<GHAZAWAT_SHARE){
    const q=pickFrom(GHAZAWAT.map(([t,y,,,m])=>({t,y,m:m||0,c:'islam'})),0,n,used);
    if(q)return q;
  }
  return pickFrom(poolFor(cat),GAP[cat],n,used);
}
function pickFrom(all,gap,n,used){
  let pool=all.filter(e=>!used.has(e.t));if(pool.length<n)pool=all;
  let best=[];
  for(const g of [gap,Math.floor(gap/2),0]){
    for(let t=0;t<40;t++){
      const p=[];
      for(const e of shuffle(pool)){if(p.some(q=>clash(q,e)||Math.abs(q.y-e.y)<g))continue;p.push(e);if(p.length===n)return shuffle(p)}
      if(p.length>best.length)best=p;
    }
  }
  return best.length>=2?shuffle(best):null;
}
// categories take turns in a shuffled cycle, never the same one twice in a row
function categorySequence(cats,n){
  const seq=[];let cycle=[];
  while(seq.length<n){
    if(!cycle.length){cycle=shuffle(cats);if(seq.length&&cats.length>1&&cycle[0]===seq[seq.length-1])cycle.push(cycle.shift())}
    seq.push(cycle.shift());
  }
  return seq;
}
function availableCats(){return Object.keys(CATS).filter(k=>k!=='family'||family.length>=3)}
function playerList(){if(!S)return[];return Object.entries(S.players).map(([id,p])=>({id,...p})).sort((a,b)=>(a.joinedAt||0)-(b.joinedAt||0))}
function teamOf(p,list){const t=(S&&S.teams||{})[p.id];if(t)return t;const i=list.findIndex(x=>x.id===p.id);return i%2?'B':'A'}
const roundPts=(p,r)=>Object.entries(p.points||{}).reduce((s,[k,v])=>k.startsWith(r+'_')?s+v:s,0);
const ranked=list=>[...list].sort((a,b)=>(b.total||0)-(a.total||0));

function ctx(){
  if(!S)return null;
  const players=playerList();
  return{key:S.gameId,R:S.rounds[S.round],r:S.round,total:S.settings.totalRounds,status:S.status,me:players.find(p=>p.id===myPid)||null,players,teams:S.settings.mode==='teams'};
}
// where are we in the round, from the admin's clock
function phase(R){
  const slot=R.ready+R.dur;const el=hostNow()-R.startedAt;const n=R.questions.length;
  if(el<0)return{q:0,stage:'ready',left:R.ready-el,span:R.ready};
  const q=Math.floor(el/slot);if(q>=n)return{over:true,since:el-n*slot};
  const w=el-q*slot;
  return w<R.ready?{q,stage:'ready',left:R.ready-w,span:R.ready}:{q,stage:'answer',left:slot-w,span:R.dur};
}

// ================= ADMIN: owns the game =================
function defaultSettings(){return{mode:'solo',totalRounds:3,perQ:3,secs:6,cats:availableCats(),v2:true}}
function loadHistory(){try{return JSON.parse(load('history')||'[]')}catch(e){return[]}}
// save the finished (or abandoned) game's standings so everyone can look back at it
function recordGame(finished){
  if(!S)return;
  const list=ranked(playerList());
  if(!list.some(p=>(p.total||0)>0))return;
  const teams=S.settings.mode==='teams';
  const entry={id:S.gameId,at:Date.now(),finished,teams,rounds:S.rounds.length,
    players:list.map(p=>({n:p.name||'لاعب',t:p.total||0,team:teams?teamOf(p,list):null}))};
  if(teams){const t={A:0,B:0};entry.players.forEach(p=>t[p.team]+=p.t);entry.teamTotals=t}
  const hist=(S.history||[]).filter(x=>x.id!==entry.id);hist.unshift(entry);
  S.history=hist.slice(0,30);store('history',JSON.stringify(S.history));
}
function resetGame(){recordGame(S.status==='done');S=newGameState(true);commit();toast('بدأت لعبة جديدة والنتائج صفر')}
function newGameState(keep){
  const players={};
  if(keep&&S)for(const[id,p]of Object.entries(S.players))players[id]={name:p.name,joinedAt:p.joinedAt,online:p.online,answers:{},points:{},total:0};
  return{gameId:rid(8),status:'setup',settings:keep&&S?S.settings:defaultSettings(),round:0,rounds:[],used:[],teams:keep&&S?S.teams:{},players,history:S&&S.history?S.history:loadHistory()};
}
function commit(){
  if(isAdmin()){
    store('hostState',JSON.stringify(S));
    const now=Date.now();
    for(const[pid,c]of Object.entries(conns)){if(c.open){try{c.send({t:'state',S,now,you:pid})}catch(e){}}}
  }
  render();
}
function applyAnswer(pid,r,q,order){
  const p=S.players[pid];if(!p||S.status!=='playing'||r!==S.round)return;
  const R=S.rounds[r];const Q=R&&R.questions[q];if(!Q)return;
  const k=qkey(r,q);if(p.answers[k])return;
  if(Date.now()>R.startedAt+(q+1)*(R.ready+R.dur)+4000)return;   // too late
  const evs=Q.evs;
  if(!Array.isArray(order)||order.length!==evs.length||new Set(order).size!==evs.length||order.some(x=>!(x>=0&&x<evs.length)))return;
  p.answers[k]=order;p.points[k]=scoreOf(evs,order).pts;p.total=Object.values(p.points).reduce((a,b)=>a+b,0);
}
function adminBoot(){
  let saved=null;try{saved=JSON.parse(load('hostState')||'null')}catch(e){}
  S=saved&&saved.settings&&saved.status!=='done'?saved:newGameState(false);
  if(!S.history)S.history=loadHistory();
  if(!S.settings.v2){S.settings.v2=true;if(!S.settings.cats.includes('tv'))S.settings.cats.push('tv')}
  if(S.status==='playing'){S.status='setup'}            // a round cut off by a reload starts over
  for(const p of Object.values(S.players))p.online=false;
  store('hostState',JSON.stringify(S));
  startPeerHost();keepAwake();render();
}
function startPeerHost(){
  if(peer){try{peer.destroy()}catch(e){}}
  net='connecting';render();
  peer=new Peer(ROOM_ID,{config:ICE,debug:0});
  peer.on('open',()=>{net='ok';render()});
  peer.on('connection',c=>{
    c.on('data',d=>onHostMsg(c,d));
    c.on('close',()=>{if(c.pid&&conns[c.pid]===c){delete conns[c.pid];if(S.players[c.pid]){S.players[c.pid].online=false;commit()}}});
    c.on('error',()=>{});
  });
  peer.on('disconnected',()=>{net='connecting';render();setTimeout(()=>{try{if(peer&&!peer.destroyed)peer.reconnect()}catch(e){}},2000)});
  peer.on('error',e=>{
    if(e.type==='unavailable-id'){net='taken';render();setTimeout(startPeerHost,5000)}   // open on another device, or still held from a reload
    else if(['network','server-error','socket-error','socket-closed'].includes(e.type)){net='connecting';render();setTimeout(startPeerHost,4000)}
  });
}
const lastSeen={};
// players ping every few seconds; anyone silent for 12 s is shown as not connected
setInterval(()=>{
  if(!isAdmin()||!S)return;let changed=false;const now=Date.now();
  for(const[id,p]of Object.entries(S.players)){
    const alive=!!(conns[id]&&conns[id].open&&now-(lastSeen[id]||0)<12000);
    if(p.online!==alive){p.online=alive;changed=true}
  }
  if(changed)commit();
},3000);
function onHostMsg(c,d){
  if(!d||typeof d!=='object')return;
  if(c.pid)lastSeen[c.pid]=Date.now();
  if(d.t==='ping')return;
  if(d.t==='hello'&&typeof d.pid==='string'&&d.pid.length<40){
    if((S.kicked||[]).includes(d.pid)){
      if(!d.rejoin){try{c.send({t:'removed'})}catch(e){}setTimeout(()=>{try{c.close()}catch(e){}},300);return}
      S.kicked=S.kicked.filter(x=>x!==d.pid);
    }
    const name=String(d.name||'لاعب').slice(0,24);
    c.pid=d.pid;lastSeen[d.pid]=Date.now();if(conns[d.pid]&&conns[d.pid]!==c){try{conns[d.pid].close()}catch(e){}}conns[d.pid]=c;
    const p=S.players[d.pid];
    if(p){p.name=name;p.online=true}else S.players[d.pid]={name,joinedAt:Date.now(),online:true,answers:{},points:{},total:0};
    commit();
  }
  if(d.t==='answer'&&c.pid){applyAnswer(c.pid,d.r,d.q,d.order);commit()}
}
let wakeLock=null;
async function keepAwake(){try{if('wakeLock' in navigator&&document.visibilityState==='visible')wakeLock=await navigator.wakeLock.request('screen')}catch(e){}}

// ================= PLAYER: joins the fixed room =================
function playerJoin(){
  if(!nick){needNick();return}
  joined=true;
  myPid=load('pid')||rid(10);store('pid',myPid);
  net='connecting';render();
  if(peer){try{peer.destroy()}catch(e){}}
  peer=new Peer(undefined,{config:ICE,debug:0});
  peer.on('open',()=>connectHost());
  peer.on('error',e=>{
    if(e.type==='peer-unavailable'){net='nohost';connecting=false;render();setTimeout(connectHost,3000)}
    else if(['network','server-error','socket-error','socket-closed'].includes(e.type)){net='lost';connecting=false;render();setTimeout(playerJoin,4000)}
  });
  peer.on('disconnected',()=>{setTimeout(()=>{try{if(peer&&!peer.destroyed)peer.reconnect()}catch(e){}},2000)});
}
function connectHost(){
  if(!peer||peer.destroyed||connecting)return;
  if(hostConn&&hostConn.open)return;
  connecting=true;
  const c=peer.connect(ROOM_ID,{reliable:true});hostConn=c;
  const giveUp=setTimeout(()=>{if(!c.open){connecting=false;try{c.close()}catch(e){};if(net!=='ok'){net='nohost';render()}setTimeout(connectHost,2500)}},9000);
  c.on('open',()=>{clearTimeout(giveUp);connecting=false;net='ok';c.send({t:'hello',pid:myPid,name:nick,rejoin:rejoining});rejoining=false;render()});
  c.on('data',d=>{if(d&&d.t==='removed'){removed=true;joined=false;S=null;try{peer.destroy()}catch(e){}peer=null;hostConn=null;connecting=false;net='idle';render();return}
    if(d&&d.t==='state'&&d.S){
    const mine=S&&S.players[myPid];S=d.S;clockOff=d.now-Date.now();
    // keep answers this phone already sent until the admin confirms them
    if(mine&&S.players[myPid])for(const[k,v]of Object.entries(mine.answers||{}))if(!S.players[myPid].answers[k]&&sentFor[k])S.players[myPid].answers[k]=v;
    render()}});
  c.on('close',()=>{clearTimeout(giveUp);connecting=false;if(hostConn===c){net='lost';render();setTimeout(connectHost,2500)}});
  c.on('error',()=>{});
}
setInterval(()=>{if(!isAdmin()&&hostConn&&hostConn.open){try{hostConn.send({t:'ping'})}catch(e){}}},4000);
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible')return;
  if(isAdmin()){keepAwake();if(peer&&peer.disconnected&&!peer.destroyed){try{peer.reconnect()}catch(e){}}}
  else if(joined&&(!hostConn||!hostConn.open))connectHost();
});

// ================= RENDER =================
function render(){
  const main=$('#main');
  netBanner();
  if(view==='history'&&S&&S.status==='playing')view='main';   // never miss a round that just started
  if(view==='history')return swap(main,viewHistory());
  if(isAdmin()){
    if(view==='refs')return swap(main,viewRefs());
    if(view==='family')return swap(main,viewFamily());
    const c=ctx();
    if(c.status==='playing')return renderAdminLive(main,c);
    return swap(main,c.status==='setup'?viewAdminSetup(c):c.status==='reveal'?viewReveal(c):viewFinal(c));
  }
  if(removed)return swap(main,viewRemoved());
  if(!joined)return swap(main,viewWelcome());
  if(!S)return swap(main,viewConnecting());
  const c=ctx();
  if(!c.me)return swap(main,viewConnecting());
  if(c.status==='playing')return renderPlaying(main,c);
  swap(main,c.status==='setup'?viewGetReady(c):c.status==='reveal'?viewReveal(c):viewFinal(c));
}
function netBanner(){
  const b=$('#net');if(!b)return;
  let msg='';
  if(isAdmin()){if(net==='taken')msg='الغرفة مفتوحة على جهاز آخر. أغلق صفحة المدير هناك… نحاول من جديد';else if(net!=='ok')msg='جارٍ فتح الغرفة… أبقِ هذه الصفحة مفتوحة'}
  else if(joined&&S&&net!=='ok')msg='انقطع الاتصال بالمدير… نحاول من جديد';
  b.textContent=msg;b.hidden=!msg;
}
function swap(main,node){builtKey=null;if(sortable){sortable.destroy();sortable=null}
  const a=document.activeElement,id=a&&a.id,val=a&&a.value,sel=a&&a.selectionStart;
  main.replaceChildren(node);
  if(id){const n=document.getElementById(id);if(n&&n!==a&&n.tagName==='INPUT'){n.value=val;n.focus();try{n.setSelectionRange(sel,sel)}catch(e){}}}
}
const seg=(label,val,opts,onpick,fmt=num,disabledFn)=>h('div',{class:'field'},h('span',{class:'lbl'},label),
  h('div',{class:'seg'},opts.map(o=>h('button',{class:'chip','aria-pressed':String(val===o),disabled:disabledFn&&disabledFn(o),onclick:()=>onpick(o)},fmt(o)))));
function nickField(){
  return h('div',{class:'field'},h('label',{for:'nick'},'اسمك'),
    h('input',{type:'text',id:'nick',maxlength:'24',autocomplete:'nickname',placeholder:'مثلاً: أبو فهد',value:nick,oninput:e=>{nick=e.target.value.trim();store('nick',nick)}}));
}
function needNick(){toast('اكتب اسمك أولًا');const n=$('#nick');if(n)n.focus()}
function peopleList(list,doneFn){
  return h('div',{class:'people'},list.length?list.map(p=>h('span',{class:(doneFn&&doneFn(p)?'done ':'')+(p.id===myPid?'me ':'')+(p.online===false?'off':'')},(p.name||'لاعب')+(p.id===myPid?' (أنت)':''))):h('span',{class:'muted'},'لا أحد بعد'));
}
function teamsBlock(c,editable){
  const col=k=>{const mem=c.players.filter(p=>teamOf(p,c.players)===k);
    return h('div',{class:'team',style:`--tc:${TEAMS[k].v}`},h('h3',{},TEAMS[k].name),
      h('div',{class:'people'},mem.length?mem.map(p=>editable?h('button',{title:'انقله إلى الفريق الآخر',class:p.online===false?'off':'',onclick:()=>moveTeam(p)},(p.name||'لاعب')+' ⇄'):h('span',{class:p.id===myPid?'me':''},(p.name||'لاعب')+(p.id===myPid?' (أنت)':''))):h('span',{class:'muted'},'لا أحد')))};
  return h('div',{class:'teams'},col('A'),col('B'));
}

// ---------- player screens ----------
function viewWelcome(){
  return h('div',{class:'stack'},h('section',{class:'panel'},
    h('h2',{},'أهلًا بك 👋'),
    h('p',{},'اكتب اسمك وادخل الغرفة، ثم انتظر حتى يبدأ المدير اللعبة.'),
    nickField(),
    h('button',{class:'btn primary block',onclick:playerJoin},'ادخل الغرفة')),
    howTo());
}
function howTo(){
  return h('section',{class:'panel'},
    h('h3',{},'كيف نلعب؟'),
    h('p',{},`كل جولة ${num(QUESTIONS_PER_ROUND)} أسئلة. في كل سؤال تظهر أحداث من فئة واحدة بترتيب عشوائي: اسحبها أو حرّكها بالأسهم حتى يصبح الأقدم في الأعلى والأحدث في الأسفل.`),
    h('p',{class:'muted small'},'عندما ينتهي وقت السؤال يُرسل ترتيبك تلقائيًا وتنتقل اللعبة إلى السؤال التالي. نقطة لكل حدث في مكانه الصحيح، و٣ نقاط إضافية للترتيب الكامل.'));
}
function viewRemoved(){
  return h('div',{class:'stack'},h('section',{class:'panel',style:'text-align:center;align-items:center'},
    h('h2',{},'خرجت من الغرفة'),
    h('p',{class:'muted'},'أخرجك المدير من اللعبة. إذا كان ذلك بالخطأ، ادخل مرة أخرى.'),
    h('button',{class:'btn primary block',onclick:()=>{removed=false;rejoining=true;playerJoin()}},'ادخل مرة أخرى')));
}
function viewConnecting(){
  return h('div',{class:'stack'},h('section',{class:'panel',style:'text-align:center;align-items:center'},
    h('div',{class:'spinner','aria-hidden':'true'}),
    h('h2',{},net==='nohost'?'المدير لم يفتح الغرفة بعد':'جارٍ الدخول إلى الغرفة…'),
    h('p',{class:'muted'},net==='nohost'?'ابقَ في هذه الصفحة، وستدخل تلقائيًا عندما يفتح المدير الغرفة.':'لحظات من فضلك.')));
}
function viewGetReady(c){
  const st=S.settings;const myTeam=c.teams&&c.me?TEAMS[teamOf(c.me,c.players)]:null;
  const out=h('div',{class:'stack'},
    h('section',{class:'panel getready'},
      h('div',{class:'spinner','aria-hidden':'true'}),
      h('h2',{class:'gr'},'استعد!'),
      h('p',{},c.r===0?`أهلًا ${c.me.name}، أنت في الغرفة ✓`:`الجولة ${num(c.r+1)} من ${num(c.total)} على وشك البدء`),
      h('p',{class:'muted'},'ستبدأ اللعبة على جوالك تلقائيًا عندما يضغط المدير «ابدأ».'),
      myTeam?h('p',{class:'myteam',style:`--tc:${myTeam.v}`},'فريقك: ',h('strong',{},myTeam.name)):null,
      h('p',{class:'muted small'},`${num(QUESTIONS_PER_ROUND)} أسئلة · ${num(st.secs)} ثوانٍ لكل سؤال`)),
    h('section',{class:'panel'},h('div',{class:'status'},h('h3',{},'في الغرفة'),h('span',{class:'pill'},num(c.players.filter(p=>p.online!==false).length))),
      c.teams?teamsBlock(c,false):peopleList(c.players.filter(p=>p.online!==false))));
  if(c.r>0)out.append(h('section',{class:'panel'},h('h3',{},'النتائج حتى الآن'),myScore(c),board(c,c.r-1)));
  else out.append(howTo());
  out.append(h('div',{class:'row'},h('button',{class:'link',onclick:()=>{view='history';render()}},'سجل الألعاب السابقة'),h('button',{class:'link',onclick:changeName},'غيّر اسمي')));
  return out;
}
function changeName(){joined=false;if(peer){try{peer.destroy()}catch(e){}}peer=null;hostConn=null;S=null;connecting=false;net='idle';render()}

// one question at a time, driven by the clock
function renderPlaying(main,c){
  const R=c.R;if(!R)return;
  const ph=phase(R);
  const pk=ph.over?`${c.key}:${c.r}:over`:`${c.key}:${c.r}:${ph.q}:${ph.stage}`;
  if(builtKey===pk)return updateClock(ph);
  if(answering&&answering!==pk&&$('#order'))finalize(answering);   // time is up: send what the player has
  answering=null;
  const n=R.questions.length;
  let node;
  if(ph.over){
    node=h('section',{class:'panel',style:'text-align:center;align-items:center'},h('h2',{},'انتهت الجولة!'),h('p',{class:'muted'},'نجمع الإجابات ونحسب النقاط…'));
  }else{
    const Q=R.questions[ph.q];
    const prog=h('div',{class:'status'},h('h2',{},`سؤال ${num(ph.q+1)} من ${num(n)}`),h('span',{class:'tag',style:cc(Q.cat)},CATS[Q.cat].name));
    const timer=h('div',{class:'timer',id:'timer'},h('div',{class:'bar'},h('i',{})),h('span',{class:'sec'},''));
    if(ph.stage==='ready'){
      node=h('div',{class:'stack'},prog,
        h('section',{class:'panel ready',style:cc(Q.cat)},h('p',{class:'muted'},'استعد… السؤال التالي من'),h('div',{class:'readycat'},CATS[Q.cat].name),
          h('p',{class:'muted small'},`رتّب ${num(Q.evs.length)} أحداث خلال ${num(Math.round(R.dur/1000))} ثوانٍ`)),timer);
    }else{
      answering=pk;
      const k=qkey(c.r,ph.q);
      const list=h('ol',{class:'order',id:'order'});
      (drafts[k]||Q.evs.map((_,i)=>i)).forEach(ix=>list.append(eventCard(Q.evs[ix],ix,k)));
      node=h('div',{class:'stack'},prog,timer,
        h('section',{class:'panel'},h('div',{class:'ends'},h('span',{},'▲ الأقدم'),h('span',{},'الأحدث ▼')),list,
          h('p',{class:'muted small'},'يُرسل ترتيبك تلقائيًا عند انتهاء الوقت.')));
    }
  }
  swap(main,node);builtKey=pk;
  const list=$('#order');
  if(list&&window.Sortable){const k=qkey(c.r,ph.q);sortable=Sortable.create(list,{animation:120,delay:60,delayOnTouchOnly:true,filter:'.mv',preventOnFilter:false,onEnd:()=>{drafts[k]=currentOrder()}})}
  updateClock(ph);
}
function updateClock(ph){
  const t=$('#timer');if(!t||ph.over)return;
  const frac=Math.max(0,Math.min(1,ph.left/ph.span));
  t.querySelector('i').style.transform=`scaleX(${frac})`;
  t.querySelector('.sec').textContent=num(Math.max(0,Math.ceil(ph.left/1000)));
  t.classList.toggle('low',ph.stage==='answer'&&ph.left<=3000);
  t.classList.toggle('wait',ph.stage==='ready');
}
function eventCard(e,ix,k){
  const li=h('li',{'data-ix':ix,style:cc(e.c)},
    h('div',{},h('div',{class:'t',text:e.t}),e.n?h('div',{class:'n',text:e.n}):null),
    h('div',{class:'mvs'},
      h('button',{class:'mv','aria-label':'حرّك للأعلى',onclick:ev=>{ev.stopPropagation();const p=li.previousElementSibling;if(p){li.parentNode.insertBefore(li,p);drafts[k]=currentOrder()}}},'▲'),
      h('button',{class:'mv','aria-label':'حرّك للأسفل',onclick:ev=>{ev.stopPropagation();const n=li.nextElementSibling;if(n){li.parentNode.insertBefore(n,li);drafts[k]=currentOrder()}}},'▼')));
  return li;
}
const currentOrder=()=>[...$('#order').children].map(li=>+li.dataset.ix);
function finalize(pk){
  const parts=pk.split(':');const r=+parts[1],q=+parts[2];const k=qkey(r,q);
  if(sentFor[k])return;sentFor[k]=true;
  const order=currentOrder();
  const me=S.players[myPid];if(me)me.answers[k]=order;
  if(hostConn&&hostConn.open){try{hostConn.send({t:'answer',r,q,order})}catch(e){}}
}

// ---------- admin screens ----------
function linkPanel(){
  const link=playerUrl();
  const qr=h('div',{class:'qr','aria-label':'رمز QR لرابط اللاعبين'});
  try{const q=qrcode(0,'M');q.addData(link);q.make();qr.innerHTML=q.createSvgTag({cellSize:5,margin:2,scalable:true})}catch(e){}
  const wa='https://wa.me/?text='+encodeURIComponent('تعالوا نلعب «رتّب الزمن» 🎯\nافتحوا الرابط واكتبوا أسماءكم:\n'+link);
  return h('section',{class:'panel room'},
    h('div',{class:'status'},h('h3',{},'رابط اللاعبين'),h('span',{class:'pill'},net==='ok'?'الغرفة مفتوحة ✓':'جارٍ الفتح…')),
    h('div',{class:'roomgrid'},qr,h('div',{class:'stack',style:'min-width:0'},
      h('p',{class:'muted small'},'يمسح أفراد العائلة الرمز بالكاميرا، أو ترسل لهم الرابط. الرابط ثابت لا يتغير.'),
      h('div',{class:'linkbox',dir:'ltr',id:'roomlink'},link),
      h('div',{class:'row'},
        h('button',{class:'btn',onclick:()=>{navigator.clipboard.writeText(link).then(()=>toast('نُسخ الرابط ✓'),()=>{const r=document.createRange();r.selectNodeContents($('#roomlink'));getSelection().removeAllRanges();getSelection().addRange(r);toast('الرابط محدد، انسخه')})}},'انسخ'),
        h('a',{class:'btn',href:wa,target:'_blank',rel:'noopener'},'واتساب')))));
}
function secsPicker(val,onset){
  const clamp=v=>Math.max(1,Math.min(20,Math.round(+v||0)));
  const apply=v=>{const n=clamp(v);if(n!==val)onset(n);else render()};
  return h('div',{class:'field'},h('label',{for:'secs'},'وقت كل سؤال (من ١ إلى ٢٠ ثانية)'),
    h('div',{class:'secs'},
      h('button',{class:'mv',type:'button','aria-label':'أقل',onclick:()=>apply(val-1),disabled:val<=1},'−'),
      h('input',{type:'number',id:'secs',min:'1',max:'20',step:'1',inputmode:'numeric',value:String(val),'aria-label':'اكتب عدد الثواني',onchange:e=>apply(e.target.value)}),
      h('button',{class:'mv',type:'button','aria-label':'أكثر',onclick:()=>apply(val+1),disabled:val>=20},'+'),
      h('select',{id:'secsSel','aria-label':'اختر عدد الثواني',onchange:e=>apply(e.target.value)},
        Array.from({length:20},(_,i)=>i+1).map(n=>h('option',{value:n,selected:n===val},`${num(n)} ثانية`)))));
}
function managePlayers(c){
  if(!c.players.length)return null;
  const offline=c.players.filter(p=>p.online===false);
  return h('div',{class:'stack'},
    h('span',{class:'lbl'},'إدارة اللاعبين'),
    h('ul',{class:'plist'},c.players.map(p=>h('li',{},
      h('span',{class:'dot'+(p.online===false?' off':'')}),
      h('span',{class:'pn'},p.name||'لاعب',h('span',{class:'muted small'},p.online===false?' · غير متصل':' · متصل'),(p.total||0)>0?h('span',{class:'muted small'},` · ${num(p.total)} نقطة`):null),
      h('button',{class:'link danger-link',onclick:()=>removePlayer(p.id)},'أخرج')))),
    offline.length?h('button',{class:'btn block',onclick:()=>{offline.forEach(p=>removePlayer(p.id,true));commit();toast('أُخرج غير المتصلين')}},`أخرج كل غير المتصلين (${num(offline.length)})`):null);
}
function removePlayer(id,silent){
  const p=S.players[id];if(!p)return;
  delete S.players[id];if(S.teams)delete S.teams[id];
  S.kicked=[...new Set([...(S.kicked||[]),id])];
  const c=conns[id];if(c){try{c.send({t:'removed'})}catch(e){}setTimeout(()=>{try{c.close()}catch(e){}},300);delete conns[id]}
  if(!silent){commit();toast(`أُخرج ${p.name||'اللاعب'} من الغرفة`)}
}
function viewAdminSetup(c){
  const st=S.settings;const set=(k,v)=>{st[k]=v;commit()};
  const avail=availableCats();
  const catBox=h('div',{class:'chips',role:'group','aria-label':'الفئات'},Object.entries(CATS).map(([k,v])=>{
    const dis=!avail.includes(k);const on=st.cats.includes(k)&&!dis;
    return h('button',{class:'chip',style:cc(k),'aria-pressed':String(on),disabled:dis,onclick:()=>{const s=new Set(st.cats);if(on){if(st.cats.filter(x=>avail.includes(x)).length<=1){toast('اختر فئة واحدة على الأقل');return}s.delete(k)}else s.add(k);set('cats',[...s])}},
      (on?'✓ ':'')+v.name,h('small',{},dis?'أضف ٣ أحداث عائلية على الأقل':v.hint));
  }));
  const online=c.players.filter(p=>p.online!==false);
  const out=h('div',{class:'stack'},
    h('div',{class:'status'},h('h2',{},c.r===0?'تجهيز اللعبة':`قبل الجولة ${num(c.r+1)} من ${num(c.total)}`),h('span',{class:'pill'},`${num(online.length)} لاعبين متصلين`)),
    linkPanel(),
    h('section',{class:'panel'},
      h('h3',{},'اللاعبون'),
      seg('طريقة اللعب',st.mode,['solo','teams'],o=>set('mode',o),o=>o==='teams'?'فريقان':'كل لاعب وحده'),
      c.teams?h('div',{class:'stack'},h('p',{class:'muted small'},'اضغط على اسم اللاعب لنقله إلى الفريق الآخر.'),teamsBlock(c,true),
        h('button',{class:'link',onclick:shuffleTeams},'وزّع الفرق عشوائيًا')):peopleList(c.players),
      c.players.some(p=>p.online===false)?h('p',{class:'muted small'},'الأسماء المشطوبة غير متصلة الآن.'):null,
      managePlayers(c)),
    h('section',{class:'panel'},
      h('h3',{},'الأسئلة'),
      h('div',{class:'field'},h('span',{class:'lbl'},'الفئات (تتناوب سؤالًا بعد سؤال)'),catBox),
      seg('عدد الجولات',st.totalRounds,[1,2,3,5],o=>set('totalRounds',o),num,o=>o<c.r+1),
      seg('عدد الأحداث في كل سؤال',st.perQ,[3,4,5],o=>set('perQ',o)),
      secsPicker(st.secs,v=>set('secs',v)),
      h('p',{class:'muted small'},`كل جولة ${num(QUESTIONS_PER_ROUND)} أسئلة، ومدتها تقريبًا ${num(Math.ceil(QUESTIONS_PER_ROUND*(st.secs+READY_MS/1000)))} ثانية.`),
      h('div',{class:'row'},h('button',{class:'link',onclick:()=>{view='family';render()}},`أحداث العائلة (${num(family.length)})`),
        h('button',{class:'link',onclick:()=>{view='history';render()}},`سجل الألعاب السابقة (${num((S.history||[]).length)})`),
        h('button',{class:'link',onclick:()=>{view='refs';render()}},'مصادر الأسئلة'))),
    h('button',{class:'btn primary block big-start',disabled:!online.length,onclick:()=>startRound(c)},online.length?`ابدأ الجولة ${num(c.r+1)} للجميع`:'بانتظار دخول اللاعبين…'));
  if(c.r>0)out.append(h('section',{class:'panel'},h('h3',{},'النتائج حتى الآن'),board(c,c.r-1)));
  if(c.players.some(p=>(p.total||0)>0))out.append(h('button',{class:'btn block',onclick:resetGame},'ابدأ لعبة جديدة (تصفير النتائج وحفظها في السجل)'));
  out.append(h('p',{class:'muted small'},'أبقِ هذه الصفحة مفتوحة طوال اللعب، فهي التي تدير الغرفة.'));
  return out;
}
// live view while a round runs: progress and who has answered, without showing the answers
function renderAdminLive(main,c){
  const R=c.R;const ph=phase(R);const n=R.questions.length;
  const pk=ph.over?'over':`${ph.q}:${ph.stage}`;
  const qi=ph.over?n-1:ph.q;const k=qkey(c.r,qi);
  const sig=pk+'|'+c.players.map(p=>p.id+(p.answers[k]?1:0)+(p.online===false?0:1)).join(',');
  if(builtKey===sig)return updateClock(ph);
  swap(main,h('div',{class:'stack'},
    h('div',{class:'status'},h('h2',{},`الجولة ${num(c.r+1)} من ${num(c.total)}`),h('span',{class:'pill'},ph.over?'انتهت':`سؤال ${num(ph.q+1)} من ${num(n)}`)),
    ph.over?h('section',{class:'panel'},h('p',{},'نجمع الإجابات الأخيرة…')):h('section',{class:'panel'},
      h('div',{class:'status'},h('span',{class:'tag',style:cc(R.questions[ph.q].cat)},CATS[R.questions[ph.q].cat].name),h('span',{class:'muted small'},ph.stage==='ready'?'استعداد':'وقت الإجابة')),
      h('div',{class:'timer',id:'timer'},h('div',{class:'bar'},h('i',{})),h('span',{class:'sec'},'')),
      h('div',{class:'qdots'},R.questions.map((Q,i)=>h('span',{class:'qd'+(i<ph.q?' past':i===ph.q?' now':''),style:cc(Q.cat),title:CATS[Q.cat].name},num(i+1))))),
    h('section',{class:'panel'},h('h3',{},`أجاب على السؤال ${num(qi+1)}`),peopleList(c.players,p=>p.answers[k])),
    h('button',{class:'btn block',onclick:()=>{S.status='reveal';commit()}},'أنهِ الجولة الآن واعرض النتائج')));
  builtKey=sig;updateClock(ph);
}

// ---------- shared screens: results ----------
function myScore(c){
  if(!c.me)return null;
  const list=ranked(c.players);const rank=list.findIndex(p=>p.id===myPid)+1;
  return h('div',{class:'mine'},h('span',{},'نقاطك: ',h('strong',{},num(c.me.total||0))),h('span',{},'ترتيبك: ',h('strong',{},`${num(rank)} من ${num(list.length)}`)),
    c.teams?h('span',{style:`color:${TEAMS[teamOf(c.me,c.players)].v}`},TEAMS[teamOf(c.me,c.players)].name):null);
}
function viewReveal(c){
  const R=c.R;const me=c.me;const last=c.r>=c.total-1;
  const maxPts=R.questions.reduce((s,Q)=>s+Q.evs.length+3,0);
  const cards=R.questions.map((Q,qi)=>{
    const k=qkey(c.r,qi);const ans=me&&me.answers[k];const corr=correctOrder(Q.evs);const res=ans?scoreOf(Q.evs,ans):null;
    return h('section',{class:'qcard',style:cc(Q.cat)},
      h('div',{class:'status'},h('span',{class:'tag'},`${num(qi+1)} · ${CATS[Q.cat].name}`),
        me?(res?h('span',{class:res.perfect?'ok small':'muted small'},res.perfect?`✓ كامل +${num(res.pts)}`:`${num(res.hits)}/${num(Q.evs.length)} +${num(res.pts)}`):h('span',{class:'no small'},'لم يُرسل')):null),
      h('ol',{class:'mini'},corr.map((ix,pos)=>h('li',{},h('span',{class:'y'},(Q.evs[ix].m?MONTHS[Q.evs[ix].m]+' ':'')+num(Q.evs[ix].y)),h('span',{class:'tt',text:Q.evs[ix].t}),
        ans?h('span',{class:ans.indexOf(ix)===pos?'ok':'no'},ans.indexOf(ix)===pos?'✓':'✗'):h('span',{})))));
  });
  return h('div',{class:'stack'},
    h('div',{class:'status'},h('h2',{},`نتائج الجولة ${num(c.r+1)} من ${num(c.total)}`)),
    me?h('section',{class:'panel'},h('div',{class:'row'},h('span',{class:'big'},'+'+num(roundPts(me,c.r))),h('p',{},`نقاطك في هذه الجولة من أصل ${num(maxPts)}`)),myScore(c)):null,
    h('section',{class:'panel'},h('h3',{},'لوحة الترتيب'),board(c,c.r)),
    isAdmin()?h('button',{class:'btn primary block',onclick:()=>advance(c,last)},last?'اعرض النتيجة النهائية للجميع':'جهّز الجولة التالية'):h('p',{class:'muted'},last?'ننتظر المدير لعرض النتيجة النهائية…':'استعد للجولة التالية، المدير يجهّزها الآن…'),
    h('h3',{},'الإجابات الصحيحة (من الأقدم إلى الأحدث)'),
    ...cards);
}
function teamTotals(c){
  const t={A:{pts:0,mem:[]},B:{pts:0,mem:[]}};
  c.players.forEach(p=>{const k=teamOf(p,c.players);t[k].pts+=p.total||0;t[k].mem.push(p)});
  return t;
}
function playersTable(c,r){
  return h('table',{class:'sc'},h('tbody',{},ranked(c.players).map((p,i)=>{const rp=r!=null?roundPts(p,r):0;return h('tr',{class:p.id===myPid?'meRow':''},
    h('td',{class:'rk'},i<3&&(p.total||0)>0?['🥇','🥈','🥉'][i]:num(i+1)),h('td',{class:p.id===myPid?'me':''},(p.name||'لاعب')+(p.id===myPid?' (أنت)':''),rp?h('span',{class:'plus'},'+'+num(rp)):null),
    h('td',{class:'num'},num(p.total||0)+' نقطة'))})));
}
function board(c,r){
  if(!c.teams)return playersTable(c,r);
  const t=teamTotals(c);const order=['A','B'].sort((a,b)=>t[b].pts-t[a].pts);
  return h('div',{class:'stack'},order.map(k=>{
    const rp=r!=null?t[k].mem.reduce((s,p)=>s+roundPts(p,r),0):null;
    return h('div',{class:'team-score',style:`--tc:${TEAMS[k].v}`},
      h('span',{class:'tn'},TEAMS[k].name,rp?h('span',{class:'plus'},'+'+num(rp)):null),
      h('span',{class:'tp'},num(t[k].pts)),
      h('span',{class:'mem'},t[k].mem.map(p=>`${p.name||'لاعب'} ${num(p.total||0)}`).join(' · ')||'لا أحد'))}),
    h('p',{class:'lbl'},'ترتيب اللاعبين'),playersTable(c,r));
}
function viewFinal(c){
  let title,sub;
  if(c.teams){const t=teamTotals(c);const w=t.A.pts===t.B.pts?null:(t.A.pts>t.B.pts?'A':'B');title=w?TEAMS[w].name:'تعادل!';sub=w?`${num(t[w].pts)} نقطة`:`${num(t.A.pts)} لكل فريق`}
  else{const top=ranked(c.players)[0];title=top?top.name:'—';sub=top?`${num(top.total||0)} نقطة`:''}
  return h('div',{class:'stack'},
    h('section',{class:'panel winner'},
      h('p',{class:'muted'},'الفائز 🏆'),
      h('h2',{},title),h('p',{},sub),
      c.me?myScore(c):null),
    h('section',{class:'panel'},h('h3',{},'لوحة الترتيب النهائية'),board(c,null)),
    isAdmin()?h('button',{class:'btn primary block',onclick:resetGame},'لعبة جديدة بنفس اللاعبين (النتائج تبدأ من صفر)'):h('p',{class:'muted'},'شكرًا على اللعب! إذا بدأ المدير لعبة جديدة ستظهر هنا تلقائيًا.'),
    h('button',{class:'link',onclick:()=>{view='history';render()}},'سجل الألعاب السابقة'));
}

let confirmClear=false;
function deleteHistory(id){S.history=(S.history||[]).filter(g=>g.id!==id);store('history',JSON.stringify(S.history));commit();toast('حُذفت النتيجة')}
function clearHistory(){S.history=[];confirmClear=false;store('history','[]');commit();toast('حُذف السجل كله')}
function viewHistory(){
  const hist=(S&&S.history)||[];
  const when=t=>{const d=new Date(t);return d.toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+' · '+d.toLocaleTimeString('ar-EG',{hour:'numeric',minute:'2-digit'})};
  return h('div',{class:'stack'},
    h('button',{class:'link back',onclick:()=>{view='main';render()}},'→ رجوع'),
    h('h2',{},'سجل الألعاب السابقة'),
    isAdmin()&&hist.length?(confirmClear?h('section',{class:'panel confirm'},h('p',{},'هل تريد حذف كل الألعاب السابقة؟ لا يمكن التراجع.'),
      h('div',{class:'row'},h('button',{class:'btn danger',onclick:clearHistory},'نعم، احذف الكل'),h('button',{class:'btn',onclick:()=>{confirmClear=false;render()}},'إلغاء'))):
      h('button',{class:'btn block',onclick:()=>{confirmClear=true;render()}},'احذف السجل كله')):null,
    hist.length?h('div',{class:'hist'},hist.map(g=>{
      const tw=g.teams&&g.teamTotals?(g.teamTotals.A===g.teamTotals.B?'تعادل':TEAMS[g.teamTotals.A>g.teamTotals.B?'A':'B'].name):null;
      return h('section',{class:'hcard'},
        h('div',{class:'status'},h('span',{class:'when'},when(g.at)+(g.finished?'':' · لم تكتمل')),
          isAdmin()?h('button',{class:'link danger-link','aria-label':'احذف هذه النتيجة',onclick:()=>deleteHistory(g.id)},'احذف'):null),
        h('div',{class:'win'},'🏆 '+(g.teams?tw:(g.players[0]?g.players[0].n:'—'))),
        g.teams&&g.teamTotals?h('p',{class:'small'},`${TEAMS.A.name}: ${num(g.teamTotals.A)} · ${TEAMS.B.name}: ${num(g.teamTotals.B)}`):null,
        h('table',{class:'sc'},h('tbody',{},g.players.map((p,i)=>h('tr',{},
          h('td',{class:'rk'},num(i+1)),h('td',{},p.n,p.team?h('span',{class:'muted small'},' · '+TEAMS[p.team].name):null),h('td',{class:'num'},num(p.t)+' نقطة'))))));
    })):h('p',{class:'muted'},'لا توجد ألعاب سابقة بعد. عندما تنتهي لعبة أو يبدأ المدير لعبة جديدة تُحفظ النتائج هنا.'));
}
function viewRefs(){
  const lists=[...Object.entries(EVENTS).map(([cat,list])=>[cat,CATS[cat].name,list]),['islam','غزوات النبي ﷺ (ضمن التاريخ الإسلامي)',GHAZAWAT]];
  const secs=lists.map(([cat,title,list])=>h('section',{class:'panel',style:cc(cat)},
    h('h2',{style:'color:var(--cc)'},`${title} (${num(list.length)})`),
    h('ol',{class:'mini refs'},[...list].sort((a,b)=>a[1]-b[1]||(a[4]||0)-(b[4]||0)).map(([t,y,q,note])=>h('li',{},
      h('span',{class:'y'},num(y)),h('span',{class:'tt'},t,note?h('span',{class:'muted small'},` (${note})`):null),
      h('a',{class:'link small',href:'https://ar.wikipedia.org/w/index.php?search='+encodeURIComponent(q),target:'_blank',rel:'noopener'},'المصدر'))))));
  return h('div',{class:'stack'},h('button',{class:'link back',onclick:()=>{view='main';render()}},'→ رجوع'),
    h('h2',{},'مصادر الأسئلة'),
    h('section',{class:'panel'},
      h('p',{},'اخترنا أحداثًا كبيرة ومعروفة، واستخدمنا السنة الميلادية الأكثر شيوعًا. كل حدث مرتبط ببحث في ويكيبيديا العربية للتحقق منه.'),
      h('p',{class:'muted small'},'مراجع عامة: موسوعة بريتانيكا (britannica.com)، الموقع الرسمي للفيفا (fifa.com) لأحداث كأس العالم، ومنظمة الصحة العالمية (who.int) لأحداث الأوبئة. هذه الصفحة تظهر للمدير فقط.')),
    ...secs);
}
function viewFamily(){
  const sorted=[...family].sort((a,b)=>cmp({y:+a.year,m:+a.month||0},{y:+b.year,m:+b.month||0}));
  const monthSel=h('select',{id:'fm'},MONTHS.map((m,i)=>h('option',{value:i},i?m:'— بدون شهر —')));
  return h('div',{class:'stack'},h('button',{class:'link back',onclick:()=>{view='main';render()}},'→ رجوع'),
    h('section',{class:'panel',style:cc('family')},
      h('span',{class:'badge'},'تُحفظ على هذا الجهاز فقط'),
      h('h2',{},'أضف حدثًا عائليًا'),
      h('p',{class:'muted small'},'مثل: زواج جدي، ولادة أول حفيد، الانتقال إلى البيت الجديد. تظهر في فئة «أحداث العائلة»، ولا يراها اللاعبون قبل السؤال.'),
      h('form',{class:'stack',onsubmit:addFamily},
        h('div',{class:'field'},h('label',{for:'ft'},'الحدث'),h('input',{type:'text',id:'ft',maxlength:'90',required:true,placeholder:'مثلاً: ولادة سارة'})),
        h('div',{class:'row'},
          h('div',{class:'field'},h('label',{for:'fy'},'السنة الميلادية'),h('input',{type:'number',id:'fy',inputmode:'numeric',min:'1800',max:'2100',required:true,placeholder:'2005'})),
          h('div',{class:'field'},h('label',{for:'fm'},'الشهر (اختياري)'),monthSel)),
        h('div',{class:'field'},h('label',{for:'fn'},'تلميح صغير (اختياري)'),h('input',{type:'text',id:'fn',maxlength:'60',placeholder:'مثلاً: في جدة'})),
        h('button',{class:'btn primary block',type:'submit'},'أضف الحدث'))),
    h('section',{class:'panel'},
      h('div',{class:'status'},h('h3',{},'أحداث العائلة'),h('span',{class:'pill'},num(family.length))),
      family.length?h('ul',{class:'fam'},sorted.map(f=>h('li',{},
        h('div',{},h('strong',{text:f.title}),h('div',{class:'muted small'},fmtDate({y:+f.year,m:+f.month||0})+(f.note?' · '+f.note:''))),
        h('button',{class:'link',onclick:()=>{family=family.filter(x=>x.id!==f.id);saveFamily();render()}},'احذف')))):
      h('p',{class:'muted'},'لا توجد أحداث بعد. أضف ٣ أحداث على الأقل لتفتح فئة «أحداث العائلة».')));
}
function saveFamily(){store('family',JSON.stringify(family));if(S&&S.settings&&family.length>=3&&!S.settings.cats.includes('family')){S.settings.cats.push('family');commit()}}

// ---------- admin actions ----------
function moveTeam(p){const cur=teamOf(p,playerList());S.teams={...(S.teams||{}),[p.id]:cur==='A'?'B':'A'};commit()}
function shuffleTeams(){const t={};shuffle(playerList()).forEach((p,i)=>t[p.id]=i%2?'B':'A');S.teams=t;commit()}
function startRound(c){
  const st=S.settings;const avail=availableCats();
  const cats=st.cats.filter(k=>avail.includes(k));
  if(!cats.length){toast('اختر فئة واحدة على الأقل');return}
  const used=new Set(S.used||[]);const questions=[];
  for(const cat of categorySequence(cats,QUESTIONS_PER_ROUND)){
    const evs=pickQuestion(cat,st.perQ,used);if(!evs)continue;
    evs.forEach(e=>used.add(e.t));questions.push({cat,evs});
  }
  if(!questions.length){toast('لا توجد أحداث كافية');return}
  const list=playerList();const teams={...(S.teams||{})};list.forEach(p=>{teams[p.id]=teamOf(p,list)});
  S.rounds[c.r]={questions,startedAt:Date.now()+1500,ready:READY_MS,dur:st.secs*1000};
  S.used=[...used];S.teams=teams;S.status='playing';
  commit();
}
function advance(c,last){
  if(last){S.status='done';recordGame(true)}else{S.status='setup';S.round=c.r+1}
  commit();
}
function addFamily(ev){
  ev.preventDefault();
  const title=$('#ft').value.trim(),year=parseInt($('#fy').value,10),month=+$('#fm').value,note=$('#fn').value.trim();
  if(!title||!(year>=1800&&year<=2100)){toast('اكتب الحدث وسنة صحيحة');return}
  family.push({id:rid(8),title,year,month,note});
  $('#ft').value='';$('#fy').value='';$('#fn').value='';$('#fm').value='0';toast('أُضيف الحدث ✓');saveFamily();render();
}

// clock loop: moves between questions; the admin page ends the round
function tick(){
  if(!S||S.status!=='playing')return;
  const c=ctx();if(!c.R)return;
  if(isAdmin()){
    if(view==='main')renderAdminLive($('#main'),c);
    const ph=phase(c.R);
    if(ph.over&&!revealFor[c.key+c.r]&&ph.since>2500){revealFor[c.key+c.r]=true;S.status='reveal';commit()}
  }else if(joined&&c.me)renderPlaying($('#main'),c);
}
setInterval(tick,200);

// scroll to top when the game moves to a new screen
let lastRk='';
const _render=render;
render=function(){const rk=view+joined+(S?S.gameId+S.status+S.round:'');if(rk!==lastRk){lastRk=rk;_render();scrollTo(0,0)}else _render()};

// ---------- boot ----------
if(isAdmin())adminBoot();
else{render();if(nick)playerJoin()}
