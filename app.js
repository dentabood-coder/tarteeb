document.documentElement.dir='rtl';document.documentElement.lang='ar';

const SEC_PER_EVENT=6;
const PREFIX='tarteeb-fam-v1-';
const ICE={iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:global.stun.twilio.com:3478'}]};
const CATS={
  arab:{name:'تاريخ العرب',hint:'أبرز أحداث العرب والخليج'},
  islam:{name:'التاريخ الإسلامي',hint:'من الهجرة إلى فتح القسطنطينية'},
  cup:{name:'كأس العالم',hint:'أشهر لحظات كأس العالم'},
  plague:{name:'الأوبئة والأمراض الكبرى',hint:'من الموت الأسود إلى كورونا'},
  family:{name:'أحداث العائلة',hint:'أحداث يضيفها المدير'}
};
// minimum years between events in one round, to keep rounds easy
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

// ---------- state ----------
let role=null;            // 'host' | 'client' | null
let S=null;               // shared game state (host owns it, clients receive copies)
let myPid=null,roomCode=null,peer=null,conns={},hostConn=null,clockOff=0,net='idle',connecting=false;
let family=[];try{family=JSON.parse(load('family')||'[]')}catch(e){family=[]}
let nick=load('nick')||'';
let mode='home';
let solo=null;
let pick={cat:'arab',per:5};
let soloSetup={cat:'arab',rounds:5,per:5};
let drafts={},sortable=null,builtKey=null,sentFor={},revealFor={};
const isAdmin=()=>role==='host';
const urlRoom=new URLSearchParams(location.search).get('room');

function poolFor(cat){
  if(cat==='family')return family.map(f=>({t:f.title,y:+f.year,m:+f.month||0,c:'family',n:f.note||''}));
  return EVENTS[cat].map(([t,y])=>({t,y,m:0,c:cat}));
}
function pickRound(cat,n,used){
  const all=poolFor(cat);let pool=all.filter(e=>!used.has(e.t));if(pool.length<n)pool=all;
  let best=[];
  for(const g of [GAP[cat],Math.floor(GAP[cat]/2),0]){
    for(let t=0;t<40;t++){
      const p=[];
      for(const e of shuffle(pool)){if(p.some(q=>clash(q,e)||Math.abs(q.y-e.y)<g))continue;p.push(e);if(p.length===n)return shuffle(p)}
      if(p.length>best.length)best=p;
    }
  }
  return best.length>=3?shuffle(best):null;
}
function playerList(){if(!S)return[];return Object.entries(S.players).map(([id,p])=>({id,...p})).sort((a,b)=>(a.joinedAt||0)-(b.joinedAt||0))}
function teamOf(p,list){const t=(S&&S.teams||{})[p.id];if(t)return t;const i=list.findIndex(x=>x.id===p.id);return i%2?'B':'A'}

// ---------- context ----------
function ctx(){
  if(mode==='solo'&&solo){
    const me={id:'me',name:nick||'أنت',answers:solo.answers,points:solo.points,total:Object.values(solo.points).reduce((a,b)=>a+b,0)};
    const cur=solo.rounds[solo.round];
    return{kind:'solo',key:'solo'+solo.id,cur,r:solo.round,total:solo.rounds.length,status:solo.status,me,players:[me],teams:false,deadline:solo.startedAt+cur.evs.length*SEC_PER_EVENT*1000,duration:cur.evs.length*SEC_PER_EVENT*1000};
  }
  if(!S)return null;
  const players=playerList();
  return{kind:'group',key:S.gameId,cur:S.rounds[S.round],r:S.round,total:S.totalRounds,status:S.status,me:players.find(p=>p.id===myPid)||null,players,teams:S.mode==='teams',
    deadline:S.startedAt-clockOff+S.duration,duration:S.duration};
}

// ---------- networking: host ----------
function newGameState(keepPlayers){
  const players={};
  if(keepPlayers&&S)for(const[id,p]of Object.entries(S.players))players[id]={name:p.name,joinedAt:p.joinedAt,online:p.online,answers:{},points:{},total:0};
  if(!players.host)players.host={name:nick||'المدير',joinedAt:Date.now(),online:true,answers:{},points:{},total:0};
  return{gameId:rid(8),status:'setup',mode:keepPlayers&&S?S.mode:'solo',totalRounds:keepPlayers&&S?S.totalRounds:5,round:0,rounds:[],used:[],teams:keepPlayers&&S?S.teams:{},startedAt:0,duration:0,players};
}
function hostOpen(resume){
  if(!nick){needNick();return}
  roomCode=load('hostRoom')||genCode();store('hostRoom',roomCode);
  let saved=null;if(resume){try{saved=JSON.parse(load('hostState')||'null')}catch(e){}}
  S=saved||newGameState(false);
  S.players.host.name=nick;
  for(const p of Object.values(S.players))if(p!==S.players.host)p.online=false;
  role='host';myPid='host';mode='group';clockOff=0;
  store('hostState',JSON.stringify(S));
  startPeerHost();keepAwake();render();
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
    if(e.type==='unavailable-id'){net='connecting';render();setTimeout(startPeerHost,4000)}   // room id still held from a previous visit
    else if(['network','server-error','socket-error','socket-closed'].includes(e.type)){net='connecting';render();setTimeout(startPeerHost,4000)}
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
  if(d.t==='answer'&&c.pid){applyAnswer(c.pid,d.r,d.order);commit()}
}
function applyAnswer(pid,r,order){
  const p=S.players[pid];if(!p||S.status!=='playing'||r!==S.round||p.answers[r])return;
  const evs=S.rounds[r].evs;
  if(!Array.isArray(order)||order.length!==evs.length||new Set(order).size!==evs.length||order.some(x=>!(x>=0&&x<evs.length)))return;
  const s=scoreOf(evs,order);p.answers[r]=order;p.points[r]=s.pts;p.total=Object.values(p.points).reduce((a,b)=>a+b,0);
}
function commit(){
  store('hostState',JSON.stringify(S));
  const now=Date.now();
  for(const[pid,c]of Object.entries(conns)){if(c.open){try{c.send({t:'state',S,now,you:pid})}catch(e){}}}
  render();tick();
}
let wakeLock=null;
async function keepAwake(){try{if('wakeLock' in navigator&&document.visibilityState==='visible')wakeLock=await navigator.wakeLock.request('screen')}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if(role==='host'){keepAwake();if(peer&&peer.disconnected&&!peer.destroyed){try{peer.reconnect()}catch(e){}}}if(role==='client'&&(!hostConn||!hostConn.open))connectHost()}});

