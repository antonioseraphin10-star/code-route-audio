/* Anti-clickjacking : GitHub Pages ne permet pas d'en-tête X-Frame-Options,
   ce frame-buster casse l'affichage si la page est chargée dans une iframe. */
if(window.top!==window.self){try{window.top.location=window.self.location;}catch(e){}}

/* ============================ Utils ============================ */
const $ = (s,r=document)=>r.querySelector(s);
const el = (t,c,h)=>{const e=document.createElement(t); if(c)e.className=c; if(h!=null)e.textContent=h; return e;};
const esc = s => (s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const THEME_COLORS=["#2563eb","#0891b2","#7c3aed","#db2777","#16a34a","#ea580c","#0d9488","#dc2626","#9333ea","#475569"];
const THEME_ICONS=["🧑‍✈️","🚸","🛣️","🚲","🌿","🅿️","🔧","⛑️","🛡️","📋"];
const shuffle = a => {let x=a.slice();for(let i=x.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* Les bonnes réponses du corpus sont à 66 % en A : on mélange l'ordre des choix
   à chaque série pour qu'on ne puisse pas deviner « A » par réflexe.
   item.shown = choix tels qu'affichés (lettres A, B, C… dans l'ordre) + bonne lettre affichée. */
const withShuffledChoices=item=>{
  const keys=Object.keys(item.q.choices).sort(), order=shuffle(keys), choices={};
  order.forEach((k,i)=>{choices[keys[i]]=item.q.choices[k];});
  return {...item,shown:{choices,answer:keys[order.indexOf(item.q.answer)]}};
};
const DATA = window.CODE_DATA;
const IS_IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && "ontouchend" in document);

function fmtDay(dt){return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");}
function todayStr(){return fmtDay(new Date());}
function addDays(ds,n){const p=ds.split("-").map(Number);const dt=new Date(p[0],p[1]-1,p[2]);dt.setDate(dt.getDate()+n);return fmtDay(dt);}

function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),2200);}

