document.documentElement.dir='rtl';document.documentElement.lang='ar';

const READY_MS=2000;
const QUESTIONS_PER_ROUND=7;            // every round has 7 questions                 // short "get ready" screen before each question
const PREFIX='tarteeb-fam-v1-';
const ICE={iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:global.stun.twilio.com:3478'}]};
const CATS={
  arab:{name:'تاريخ العرب',hint:'أبرز أحداث العرب والخليج'},
  cup:{name:'كأس العالم',hint:'أشهر لحظات كأس العالم'},
  plague:{name:'الأوبئة والأمراض',hint:'من الموت الأسود إلى كورونا'},
  islam:{name:'التاريخ الإسلامي',hint:'من الهجرة إلى فتح القسطنطينية'},
  family:{name:'أحداث العائلة',hint:'أحداث يضيفها المدير'}
};
// minimum years between events in one question, to keep it easy
const GAP={arab:20,islam:20,cup:8,plague:15,family:0};
const EVENTS={
arab:[
['عام الفيل وهجوم أبرهة على مكة',570],['سقوط غرناطة آخر ممالك الأندلس',1492],['تأسيس الدولة السعودية الأولى في الدرعية',1727],
['حملة نابليون على مصر',1798],['افتتاح قناة السويس',1869],['الثورة العربية الكبرى',1916],
['توحيد المملكة العربية السعودية',1932],['اكتشاف النفط في السعودية',1938],['تأسيس جامعة الدول العربية',1945],
['تأميم قناة السويس',1956],['استقلال الكويت',1961],['قيام دولة الإمارات العربية المتحدة',1971],
['حرب أكتوبر ١٩٧٣',1973],['تأسيس مجلس التعاون الخليجي',1981],['تحرير الكويت',1991],['افتتاح برج خليفة في دبي',2010],
['إطلاق رؤية السعودية ٢٠٣٠',2016]
],
islam:[
['بدء نزول الوحي على النبي ﷺ',610],['الهجرة النبوية إلى المدينة',622],['فتح مكة',630],['معركة اليرموك',636],
['قيام الدولة الأموية',661],['فتح الأندلس على يد طارق بن زياد',711],['قيام الدولة العباسية',750],
['تأسيس مدينة بغداد',762],['بناء الجامع الأزهر',972],['معركة حطين وتحرير صلاح الدين للقدس',1187],
['سقوط بغداد على يد المغول',1258],['فتح القسطنطينية على يد محمد الفاتح',1453],['سقوط غرناطة',1492],['إلغاء الخلافة العثمانية',1924]
],
cup:[
['أول كأس عالم في التاريخ (الأوروغواي)',1930],['مصر أول منتخب عربي يشارك في كأس العالم',1934],['بيليه يقود البرازيل لأول لقب',1958],
['إنجلترا تفوز بكأس العالم على أرضها',1966],['البرازيل تفوز باللقب الثالث بقيادة بيليه',1970],['مارادونا يقود الأرجنتين للقب في المكسيك',1986],
['السعودية تشارك لأول مرة وهدف العويران الشهير',1994],['فرنسا تفوز باللقب بقيادة زيدان',1998],['أول كأس عالم في آسيا (كوريا واليابان)',2002],
['إيطاليا تفوز باللقب في ألمانيا',2006],['أول كأس عالم في أفريقيا وإسبانيا بطلة',2010],['ألمانيا تهزم البرازيل ٧-١ وتفوز باللقب',2014],
['فرنسا تفوز باللقب في روسيا',2018],['كأس العالم في قطر وميسي يفوز باللقب',2022],['أول كأس عالم بـ٤٨ منتخبًا في أمريكا وكندا والمكسيك',2026]
],
plague:[
['طاعون جستنيان',541],['الموت الأسود يجتاح العالم',1347],['أول لقاح ضد الجدري',1796],['أول جائحة كوليرا عالمية',1817],
['الإنفلونزا الإسبانية',1918],['اكتشاف البنسلين',1928],['لقاح شلل الأطفال',1955],['إعلان القضاء على الجدري',1980],
['اكتشاف مرض الإيدز',1981],['تفشي سارس',2003],['إنفلونزا الخنازير',2009],['ظهور كورونا ميرس في السعودية',2012],
['تفشي الإيبولا في أفريقيا',2014],['جائحة كوفيد-١٩',2020]
]};
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
function unstore(k){try{localStorage.removeItem('tz_'+k)}catch(e){}}
let toastT;function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,3200)}
const cmp=(a,b)=>a.y-b.y||(a.m||0)-(b.m||0);
const clash=(a,b)=>a.y===b.y&&(!a.m||!b.m||a.m===b.m);
const correctOrder=evs=>evs.map((e,i)=>i).sort((i,j)=>cmp(evs[i],evs[j]));
function scoreOf(evs,order){const c=correctOrder(evs);let hits=0;order.forEach((ix,i)=>{if(ix===c[i])hits++});const perfect=hits===evs.length;return{hits,perfect,pts:hits+(perfect?3:0)}}
const rid=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),b=>'23456789abcdefghjkmnpqrstuvwxyz'[b%31]).join('');
const genCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(5)),b=>'23456789'[b%8]).join('');
const qkey=(r,q)=>r+'_'+q;

