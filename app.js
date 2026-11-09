/* Anti-clickjacking : GitHub Pages ne permet pas d'en-tête X-Frame-Options,
   ce frame-buster casse l'affichage si la page est chargée dans une iframe. */
if(window.top!==window.self){try{window.top.location=window.self.location;}catch(e){}}

/* ============================ Utils ============================ */
const $ = (s,r=document)=>r.querySelector(s);
const el = (t,c,h)=>{const e=document.createElement(t); if(c)e.className=c; if(h!=null)e.textContent=h; return e;};
const esc = s => (s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
/* Icône du sprite SVG d'index.html (même trait partout, hors ligne). */
const ic=(id,cls)=>`<svg class="i${cls?" "+cls:""}" aria-hidden="true"><use href="#${id}"/></svg>`;
const themeIcon=i=>ic("t"+(i+1));
/* Titres de thèmes du corpus en « Title Case » → casse de phrase française. */
const sentenceCase=s=>String(s||"").split(" ").map((w,i)=>i===0?w:w.charAt(0).toLowerCase()+w.slice(1))
  .join(" ").replace(/([’'])(\p{Lu})/u,(m,a,b)=>a+b.toLowerCase());
/* Typographie française à l'affichage : 'texte' → « texte », espaces insécables avant ? ! : ; »
   (le texte lu à voix haute n'est pas modifié). */
const typo=s=>esc(s)
  .replace(/(^|[\s(])&#39;([^&]{2,80}?)&#39;(?=[\s.,;:!?)]|$)/g,"$1« $2 »")
  .replace(/ ([?!:;»])/g," $1").replace(/« /g,"« ");
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
    if(this.supported){try{if(speechSynthesis.paused)speechSynthesis.resume();speechSynthesis.cancel();}catch(e){}}
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
const EXAM_RATIO=35/40; // seuil de l'examen officiel : 35 bonnes réponses sur 40
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
    document.body.setAttribute("data-view",view);
    window.scrollTo(0,0);
    ({home:this.renderHome,theme:this.renderTheme,course:this.renderCourse,quiz:this.renderQuiz,results:this.renderResults,stats:this.renderStats,ecfList:this.renderEcfList,ecfCard:this.renderEcfCard}[view]).call(this,ctx);
  },
  /* Zone sombre du haut (sous la barre du logo) ; lane = bande de marquage au sol. */
  setTop(html,lane){
    $("#topSlot").innerHTML=html||"";
    const l=$("#lane"); if(l)l.hidden=!lane;
    const top=$("#top"); if(top&&top.classList)top.classList[lane?"add":"remove"]("has-lane");
  },
  subKey(tnum,sid){return "t"+tnum+"_"+sid;},
  themeProgress(t){
    let sum=0;
    t.subthemes.forEach(s=>{const b=Store.bestSub(App.subKey(t.num,s.id));if(b!=null)sum+=b;});
    return t.subthemes.length?Math.round(sum/t.subthemes.length*100):0;
  },
  crumb(parts){
    return `<nav class="crumb" aria-label="Fil d'Ariane">${parts.map(p=>p.go?`<button onclick="${p.go}">${esc(p.label)}</button>`:`<span>${esc(p.label)}</span>`).join("<span aria-hidden=\"true\">›</span>")}</nav>`;
  },

  /* ---------- ACCUEIL ---------- */
  renderHome(){
    const app=$("#app");
    const totalSub=DATA.themes.reduce((a,t)=>a+t.subthemes.length,0);
    const st=Store.st, acc=st.totalAnswered?Math.round(st.totalCorrect/st.totalAnswered*100):null;
    this.setTop(`
      <div class="hero">
        <h1>Réviser le code de la route</h1>
        <p>Permis B · édition 2026 · questions lues à voix haute</p>
        <div class="facts">
          <div><b>${DATA.totalQuestions}</b>questions</div>
          <div><b>${totalSub}</b>leçons</div>
          ${acc!=null?`<button class="click" onclick="App.go('stats')"><b>${acc}&nbsp;%</b>de réussite</button>`:`<div><b>${DATA.themes.length}</b>thèmes</div>`}
        </div>
        <div class="cta">
          <button class="btn btn-main" onclick="App.startQuiz(App.allQuestions(),{title:'Quiz de 40 questions',key:null,themeNum:null})">${ic("i-shuffle")}Quiz de 40 questions</button>
          <button class="btn btn-dark" aria-label="Ma progression" title="Ma progression" onclick="App.go('stats')">${ic("i-stats")}</button>
        </div>
      </div>`,true);
    const rows=DATA.themes.map((t,i)=>{
      const nq=t.subthemes.reduce((a,s)=>a+s.questions.length,0), prog=this.themeProgress(t), ns=t.subthemes.length;
      return `<button class="trow" onclick="App.go('theme',{ti:${i}})">
        <span class="tic">${themeIcon(i)}</span>
        <span class="tm"><b>${esc(sentenceCase(t.title))}</b><span>${ns} leçon${ns>1?"s":""} · ${nq} questions</span></span>
        <span class="tp">${prog}&nbsp;%<i><s style="width:${prog}%"></s></i></span>
      </button>`;
    }).join("");
    app.innerHTML=`
      ${TTS.supported?"":`<div class="alert">La synthèse vocale n'est pas disponible dans ce navigateur. L'application fonctionne, mais sans lecture audio. Essaie Chrome, Edge ou Safari.</div>`}
      <button class="card exam" onclick="App.go('ecfList')">
        <span class="pic">${ic("t-exam")}</span>
        <span class="txt"><b>Les 100 questions de l'examinateur</b><small>Vérifications, sécurité et premiers secours&nbsp;: l'oral du jour&nbsp;J</small></span>
        <span class="go">${ic("i-arrow")}</span>
      </button>
      <div class="sect"><h2>Thèmes</h2><span>${DATA.themes.length} thèmes · ${totalSub} leçons</span></div>
      <div class="card themes two">${rows}</div>`;
  },
  allQuestions(){
    let all=[];
    DATA.themes.forEach(t=>t.subthemes.forEach(s=>s.questions.forEach(q=>{
      all.push({q,tnum:t.num,ttitle:t.title,sid:s.id,stitle:s.title});
    })));
    return shuffle(all).slice(0,40);
  },

  /* ---------- THÈME ---------- */
  renderTheme(c){
    const ti=c.ti, t=DATA.themes[ti], app=$("#app");
    const nq=t.subthemes.reduce((a,s)=>a+s.questions.length,0);
    this.setTop(`
      ${this.crumb([{label:"Accueil",go:"App.go('home')"},{label:sentenceCase(t.title)}])}
      <h1 class="ptitle"><small>THÈME ${t.num}</small>${esc(sentenceCase(t.title))}</h1>
      <div class="row-btns">
        <button class="btn btn-main" onclick="App.startThemeQuiz(${ti})">${ic("i-target")}Tout le thème · ${nq} questions</button>
        <button class="btn btn-dark" onclick="App.startThemeQuiz(${ti},true)">${ic("i-shuffle")}Ordre aléatoire</button>
      </div>`);
    const rows=t.subthemes.map((s,si)=>{
      const b=Store.bestSub(App.subKey(t.num,s.id)), n=s.questions.length;
      const badge=b!=null?` · <span class="best ${b>=EXAM_RATIO?"good":"mid"}">meilleur score ${Math.round(b*100)}&nbsp;%</span>`:"";
      return `<div class="subrow">
        <div class="sid">${esc(s.id)}</div>
        <div class="meta"><b>${esc(s.title)}</b><span>${n?`${n} question${n>1?"s":""}`:"cours seul"}${badge}</span></div>
        <div class="acts">
          <button class="btn btn-ghost mini" onclick="App.go('course',{ti:${ti},si:${si}})">${ic("i-book","sm")}Cours</button>
          <button class="btn btn-primary mini" ${n?"":"disabled"} onclick="App.startSubQuiz(${ti},${si})">${ic("i-target","sm")}Quiz</button>
        </div>
      </div>`;
    }).join("");
    app.innerHTML=`<div class="card" style="padding:4px 0">${rows}</div>`;
  },
  startSubQuiz(ti,si){
    const t=DATA.themes[ti], s=t.subthemes[si];
    const list=s.questions.map(q=>({q,tnum:t.num,ttitle:t.title,sid:s.id,stitle:s.title}));
    this.startQuiz(list,{title:sentenceCase(t.title)+" · "+s.id+" "+s.title,key:App.subKey(t.num,s.id),themeNum:t.num,back:{view:'theme',ctx:{ti}}});
  },
  startThemeQuiz(ti,rand){
    const t=DATA.themes[ti]; let list=[];
    t.subthemes.forEach(s=>s.questions.forEach(q=>list.push({q,tnum:t.num,ttitle:t.title,sid:s.id,stitle:s.title})));
    if(rand)list=shuffle(list);
    this.startQuiz(list,{title:sentenceCase(t.title)+" · tout le thème",key:null,themeNum:t.num,back:{view:'theme',ctx:{ti}}});
  },

  /* ---------- LEÇON ---------- */
  courseHtml(blocks){
    // Un intertitre « À retenir », « essentiel », « mémo »… ouvre un encadré jusqu'au prochain intertitre.
    const KEY=/^(à retenir|ce qu.il faut (absolument )?retenir|retenez|m[ée]mo|rappel\b|points? cl[ée]s?|l.essentiel|r[èe]gles? essentielles?\s*:|la r[èe]gle essentielle)/i;
    let html="", i=0, open=false;
    const close=()=>{if(open){html+="</div>";open=false;}};
    while(i<blocks.length){
      const b=blocks[i];
      if(b.t==="h"){close();const nxt=blocks[i+1];if(KEY.test(b.s.trim())&&nxt&&nxt.t!=="h"){html+=`<div class="retenir">`;open=true;}html+=`<h3>${typo(b.s)}</h3>`;i++;}
      else if(b.t==="li"){html+="<ul>";while(i<blocks.length&&blocks[i].t==="li"){html+=`<li>${typo(blocks[i].s)}</li>`;i++;}html+="</ul>";}
      else{html+=`<p>${typo(b.s)}</p>`;i++;}
    }
    close();
    return html;
  },
  renderCourse(c){
    const ti=c.ti, si=c.si, t=DATA.themes[ti], s=t.subthemes[si], app=$("#app");
    const guides=(window.CODE_VISUALS&&typeof CODE_VISUALS.lesson==="function")?CODE_VISUALS.lesson(s.id):[];
    this.setTop(`
      ${this.crumb([{label:"Accueil",go:"App.go('home')"},{label:sentenceCase(t.title),go:`App.go('theme',{ti:${ti}})`},{label:"Leçon "+s.id}])}
      <h1 class="ptitle"><small>LEÇON ${esc(s.id)}</small>${esc(s.title)}</h1>`);
    const readerHtml=`
      <div class="reader">
        <button class="rbtn" id="rPlay" aria-label="Écouter la leçon">${ic("i-play")}</button>
        <div class="rinfo"><b id="rInfo">Écouter la leçon</b><span id="rSub">${guides.length?`${guides.length} schéma${guides.length>1?"s":""} · `:""}lecture à voix haute</span><div class="rbar"><i id="rBar"></i></div></div>
        <button class="rbtn stop" id="rStop" aria-label="Arrêter la lecture">${ic("i-stop","sm")}</button>
      </div>`;
    const guideHtml=guides.map((guide,gi)=>`<article class="card lesson-diagram">
        <span class="lesson-diagram-kicker">${esc(guide.kicker)}</span>
        <h3>${typo(guide.title)}</h3>
        <p>${typo(guide.caption)}</p>
        <div class="lesson-diagram-visual">${guide.svg}</div>
      </article>`).join("");
    const nq=s.questions.length;
    app.innerHTML=`${readerHtml}
      ${guideHtml?`<div class="lesson-visuals">${guideHtml}</div>`:""}
      <div class="card course">${this.courseHtml(s.course)||"<p>Pas de contenu de cours pour cette leçon.</p>"}</div>
      ${nq?`<button class="btn btn-primary btn-lg" style="margin-top:14px" onclick="App.startSubQuiz(${ti},${si})">${ic("i-target")}Passer au quiz de cette leçon · ${nq} question${nq>1?"s":""}</button>`:""}`;
    const chunks=[];
    guides.forEach(guide=>splitSentences(`${guide.title}. ${guide.caption}`).forEach(p=>chunks.push(p)));
    s.course.forEach(blk=>splitSentences(blk.s).forEach(p=>chunks.push(p)));
    let playing=false;
    const info=$("#rInfo"),bar=$("#rBar"),play=$("#rPlay");
    const setPlay=on=>{play.innerHTML=ic(on?"i-pause":"i-play");play.setAttribute("aria-label",on?"Mettre en pause":"Écouter la leçon");};
    const startRead=()=>{
      playing=true;setPlay(true);info.textContent="Lecture en cours…";
      TTS.speakChunks(chunks,{
        onprogress:(d,tot)=>{bar.style.width=Math.round(d/tot*100)+"%";},
        onend:()=>{playing=false;setPlay(false);info.textContent="Lecture terminée";bar.style.width="100%";}
      });
    };
    play.onclick=()=>{
      if(!playing){
        if(TTS.supported&&speechSynthesis.paused){speechSynthesis.resume();setPlay(true);playing=true;info.textContent="Lecture en cours…";return;}
        startRead();
      }else{TTS.pauseToggle();playing=false;setPlay(false);info.textContent="En pause";}
    };
    $("#rStop").onclick=()=>{TTS.cancel();playing=false;setPlay(false);info.textContent="Écouter la leçon";bar.style.width="0";};
  },

  /* ---------- QUIZ ---------- */
  startQuiz(list,meta){
    if(!list||!list.length){toast("Aucune question disponible.");return;}
    this.quiz={list:list.map(withShuffledChoices),meta,i:0,correct:0,answered:false,missed:[],results:[]};
    this.go("quiz");
  },
  quizSegments(){
    const Q=this.quiz, n=Q.list.length;
    if(n>60)return `<div class="qbar"><i style="width:${Math.round(Q.i/n*100)}%"></i></div>`;
    let s="";
    for(let k=0;k<n;k++)s+=`<i class="${Q.results[k]===true?"ok":Q.results[k]===false?"ko":k===Q.i?"now":""}"></i>`;
    return `<div class="seg" id="seg" aria-hidden="true">${s}</div>`;
  },
  renderQuiz(){
    const Q=this.quiz, app=$("#app");
    const item=Q.list[Q.i], q=item.q, shown=item.shown, letters=Object.keys(shown.choices);
    this.setTop(`
      <div class="qnav">
        <button class="x" onclick="App.quitQuiz()">${ic("i-x","sm")}Quitter</button>
        <span class="score" id="qScore">${ic("i-check","sm")}${Q.correct}<span class="sr"> bonnes réponses</span></span>
        <button class="x" aria-label="Réglages de la voix" title="Réglages de la voix" onclick="App.openSettings()">${ic("i-sliders","sm")}</button>
      </div>
      <div class="qtitle">${esc(Q.meta.title)}</div>
      <div class="qcount"><b>Question ${Q.i+1}</b><span>sur ${Q.list.length}</span></div>
      ${this.quizSegments()}`);
    let ch="";
    letters.forEach(L=>{ch+=`<button class="choice" data-l="${L}" onclick="App.answer('${L}')">
        <span class="key">${L}</span><span class="ctxt">${typo(shown.choices[L])}</span><span class="mark"></span></button>`;});
    const vis=(window.CODE_IMAGES&&window.CODE_VISUALS)?window.CODE_IMAGES[q.id]:null;
    const visHtml=vis?`<div class="qvisual">${CODE_VISUALS.render(vis)}</div>`:"";
    app.innerHTML=`
      <div class="card qcard">
        <div class="qtags">
          <span class="tag">${esc(item.sid)} · ${esc(item.stitle)}</span>
          <button class="listen" onclick="App.reread()">${ic("i-speaker","sm")}Écouter</button>
        </div>
        ${visHtml}
        <p class="qtext">${typo(q.text)}</p>
        <div class="choices">${ch}</div>
        <div class="feedback" id="fb" role="status"></div>
        <div class="qfoot">
          <button class="btn btn-primary" id="nextBtn" style="display:none" onclick="App.next()">Question suivante${ic("i-arrow")}</button>
          <span class="ftip">Clavier&nbsp;: <kbd>A</kbd> à <kbd>D</kbd> pour répondre · <kbd>R</kbd> réécouter · <kbd>Entrée</kbd> suivante</span>
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
      if(bl===correct){b.classList.add("correct");b.querySelector(".mark").innerHTML=ic("i-check");}
      else if(bl===L){b.classList.add("wrong");b.querySelector(".mark").innerHTML=ic("i-x");}
      else b.classList.add("dim");
    });
    const ok=L===correct;
    Q.results[Q.i]=ok;
    if(ok)Q.correct++; else Q.missed.push(item);
    Store.logAnswer(item,ok);
    $("#qScore").innerHTML=ic("i-check","sm")+Q.correct+`<span class="sr"> bonnes réponses</span>`;
    const seg=$("#seg"); if(seg&&seg.children&&seg.children[Q.i])seg.children[Q.i].className=ok?"ok":"ko";
    const fb=$("#fb");
    fb.className="feedback show "+(ok?"ok":"no");
    fb.innerHTML=ok?`<b>Bonne réponse.</b>`:`<b>Raté&nbsp;: la bonne réponse est ${correct}.</b>${typo(shown.choices[correct])}`;
    const nb=$("#nextBtn");
    nb.style.display="inline-flex";
    nb.innerHTML=(Q.i+1>=Q.list.length)?`Voir le résultat${ic("i-arrow")}`:`Question suivante${ic("i-arrow")}`;
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

  /* ---------- RÉSULTAT ---------- */
  renderResults(){
    const Q=this.quiz, app=$("#app");
    const total=Q.list.length, correct=Q.correct, pct=Math.round(correct/total*100);
    const need=Math.ceil(total*EXAM_RATIO-1e-9), missing=Math.max(0,need-correct);
    const col=missing===0?"var(--ok)":(pct>=60?"var(--warn)":"var(--ko)");
    const verdict=missing===0?(correct===total?"Sans faute":"Niveau examen atteint"):`Encore ${missing} bonne${missing>1?"s":""} réponse${missing>1?"s":""}`;
    const C=2*Math.PI*52, off=C*(1-correct/total);
    const nMiss=Q.missed.length;
    this.setTop(`
      <div class="qnav"><button class="x" onclick="App.go('home')">${ic("i-back","sm")}Accueil</button></div>
      <div class="qtitle">${esc(Q.meta.title)}</div>`);
    const missHtml=Q.missed.map(item=>{const q=item.q,shown=item.shown;
      return `<div class="card mq">
        <div class="q">${typo(q.text)}</div>
        <div class="a">${ic("i-check","sm")}<span><b>${esc(shown.answer)}</b>&nbsp;· ${typo(shown.choices[shown.answer])}</span></div>
        <div class="m">Leçon ${esc(item.sid)} · ${esc(item.stitle)}</div>
      </div>`;}).join("");
    app.innerHTML=`
      <div class="card res">
        <div class="ring">
          <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" fill="none" stroke="#e3e1db" stroke-width="11"/>
            <circle cx="60" cy="60" r="52" fill="none" stroke="${col}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}"/></svg>
          <div class="pct"><b>${correct}/${total}</b><span>${pct}&nbsp;% de réussite</span></div>
        </div>
        <div class="verdict" style="color:${col}">${verdict}</div>
        <div class="thr">${missing?"pour atteindre ":""}le seuil de l'examen&nbsp;: ${need}/${total}${total===40?"":" (35/40 à l'examen officiel)"}</div>
        <div class="gauge" aria-hidden="true"><i style="width:${pct}%;background:${col}"></i><em style="left:${EXAM_RATIO*100}%"></em></div>
        <div class="glabel" aria-hidden="true"><span style="left:0">0</span><span style="left:${EXAM_RATIO*100}%;transform:translateX(-100%);padding-right:6px">seuil ${need}</span><span style="right:0">${total}</span></div>
        <div class="ra">
          ${nMiss?`<button class="btn btn-primary" onclick="App.retryMissed()">${ic("i-retry")}${nMiss>1?"Rejouer mes "+nMiss+" erreurs":"Rejouer mon erreur"}</button>`:""}
          <button class="btn btn-ghost" onclick="App.retryAll()">Refaire la série</button>
        </div>
      </div>
      ${nMiss?`<div class="sect"><h2>${nMiss>1?"Tes erreurs":"Ton erreur"}</h2><span>${nMiss}</span></div>${missHtml}`:""}`;
  },
  retryMissed(){const m=this.quiz.missed.slice();this.startQuiz(shuffle(m),{title:this.quiz.meta.title+" · rattrapage",key:null,themeNum:this.quiz.meta.themeNum,back:this.quiz.meta.back});},
  retryAll(){this.startQuiz(this.quiz.list.slice(),this.quiz.meta);},

  /* ---------- ECF : 100 questions de l'examinateur ---------- */
  ecf:{i:0,revealed:false},
  renderEcfList(){
    const app=$("#app"), D=window.ECF_DATA||[];
    this.setTop(`
      ${this.crumb([{label:"Accueil",go:"App.go('home')"},{label:"Examinateur"}])}
      <h1 class="ptitle"><small>ORAL DU JOUR J</small>Les 100 questions de l'examinateur</h1>
      <div class="row-btns">
        <button class="btn btn-main" onclick="App.openEcf(0)">${ic("i-play")}Commencer à la fiche 1</button>
        <button class="btn btn-dark" onclick="App.openEcf(Math.floor(Math.random()*${D.length||1}))">${ic("i-shuffle")}Au hasard</button>
      </div>`);
    const rows=D.map((f,idx)=>{
      const first=(f.pairs[0]&&f.pairs[0].q)||("Fiche "+f.n);
      return `<div class="subrow clickable" role="button" tabindex="0" onclick="App.openEcf(${idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();App.openEcf(${idx})}">
        <div class="sid">${String(f.n).padStart(2,'0')}</div>
        <div class="meta"><b>${typo(first)}</b><span>${f.pairs.length} points · vérification, sécurité, secours</span></div>
        <span style="color:var(--accent)">${ic("i-arrow")}</span>
      </div>`;
    }).join("");
    app.innerHTML=`<div class="card" style="padding:4px 0">${rows||'<p style="padding:16px">Données indisponibles.</p>'}</div>`;
  },
  openEcf(i){this.ecf={i:i,revealed:false};this.go("ecfCard");},
  fmtAnswer(a){
    return (a||"").split("\n").map(l=>{l=l.trim();if(!l)return"";
      return l.indexOf("• ")===0?`<div class="ecf-li">${typo(l.slice(2))}</div>`:`<div>${typo(l)}</div>`;}).join("");
  },
  renderEcfCard(){
    const app=$("#app"), D=window.ECF_DATA||[], i=this.ecf.i, f=D[i];
    if(!f){this.go("ecfList");return;}
    this.setTop(`
      ${this.crumb([{label:"Accueil",go:"App.go('home')"},{label:"Examinateur",go:"App.go('ecfList')"},{label:"Fiche "+f.n}])}
      <div class="qcount"><b>Fiche ${f.n}</b><span>sur ${D.length}</span></div>
      <div class="qbar"><i style="width:${Math.round((i+1)/D.length*100)}%"></i></div>`);
    let blocks="";
    f.pairs.forEach((p,bi)=>{
      const demo=p.kind==="demo";
      const label=demo?`${ic("i-hand","sm")}À montrer dans le véhicule`:`${ic("i-help","sm")}Question`;
      const disp=this.ecf.revealed?"block":"none";
      let ans="";
      if(p.a) ans=`<div class="ecf-ans" id="ans${bi}" style="display:${disp}">${App.fmtAnswer(p.a)}</div>`;
      else if(demo) ans=`<div class="ecf-ans demo-note" id="ans${bi}" style="display:${disp}">Geste à effectuer dans le véhicule (rien à dire à l'examinateur).</div>`;
      blocks+=`<div class="ecf-block">
        <div class="ecf-label ${demo?"demo":""}">${label}</div>
        <div class="ecf-q">${typo(p.q)}</div>
        ${(p.a||demo)?`<button class="btn btn-ghost mini" onclick="App.revealEcf(${bi})">${ic("i-eye","sm")}Voir la réponse</button>`:""}
        ${ans}
      </div>`;
    });
    app.innerHTML=`
      <div class="card" style="padding:4px 16px 16px">
        <div class="qtags" style="margin:12px 0 0"><button class="listen" style="margin-left:0" onclick="App.readEcf()">${ic("i-speaker","sm")}Écouter la fiche</button></div>
        ${blocks}
        <button class="btn btn-ghost" style="width:100%;margin-top:8px" onclick="App.revealAllEcf()">${ic("i-eye","sm")}Tout révéler</button>
      </div>
      <div class="ecf-nav" style="margin-top:14px">
        <button class="btn btn-ghost" ${i<=0?"disabled":""} onclick="App.ecfNav(-1)">${ic("i-back","sm")}Précédente</button>
        <button class="btn btn-primary" ${i>=D.length-1?"disabled":""} onclick="App.ecfNav(1)">Suivante${ic("i-arrow","sm")}</button>
      </div>`;
    if(Store.get("autoread",true)){
      const chunks=[]; f.pairs.forEach(p=>{if(p.q)chunks.push(p.q);}); TTS.speakChunks(chunks);
    }
  },
  revealEcf(bi){const e=$("#ans"+bi);if(e){e.style.display="block";const p=(window.ECF_DATA[this.ecf.i].pairs[bi]);if(p&&p.a){TTS.unlock();TTS.speak(p.a);}}},
  revealAllEcf(){this.ecf.revealed=true;document.querySelectorAll(".ecf-ans").forEach(e=>e.style.display="block");},
  readEcf(){TTS.unlock();const f=window.ECF_DATA[this.ecf.i];const c=[];f.pairs.forEach(p=>{if(p.q)c.push(p.q);if(p.a&&this.ecf.revealed)c.push(p.a);});TTS.speakChunks(c);},
  ecfNav(d){const D=window.ECF_DATA||[];let n=this.ecf.i+d;if(n<0)n=0;if(n>=D.length)n=D.length-1;this.ecf={i:n,revealed:false};this.go("ecfCard");},

  /* ---------- PROGRESSION ---------- */
  renderStats(){
    const app=$("#app"), st=Store.st;
    this.setTop(`
      ${this.crumb([{label:"Accueil",go:"App.go('home')"},{label:"Ma progression"}])}
      <h1 class="ptitle">Ma progression</h1>`);
    const dataCard=`<div class="panel"><div class="card-h">${ic("i-sliders","sm")}Données</div><div class="actions-row">
        <button class="btn btn-ghost" onclick="App.exportProgress()">${ic("i-download","sm")}Exporter</button>
        <button class="btn btn-ghost" onclick="document.getElementById('importFile').click()">${ic("i-upload","sm")}Importer</button>
        <button class="btn btn-ghost danger" onclick="App.resetProgress()">${ic("i-trash","sm")}Réinitialiser</button>
      </div>
      <div class="hint">Exporte ta progression pour la transférer entre ton PC et ton iPhone ou iPad : les statistiques sont enregistrées séparément sur chaque appareil.</div></div>`;
    if(!st.totalAnswered){
      app.innerHTML=`
        <div class="panel"><div class="empty">
          <div class="big">${ic("i-chart")}</div>
          <b>Pas encore de statistiques</b>
          <p style="margin-top:6px">Réponds à quelques questions : ta précision, tes points faibles et ta progression apparaîtront ici.</p>
          <button class="btn btn-primary" style="margin-top:14px" onclick="App.go('home')">${ic("i-target","sm")}Commencer à réviser</button>
        </div></div>${dataCard}`;
      return;
    }
    const acc=Math.round(st.totalCorrect/st.totalAnswered*100);
    const stk=Store.streak();
    const tone=v=>v>=EXAM_RATIO*100?"var(--ok)":v>=60?"var(--warn)":"var(--ko)";
    const kpis=`<div class="kpis">
      <div class="kpi"><b>${st.totalAnswered}</b><span>questions répondues</span></div>
      <div class="kpi"><b style="color:${tone(acc)}">${acc}&nbsp;%</b><span>précision globale</span></div>
      <div class="kpi"><b>${stk.current}</b><span>jour${stk.current>1?"s":""} d'affilée</span></div>
      <div class="kpi"><b>${st.sessions.length}</b><span>séries terminées</span></div>
    </div>`;
    const C=2*Math.PI*52, off=C*(1-st.totalCorrect/st.totalAnswered), rc=tone(acc);
    const ring=`<div class="panel"><div class="card-h">${ic("i-target","sm")}Précision globale</div>
      <div class="ringrow">
        <div class="ring" style="width:140px;height:140px">
          <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" fill="none" stroke="#e3e1db" stroke-width="11"/>
          <circle cx="60" cy="60" r="52" fill="none" stroke="${rc}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}"/></svg>
          <div class="pct"><b style="font-size:30px">${acc}&nbsp;%</b><span>${st.totalCorrect}/${st.totalAnswered}</span></div>
        </div>
        <p>${acc>=88?"Tu es au niveau de l'examen officiel (35/40). Continue ainsi.":
            acc>=70?"Tu progresses bien. Vise 88 % pour atteindre le niveau de l'examen.":
            "Encore du travail : concentre-toi sur tes points faibles ci-dessous."}</p>
      </div></div>`;
    let tbars="";
    DATA.themes.forEach((t,i)=>{
      const d=st.themes[t.num]; if(!d||!d.a)return;
      const a=Math.round(d.c/d.a*100);
      tbars+=`<button class="tbar" onclick="App.go('theme',{ti:${i}})">
        <span class="tlabel">${themeIcon(i)}${esc(sentenceCase(t.title))}</span>
        <span class="track"><i style="width:${a}%;background:${tone(a)}"></i></span>
        <span class="tval">${a}&nbsp;% · ${d.c}/${d.a}</span>
      </button>`;
    });
    const themeCard=tbars?`<div class="panel"><div class="card-h">${ic("i-book","sm")}Précision par thème <small>touche un thème pour le réviser</small></div>${tbars}</div>`:"";
    const days=[]; for(let i=13;i>=0;i--){const ds=addDays(todayStr(),-i);days.push({ds,a:(st.days[ds]&&st.days[ds].a)||0});}
    const maxA=Math.max(1,...days.map(d=>d.a));
    const WD=["D","L","M","M","J","V","S"];
    const dcols=days.map(d=>{
      const h=Math.round(d.a/maxA*100), p=d.ds.split("-"), wd=WD[new Date(p[0],p[1]-1,p[2]).getDay()];
      return `<div class="day" title="${d.ds} : ${d.a} question(s)"><div class="col${d.a?"":" zero"}" style="height:${d.a?Math.max(h,4):4}%"></div><small>${wd}</small></div>`;
    }).join("");
    const totalWeek=days.reduce((a,d)=>a+d.a,0);
    const actCard=`<div class="panel"><div class="card-h">${ic("i-calendar","sm")}Activité des 14 derniers jours <small>${totalWeek} questions</small></div><div class="days">${dcols}</div></div>`;
    let trendCard="";
    const sess=st.sessions.slice(-20);
    if(sess.length>=2){
      const W=320,H=120,pad=8;
      const pts=sess.map((s,i)=>{const x=pad+i*(W-2*pad)/(sess.length-1);const y=H-pad-(s.c/s.n)*(H-2*pad);return [x,y];});
      const line=pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
      const area="M"+pad+","+(H-pad)+" L"+line.replace(/ /g," L")+" L"+(W-pad)+","+(H-pad)+" Z";
      const dots=pts.map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="#1f4f9e"/>`).join("");
      const last=Math.round(sess[sess.length-1].c/sess[sess.length-1].n*100);
      const yT=(H-pad-EXAM_RATIO*(H-2*pad)).toFixed(1);
      trendCard=`<div class="panel trend"><div class="card-h">${ic("i-chart","sm")}Progression <small>${sess.length} dernières séries · dernière&nbsp;: ${last}&nbsp;%</small></div>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          <line x1="${pad}" y1="${yT}" x2="${W-pad}" y2="${yT}" stroke="#a56a00" stroke-width="1" stroke-dasharray="4 4"/>
          <path d="${area}" fill="rgba(31,79,158,.10)"/>
          <polyline points="${line}" fill="none" stroke="#1f4f9e" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
          ${dots}
        </svg>
        <div style="font-size:12px;color:var(--muted);text-align:right;margin-top:4px">pointillés&nbsp;: seuil de l'examen (35/40)</div></div>`;
    }
    const weakArr=[];
    DATA.themes.forEach((t,i)=>{const d=st.themes[t.num];if(d&&d.a>=3){weakArr.push({i,t,acc:d.c/d.a,d});}});
    weakArr.sort((a,b)=>a.acc-b.acc);
    const weak=weakArr.filter(w=>w.acc<0.85).slice(0,3);
    const weakCard=weak.length?`<div class="panel"><div class="card-h">${ic("i-target","sm")}Tes points faibles</div>${weak.map(w=>`<div class="weak">
          <div class="wi">${themeIcon(w.i)}</div>
          <div class="wm"><b>${esc(sentenceCase(w.t.title))}</b><span>${Math.round(w.acc*100)}&nbsp;% de réussite · ${w.d.c}/${w.d.a}</span></div>
          <button class="btn btn-primary mini" onclick="App.startThemeQuiz(${w.i},true)">Réviser</button>
        </div>`).join("")}</div>`:"";
    app.innerHTML=`${kpis}${ring}${weakCard}${themeCard}${trendCard}${actCard}${dataCard}`;
  },
  exportProgress(){
    try{
      const blob=new Blob([Store.exportData()],{type:"application/json"});
      const url=URL.createObjectURL(blob), a=document.createElement("a");
      a.href=url; a.download="ma-progression-code.json"; document.body.appendChild(a); a.click();
      setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},500);
      toast("Progression exportée");
    }catch(e){toast("Export impossible");}
  },
  resetProgress(){
    if(confirm("Effacer TOUTE ta progression (stats, historique) ? Cette action est irréversible."))
    {Store.reset();toast("Progression réinitialisée");this.go("stats");}
  },

  /* ---------- Réglages ---------- */
  openSettings(){$("#modalBg").classList.add("show");this.fillVoices();},
  closeSettings(){$("#modalBg").classList.remove("show");},
  fillVoices(){
    const sel=$("#selVoice"); if(!sel)return; sel.innerHTML="";
    const natural=el("option",null,"Automatique · voix la plus naturelle (conseillé)");natural.value="auto:natural";sel.appendChild(natural);
    const offline=el("option",null,"Automatique · voix française locale uniquement");offline.value="auto:offline";sel.appendChild(offline);
    if(TTS.voices.length){
      const group=document.createElement("optgroup");group.label="Choisir manuellement";
      TTS.voices.forEach(voice=>{
        const meta=TTS_CORE.voiceMeta(voice);
        const option=el("option",null,`${voice.name} (${voice.lang}) · ${meta.quality} · ${voice.localService?"locale":"service distant"}`);
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
    const quality=el("span","voice-chip",meta.quality==="naturelle"?"Voix naturelle":(meta.quality==="améliorée"?"Voix améliorée":"Voix standard"));
    const locality=el("span","voice-chip "+(meta.local?"local":"remote"),meta.local?"Locale, hors ligne":"Service vocal distant");
    const name=el("span","voice-chip name",TTS.voice.name);name.title=TTS.voice.name;
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
      rd.onload=()=>{try{Store.importData(JSON.parse(rd.result));toast("Progression importée");App.go("stats");}catch(err){toast("Fichier invalide");}};
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
