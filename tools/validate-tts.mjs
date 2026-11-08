import fs from "node:fs";
import vm from "node:vm";

const context={window:{}};
vm.runInNewContext(fs.readFileSync("tts.js","utf8"),context,{filename:"tts.js"});
const core=context.window.CODE_TTS_CORE;
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const voices=[
  {name:"Microsoft Aria Online (Natural)",lang:"en-US",localService:false,default:true,voiceURI:"aria"},
  {name:"Microsoft Sylvie Online (Natural)",lang:"fr-CA",localService:false,default:false,voiceURI:"sylvie"},
  {name:"Microsoft Denise Online (Natural)",lang:"fr-FR",localService:false,default:false,voiceURI:"denise"},
  {name:"Microsoft Hortense Desktop",lang:"fr-FR",localService:true,default:false,voiceURI:"hortense"}
];

assert(core.selectVoice(voices,{mode:"natural"})?.voiceURI==="denise","Le mode naturel doit préférer Denise Natural en français de France");
assert(core.selectVoice(voices,{mode:"offline"})?.voiceURI==="hortense","Le mode hors ligne doit sélectionner uniquement une voix locale");
assert(core.selectVoice(voices,{mode:"manual",voiceURI:"sylvie"})?.voiceURI==="sylvie","Le choix manuel doit être respecté");
assert(core.selectVoice(voices.slice(0,1),{mode:"natural"})===null,"Une voix non française ne doit jamais servir de repli");
assert(core.selectVoice(voices.filter(v=>!v.localService),{mode:"offline"})===null,"Le mode hors ligne ne doit jamais accepter une voix distante");

const normalized=core.normalizeSpeech("Le 1er contrôle en ZFE-m est limité à 50 km/h et vérifié dans le FVA.");
assert(normalized.includes("premier contrôle"),"La date « 1er » doit être correctement prononcée");
assert(normalized.includes("zone à faibles émissions mobilité"),"ZFE-m doit être développé à l'oral");
assert(normalized.includes("50 kilomètres heure"),"km/h doit être développé à l'oral");
assert(normalized.includes("fichier des véhicules assurés"),"FVA doit être développé à l'oral");

const longText=("Cette phrase explique une règle de sécurité avec suffisamment de détails pour tester la segmentation naturelle. ").repeat(8);
const segments=core.segmentSpeech(longText,180);
assert(segments.length>1&&segments.every(segment=>segment.length<=180),"Les longs cours doivent être segmentés sans ancien réveil pause/reprise");

const sequence=core.quizSequence({text:"Question ?",choices:{A:"Choix un",B:"Choix deux"}},["A","B"]);
assert(sequence.length===2,"Une question et ses choix doivent former deux blocs prosodiques");
assert(sequence[0].pauseAfter===320,"Une pause doit séparer la question des réponses");
assert(sequence[1].text.includes("Réponse A")&&sequence[1].text.includes("Réponse B"),"Les choix doivent être regroupés dans un même bloc");

// Le code de l'application est dans app.js depuis le durcissement CSP (PR #3).
const index=fs.readFileSync("index.html","utf8");
const app=fs.readFileSync("app.js","utf8");
const sw=fs.readFileSync("sw.js","utf8");
assert(index.includes('<script src="tts.js"></script>'),"tts.js doit être chargé par l'application");
assert(index.indexOf('src="tts.js"')<index.indexOf('src="app.js"'),"tts.js doit être chargé avant app.js");
assert(!app.includes("setInterval(()=>{try{if(speechSynthesis.speaking)"),"L'ancien réveil pause/reprise toutes les neuf secondes doit être supprimé");
assert(app.includes("_runId"),"La lecture doit être protégée contre les callbacks d'une ancienne session");
assert(app.includes("voix française locale uniquement"),"Le choix hors ligne doit être visible dans les réglages");
assert(sw.includes('"./tts.js"'),"tts.js doit être inclus dans le cache hors ligne");

if(failures.length){
  console.error("ÉCHEC DE VALIDATION TTS");
  failures.forEach(failure=>console.error(`- ${failure}`));
  process.exitCode=1;
}else{
  console.log("OK — sélection naturelle/locale, prononciation, pauses et protection anti-chevauchement validées.");
}