// ---------- state ----------
let role=null;            // 'host' | 'client' | 'local' (practice alone) | null
let S=null;               // shared game state (host owns it, clients receive copies)
let myPid=null,roomCode=null,peer=null,conns={},hostConn=null,clockOff=0,net='idle',connecting=false;
let family=[];try{family=JSON.parse(load('family')||'[]')}catch(e){family=[]}
let nick=load('nick')||'';
let mode='home';
let drafts={},sortable=null,builtKey=null,answering=null,sentFor={},revealFor={};
const isAdmin=()=>role==='host'||role==='local';
const hostNow=()=>Date.now()+clockOff;
const urlRoom=new URLSearchParams(location.search).get('room');

function poolFor(cat){
  if(cat==='family')return family.map(f=>({t:f.title,y:+f.year,m:+f.month||0,c:'family',n:f.note||''}));
  return EVENTS[cat].map(([t,y])=>({t,y,m:0,c:cat}));
}
function pickQuestion(cat,n,used){
  const all=poolFor(cat);let pool=all.filter(e=>!used.has(e.t));if(pool.length<n)pool=all;
  let best=[];
  for(const g of [GAP[cat],Math.floor(GAP[cat]/2),0]){
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

// ---------- context ----------
function ctx(){
  if(!S)return null;
  const players=playerList();
  return{key:S.gameId,R:S.rounds[S.round],r:S.round,total:S.settings.totalRounds,status:S.status,me:players.find(p=>p.id===myPid)||null,players,teams:S.settings.mode==='teams'&&role!=='local',local:role==='local'};
}
// where are we in the round, from the host's clock
function phase(R){
  const slot=R.ready+R.dur;const el=hostNow()-R.startedAt;const n=R.questions.length;
  if(el<0)return{q:0,stage:'ready',left:R.ready-el,span:R.ready};
  const q=Math.floor(el/slot);if(q>=n)return{over:true,since:el-n*slot};
  const w=el-q*slot;
  return w<R.ready?{q,stage:'ready',left:R.ready-w,span:R.ready}:{q,stage:'answer',left:slot-w,span:R.dur};
}

// ---------- game state (host / local) ----------
function defaultSettings(){return{mode:'solo',totalRounds:3,perRound:7,perQ:3,secs:6,cats:availableCats()}}
function newGameState(keepPlayers){
  const players={};
  if(keepPlayers&&S)for(const[id,p]of Object.entries(S.players))players[id]={name:p.name,joinedAt:p.joinedAt,online:p.online,answers:{},points:{},total:0};
  if(!players[myPid])players[myPid]={name:nick||'أنا',joinedAt:Date.now(),online:true,answers:{},points:{},total:0};
  return{gameId:rid(8),status:'setup',settings:keepPlayers&&S?S.settings:defaultSettings(),round:0,rounds:[],used:[],teams:keepPlayers&&S?S.teams:{},players};
}
function commit(){
  if(role==='host'){
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

// ---------- networking: host ----------
function hostOpen(resume){
  if(!nick){needNick();return}
  if(peer){try{peer.destroy()}catch(e){}}peer=null;
  roomCode=load('hostRoom')||genCode();store('hostRoom',roomCode);
  role='host';myPid='host';clockOff=0;
  let saved=null;if(resume){try{saved=JSON.parse(load('hostState')||'null')}catch(e){}}
  S=saved&&saved.settings?saved:newGameState(false);
  S.players.host.name=nick;S.players.host.online=true;
  for(const[id,p]of Object.entries(S.players))if(id!=='host')p.online=false;
  mode='group';store('hostState',JSON.stringify(S));
  startPeerHost();keepAwake();render();
}
function openLocal(){
  if(peer){try{peer.destroy()}catch(e){}}peer=null;
  role='local';myPid='me';clockOff=0;roomCode=null;net='ok';S=null;
  S=newGameState(false);S.settings.totalRounds=1;mode='group';render();
}
function startPeerHost(){
  if(peer){try{peer.destroy()}catch(e){}}
  net='connecting';
  peer=new Peer(PREFIX+roomCode,{config:ICE,debug:0});
  peer.on('open',()=>{net='ok';render()});
  peer.on('connection',c=>{
    c.on('data',d=>onHostMsg(c,d));
    c.on('close',()=>{if(c.pid&&conns[c.pid]===c){delete conns[c.pid];if(S.players[c.pid]){S.players[c.pid].online=false;commit()}}});
    c.on('error',()=>{});
  });
  peer.on('disconnected',()=>{net='connecting';render();setTimeout(()=>{try{if(peer&&!peer.destroyed)peer.reconnect()}catch(e){}},2000)});
  peer.on('error',e=>{
    if(role!=='host')return;
    if(e.type==='unavailable-id'||['network','server-error','socket-error','socket-closed'].includes(e.type)){net='connecting';render();setTimeout(()=>{if(role==='host')startPeerHost()},4000)}
  });
}
function onHostMsg(c,d){
  if(!d||typeof d!=='object')return;
  if(d.t==='hello'&&typeof d.pid==='string'&&d.pid.length<40&&d.pid!=='host'){
    const name=String(d.name||'لاعب').slice(0,24);
    c.pid=d.pid;if(conns[d.pid]&&conns[d.pid]!==c){try{conns[d.pid].close()}catch(e){}}conns[d.pid]=c;
    const p=S.players[d.pid];
    if(p){p.name=name;p.online=true}else S.players[d.pid]={name,joinedAt:Date.now(),online:true,answers:{},points:{},total:0};
    commit();
  }
  if(d.t==='answer'&&c.pid){applyAnswer(c.pid,d.r,d.q,d.order);commit()}
}
let wakeLock=null;
async function keepAwake(){try{if('wakeLock' in navigator&&document.visibilityState==='visible')wakeLock=await navigator.wakeLock.request('screen')}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if(role==='host'){keepAwake();if(peer&&peer.disconnected&&!peer.destroyed){try{peer.reconnect()}catch(e){}}}if(role==='client'&&(!hostConn||!hostConn.open))connectHost()}});

// ---------- networking: client ----------
function clientJoin(code){
  if(!nick){needNick();return}
  roomCode=code;role='client';mode='group';S=null;
  myPid=load('pid_'+code)||rid(10);store('pid_'+code,myPid);
  net='connecting';render();
  if(peer){try{peer.destroy()}catch(e){}}
  peer=new Peer(undefined,{config:ICE,debug:0});
  peer.on('open',()=>connectHost());
  peer.on('error',e=>{
    if(role!=='client')return;
    if(e.type==='peer-unavailable'){net='nohost';connecting=false;render();setTimeout(connectHost,3000)}
    else if(['network','server-error','socket-error','socket-closed'].includes(e.type)){net='lost';connecting=false;render();setTimeout(()=>{if(role==='client')clientJoin(code)},4000)}
  });
  peer.on('disconnected',()=>{setTimeout(()=>{try{if(peer&&!peer.destroyed)peer.reconnect()}catch(e){}},2000)});
}
function connectHost(){
  if(role!=='client'||!peer||peer.destroyed||connecting)return;
  if(hostConn&&hostConn.open)return;
  connecting=true;
  const c=peer.connect(PREFIX+roomCode,{reliable:true});hostConn=c;
  const giveUp=setTimeout(()=>{if(!c.open){connecting=false;try{c.close()}catch(e){};if(net!=='ok'){net='nohost';render()}setTimeout(connectHost,2500)}},9000);
  c.on('open',()=>{clearTimeout(giveUp);connecting=false;net='ok';c.send({t:'hello',pid:myPid,name:nick});render()});
  c.on('data',d=>{if(d&&d.t==='state'&&d.S){
    // keep answers this phone already sent until the host confirms them
    const mine=S&&S.players[myPid];S=d.S;clockOff=d.now-Date.now();
    if(mine&&S.players[myPid])for(const[k,v]of Object.entries(mine.answers||{}))if(!S.players[myPid].answers[k]&&sentFor[k])S.players[myPid].answers[k]=v;
    render()}});
  c.on('close',()=>{clearTimeout(giveUp);connecting=false;if(hostConn===c){net='lost';render();setTimeout(connectHost,2500)}});
  c.on('error',()=>{});
}
function leave(){role=null;S=null;mode='home';if(peer){try{peer.destroy()}catch(e){}}peer=null;hostConn=null;conns={};connecting=false;net='idle'}

// ---------- render ----------
function render(){
  const main=$('#main');
  if(mode==='group'){
    if(role==='client'&&!S){swap(main,viewConnecting());return netBanner()}
    const c=ctx();
    if(!c){mode='home';return render()}
    if(c.status==='playing'){renderPlaying(main,c);return netBanner()}
    swap(main,c.status==='setup'?viewSetupRound(c):c.status==='reveal'?viewReveal(c):viewFinal(c));
    return netBanner();
  }
  if(mode==='join')swap(main,viewJoin());
  else if(mode==='family')swap(main,viewFamily());
  else swap(main,viewHome());
  netBanner();
}
function netBanner(){
  const b=$('#net');if(!b)return;
  let msg='';
  if(mode==='group'&&role==='client'&&net!=='ok')msg=net==='nohost'?'لا نجد غرفة المدير. تأكد أن جوال المدير فاتح اللعبة… نحاول من جديد':'انقطع الاتصال بجوال المدير… نحاول من جديد';
  if(mode==='group'&&role==='host'&&net!=='ok')msg='جارٍ فتح الغرفة… أبقِ هذه الصفحة مفتوحة';
  b.textContent=msg;b.hidden=!msg;
}
function swap(main,node){builtKey=null;if(sortable){sortable.destroy();sortable=null}
  const a=document.activeElement,id=a&&a.id,val=a&&a.value,sel=a&&a.selectionStart;
  main.replaceChildren(node);
  if(id){const n=document.getElementById(id);if(n&&n!==a&&n.tagName==='INPUT'){n.value=val;n.focus();try{n.setSelectionRange(sel,sel)}catch(e){}}}
}
const back=(label='الرئيسية')=>h('button',{class:'link back',onclick:()=>{if(role==='local')leave();mode='home';render()}},'→ '+label);
const seg=(label,val,opts,onpick,fmt=num,disabledFn)=>h('div',{class:'field'},h('span',{class:'lbl'},label),
  h('div',{class:'seg'},opts.map(o=>h('button',{class:'chip','aria-pressed':String(val===o),disabled:disabledFn&&disabledFn(o),onclick:()=>onpick(o)},fmt(o)))));
function nickField(){
  return h('div',{class:'field'},h('label',{for:'nick'},'اسمك في اللعبة'),
    h('input',{type:'text',id:'nick',maxlength:'24',autocomplete:'nickname',placeholder:'مثلاً: أبو فهد',value:nick,oninput:e=>{nick=e.target.value.trim();store('nick',nick)}}));
}
function needNick(){toast('اكتب اسمك أولًا');const n=$('#nick');if(n)n.focus()}
function roomLink(){return location.origin+location.pathname+'?room='+roomCode}

function viewHome(){
  const wrap=h('div',{class:'stack'});
  wrap.append(h('section',{class:'panel'},nickField()));
  if((role==='host'||role==='client')&&S){
    wrap.append(h('section',{class:'panel'+(role==='host'?' admin':'')},h('h3',{},role==='host'?`غرفتك مفتوحة: ${num(roomCode)}`:'أنت في غرفة لعب'),
      h('button',{class:'btn primary block',onclick:()=>{mode='group';render()}},role==='host'?'ارجع إلى الغرفة':'ارجع إلى اللعبة')));
  }
  if(role!=='host'){
    wrap.append(h('section',{class:'panel'},
      h('h2',{},'انضم إلى لعبة'),
      h('p',{class:'muted small'},'افتح الرابط الذي أرسله المدير، أو اكتب رمز الغرفة الظاهر على جواله.'),
      h('div',{class:'field'},h('label',{for:'code'},'رمز الغرفة'),h('input',{type:'text',id:'code',inputmode:'numeric',maxlength:'5',placeholder:'مثلاً: 48273',autocomplete:'off'})),
      h('button',{class:'btn primary block',onclick:()=>{const v=($('#code').value||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g,'');if(v.length!==5){toast('رمز الغرفة ٥ أرقام');return}clientJoin(v)}},'انضم')));
  }
  const saved=(()=>{try{return JSON.parse(load('hostState')||'null')}catch(e){return null}})();
  const canResume=role!=='host'&&saved&&saved.settings&&saved.status!=='done';
  wrap.append(h('section',{class:'panel admin'},
    h('span',{class:'badge'},'للمدير'),
    h('p',{class:'small'},'المدير يفتح الغرفة من جواله، ويتحكم في الإعدادات والجولات وأحداث العائلة. يجب أن تبقى الصفحة مفتوحة على جوال المدير أثناء اللعب.'),
    canResume?h('button',{class:'btn primary block',onclick:()=>hostOpen(true)},'تابع غرفتي السابقة'):null,
    role!=='host'?h('button',{class:'btn block'+(canResume?'':' primary'),onclick:()=>{unstore('hostState');hostOpen(false)}},'افتح غرفة جديدة (أنا المدير)'):null,
    h('button',{class:'btn block',onclick:()=>{mode='family';render()}},`أحداث العائلة (${num(family.length)})`)));
  wrap.append(h('section',{class:'panel'},
    h('h2',{},'كيف نلعب؟'),
    h('p',{},'في كل سؤال تظهر أحداث من فئة واحدة بترتيب عشوائي. اسحبها أو حرّكها بالأسهم حتى يصبح الأقدم في الأعلى والأحدث في الأسفل.'),
    h('p',{class:'muted small'},'الفئات تتناوب: تاريخ، ثم كرة، ثم أوبئة… وعندما ينتهي وقت السؤال يُرسل ترتيبك تلقائيًا وتنتقل اللعبة إلى السؤال التالي. نقطة لكل حدث في مكانه الصحيح، و٣ نقاط إضافية للترتيب الكامل.'),
    role!=='host'&&role!=='client'?h('button',{class:'btn block',onclick:openLocal},'تدرّب وحدك'):null));
  return wrap;
}
function viewJoin(){
  return h('div',{class:'stack'},h('section',{class:'panel'},
    h('h2',{},'أهلًا بك في اللعبة'),
    h('p',{class:'muted'},`رمز الغرفة: ${num(urlRoom)}`),
    nickField(),
    h('button',{class:'btn primary block',onclick:()=>clientJoin(urlRoom)},'انضم')),
    h('button',{class:'link back',onclick:()=>{mode='home';render()}},'→ الرئيسية'));
}
function viewConnecting(){
  return h('div',{class:'stack'},h('section',{class:'panel'},h('h2',{},'جارٍ الاتصال بالغرفة…'),
    h('p',{class:'muted'},net==='nohost'?'لم نجد الغرفة بعد. تأكد أن المدير فاتح اللعبة على جواله والرمز صحيح.':'لحظات من فضلك.'),
    h('button',{class:'link',onclick:()=>{leave();render()}},'إلغاء')));
}

function peopleList(list,doneFn){
  return h('div',{class:'people'},list.map(p=>h('span',{class:(doneFn&&doneFn(p)?'done ':'')+(p.id===myPid?'me ':'')+(p.online===false?'off':'')},(p.name||'لاعب')+(p.id===myPid?' (أنت)':''))));
}
function teamsBlock(c,editable){
  const col=k=>{const mem=c.players.filter(p=>teamOf(p,c.players)===k);
    return h('div',{class:'team',style:`--tc:${TEAMS[k].v}`},h('h3',{},TEAMS[k].name),
      h('div',{class:'people'},mem.length?mem.map(p=>editable?h('button',{title:'انقله إلى الفريق الآخر',onclick:()=>moveTeam(p)},(p.name||'لاعب')+' ⇄'):h('span',{class:p.id===myPid?'me':''},p.name||'لاعب')):h('span',{class:'muted'},'لا أحد')))};
  return h('div',{class:'teams'},col('A'),col('B'));
}
function roomPanel(){
  const link=roomLink();
  const qr=h('div',{class:'qr','aria-label':'رمز QR لرابط الغرفة'});
  try{const q=qrcode(0,'M');q.addData(link);q.make();qr.innerHTML=q.createSvgTag({cellSize:5,margin:2,scalable:true})}catch(e){}
  const wa='https://wa.me/?text='+encodeURIComponent('تعالوا نلعب «رتّب الزمن» 🎯\n'+link);
  return h('section',{class:'panel room'},
    h('div',{class:'status'},h('span',{class:'lbl'},'رمز الغرفة'),h('span',{class:'pill'},net==='ok'?'الغرفة مفتوحة ✓':'جارٍ الفتح…')),
    h('div',{class:'code',dir:'ltr'},roomCode),
    qr,
    h('p',{class:'muted small'},'يمسح أفراد العائلة الرمز بكاميرا الجوال، أو ترسل لهم الرابط:'),
    h('div',{class:'linkbox',dir:'ltr',id:'roomlink'},link),
    h('div',{class:'row'},
      h('button',{class:'btn',onclick:()=>{navigator.clipboard.writeText(link).then(()=>toast('نُسخ الرابط ✓'),()=>{const r=document.createRange();r.selectNodeContents($('#roomlink'));getSelection().removeAllRanges();getSelection().addRange(r);toast('الرابط محدد، انسخه')})}},'انسخ الرابط'),
      h('a',{class:'btn',href:wa,target:'_blank',rel:'noopener'},'أرسل عبر واتساب')));
}

// waiting room / admin setup before each round
function viewSetupRound(c){
  const st=S.settings;
  const head=h('div',{class:'status'},h('h2',{},c.local?'تدرّب وحدك':(c.r===0?'غرفة الانتظار':`قبل الجولة ${num(c.r+1)}`)),c.local?null:h('span',{class:'pill'},`${num(c.players.length)} لاعبين`));
  const out=h('div',{class:'stack'},back(),head);
  if(isAdmin()){
    const set=(k,v)=>{st[k]=v;commit()};
    const avail=availableCats();
    const catBox=h('div',{class:'chips',role:'group','aria-label':'الفئات'},Object.entries(CATS).map(([k,v])=>{
      const dis=!avail.includes(k);const on=st.cats.includes(k)&&!dis;
      return h('button',{class:'chip',style:cc(k),'aria-pressed':String(on),disabled:dis,onclick:()=>{const s=new Set(st.cats);if(on){if(st.cats.filter(x=>avail.includes(x)).length<=1){toast('اختر فئة واحدة على الأقل');return}s.delete(k)}else s.add(k);set('cats',[...s])}},
        (on?'✓ ':'')+v.name,h('small',{},dis?'أضف ٣ أحداث على الأقل':v.hint));
    }));
    if(role==='host'&&c.r===0)out.append(roomPanel());
    out.append(h('section',{class:'panel admin'},
      h('span',{class:'badge'},c.local?'الإعدادات':'إعدادات المدير'),
      c.local?null:seg('طريقة اللعب',st.mode,['solo','teams'],o=>set('mode',o),o=>o==='teams'?'فريقان':'كل لاعب وحده'),
      c.local?null:(c.teams?h('div',{class:'stack'},h('p',{class:'muted small'},'اضغط على اسم اللاعب لنقله إلى الفريق الآخر.'),teamsBlock(c,true),
        h('button',{class:'link',onclick:shuffleTeams},'وزّع الفرق عشوائيًا')):peopleList(c.players)),
      h('div',{class:'field'},h('span',{class:'lbl'},'الفئات (تتناوب سؤالًا بعد سؤال)'),catBox),
      c.local?null:seg('عدد الجولات',st.totalRounds,[1,2,3,5],o=>set('totalRounds',o),num,o=>o<c.r+1),
      seg('عدد الأحداث في كل سؤال',st.perQ,[3,4,5],o=>set('perQ',o)),
      seg('وقت كل سؤال (ثانية)',st.secs,[6,10,15],o=>set('secs',o)),
      h('p',{class:'muted small'},`كل جولة ${num(QUESTIONS_PER_ROUND)} أسئلة. مدة الجولة تقريبًا: ${num(Math.ceil(QUESTIONS_PER_ROUND*(st.secs+READY_MS/1000)))} ثانية.`),
      h('button',{class:'btn primary block',onclick:()=>startRound(c)},c.local?'ابدأ':`ابدأ الجولة ${num(c.r+1)} من ${num(c.total)}`)));
    if(role==='host'&&c.r>0)out.append(roomPanel());
  }else{
    out.append(h('section',{class:'panel'},
      c.r===0?h('p',{},'أنت في الغرفة ✓ انتظر حتى يبدأ المدير.'):null,
      h('h3',{},`المدير يجهّز الجولة ${num(c.r+1)} من ${num(c.total)}…`),
      h('p',{class:'muted'},`${num(QUESTIONS_PER_ROUND)} أسئلة · ${num(st.secs)} ثوانٍ لكل سؤال · ${c.teams?'فريقان':'كل لاعب وحده'}`),
      c.teams?teamsBlock(c,false):peopleList(c.players)));
  }
  if(c.r>0&&!c.local)out.append(h('section',{class:'panel'},h('h3',{},'النتائج حتى الآن'),board(c,c.r-1)));
  return out;
}

// one question at a time, driven by the clock
function renderPlaying(main,c){
  const R=c.R;if(!R)return;
  const ph=phase(R);
  const pk=ph.over?`${c.key}:${c.r}:over`:`${c.key}:${c.r}:${ph.q}:${ph.stage}`;
  if(builtKey===pk)return updateClock(ph);
  // leaving an answer screen: send what the player has right now
  if(answering&&answering!==pk&&$('#order'))finalize(answering);
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
      const list=h('ol',{class:'order',id:'order'});
      const k=qkey(c.r,ph.q);
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
  if(isAdmin()){applyAnswer(myPid,r,q,order);commit();return}
  const me=S.players[myPid];if(me)me.answers[k]=order;
  if(hostConn&&hostConn.open){try{hostConn.send({t:'answer',r,q,order})}catch(e){}}
}

// clock loop: moves between questions; the admin's phone ends the round
function tick(){
  if(mode!=='group'||!S||S.status!=='playing')return;
  const c=ctx();if(!c.R)return;
  renderPlaying($('#main'),c);
  const ph=phase(c.R);
  if(ph.over&&isAdmin()&&!revealFor[c.key+c.r]&&ph.since>(role==='local'?300:2500)){revealFor[c.key+c.r]=true;S.status='reveal';commit()}
}
setInterval(tick,200);

function viewReveal(c){
  const R=c.R;const me=c.me;const last=c.r>=c.total-1;
  const mine=me?roundPts(me,c.r):0;const maxPts=R.questions.reduce((s,Q)=>s+Q.evs.length+3,0);
  const cards=R.questions.map((Q,qi)=>{
    const k=qkey(c.r,qi);const ans=me&&me.answers[k];const corr=correctOrder(Q.evs);const res=ans?scoreOf(Q.evs,ans):null;
    return h('section',{class:'qcard',style:cc(Q.cat)},
      h('div',{class:'status'},h('span',{class:'tag'},`${num(qi+1)} · ${CATS[Q.cat].name}`),
        res?h('span',{class:res.perfect?'ok small':'muted small'},res.perfect?`✓ كامل +${num(res.pts)}`:`${num(res.hits)}/${num(Q.evs.length)} +${num(res.pts)}`):h('span',{class:'no small'},'لم يُرسل')),
      h('ol',{class:'mini'},corr.map((ix,pos)=>h('li',{},h('span',{class:'y'},num(Q.evs[ix].y)),h('span',{class:'tt',text:Q.evs[ix].t}),
        ans?h('span',{class:ans.indexOf(ix)===pos?'ok':'no'},ans.indexOf(ix)===pos?'✓':'✗'):null))));
  });
  return h('div',{class:'stack'},
    h('div',{class:'status'},h('h2',{},c.local?'نتيجتك':`نتائج الجولة ${num(c.r+1)}`)),
    h('section',{class:'panel'},h('div',{class:'row'},h('span',{class:'big'},'+'+num(mine)),h('p',{},`نقاطك في هذه الجولة من أصل ${num(maxPts)}`))),
    c.local?null:h('section',{class:'panel'},h('h3',{},'الترتيب حتى الآن'),board(c,c.r)),
    h('h3',{},'الإجابات الصحيحة (من الأقدم إلى الأحدث)'),
    ...cards,
    isAdmin()?h('button',{class:'btn primary block',onclick:()=>advance(c,last)},c.local?'العب مرة ثانية':(last?'اعرض النتيجة النهائية':'جهّز الجولة التالية')):h('p',{class:'muted'},'ننتظر المدير لتجهيز الجولة التالية…'),
    c.local?back():null);
}
function teamTotals(c){
  const t={A:{pts:0,mem:[]},B:{pts:0,mem:[]}};
  c.players.forEach(p=>{const k=teamOf(p,c.players);t[k].pts+=p.total||0;t[k].mem.push(p)});
  return t;
}
function board(c,r){
  if(c.teams){
    const t=teamTotals(c);const order=['A','B'].sort((a,b)=>t[b].pts-t[a].pts);
    return h('div',{class:'stack'},order.map(k=>{
      const rp=r!=null?t[k].mem.reduce((s,p)=>s+roundPts(p,r),0):null;
      return h('div',{class:'team-score',style:`--tc:${TEAMS[k].v}`},
        h('span',{class:'tn'},TEAMS[k].name,rp?h('span',{class:'plus'},'+'+num(rp)):null),
        h('span',{class:'tp'},num(t[k].pts)),
        h('span',{class:'mem'},t[k].mem.map(p=>`${p.name||'لاعب'} ${num(p.total||0)}`).join(' · ')||'لا أحد'))}));
  }
  const rows=[...c.players].sort((a,b)=>(b.total||0)-(a.total||0));
  return h('table',{class:'sc'},h('tbody',{},rows.map((p,i)=>{const rp=r!=null?roundPts(p,r):0;return h('tr',{},
    h('td',{class:'rk'},num(i+1)),h('td',{class:p.id===myPid?'me':''},(p.name||'لاعب')+(p.id===myPid?' (أنت)':''),rp?h('span',{class:'plus'},'+'+num(rp)):null),
    h('td',{class:'num'},num(p.total||0)+' نقطة'))})));
}
function viewFinal(c){
  let title,sub;
  if(c.teams){const t=teamTotals(c);const w=t.A.pts===t.B.pts?null:(t.A.pts>t.B.pts?'A':'B');title=w?TEAMS[w].name:'تعادل!';sub=w?`${num(t[w].pts)} نقطة`:`${num(t.A.pts)} لكل فريق`}
  else{const top=[...c.players].sort((a,b)=>(b.total||0)-(a.total||0))[0];title=top?top.name:'—';sub=top?`${num(top.total||0)} نقطة`:''}
  return h('div',{class:'stack'},
    h('section',{class:'panel',style:'text-align:center;align-items:center'},
      h('p',{class:'muted'},'الفائز 🏆'),
      h('h2',{style:'font-size:2rem;color:var(--gold)'},title),h('p',{},sub)),
    h('section',{class:'panel'},h('h3',{},'الترتيب النهائي'),board(c,null)),
    isAdmin()?h('button',{class:'btn primary block',onclick:()=>{S=newGameState(true);commit()}},'لعبة جديدة بنفس اللاعبين'):h('p',{class:'muted'},'إذا بدأ المدير لعبة جديدة ستظهر هنا تلقائيًا.'),
    back());
}

function viewFamily(){
  const sorted=[...family].sort((a,b)=>cmp({y:+a.year,m:+a.month||0},{y:+b.year,m:+b.month||0}));
  const monthSel=h('select',{id:'fm'},MONTHS.map((m,i)=>h('option',{value:i},i?m:'— بدون شهر —')));
  return h('div',{class:'stack'},back(),
    h('section',{class:'panel admin',style:cc('family')},
      h('span',{class:'badge'},'للمدير · تُحفظ على هذا الجوال فقط'),
      h('h2',{},'أضف حدثًا عائليًا'),
      h('p',{class:'muted small'},'مثل: زواج جدي، ولادة أول حفيد، الانتقال إلى البيت الجديد. تظهر في فئة «أحداث العائلة» عندما تفتح الغرفة من هذا الجوال، ولا يراها اللاعبون قبل السؤال.'),
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
function saveFamily(){store('family',JSON.stringify(family))}

// ---------- actions ----------
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
  S.rounds[c.r]={questions,startedAt:Date.now()+800,ready:READY_MS,dur:st.secs*1000};
  S.used=[...used];S.teams=teams;S.status='playing';
  commit();
}
function advance(c,last){
  if(role==='local'){const st=S.settings;S=newGameState(false);S.settings=st;commit();return}
  if(last)S.status='done';else{S.status='setup';S.round=c.r+1}
  commit();
}
function addFamily(ev){
  ev.preventDefault();
  const title=$('#ft').value.trim(),year=parseInt($('#fy').value,10),month=+$('#fm').value,note=$('#fn').value.trim();
  if(!title||!(year>=1800&&year<=2100)){toast('اكتب الحدث وسنة صحيحة');return}
  family.push({id:rid(8),title,year,month,note});saveFamily();
  $('#ft').value='';$('#fy').value='';$('#fn').value='';$('#fm').value='0';toast('أُضيف الحدث ✓');render();
}

// scroll to top when the game moves to a new screen
let lastRk='';
const _render=render;
render=function(){const rk=mode+(S?S.gameId+S.status+S.round:'');if(rk!==lastRk){lastRk=rk;_render();scrollTo(0,0)}else _render()};

// ---------- boot ----------
if(urlRoom&&/^\d{5}$/.test(urlRoom)){
  if(load('hostRoom')===urlRoom){mode='home'}   // the admin opened their own link
  else if(nick){clientJoin(urlRoom)}else mode='join';
}
render();