// ---------- networking: client ----------
function clientJoin(code){
  if(!nick){needNick();return}
  roomCode=code;role='client';mode='group';
  myPid=load('pid_'+code)||rid(10);store('pid_'+code,myPid);
  net='connecting';render();
  if(peer){try{peer.destroy()}catch(e){}}
  peer=new Peer(undefined,{config:ICE,debug:0});
  peer.on('open',()=>connectHost());
  peer.on('error',e=>{
    if(e.type==='peer-unavailable'){net='nohost';connecting=false;render();setTimeout(connectHost,3000)}
    else if(['network','server-error','socket-error','socket-closed'].includes(e.type)){net='lost';connecting=false;render();setTimeout(()=>clientJoin(code),4000)}
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
  c.on('data',d=>{if(d&&d.t==='state'&&d.S){S=d.S;clockOff=d.now-Date.now();render();tick()}});
  c.on('close',()=>{clearTimeout(giveUp);connecting=false;if(hostConn===c){net='lost';render();setTimeout(connectHost,2500)}});
  c.on('error',()=>{});
}

// ---------- render ----------
function render(){
  const main=$('#main');
  if(mode==='group'||mode==='solo'){
    const c=ctx();
    if(mode==='group'&&role==='client'&&!S)return swap(main,viewConnecting());
    if(!c){mode='home';return render()}
    let node;
    if(c.status==='setup')node=viewSetupRound(c);
    else if(c.status==='playing'){renderRound(main,c);return netBanner()}
    else if(c.status==='reveal')node=viewReveal(c);
    else node=viewFinal(c);
    swap(main,node);return netBanner();
  }
  if(mode==='join')return swap(main,viewJoin());
  if(mode==='soloSetup')return swap(main,viewSoloSetup());
  if(mode==='family')return swap(main,viewFamily());
  swap(main,viewHome());netBanner();
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
const back=(label='الرئيسية')=>h('button',{class:'link back',onclick:()=>{mode='home';render()}},'→ '+label);
const seg=(label,val,opts,onpick,fmt=num,disabledFn)=>h('div',{class:'field'},h('span',{class:'lbl'},label),
  h('div',{class:'seg'},opts.map(o=>h('button',{class:'chip','aria-pressed':String(val===o),disabled:disabledFn&&disabledFn(o),onclick:()=>onpick(o)},fmt(o)))));
function catChips(val,onpick,withFamily){
  return h('div',{class:'chips',role:'group','aria-label':'الفئة'},Object.entries(CATS).filter(([k])=>k!=='family'||withFamily).map(([k,v])=>{
    const dis=k==='family'&&family.length<3;
    return h('button',{class:'chip',style:cc(k),'aria-pressed':String(val===k),disabled:dis,onclick:()=>onpick(k)},v.name,h('small',{},dis?'أضف ٣ أحداث على الأقل':v.hint));
  }));
}
function nickField(){
  return h('div',{class:'field'},h('label',{for:'nick'},'اسمك في اللعبة'),
    h('input',{type:'text',id:'nick',maxlength:'24',autocomplete:'nickname',placeholder:'مثلاً: أبو فهد',value:nick,oninput:e=>{nick=e.target.value.trim();store('nick',nick)}}));
}
function needNick(){toast('اكتب اسمك أولًا');const n=$('#nick');if(n)n.focus()}
function roomLink(){return location.origin+location.pathname+'?room='+roomCode}

function viewHome(){
  const wrap=h('div',{class:'stack'});
  wrap.append(h('section',{class:'panel'},nickField()));
  if(role==='host'&&S){
    wrap.append(h('section',{class:'panel admin'},h('h3',{},`غرفتك مفتوحة: ${num(roomCode)}`),h('button',{class:'btn primary block',onclick:()=>{mode='group';render()}},'ارجع إلى الغرفة')));
  }else if(role==='client'&&S){
    wrap.append(h('section',{class:'panel'},h('h3',{},'أنت في غرفة لعب'),h('button',{class:'btn primary block',onclick:()=>{mode='group';render()}},'ارجع إلى اللعبة')));
  }
  if(role!=='host'){
    const codeIn=h('input',{type:'text',id:'code',inputmode:'numeric',maxlength:'5',placeholder:'مثلاً: 48273',autocomplete:'off'});
    wrap.append(h('section',{class:'panel'},
      h('h2',{},'انضم إلى لعبة'),
      h('p',{class:'muted small'},'افتح الرابط الذي أرسله المدير، أو اكتب رمز الغرفة الظاهر على جواله.'),
      h('div',{class:'field'},h('label',{for:'code'},'رمز الغرفة'),codeIn),
      h('button',{class:'btn primary block',onclick:()=>{const v=($('#code').value||'').replace(/[^0-9٠-٩]/g,'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));if(v.length!==5){toast('رمز الغرفة ٥ أرقام');return}clientJoin(v)}},'انضم')));
  }
  const saved=(()=>{try{return JSON.parse(load('hostState')||'null')}catch(e){return null}})();
  wrap.append(h('section',{class:'panel admin'},
    h('span',{class:'badge'},'للمدير'),
    h('p',{class:'small'},'المدير يفتح الغرفة من جواله، ويتحكم في الإعدادات والجولات وأحداث العائلة. يجب أن تبقى الصفحة مفتوحة على جوال المدير أثناء اللعب.'),
    role!=='host'&&saved&&saved.status!=='done'?h('button',{class:'btn primary block',onclick:()=>hostOpen(true)},'تابع غرفتي السابقة'):null,
    role!=='host'?h('button',{class:'btn block'+(saved&&saved.status!=='done'?'':' primary'),onclick:()=>{unstore('hostState');hostOpen(false)}},'افتح غرفة جديدة (أنا المدير)'):null,
    h('button',{class:'btn block',onclick:()=>{mode='family';render()}},`أحداث العائلة (${num(family.length)})`)));
  wrap.append(h('section',{class:'panel'},
    h('h2',{},'كيف نلعب؟'),
    h('p',{},'تظهر لكل لاعب نفس الأحداث على جواله بترتيب عشوائي. اسحبها أو حرّكها بالأسهم حتى يصبح الأقدم في الأعلى والأحدث في الأسفل.'),
    h('p',{class:'muted small'},`لكل حدث ${num(SEC_PER_EVENT)} ثوانٍ، وعند انتهاء الوقت يُرسل ترتيبك تلقائيًا. نقطة لكل حدث في مكانه الصحيح، و٣ نقاط إضافية للترتيب الكامل.`),
    h('button',{class:'btn block',onclick:()=>{mode='soloSetup';render()}},'تدرّب وحدك')));
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
function leave(){role=null;S=null;mode='home';if(peer){try{peer.destroy()}catch(e){}}peer=null;hostConn=null;conns={};connecting=false;net='idle'}

function viewSoloSetup(){
  const s=soloSetup,re=()=>render();
  return h('div',{class:'stack'},back(),h('section',{class:'panel'},
    h('h2',{},'تدرّب وحدك'),
    h('div',{class:'field'},h('span',{class:'lbl'},'الفئة'),catChips(s.cat,k=>{s.cat=k;re()},true)),
    seg('عدد الجولات',s.rounds,[3,5,7],o=>{s.rounds=o;re()}),
    seg('عدد الأحداث في كل جولة',s.per,[4,5,6],o=>{s.per=o;re()}),
    h('button',{class:'btn primary block',onclick:startSolo},'ابدأ')));
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
  const head=h('div',{class:'status'},h('h2',{},c.r===0?'غرفة الانتظار':`قبل الجولة ${num(c.r+1)}`),h('span',{class:'pill'},`${num(c.players.length)} لاعبين`));
  const out=h('div',{class:'stack'},back(),head);
  if(isAdmin()){
    const re=()=>render();
    if(c.r===0)out.append(roomPanel());
    out.append(h('section',{class:'panel admin'},
      h('span',{class:'badge'},'إعدادات المدير'),
      seg('طريقة اللعب',S.mode,['solo','teams'],o=>{S.mode=o;commit()},o=>o==='teams'?'فريقان':'كل لاعب وحده'),
      c.teams?h('div',{class:'stack'},h('p',{class:'muted small'},'اضغط على اسم اللاعب لنقله إلى الفريق الآخر.'),teamsBlock(c,true),
        h('button',{class:'link',onclick:shuffleTeams},'وزّع الفرق عشوائيًا')):peopleList(c.players),
      seg('عدد الجولات',c.total,[3,5,7],o=>{S.totalRounds=o;commit()},num,o=>o<c.r+1),
      h('div',{class:'field'},h('span',{class:'lbl'},`فئة الجولة ${num(c.r+1)}`),catChips(pick.cat,k=>{pick.cat=k;re()},true)),
      seg('عدد الأحداث في الجولة',pick.per,[4,5,6],o=>{pick.per=o;re()}),
      h('p',{class:'muted small'},`الوقت: ${num(pick.per*SEC_PER_EVENT)} ثانية (${num(SEC_PER_EVENT)} ثوانٍ لكل حدث).`),
      h('button',{class:'btn primary block',onclick:()=>startRound(c)},`ابدأ الجولة ${num(c.r+1)} من ${num(c.total)}`)));
    if(c.r>0)out.append(roomPanel());
  }else{
    out.append(h('section',{class:'panel'},
      c.r===0?h('p',{},'أنت في الغرفة ✓ انتظر حتى يبدأ المدير.'):null,
      h('h3',{},`المدير يجهّز الجولة ${num(c.r+1)} من ${num(c.total)}…`),
      h('p',{class:'muted'},c.teams?'اللعب بنظام الفريقين':'كل لاعب يلعب وحده'),
      c.teams?teamsBlock(c,false):peopleList(c.players)));
  }
  if(c.r>0)out.append(h('section',{class:'panel'},h('h3',{},'النتائج حتى الآن'),board(c,c.r-1)));
  return out;
}

function renderRound(main,c){
  const evs=c.cur?c.cur.evs:[];const cat=c.cur?c.cur.cat:'arab';
  const key=c.key+':'+c.r;
  const submitted=c.me&&c.me.answers&&c.me.answers[c.r];
  const buildKey=key+(submitted?':done':'');
  if(builtKey!==buildKey){
    swap(main,h('div',{class:'stack'},
      h('div',{class:'status'},h('h2',{},`الجولة ${num(c.r+1)} من ${num(c.total)}`),h('span',{class:'tag',style:cc(cat)},CATS[cat].name)),
      h('div',{class:'timer',id:'timer'},h('div',{class:'bar'},h('i',{})),h('span',{class:'sec'},'')),
      h('section',{class:'panel'},
        h('div',{class:'ends'},h('span',{},'▲ الأقدم'),h('span',{},'الأحدث ▼')),
        h('ol',{class:'order'+(submitted?' locked':''),id:'order'}),
        submitted?h('p',{class:'ok'},'تم إرسال ترتيبك ✓'):h('button',{class:'btn primary block',id:'submit',onclick:()=>submitRound(c)},'أرسل ترتيبي')),
      h('section',{class:'panel',id:'roundStatus'})));
    builtKey=buildKey;
    const list=$('#order');
    const order=submitted?c.me.answers[c.r]:(drafts[key]||evs.map((_,i)=>i));
    order.forEach(ix=>list.append(eventCard(evs[ix],ix,!submitted,key)));
    if(!submitted&&window.Sortable)sortable=Sortable.create(list,{animation:150,delay:100,delayOnTouchOnly:true,filter:'.mv',preventOnFilter:false,onEnd:()=>saveDraft(key)});
  }
  tick();
  const st=$('#roundStatus');
  if(c.kind==='solo'){st.replaceChildren(h('p',{class:'muted small'},'رتّب ثم اضغط «أرسل ترتيبي» قبل انتهاء الوقت.'));return}
  const n=c.players.filter(p=>p.answers&&p.answers[c.r]).length;
  st.replaceChildren(
    h('div',{class:'status'},h('h3',{},'من أرسل؟'),h('span',{class:'pill'},`${num(n)} من ${num(c.players.length)}`)),
    peopleList(c.players,p=>p.answers&&p.answers[c.r]),
    isAdmin()?h('button',{class:'btn block',onclick:()=>{S.status='reveal';commit()}},'اكشف الترتيب الصحيح الآن'):null);
}
function eventCard(e,ix,movable,key){
  const li=h('li',{'data-ix':ix,style:cc(e.c)},
    h('div',{},h('div',{class:'t',text:e.t}),e.n?h('div',{class:'n',text:e.n}):null),
    h('div',{class:'mvs'},
      h('button',{class:'mv','aria-label':'حرّك للأعلى',disabled:!movable,onclick:ev=>{ev.stopPropagation();const p=li.previousElementSibling;if(p){li.parentNode.insertBefore(li,p);saveDraft(key);li.querySelector('.mv').focus()}}},'▲'),
      h('button',{class:'mv','aria-label':'حرّك للأسفل',disabled:!movable,onclick:ev=>{ev.stopPropagation();const n=li.nextElementSibling;if(n){li.parentNode.insertBefore(n,li);saveDraft(key);li.querySelectorAll('.mv')[1].focus()}}},'▼')));
  return li;
}
const currentOrder=()=>[...$('#order').children].map(li=>+li.dataset.ix);
function saveDraft(key){drafts[key]=currentOrder()}

// timer loop: updates the bar, auto-submits at zero, host reveals when time is up
function tick(){
  if(mode!=='group'&&mode!=='solo')return;
  const c=ctx();if(!c||c.status!=='playing')return;
  const key=c.key+':'+c.r;const dl=c.deadline;
  const dur=c.duration||1;const left=Math.max(0,Math.min(dur,dl-Date.now()));
  const t=$('#timer');
  if(t){t.querySelector('i').style.transform=`scaleX(${left/dur})`;t.querySelector('.sec').textContent=num(Math.ceil(left/1000));t.classList.toggle('low',left<=Math.min(6000,dur*.3))}
  const submitted=c.me&&c.me.answers&&c.me.answers[c.r];
  if(left<=0&&!submitted&&!sentFor[key]&&$('#order')){toast('انتهى الوقت! أُرسل ترتيبك.');submitRound(c)}
  if(c.kind==='group'&&isAdmin()&&!revealFor[key]){
    const active=c.players.filter(p=>p.online!==false||(p.answers&&p.answers[c.r]));
    const all=active.length&&active.every(p=>p.answers&&p.answers[c.r]);
    if(all||Date.now()>dl+2500){revealFor[key]=true;setTimeout(()=>{if(S.status==='playing'&&S.gameId+':'+S.round===key){S.status='reveal';commit()}},all?800:0)}
  }
}
setInterval(tick,250);

function viewReveal(c){
  const evs=c.cur?c.cur.evs:[];const cat=c.cur?c.cur.cat:'arab';const corr=correctOrder(evs);
  const mine=c.me&&c.me.answers&&c.me.answers[c.r];
  const res=mine?scoreOf(evs,mine):null;
  const tl=h('ol',{class:'tl'},corr.map((ix,pos)=>{const e=evs[ix];const myPos=mine?mine.indexOf(ix):-1;
    return h('li',{style:cc(e.c)},h('div',{class:'yr'},fmtDate(e)),
      h('div',{class:'body'},h('strong',{text:e.t}),
        mine?(myPos===pos?h('span',{class:'ok small'},'✓ في مكانه الصحيح'):h('span',{class:'no small'},`✗ وضعته في المركز ${num(myPos+1)}، مكانه ${num(pos+1)}`)):null))}));
  const last=c.r>=c.total-1;
  return h('div',{class:'stack'},
    h('div',{class:'status'},h('h2',{},`الترتيب الصحيح للجولة ${num(c.r+1)}`),h('span',{class:'tag',style:cc(cat)},CATS[cat].name)),
    res?h('section',{class:'panel'},h('div',{class:'row'},h('span',{class:'big'},'+'+num(res.pts)),
      h('p',{},res.perfect?'ترتيب كامل! حصلت على ٣ نقاط إضافية.':`${num(res.hits)} من ${num(evs.length)} أحداث في مكانها الصحيح.`))):h('p',{class:'muted'},'لم تُرسل ترتيبًا في هذه الجولة.'),
    tl,
    c.kind==='group'?h('section',{class:'panel'},h('h3',{},'النتائج حتى الآن'),board(c,c.r)):null,
    (c.kind==='solo'||isAdmin())?h('button',{class:'btn primary block',onclick:()=>advance(c,last)},last?'اعرض النتيجة النهائية':(c.kind==='solo'?'الجولة التالية':'جهّز الجولة التالية')):h('p',{class:'muted'},'ننتظر المدير لتجهيز الجولة التالية…'));
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
      const rp=r!=null?t[k].mem.reduce((s,p)=>s+((p.points||{})[r]||0),0):null;
      return h('div',{class:'team-score',style:`--tc:${TEAMS[k].v}`},
        h('span',{class:'tn'},TEAMS[k].name,rp?h('span',{class:'plus'},'+'+num(rp)):null),
        h('span',{class:'tp'},num(t[k].pts)),
        h('span',{class:'mem'},t[k].mem.map(p=>`${p.name||'لاعب'} ${num(p.total||0)}`).join(' · ')||'لا أحد'))}));
  }
  const rows=[...c.players].sort((a,b)=>(b.total||0)-(a.total||0));
  return h('table',{class:'sc'},h('tbody',{},rows.map((p,i)=>h('tr',{},
    h('td',{class:'rk'},num(i+1)),h('td',{class:p.id===myPid?'me':''},(p.name||'لاعب')+(p.id===myPid?' (أنت)':''),r!=null&&p.points&&p.points[r]!=null?h('span',{class:'plus'},'+'+num(p.points[r])):null),
    h('td',{class:'num'},num(p.total||0)+' نقطة')))));
}
function viewFinal(c){
  let title,sub;
  if(c.kind==='solo'){title=`${num(c.players[0].total)} نقطة`;sub='جرّب فئة أخرى أو العب مرة ثانية.'}
  else if(c.teams){const t=teamTotals(c);const w=t.A.pts===t.B.pts?null:(t.A.pts>t.B.pts?'A':'B');title=w?TEAMS[w].name:'تعادل!';sub=w?`${num(t[w].pts)} نقطة`:`${num(t.A.pts)} لكل فريق`}
  else{const top=[...c.players].sort((a,b)=>(b.total||0)-(a.total||0))[0];title=top?top.name:'—';sub=top?`${num(top.total||0)} نقطة`:''}
  return h('div',{class:'stack'},
    h('section',{class:'panel',style:'text-align:center;align-items:center'},
      h('p',{class:'muted'},c.kind==='solo'?'نتيجتك':'الفائز 🏆'),
      h('h2',{style:'font-size:2rem;color:var(--gold)'},title),h('p',{},sub)),
    c.kind==='group'?h('section',{class:'panel'},h('h3',{},'الترتيب النهائي'),board(c,null)):null,
    c.kind==='solo'?h('button',{class:'btn primary block',onclick:()=>{mode='soloSetup';render()}},'العب مرة ثانية'):
      (isAdmin()?h('button',{class:'btn primary block',onclick:()=>{S=newGameState(true);commit()}},'لعبة جديدة بنفس اللاعبين'):h('p',{class:'muted'},'إذا بدأ المدير لعبة جديدة ستظهر هنا تلقائيًا.')),
    back());
}

function viewFamily(){
  const sorted=[...family].sort((a,b)=>cmp({y:+a.year,m:+a.month||0},{y:+b.year,m:+b.month||0}));
  const monthSel=h('select',{id:'fm'},MONTHS.map((m,i)=>h('option',{value:i},i?m:'— بدون شهر —')));
  return h('div',{class:'stack'},back(),
    h('section',{class:'panel admin',style:cc('family')},
      h('span',{class:'badge'},'للمدير · تُحفظ على هذا الجوال فقط'),
      h('h2',{},'أضف حدثًا عائليًا'),
      h('p',{class:'muted small'},'مثل: زواج جدي، ولادة أول حفيد، الانتقال إلى البيت الجديد. تظهر في فئة «أحداث العائلة» عندما تفتح الغرفة من هذا الجوال، ولا يراها اللاعبون قبل الجولة.'),
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
  const used=new Set(S.used||[]);
  const evs=pickRound(pick.cat,pick.per,used);
  if(!evs){toast('لا توجد أحداث كافية في هذه الفئة');return}
  evs.forEach(e=>used.add(e.t));
  const list=playerList();const teams={...(S.teams||{})};list.forEach(p=>{teams[p.id]=teamOf(p,list)});
  S.rounds[c.r]={cat:pick.cat,evs};S.used=[...used];S.teams=teams;S.status='playing';S.startedAt=Date.now();S.duration=evs.length*SEC_PER_EVENT*1000;
  commit();
}
function submitRound(c){
  const key=c.key+':'+c.r;if(sentFor[key])return;sentFor[key]=true;
  const order=currentOrder();
  if(c.kind==='solo'){const s=scoreOf(c.cur.evs,order);solo.answers[c.r]=order;solo.points[c.r]=s.pts;solo.status='reveal';render();return}
  if(role==='host'){applyAnswer('host',c.r,order);commit();return}
  if(hostConn&&hostConn.open){
    hostConn.send({t:'answer',r:c.r,order});
    const me=S.players[myPid];if(me){me.answers={...(me.answers||{}),[c.r]:order}}   // show as sent until the host confirms
    render();
  }else{sentFor[key]=false;toast('لا يوجد اتصال بجوال المدير، حاول مرة أخرى.')}
}
function advance(c,last){
  if(c.kind==='solo'){if(last)solo.status='done';else{solo.round++;solo.status='playing';solo.startedAt=Date.now()}render();scrollTo(0,0);return}
  if(last)S.status='done';else{S.status='setup';S.round=c.r+1}
  commit();
}
function startSolo(){
  const used=new Set();const rounds=[];
  for(let i=0;i<soloSetup.rounds;i++){const evs=pickRound(soloSetup.cat,soloSetup.per,used);if(!evs)break;evs.forEach(e=>used.add(e.t));rounds.push({cat:soloSetup.cat,evs})}
  if(!rounds.length){toast('لا توجد أحداث كافية في هذه الفئة');return}
  solo={id:Date.now(),rounds,round:0,status:'playing',answers:{},points:{},startedAt:Date.now()};mode='solo';render();
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
render=function(){const rk=mode+(S?S.gameId+S.status+S.round:'')+(solo?solo.round+solo.status:'');if(rk!==lastRk){lastRk=rk;_render();scrollTo(0,0)}else _render()};

// ---------- boot ----------
if(urlRoom&&/^\d{5}$/.test(urlRoom)){
  if(load('hostRoom')===urlRoom){mode='home'}   // the admin opened their own link
  else if(nick){clientJoin(urlRoom)}else mode='join';
}
render();