/* ============================ Persistence ============================ */
const emptyStats=()=>({version:2,totalAnswered:0,totalCorrect:0,themes:{},subs:{},questions:{},sessions:[],days:{}});
const isObj=v=>v&&typeof v==="object"&&!Array.isArray(v);
const safeJson=(raw,fallback={})=>{try{return raw?JSON.parse(raw):fallback;}catch(e){return fallback;}};
const safeInt=(v,max=1000000)=>{const n=Number(v);return Number.isFinite(n)&&n>=0?Math.min(Math.floor(n),max):0;};
const safeNum=(v,min,max,d)=>{const n=Number(v);return Number.isFinite(n)?clamp(n,min,max):d;};
const safeStr=(v,max=180)=>typeof v==="string"?v.slice(0,max).replace(/[<>&"]/g,""):"";
const safeTime=v=>{const n=Number(v);return Number.isFinite(n)&&n>0&&n<4102444800000?Math.floor(n):Date.now();};
const safeDateKey=k=>/^\d{4}-\d{2}-\d{2}$/.test(k);
const normalizeCounters=obj=>{
  const out=Object.create(null);
  if(!isObj(obj))return out;
  Object.keys(obj).slice(0,1000).forEach(k=>{
    const row=obj[k]; if(!isObj(row))return;
    const a=safeInt(row.a), c=Math.min(safeInt(row.c),a);
    if(a||c)out[safeStr(k,40)]={a,c};
  });
  return out;
};
function normalizeSettings(raw){
  const src=isObj(raw)?raw:{}, out={};
  if(typeof src.voiceURI==="string")out.voiceURI=safeStr(src.voiceURI,500);
  if(["natural","offline","manual"].includes(src.voiceMode))out.voiceMode=src.voiceMode;
  if(src.rate!==undefined)out.rate=safeNum(src.rate,.5,2,.94);
  if(typeof src.naturalPauses==="boolean")out.naturalPauses=src.naturalPauses;
  if(src.speechVersion!==undefined)out.speechVersion=safeInt(src.speechVersion,20);
  if(typeof src.autoread==="boolean")out.autoread=src.autoread;
  return out;
}
function normalizeStats(raw){
  const src=isObj(raw)?raw:{}, st=emptyStats();
  st.totalAnswered=safeInt(src.totalAnswered);
  st.totalCorrect=Math.min(safeInt(src.totalCorrect),st.totalAnswered);
  st.themes=normalizeCounters(src.themes);
  st.days={};
  if(isObj(src.days))Object.keys(src.days).slice(0,730).forEach(k=>{
    if(!safeDateKey(k))return;
    const row=src.days[k]; if(!isObj(row))return;
    const a=safeInt(row.a), c=Math.min(safeInt(row.c),a);
    if(a||c)st.days[k]={a,c};
  });
  st.questions=Object.create(null);
  if(isObj(src.questions))Object.keys(src.questions).slice(0,5000).forEach(k=>{
    const row=src.questions[k]; if(!isObj(row))return;
    const s=safeInt(row.s), c=Math.min(safeInt(row.c),s), l=safeTime(row.l);
    if(s||c)st.questions[safeStr(k,40)]={s,c,l};
  });
  st.subs=Object.create(null);
  if(isObj(src.subs))Object.keys(src.subs).slice(0,1000).forEach(k=>{
    const row=src.subs[k]; if(!isObj(row))return;
    st.subs[safeStr(k,80)]={best:safeNum(row.best,0,1,0),total:safeInt(row.total,500),when:safeTime(row.when)};
  });
  st.sessions=Array.isArray(src.sessions)?src.sessions.slice(-300).map(s=>{
    const n=safeInt(isObj(s)?s.n:0,500), c=Math.min(safeInt(isObj(s)?s.c:0,500),n);
    return {t:safeTime(isObj(s)?s.t:null),title:safeStr(isObj(s)?s.title:"",140),c,n,tnum:isObj(s)&&s.tnum!=null?safeInt(s.tnum,99):null};
  }).filter(s=>s.n>0):[];
  return st;
}
/* localStorage peut être bloqué (navigation privée, cookies refusés) ou plein :
   l'app doit continuer à marcher, simplement sans mémoriser la progression. */
const storageGet=k=>{try{return localStorage.getItem(k);}catch(e){return null;}};
const storageSet=(k,v)=>{
  try{localStorage.setItem(k,v);return true;}
  catch(e){if(!storageSet._warned){storageSet._warned=true;setTimeout(()=>toast("Progression non enregistrée : stockage du navigateur indisponible."),0);}return false;}
};
const Store = {
  s:normalizeSettings(safeJson(storageGet("cdlr_settings"),{})),
  st:null,
  init(){
    this.st=normalizeStats(safeJson(storageGet("cdlr_stats"),{}));
    this.saveSt();
    this.saveS();
  },
  saveS(){storageSet("cdlr_settings",JSON.stringify(this.s));},
  saveSt(){storageSet("cdlr_stats",JSON.stringify(this.st));},
  get(k,d){return this.s[k]===undefined?d:this.s[k];},
  set(k,v){this.s[k]=v;this.saveS();},

  logAnswer(item,correct){
    const st=this.st, tnum=item.tnum, qid=item.q.id, day=todayStr();
    st.totalAnswered++; if(correct)st.totalCorrect++;
    (st.themes[tnum]=st.themes[tnum]||{a:0,c:0}); st.themes[tnum].a++; if(correct)st.themes[tnum].c++;
    (st.questions[qid]=st.questions[qid]||{s:0,c:0}); st.questions[qid].s++; if(correct)st.questions[qid].c++; st.questions[qid].l=Date.now();
    (st.days[day]=st.days[day]||{a:0,c:0}); st.days[day].a++; if(correct)st.days[day].c++;
    this.saveSt();
  },
  logSession(meta,correct,total){
    this.st.sessions.push({t:Date.now(),title:meta.title,c:correct,n:total,tnum:meta.themeNum||null});
    if(this.st.sessions.length>300)this.st.sessions=this.st.sessions.slice(-300);
    this.saveSt();
  },
  recordSub(key,correct,total){
    const cur=this.st.subs[key];
    if(!cur||cur.best<correct/total)this.st.subs[key]={best:correct/total,total,when:Date.now()};
    this.saveSt();
  },
  bestSub(key){return this.st.subs[key]?this.st.subs[key].best:null;},

  streak(){
    const set=new Set(Object.keys(this.st.days));
    if(!set.size)return {current:0,best:0};
    let best=0;
    for(const d of set){
      if(!set.has(addDays(d,-1))){let run=0,c=d;while(set.has(c)){run++;c=addDays(c,1);}best=Math.max(best,run);}
    }
    let current=0,c=todayStr();
    if(!set.has(c))c=addDays(c,-1);
    while(set.has(c)){current++;c=addDays(c,-1);}
    return {current,best};
  },
  reset(){
    this.st=emptyStats();
    this.saveSt();
  },
  exportData(){return JSON.stringify({app:"cdlr",version:2,exportedAt:new Date().toISOString(),settings:this.s,stats:this.st},null,1);},
  importData(obj){
    if(!obj||obj.app!=="cdlr"||!isObj(obj.stats))throw new Error("Fichier non reconnu");
    this.st=normalizeStats(obj.stats); this.saveSt();
    if(obj.settings){this.s=normalizeSettings(obj.settings); this.saveS();}
  }
};

/* ============================ Text-to-Speech ============================ */
function splitSentences(t){
  const m=(t||"").match(/[^.!?]+[.!?]*\s*/g);
  return m?m.map(s=>s.trim()).filter(Boolean):((t&&t.trim())?[t.trim()]:[]);
}
const TTS_CORE=window.CODE_TTS_CORE;
const TTS = {
  voices:[],voice:null,rate:.94,mode:"natural",naturalPauses:true,speaking:false,
  _pauseTimer:null,_voiceTimer:null,_runId:0,_unlocked:false,
  supported:("speechSynthesis" in window)&&!!TTS_CORE,
  init(){
    if(!this.supported)return;
    // Migration unique : l'ancien réglage 1.0 et la voix mémorisée pouvaient
    // conserver une voix système robotisée malgré l'arrivée de voix naturelles.
    if(Store.get("speechVersion",0)<2){
      if(Math.abs(Store.get("rate",1)-1)<.001)Store.s.rate=.94;
      Store.s.voiceMode="natural";
      Store.s.naturalPauses=true;
      Store.s.speechVersion=2;
      Store.saveS();
    }
    this.rate=Store.get("rate",.94);
    this.mode=Store.get("voiceMode","natural");
    this.naturalPauses=Store.get("naturalPauses",true);
    const load=()=>{
      const all=speechSynthesis.getVoices();
      this.voices=TTS_CORE.sortVoices(all,"natural");
      this.pick(Store.get("voiceURI",""),this.mode);
      App.fillVoices&&App.fillVoices();
    };
    load();
    speechSynthesis.onvoiceschanged=load;
  },
  unlock(){
    if(this._unlocked||!this.supported)return;
    this._unlocked=true;
    try{const utterance=new SpeechSynthesisUtterance(" ");utterance.volume=0;utterance.rate=2;speechSynthesis.speak(utterance);}catch(e){}
    if(!this.voices.length){
      this._voiceTimer=setTimeout(()=>{
        this.voices=TTS_CORE.sortVoices(speechSynthesis.getVoices(),"natural");
        this.pick(Store.get("voiceURI",""),this.mode);
        App.fillVoices&&App.fillVoices();
        this._voiceTimer=null;
      },180);
    }
  },
  scoreVoice(voice,mode){return TTS_CORE.scoreVoice(voice,mode||this.mode);},
  pick(uri,mode){
    this.mode=["natural","offline","manual"].includes(mode)?mode:"natural";
    this.voice=TTS_CORE.selectVoice(this.voices,{mode:this.mode,voiceURI:uri||""});
    return this.voice;
  },
  clean(text){return TTS_CORE.normalizeSpeech(String(text||"").replace(/\s*\*\s*/g," "));},
  cancel(){
    this._runId++;
    this.speaking=false;
    if(this._pauseTimer){clearTimeout(this._pauseTimer);this._pauseTimer=null;}
    if(this.supported){try{speechSynthesis.cancel();}catch(e){}}
  },
  speakChunks(chunks,opts){
    opts=opts||{};
    this.cancel();
    if(!this.supported){opts.onend&&opts.onend();return;}
    if(!this.voice){
      this.voices=TTS_CORE.sortVoices(speechSynthesis.getVoices(),"natural");
      this.pick(Store.get("voiceURI",""),this.mode);
    }
    if(!this.voice){
      toast("Aucune voix française compatible. Ouvre les réglages de la voix.");
      opts.onend&&opts.onend();return;
    }
    const items=(chunks||[]).flatMap(chunk=>{
      const source=typeof chunk==="string"?{text:chunk}:chunk||{};
      const parts=TTS_CORE.segmentSpeech(this.clean(source.text),240);
      return parts.map((text,index)=>({
        text,
        rateFactor:safeNum(source.rateFactor,.75,1.25,1),
        pauseAfter:index===parts.length-1?safeNum(source.pauseAfter,0,1200,120):70
      }));
    });
    if(!items.length){opts.onend&&opts.onend();return;}
    this.speaking=true;
    const runId=this._runId;
    let idx=0;
    const total=items.length,self=this;
    const finish=()=>{
      if(runId!==self._runId)return;
      self.speaking=false;
      self._pauseTimer=null;
      opts.onend&&opts.onend();
    };
    const next=()=>{
      if(runId!==self._runId||!self.speaking)return;
      if(idx>=total){finish();return;}
      const item=items[idx],utterance=new SpeechSynthesisUtterance(item.text);
      if(self.voice)utterance.voice=self.voice;
      utterance.lang=(self.voice&&self.voice.lang)||"fr-FR";
      utterance.rate=clamp(self.rate*item.rateFactor,.5,2);
      utterance.pitch=1;
      const advance=()=>{
        if(runId!==self._runId)return;
        idx++;
        opts.onprogress&&opts.onprogress(idx,total);
        const wait=self.naturalPauses?item.pauseAfter:0;
        if(wait){self._pauseTimer=setTimeout(next,wait);}else next();
      };
      utterance.onend=advance;
      utterance.onerror=event=>{
        if(runId!==self._runId)return;
        if(!item.retried&&self.mode==="natural"&&self.voice&&!self.voice.localService&&/network|voice-unavailable|synthesis-failed/.test(event.error||"")){
          const local=TTS_CORE.selectVoice(self.voices,{mode:"offline"});
          if(local){
            item.retried=true;self.voice=local;App.updateVoiceInfo&&App.updateVoiceInfo();
            toast("Voix distante indisponible : passage à une voix locale.");
            next();return;
          }
        }
        advance();
      };
      try{speechSynthesis.speak(utterance);}catch(e){advance();}
    };
    const start=()=>{
      if(runId!==self._runId)return;
      try{speechSynthesis.resume();}catch(e){}
      next();
    };
    if(IS_IOS)this._pauseTimer=setTimeout(start,90);else start();
  },
  speak(text,opts){this.speakChunks([{text,pauseAfter:0}],opts);},
  pauseToggle(){if(!this.supported)return;if(speechSynthesis.paused)speechSynthesis.resume();else if(speechSynthesis.speaking)speechSynthesis.pause();},
  test(){
    this._unlocked=true;
    this.speakChunks(TTS_CORE.quizSequence({
      text:"À l’approche de cette zone, la vitesse est limitée à 50 km/h. Que faites-vous ?",
      choices:{A:"Je ralentis progressivement.",B:"J’accélère jusqu’au panneau."}
    },["A","B"]));
  }
};

/* ============================ App ============================ */
const App = {
  view:"home", ctx:{}, quiz:null,
  start(){
    Store.init();
    TTS.init();
    this.bindSettings();
    this.go("home");
  },
  go(view,ctx){
    ctx=ctx||{};
    TTS.cancel();
    this.view=view; this.ctx=ctx;
    window.scrollTo(0,0);
    ({home:this.renderHome,theme:this.renderTheme,course:this.renderCourse,quiz:this.renderQuiz,results:this.renderResults,stats:this.renderStats,ecfList:this.renderEcfList,ecfCard:this.renderEcfCard}[view]).call(this,ctx);
  },
  subKey(tnum,sid){return "t"+tnum+"_"+sid;},

  /* ---------- HOME ---------- */
  renderHome(){
    const app=$("#app");
    const totalSub=DATA.themes.reduce((a,t)=>a+t.subthemes.length,0);
    const st=Store.st, acc=st.totalAnswered?Math.round(st.totalCorrect/st.totalAnswered*100):null;
    let cards="";
    DATA.themes.forEach((t,i)=>{
      const nq=t.subthemes.reduce((a,s)=>a+s.questions.length,0);
      let sum=0;
      t.subthemes.forEach(s=>{const b=Store.bestSub(App.subKey(t.num,s.id));if(b!=null)sum+=b;});
      const prog=t.subthemes.length?Math.round(sum/t.subthemes.length*100):0;
      cards+=`<div class="theme-card" onclick="App.go('theme',{ti:${i}})">
        <div class="tnum" style="background:${THEME_COLORS[i]}">${THEME_ICONS[i]}</div>
        <div style="flex:1;min-width:0">
          <h3>${esc(t.title)}</h3>
          <div class="sub">${t.subthemes.length} sous-thème${t.subthemes.length>1?"s":""} · ${nq} questions</div>
          <div class="prog"><i style="width:${prog}%"></i></div>
        </div>
      </div>`;
    });
    app.innerHTML=`
      <div class="hero">
        <h1>🚗 Réviser le Code de la Route</h1>
        <p>Édition 2026 · Permis B · les questions sont lues à voix haute</p>
        <div class="stats-row">
          <span class="pill"><b>${DATA.totalQuestions}</b> questions</span>
          <span class="pill"><b>${DATA.themes.length}</b> thématiques</span>
          ${acc!=null?`<span class="pill click" onclick="App.go('stats')">🎯 <b>${acc}%</b> de réussite</span>`:`<span class="pill"><b>${totalSub}</b> leçons</span>`}
        </div>
      </div>
      <div class="panel ecf-banner" onclick="App.go('ecfList')">
        <div class="ecf-ic">🧑‍⚖️</div>
        <div style="min-width:0"><b>Les 100 questions de l'examinateur</b><span>Vérifications, sécurité &amp; premiers secours — l'oral du jour J</span></div>
        <div class="ecf-go">→</div>
      </div>
      <div class="sec-title">📚 Choisis une thématique</div>
      <div class="grid">${cards}</div>
      <div class="panel" style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-green" style="flex:2;min-width:220px" onclick="App.startQuiz(App.allQuestions(),{title:'Quiz surprise — tout le code',key:null,themeNum:null})">
          🎲 Quiz surprise — 40 questions
        </button>
        <button class="btn btn-ghost" style="flex:1;min-width:150px" onclick="App.go('stats')">📊 Ma progression</button>
      </div>`;
    if(!TTS.supported){
      app.insertAdjacentHTML("afterbegin",`<div class="panel" style="background:var(--amber-bg);color:#92400e">⚠️ La synthèse vocale n'est pas disponible dans ce navigateur. L'app fonctionne, mais sans lecture audio. Essaie Chrome, Edge ou Safari.</div>`);
    }
  },
  allQuestions(){
    let all=[];
    DATA.themes.forEach(t=>t.subthemes.forEach(s=>s.questions.forEach(q=>{
      all.push({q,tnum:t.num,ttitle:t.title,sid:s.id,stitle:s.title});
    })));
    return shuffle(all).slice(0,40);
  },

  /* ---------- THEME ---------- */
  renderTheme(c){
    const ti=c.ti, t=DATA.themes[ti], app=$("#app");
    const nq=t.subthemes.reduce((a,s)=>a+s.questions.length,0);
    let rows="";
    t.subthemes.forEach((s,si)=>{
      const b=Store.bestSub(App.subKey(t.num,s.id));
      const badge=b!=null?`<span style="color:${b>=.8?'var(--green)':'var(--amber)'};font-weight:700"> · ★ ${Math.round(b*100)}%</span>`:"";
      rows+=`<div class="subrow">
        <div class="sid">${esc(s.id)}</div>
        <div class="meta"><b>${esc(s.title)}</b><span>${s.questions.length} question${s.questions.length>1?"s":""}${badge}</span></div>
        <div class="acts">
          <button class="btn btn-ghost mini" onclick="App.go('course',{ti:${ti},si:${si}})">📖 Cours</button>
          <button class="btn btn-primary mini" onclick="App.startSubQuiz(${ti},${si})">🎯 Quiz</button>
        </div>
      </div>`;
    });
    app.innerHTML=`
      <div class="crumb"><a onclick="App.go('home')">Accueil</a> › <span>${esc(t.title)}</span></div>
      <div class="sec-title"><span style="font-size:24px">${THEME_ICONS[ti]}</span> ${esc(t.title)}</div>
      <div class="panel" style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-green" style="flex:1;min-width:200px" onclick="App.startThemeQuiz(${ti})">🎯 Réviser tout le thème (${nq} questions)</button>
        <button class="btn btn-ghost" style="flex:1;min-width:160px" onclick="App.startThemeQuiz(${ti},true)">🔀 En mode aléatoire</button>
      </div>
      <div class="panel">${rows}</div>`;
  },
  startSubQuiz(ti,si){
    const t=DATA.themes[ti], s=t.subthemes[si];
    const list=s.questions.map(q=>({q,tnum:t.num,ttitle:t.title,sid:s.id,stitle:s.title}));
    this.startQuiz(list,{title:t.title+" · "+s.id+" "+s.title,key:App.subKey(t.num,s.id),themeNum:t.num,back:{view:'theme',ctx:{ti}}});
  },
  startThemeQuiz(ti,rand){
    const t=DATA.themes[ti]; let list=[];
    t.subthemes.forEach(s=>s.questions.forEach(q=>list.push({q,tnum:t.num,ttitle:t.title,sid:s.id,stitle:s.title})));
    if(rand)list=shuffle(list);
    this.startQuiz(list,{title:t.title+" — tout le thème",key:null,themeNum:t.num,back:{view:'theme',ctx:{ti}}});
  },

  /* ---------- COURSE ---------- */
  renderCourse(c){
    const ti=c.ti, si=c.si, t=DATA.themes[ti], s=t.subthemes[si], app=$("#app");
    let html="", i=0, b=s.course;
    while(i<b.length){
      if(b[i].t==="li"){html+="<ul>";while(i<b.length&&b[i].t==="li"){html+=`<li>${esc(b[i].s)}</li>`;i++;}html+="</ul>";}
      else if(b[i].t==="h"){html+=`<h3>${esc(b[i].s)}</h3>`;i++;}
      else{html+=`<p>${esc(b[i].s)}</p>`;i++;}
    }
    const guides=(window.CODE_VISUALS&&typeof CODE_VISUALS.lesson==="function")?CODE_VISUALS.lesson(s.id):[];
    const guideHtml=guides.map(guide=>`<article class="lesson-diagram">
      <div class="lesson-diagram-head">
        <span class="lesson-diagram-kicker">${esc(guide.kicker)}</span>
        <h3>${esc(guide.title)}</h3>
        <p>${esc(guide.caption)}</p>
      </div>
      <div class="lesson-diagram-visual">${guide.svg}</div>
    </article>`).join("");
    app.innerHTML=`
      <div class="crumb"><a onclick="App.go('home')">Accueil</a> › <a onclick="App.go('theme',{ti:${ti}})">${esc(t.title)}</a> › <span>Cours ${esc(s.id)}</span></div>
      <div class="sec-title" style="font-size:18px">📖 ${esc(s.id)} — ${esc(s.title)}</div>
      <div class="reader">
        <button class="rbtn" id="rPlay" title="Lire / Pause">▶️</button>
        <button class="rbtn" id="rStop" title="Arrêter" style="background:#334155;color:#fff">⏹️</button>
        <div class="rinfo" id="rInfo">Écouter la leçon</div>
        <div class="rbar"><i id="rBar"></i></div>
      </div>
      ${guideHtml?`<div class="lesson-visuals">${guideHtml}</div>`:""}
      <div class="panel course">${html||"<p>Pas de contenu de cours pour cette leçon.</p>"}</div>
      <button class="btn btn-primary btn-lg" onclick="App.startSubQuiz(${ti},${si})">🎯 Passer au quiz de cette leçon</button>`;
    const chunks=[];
    guides.forEach(guide=>splitSentences(`${guide.title}. ${guide.caption}`).forEach(p=>chunks.push(p)));
    s.course.forEach(blk=>splitSentences(blk.s).forEach(p=>chunks.push(p)));
    let playing=false;
    const info=$("#rInfo"),bar=$("#rBar"),play=$("#rPlay");
    const startRead=()=>{
      playing=true;play.textContent="⏸️";info.textContent="Lecture en cours…";
      TTS.speakChunks(chunks,{
        onprogress:(d,tot)=>{bar.style.width=Math.round(d/tot*100)+"%";},
        onend:()=>{playing=false;play.textContent="▶️";info.textContent="Lecture terminée ✓";bar.style.width="100%";}
      });
    };
    play.onclick=()=>{
      if(!playing){
        if(TTS.supported&&speechSynthesis.paused){speechSynthesis.resume();play.textContent="⏸️";playing=true;return;}
        startRead();
      }else{TTS.pauseToggle();playing=false;play.textContent="▶️";info.textContent="En pause";}
    };
    $("#rStop").onclick=()=>{TTS.cancel();playing=false;play.textContent="▶️";info.textContent="Écouter la leçon";bar.style.width="0";};
  },

  /* ---------- QUIZ ---------- */
  startQuiz(list,meta){
    if(!list||!list.length){toast("Aucune question disponible.");return;}
    this.quiz={list:list.map(withShuffledChoices),meta,i:0,correct:0,answered:false,missed:[]};
    this.go("quiz");
  },
  renderQuiz(){
    const Q=this.quiz, app=$("#app");
    const item=Q.list[Q.i], q=item.q, shown=item.shown, letters=Object.keys(shown.choices);
    let ch="";
    letters.forEach(L=>{ch+=`<button class="choice" data-l="${L}" onclick="App.answer('${L}')">
        <span class="key">${L}</span><span class="ctxt">${esc(shown.choices[L])}</span><span class="mark"></span></button>`;});
    const pct=Math.round(Q.i/Q.list.length*100);
    const vis=(window.CODE_IMAGES&&window.CODE_VISUALS)?window.CODE_IMAGES[q.id]:null;
    const visHtml=vis?`<div class="qvisual">${CODE_VISUALS.render(vis)}</div>`:"";
    app.innerHTML=`
      <div class="crumb"><a onclick="App.quitQuiz()">✕ Quitter</a> › <span>${esc(Q.meta.title)}</span></div>
      <div class="qhead">
        <span class="qcount">Question ${Q.i+1} / ${Q.list.length}</span>
        <span class="score" id="qScore">✓ ${Q.correct}</span>
      </div>
      <div class="qbar"><i style="width:${pct}%"></i></div>
      <div class="panel">
        <div class="qtags">
          <span class="tag">${esc(item.sid)} ${esc(item.stitle)}</span>
          <span class="tag" style="background:#f1f5f9;color:#475569;cursor:pointer" onclick="App.reread()">🔊 Réécouter</span>
        </div>
        ${visHtml}
        <div class="qtext">${esc(q.text)}</div>
        <div class="choices">${ch}</div>
        <div class="feedback" id="fb"></div>
        <div class="qfoot">
          <span class="ftip">Réponds avec <kbd>A</kbd>..<kbd>D</kbd> · <kbd>R</kbd> réécouter · <kbd>Entrée</kbd> suivante</span>
          <button class="btn btn-primary" id="nextBtn" style="display:none" onclick="App.next()">Suivante →</button>
        </div>
      </div>`;
    Q.answered=false;
    if(Store.get("autoread",true))this.readItem(item);
  },
  readItem(item){
    const shown=item.shown;
    TTS.speakChunks(TTS_CORE.quizSequence({text:item.q.text,choices:shown.choices},Object.keys(shown.choices)));
  },
  reread(){
    TTS.unlock();
    this.readItem(this.quiz.list[this.quiz.i]);
  },
  answer(L){
    const Q=this.quiz; if(Q.answered)return; Q.answered=true;
    TTS.cancel();
    const item=Q.list[Q.i], shown=item.shown, correct=shown.answer;
    document.querySelectorAll(".choice").forEach(b=>{
      b.setAttribute("disabled","");
      const bl=b.getAttribute("data-l");
      if(bl===correct){b.classList.add("correct");b.querySelector(".mark").textContent="✓";}
      if(bl===L&&L!==correct){b.classList.add("wrong");b.querySelector(".mark").textContent="✗";}
    });
    const ok=L===correct;
    if(ok)Q.correct++; else Q.missed.push(item);
    Store.logAnswer(item,ok);
    $("#qScore").textContent="✓ "+Q.correct;
    const fb=$("#fb");
    fb.className="feedback show "+(ok?"ok":"no");
    fb.innerHTML=ok?"✅ <b>Bonne réponse !</b>":`❌ <b>Raté.</b> La bonne réponse était <b>${correct}</b> : ${esc(shown.choices[correct])}`;
    const nb=$("#nextBtn");
    nb.style.display="inline-flex";
    nb.textContent=(Q.i+1>=Q.list.length)?"Voir le résultat →":"Suivante →";
    nb.focus();
  },
  next(){const Q=this.quiz;if(Q.i+1>=Q.list.length){this.finishQuiz();return;}Q.i++;this.renderQuiz();},
  finishQuiz(){
    const Q=this.quiz;
    if(Q.meta.key)Store.recordSub(Q.meta.key,Q.correct,Q.list.length);
    Store.logSession(Q.meta,Q.correct,Q.list.length);
    this.go("results");
  },
  quitQuiz(){TTS.cancel();if(confirm("Quitter ce quiz ? Ta progression de cette série sera perdue."))this.go("home");},

  /* ---------- RESULTS ---------- */
  renderResults(){
    const Q=this.quiz, app=$("#app");
    const total=Q.list.length, correct=Q.correct, pct=Math.round(correct/total*100);
    const col=pct>=88?"var(--green)":(pct>=70?"var(--amber)":"var(--red)");
    const verdict=pct>=95?"Excellent ! 🏆":pct>=88?"Niveau examen atteint ✅":pct>=70?"Bien, encore un effort 💪":pct>=50?"Continue à réviser 📚":"À retravailler 📚";
    const C=2*Math.PI*60, off=C*(1-correct/total);
    const nMiss=Q.missed.length;
    let missHtml="";
    if(nMiss){
      missHtml=`<div class="sec-title" style="font-size:17px;color:var(--ink);margin-top:18px">❌ ${nMiss>1?"Tes "+nMiss+" erreurs":"Ton erreur"}</div>`;
      Q.missed.forEach(item=>{const q=item.q,shown=item.shown;
        missHtml+=`<div class="mq">
          <div class="q">${esc(q.text)}</div>
          <div class="a"><span class="good">✓ ${esc(shown.answer)} : ${esc(shown.choices[shown.answer])}</span></div>
          <div class="a" style="color:var(--muted)">${esc(item.sid)} — ${esc(item.stitle)}</div>
        </div>`;});
    }
    app.innerHTML=`
      <div class="crumb"><a onclick="App.go('home')">Accueil</a> › <span>Résultat</span></div>
      <div class="panel">
        <div class="result-top">
          <div class="ring">
            <svg width="150" height="150">
              <circle cx="75" cy="75" r="60" fill="none" stroke="#e2e8f0" stroke-width="13"/>
              <circle cx="75" cy="75" r="60" fill="none" stroke="${col}" stroke-width="13" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}"/>
            </svg>
            <div class="pct"><b style="color:${col}">${pct}%</b><span>${correct}/${total}</span></div>
          </div>
          <div class="verdict" style="color:${col}">${verdict}</div>
          <div style="color:var(--muted);font-size:13px;margin-top:4px">${esc(Q.meta.title)}</div>
          <div style="color:var(--muted);font-size:12px;margin-top:6px">🎯 Seuil de l'examen officiel : 35/40 (87,5 %)</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
          ${nMiss?`<button class="btn btn-primary" style="flex:1;min-width:180px" onclick="App.retryMissed()">🔁 ${nMiss>1?"Rejouer mes "+nMiss+" erreurs":"Rejouer mon erreur"}</button>`:""}
          <button class="btn btn-green" style="flex:1;min-width:140px" onclick="App.retryAll()">↻ Refaire la série</button>
          <button class="btn btn-ghost" style="flex:1;min-width:120px" onclick="App.go('home')">🏠 Accueil</button>
        </div>
        <div class="miss">${missHtml}</div>
      </div>`;
  },
  retryMissed(){const m=this.quiz.missed.slice();this.startQuiz(shuffle(m),{title:this.quiz.meta.title+" — rattrapage",key:null,themeNum:this.quiz.meta.themeNum,back:this.quiz.meta.back});},
  retryAll(){this.startQuiz(this.quiz.list.slice(),this.quiz.meta);},

  /* ---------- ECF : 100 questions de l'examinateur ---------- */
  ecf:{i:0,revealed:false},
  renderEcfList(){
    const app=$("#app"), D=window.ECF_DATA||[];
    let rows="";
    D.forEach((f,idx)=>{
      const first=(f.pairs[0]&&f.pairs[0].q)||("Fiche "+f.n);
      rows+=`<div class="subrow" onclick="App.openEcf(${idx})">
        <div class="sid">${String(f.n).padStart(2,'0')}</div>
        <div class="meta"><b>${esc(first)}</b><span>${f.pairs.length} points · vérification · sécurité / secours</span></div>
        <div class="acts"><button class="btn btn-primary mini">Ouvrir</button></div>
      </div>`;
    });
    app.innerHTML=`
      <div class="crumb"><a onclick="App.go('home')">Accueil</a> › <span>100 questions de l'examinateur</span></div>
      <div class="sec-title">🧑‍⚖️ Les 100 questions de l'examinateur</div>
      <div class="panel" style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-green" style="flex:1;min-width:200px" onclick="App.openEcf(0)">▶️ Commencer (fiche 1)</button>
        <button class="btn btn-ghost" style="flex:1;min-width:160px" onclick="App.openEcf(Math.floor(Math.random()*${D.length||1}))">🔀 Au hasard</button>
      </div>
      <div class="panel" style="padding:6px 16px">${rows||"<p>Données indisponibles.</p>"}</div>`;
  },
  openEcf(i){this.ecf={i:i,revealed:false};this.go("ecfCard");},
  fmtAnswer(a){
    return (a||"").split("\n").map(l=>{l=l.trim();if(!l)return"";
      return l.indexOf("• ")===0?`<div class="ecf-li">${esc(l.slice(2))}</div>`:`<div>${esc(l)}</div>`;}).join("");
  },
  renderEcfCard(){
    const app=$("#app"), D=window.ECF_DATA||[], i=this.ecf.i, f=D[i];
    if(!f){this.go("ecfList");return;}
    let blocks="";
    f.pairs.forEach((p,bi)=>{
      const demo=p.kind==="demo";
      const label=demo?"👆 À montrer / faire dans le véhicule":"❓ Question";
      const disp=this.ecf.revealed?"block":"none";
      let ans="";
      if(p.a) ans=`<div class="ecf-ans" id="ans${bi}" style="display:${disp}">${App.fmtAnswer(p.a)}</div>`;
      else if(demo) ans=`<div class="ecf-ans demo-note" id="ans${bi}" style="display:${disp}">Geste à effectuer dans le véhicule (rien à dire à l'examinateur).</div>`;
      blocks+=`<div class="ecf-block">
        <div class="ecf-label ${demo?"demo":""}">${label}</div>
        <div class="ecf-q">${esc(p.q)}</div>
        ${(p.a||demo)?`<button class="btn btn-ghost mini" onclick="App.revealEcf(${bi})">👁️ Voir la réponse</button>`:""}
        ${ans}
      </div>`;
    });
    app.innerHTML=`
      <div class="crumb"><a onclick="App.go('ecfList')">✕ Liste</a> › <span>Examinateur</span></div>
      <div class="qhead"><span class="qcount">Fiche ${f.n} / ${D.length}</span>
        <span class="tag" style="margin-left:auto;cursor:pointer" onclick="App.readEcf()">🔊 Réécouter</span></div>
      <div class="qbar"><i style="width:${Math.round((i+1)/D.length*100)}%"></i></div>
      <div class="panel">${blocks}
        <button class="btn btn-ghost" style="width:100%;margin-top:12px" onclick="App.revealAllEcf()">👁️ Tout révéler</button>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost" style="flex:1" ${i<=0?"disabled":""} onclick="App.ecfNav(-1)">← Préc.</button>
        <button class="btn btn-primary" style="flex:1" ${i>=D.length-1?"disabled":""} onclick="App.ecfNav(1)">Suivant →</button>
      </div>`;
    if(Store.get("autoread",true)){
      const chunks=[]; f.pairs.forEach(p=>{if(p.q)chunks.push(p.q);}); TTS.speakChunks(chunks);
    }
  },
  revealEcf(bi){const e=$("#ans"+bi);if(e){e.style.display="block";const p=(window.ECF_DATA[this.ecf.i].pairs[bi]);if(p&&p.a){TTS.unlock();TTS.speak(p.a);}}},
  revealAllEcf(){this.ecf.revealed=true;document.querySelectorAll(".ecf-ans").forEach(e=>e.style.display="block");},
  readEcf(){TTS.unlock();const f=window.ECF_DATA[this.ecf.i];const c=[];f.pairs.forEach(p=>{if(p.q)c.push(p.q);if(p.a&&this.ecf.revealed)c.push(p.a);});TTS.speakChunks(c);},
  ecfNav(d){const D=window.ECF_DATA||[];let n=this.ecf.i+d;if(n<0)n=0;if(n>=D.length)n=D.length-1;this.ecf={i:n,revealed:false};this.go("ecfCard");},

  /* ---------- STATS DASHBOARD ---------- */
  renderStats(){
    const app=$("#app"), st=Store.st;
    if(!st.totalAnswered){
      app.innerHTML=`
        <div class="crumb"><a onclick="App.go('home')">Accueil</a> › <span>Ma progression</span></div>
        <div class="sec-title">📊 Ma progression</div>
        <div class="panel"><div class="empty">
          <div class="big">📈</div>
          <b>Pas encore de statistiques</b>
          <p style="margin-top:6px">Réponds à quelques questions et tes résultats apparaîtront ici : précision, points faibles, progression dans le temps…</p>
          <button class="btn btn-green" style="margin-top:14px" onclick="App.go('home')">🎯 Commencer à réviser</button>
        </div></div>`;
      return;
    }
    const acc=Math.round(st.totalCorrect/st.totalAnswered*100);
    const stk=Store.streak();
    // KPIs
    const kpis=`<div class="kpis">
      <div class="kpi"><b>${st.totalAnswered}</b><span>questions répondues</span></div>
      <div class="kpi"><b style="color:${acc>=88?'var(--green)':acc>=70?'var(--amber)':'var(--red)'}">${acc}%</b><span>précision globale</span></div>
      <div class="kpi"><b>${stk.current}🔥</b><span>jours d'affilée</span></div>
      <div class="kpi"><b>${st.sessions.length}</b><span>séries terminées</span></div>
    </div>`;
    // Ring
    const C=2*Math.PI*54, off=C*(1-st.totalCorrect/st.totalAnswered), rc=acc>=88?"var(--green)":acc>=70?"var(--amber)":"var(--red)";
    const ring=`<div class="panel"><div class="card-h">🎯 Précision globale</div>
      <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:center">
        <div class="ring" style="width:135px;height:135px">
          <svg width="135" height="135"><circle cx="67.5" cy="67.5" r="54" fill="none" stroke="#e2e8f0" stroke-width="12"/>
          <circle cx="67.5" cy="67.5" r="54" fill="none" stroke="${rc}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}"/></svg>
          <div class="pct"><b style="color:${rc};font-size:30px">${acc}%</b><span>${st.totalCorrect}/${st.totalAnswered}</span></div>
        </div>
        <div style="font-size:13.5px;color:var(--muted);max-width:240px">
          ${acc>=88?"Tu es au niveau de l'examen officiel (87,5 %). Continue ainsi ! 🏆":
            acc>=70?"Tu progresses bien. Vise 88 % pour atteindre le niveau de l'examen.":
            "Encore du travail. Concentre-toi sur tes points faibles ci-dessous. 💪"}
        </div>
      </div></div>`;
    // Theme accuracy bars
    let tbars="";
    DATA.themes.forEach((t,i)=>{
      const d=st.themes[t.num]; if(!d||!d.a)return;
      const a=Math.round(d.c/d.a*100);
      const col=a>=80?"var(--green)":a>=60?"var(--amber)":"var(--red)";
      tbars+=`<div class="tbar" onclick="App.go('theme',{ti:${i}})">
        <div class="tlabel">${THEME_ICONS[i]} ${esc(t.title)}</div>
        <div class="track"><i style="width:${a}%;background:${col}"></i></div>
        <div class="tval">${a}% · ${d.c}/${d.a}</div>
      </div>`;
    });
    const themeCard=tbars?`<div class="panel"><div class="card-h">📚 Précision par thème <span style="font-weight:500;color:var(--muted);font-size:12px">(clique pour réviser)</span></div>${tbars}</div>`:"";
    // 14-day activity
    const days=[]; for(let i=13;i>=0;i--){const ds=addDays(todayStr(),-i);days.push({ds,a:(st.days[ds]&&st.days[ds].a)||0});}
    const maxA=Math.max(1,...days.map(d=>d.a));
    const WD=["D","L","M","M","J","V","S"];
    let dcols="";
    days.forEach(d=>{
      const h=Math.round(d.a/maxA*100), p=d.ds.split("-"), wd=WD[new Date(p[0],p[1]-1,p[2]).getDay()];
      dcols+=`<div class="day" title="${d.ds} : ${d.a} question(s)">
        <div class="col${d.a?"":" zero"}" style="height:${d.a?Math.max(h,4):4}%"></div>
        <small>${wd}</small></div>`;
    });
    const totalWeek=days.reduce((a,d)=>a+d.a,0);
    const actCard=`<div class="panel"><div class="card-h">🗓️ Activité — 14 derniers jours <span style="font-weight:500;color:var(--muted);font-size:12px">(${totalWeek} questions)</span></div><div class="days">${dcols}</div></div>`;
    // Session trend (line)
    let trendCard="";
    const sess=st.sessions.slice(-20);
    if(sess.length>=2){
      const W=320,H=120,pad=8;
      const pts=sess.map((s,i)=>{const x=pad+i*(W-2*pad)/(sess.length-1);const y=H-pad-(s.c/s.n)*(H-2*pad);return [x,y];});
      const line=pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
      const area="M"+pad+","+(H-pad)+" L"+line.replace(/ /g," L")+" L"+(W-pad)+","+(H-pad)+" Z";
      const dots=pts.map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="#2563eb"/>`).join("");
      const last=Math.round(sess[sess.length-1].c/sess[sess.length-1].n*100);
      trendCard=`<div class="panel trend"><div class="card-h">📈 Progression <span style="font-weight:500;color:var(--muted);font-size:12px">(${sess.length} dernières séries · dernière : ${last}%)</span></div>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
          <line x1="${pad}" y1="${(H-pad-(0.875)*(H-2*pad)).toFixed(1)}" x2="${W-pad}" y2="${(H-pad-(0.875)*(H-2*pad)).toFixed(1)}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4 4"/>
          <path d="${area}" fill="rgba(37,99,235,.12)"/>
          <polyline points="${line}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
          ${dots}
        </svg>
        <div style="font-size:11.5px;color:var(--muted);text-align:right">— — — seuil examen 87,5 %</div></div>`;
    }
    // Weak points
    const weakArr=[];
    DATA.themes.forEach((t,i)=>{const d=st.themes[t.num];if(d&&d.a>=3){weakArr.push({i,t,acc:d.c/d.a,d});}});
    weakArr.sort((a,b)=>a.acc-b.acc);
    const weak=weakArr.filter(w=>w.acc<0.85).slice(0,3);
    let weakCard="";
    if(weak.length){
      let rows="";
      weak.forEach(w=>{const a=Math.round(w.acc*100);
        rows+=`<div class="weak">
          <div class="wi" style="background:${THEME_COLORS[w.i]}22">${THEME_ICONS[w.i]}</div>
          <div class="wm"><b>${esc(w.t.title)}</b><span>${a}% de réussite · ${w.d.c}/${w.d.a}</span></div>
          <button class="btn btn-primary mini" onclick="App.startThemeQuiz(${w.i},true)">Réviser</button>
        </div>`;});
      weakCard=`<div class="panel"><div class="card-h">🎯 Tes points faibles</div>${rows}</div>`;
    }
    const actions=`<div class="panel"><div class="card-h">⚙️ Données</div><div class="actions-row">
        <button class="btn btn-ghost" onclick="App.exportProgress()">⬇️ Exporter</button>
        <button class="btn btn-ghost" onclick="document.getElementById('importFile').click()">⬆️ Importer</button>
        <button class="btn btn-ghost danger" onclick="App.resetProgress()">🗑️ Réinitialiser</button>
      </div>
      <div class="hint" style="margin-top:12px">💡 Exporte ta progression pour la transférer entre ton PC et ton iPhone/iPad (les stats sont stockées séparément sur chaque appareil).</div></div>`;
    app.innerHTML=`
      <div class="crumb"><a onclick="App.go('home')">Accueil</a> › <span>Ma progression</span></div>
      <div class="sec-title">📊 Ma progression</div>
      ${kpis}${ring}${themeCard}${trendCard}${actCard}${weakCard}${actions}`;
  },
  exportProgress(){
    try{
      const blob=new Blob([Store.exportData()],{type:"application/json"});
      const url=URL.createObjectURL(blob), a=document.createElement("a");
      a.href=url; a.download="ma-progression-code.json"; document.body.appendChild(a); a.click();
      setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},500);
      toast("Progression exportée ✓");
    }catch(e){toast("Export impossible");}
  },
  resetProgress(){
    if(confirm("Effacer TOUTE ta progression (stats, historique) ? Cette action est irréversible."))
    {Store.reset();toast("Progression réinitialisée");this.go("stats");}
  },

  /* ---------- Settings ---------- */
  openSettings(){$("#modalBg").classList.add("show");this.fillVoices();},
  closeSettings(){$("#modalBg").classList.remove("show");},
  fillVoices(){
    const sel=$("#selVoice"); if(!sel)return; sel.innerHTML="";
    const natural=el("option",null,"✨ Automatique — voix la plus naturelle (conseillé)");natural.value="auto:natural";sel.appendChild(natural);
    const offline=el("option",null,"📴 Automatique — voix française locale uniquement");offline.value="auto:offline";sel.appendChild(offline);
    if(TTS.voices.length){
      const group=document.createElement("optgroup");group.label="Choisir manuellement";
      TTS.voices.forEach(voice=>{
        const meta=TTS_CORE.voiceMeta(voice),icon=meta.quality==="naturelle"?"✨ ":(voice.localService?"📴 ":"🌐 ");
        const option=el("option",null,`${icon}${voice.name} (${voice.lang}) · ${voice.localService?"locale":"service distant"}`);
        option.value="manual:"+voice.voiceURI;
        group.appendChild(option);
      });
      sel.appendChild(group);
    }
    if(TTS.mode==="manual"&&TTS.voice)sel.value="manual:"+TTS.voice.voiceURI;
    else sel.value="auto:"+TTS.mode;
    this.updateVoiceInfo();
  },
  updateVoiceInfo(){
    const state=$("#voiceState"),hint=$("#voiceHint");if(!state||!hint)return;
    state.innerHTML="";
    const meta=TTS_CORE.voiceMeta(TTS.voice);
    if(!TTS.voice){
      state.appendChild(el("span","voice-chip remote","Voix française indisponible"));
      hint.innerHTML=`Aucune voix française ${TTS.mode==="offline"?"locale ":""}compatible n’est disponible dans ce navigateur. Installe une voix française sur l’appareil puis rouvre l’application.`;
      return;
    }
    const quality=el("span","voice-chip",meta.quality==="naturelle"?"✨ Voix naturelle":(meta.quality==="améliorée"?"✓ Voix améliorée":"Voix standard"));
    const locality=el("span","voice-chip "+(meta.local?"local":"remote"),meta.local?"📴 Locale / hors ligne":"🌐 Service vocal distant");
    const name=el("span","voice-chip name","🎙 "+TTS.voice.name);name.title=TTS.voice.name;
    state.appendChild(quality);state.appendChild(locality);state.appendChild(name);
    let install="";
    if(IS_IOS)install=`Sur iPhone/iPad : <b>Réglages › Accessibilité › Contenu énoncé › Voix › Français</b>, puis télécharge une qualité améliorée ou premium.`;
    else if(/Windows/i.test(navigator.userAgent))install=`Sous Windows 11 : <b>Paramètres › Accessibilité › Narrateur › Ajouter une voix naturelle</b>. Edge propose aussi des voix naturelles distantes.`;
    else if(/Android/i.test(navigator.userAgent))install=`Sous Android : ouvre les réglages de <b>Synthèse vocale</b>, installe les données françaises et choisis la voix de meilleure qualité.`;
    else install=`Installe une voix française améliorée dans les réglages d’accessibilité ou de synthèse vocale de l’appareil.`;
    hint.innerHTML=(meta.local
      ?`Cette voix est fournie localement par l’appareil et reste disponible hors connexion.`
      :`Cette voix est plus naturelle, mais le navigateur ou le système peut utiliser un service distant pour la synthèse. Choisis le mode local si tu veux une lecture strictement hors ligne.`)+`<br>${install}`;
  },
  useNaturalVoice(){
    TTS.mode="natural";TTS.rate=.94;TTS.naturalPauses=true;TTS.pick("","natural");
    Store.s.voiceMode="natural";Store.s.rate=.94;Store.s.naturalPauses=true;Store.s.speechVersion=2;Store.saveS();
    $("#rngRate").value=.94;$("#rateVal").textContent="0.94×";$("#chkNatural").checked=true;
    this.fillVoices();TTS.test();toast("Réglage naturel activé");
  },
  bindSettings(){
    const r=$("#rngRate"),rv=$("#rateVal"),auto=$("#chkAuto"),natural=$("#chkNatural"),sel=$("#selVoice");
    r.value=Store.get("rate",.94); rv.textContent=(+r.value).toFixed(2).replace(/0$/,"")+"×";
    auto.checked=Store.get("autoread",true);
    natural.checked=Store.get("naturalPauses",true);
    r.oninput=()=>{rv.textContent=(+r.value).toFixed(2).replace(/0$/,"")+"×";TTS.rate=+r.value;Store.set("rate",+r.value);};
    auto.onchange=()=>Store.set("autoread",auto.checked);
    natural.onchange=()=>{TTS.naturalPauses=natural.checked;Store.set("naturalPauses",natural.checked);};
    sel.onchange=()=>{
      const value=sel.value;
      if(value==="auto:natural"||value==="auto:offline"){
        const mode=value.slice(5);TTS.pick("",mode);Store.s.voiceMode=mode;Store.s.voiceURI="";
      }else{
        const uri=value.slice(7);TTS.pick(uri,"manual");Store.s.voiceMode="manual";Store.s.voiceURI=uri;
      }
      Store.saveS();this.updateVoiceInfo();
    };
    $("#modalBg").onclick=e=>{if(e.target===$("#modalBg"))this.closeSettings();};
    $("#importFile").onchange=e=>{
      const f=e.target.files[0]; if(!f)return;
      if(f.size>1024*1024){toast("Fichier trop volumineux");e.target.value="";return;}
      const rd=new FileReader();
      rd.onload=()=>{try{Store.importData(JSON.parse(rd.result));toast("Progression importée ✓");App.bindSettings&&0;App.go("stats");}catch(err){toast("Fichier invalide");}};
      rd.readAsText(f); e.target.value="";
    };
  }
};

/* ============================ Keyboard ============================ */
document.addEventListener("keydown",e=>{
  if($("#modalBg").classList.contains("show")){
    if(e.key==="Escape"){App.closeSettings();e.preventDefault();}
    return;
  }
  if(e.ctrlKey||e.metaKey||e.altKey)return; // laisse passer Ctrl+R, Ctrl+C…
  if(App.view==="quiz"){
    const Q=App.quiz, k=e.key.toUpperCase(), shown=Q.list[Q.i].shown;
    if(!Q.answered&&["A","B","C","D","E"].includes(k)){
      if(shown.choices[k]!==undefined){App.answer(k);e.preventDefault();}
    }else if(!Q.answered&&["1","2","3","4","5"].includes(e.key)){
      const L=Object.keys(shown.choices)[+e.key-1];
      if(L){App.answer(L);e.preventDefault();}
    }else if(k==="R"){App.reread();e.preventDefault();}
    else if((e.key==="Enter"||e.key===" "||e.key==="ArrowRight")&&Q.answered){App.next();e.preventDefault();}
  }else if(App.view==="ecfCard"){
    if(e.key==="ArrowRight"){App.ecfNav(1);e.preventDefault();}
    else if(e.key==="ArrowLeft"){App.ecfNav(-1);e.preventDefault();}
    else if(e.key===" "||e.key==="Enter"){App.revealAllEcf();e.preventDefault();}
    else if(e.key.toUpperCase()==="R"){App.readEcf();e.preventDefault();}
  }
});

/* Unlock speech on first user gesture (required by iOS Safari) */
window.addEventListener("pointerdown",()=>TTS.unlock(),{once:true});
window.addEventListener("touchend",()=>TTS.unlock(),{once:true});
window.addEventListener("beforeunload",()=>TTS.cancel());

/* PWA service worker (uniquement en http/https, pas en file://) */
if("serviceWorker" in navigator && location.protocol.indexOf("http")===0){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}

App.start();
