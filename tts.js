/* ============================================================
   tts.js — Sélection et préparation de la synthèse vocale
   Fonctions pures testables, sans dépendance réseau ni bibliothèque.
   ============================================================ */
(function(){
  "use strict";

  const NATURAL_RE=/natural|neural|enhanced|premium|am[eé]lior|wavenet|studio|haute définition|high definition|siri/i;
  const KNOWN_GOOD_RE=/denise|sylvie|audrey|aur[eé]lie|thomas|marie|henri|julie|paul|guillaume|virginie|charlotte|am[eé]lie/i;
  const COMPACT_RE=/compact|eloquence|reduced|desktop|hortense/i;

  function isFrench(voice){return /^fr(?:[-_]|$)/i.test(voice&&voice.lang||"");}
  function isFranceFrench(voice){return /^fr[-_]fr$/i.test(voice&&voice.lang||"");}
  function voiceText(voice){return `${voice&&voice.name||""} ${voice&&voice.voiceURI||""}`;}
  function isNatural(voice){return NATURAL_RE.test(voiceText(voice));}

  function scoreVoice(voice,mode="natural"){
    const text=voiceText(voice), lang=(voice&&voice.lang||"").toLowerCase();
    let score=0;
    if(/^fr[-_]fr$/.test(lang))score+=90;
    else if(/^fr/.test(lang))score+=50;
    else score-=500;
    if(isNatural(voice))score+=mode==="natural"?180:80;
    if(KNOWN_GOOD_RE.test(text))score+=35;
    if(COMPACT_RE.test(text))score-=70;
    if(voice&&voice.default)score+=5;
    if(mode==="offline")score+=voice&&voice.localService?400:-400;
    else if(voice&&voice.localService)score+=10;
    return score;
  }

  function sortVoices(voices,mode="natural"){
    return (voices||[]).filter(isFrench).slice().sort((a,b)=>{
      const delta=scoreVoice(b,mode)-scoreVoice(a,mode);
      return delta||String(a.name||"").localeCompare(String(b.name||""),"fr");
    });
  }

  function selectVoice(voices,{mode="natural",voiceURI=""}={}){
    const french=(voices||[]).filter(isFrench);
    if(mode==="manual"&&voiceURI){
      const manual=french.find(voice=>voice.voiceURI===voiceURI);
      if(manual)return manual;
    }
    const sorted=sortVoices(french,mode);
    if(mode==="offline"){
      const local=sorted.find(voice=>voice.localService);
      return local||null;
    }
    return sorted[0]||null;
  }

  function voiceMeta(voice){
    if(!voice)return {quality:"indisponible",local:false,label:"Aucune voix française détectée"};
    const quality=isNatural(voice)?"naturelle":(KNOWN_GOOD_RE.test(voiceText(voice))&&!COMPACT_RE.test(voiceText(voice))?"améliorée":"standard");
    const locality=voice.localService?"locale":"service distant";
    return {quality,local:!!voice.localService,label:`${voice.name} · ${quality} · ${locality}`};
  }

  const LEX=[
    [/\bADAS\b/g,"systèmes d’aide à la conduite"],
    [/\bAEB\b/g,"freinage automatique d’urgence"],
    [/\bZFE[- ]?m\b/gi,"zone à faibles émissions mobilité"],
    [/\bFVA\b/g,"fichier des véhicules assurés"],
    [/\bAAC\b/g,"conduite accompagnée"],
    [/\bABS\b/g,"A B S"],
    [/\bESP\b/g,"E S P"],
    [/\bANTS\b/g,"A N T S"],
    [/\b1er\b/gi,"premier"],
    [/\bIsofix\b/gi,"Isofix"]
  ];

  function normalizeSpeech(value){
    let text=String(value||"");
    text=text.replace(/ /g," ");
    text=text.replace(/[•▪●∙]/g," ");
    text=text.replace(/\s*->\s*|→/g," soit ");
    text=text.replace(/×/g," fois ");
    text=text.replace(/÷/g," divisé par ");
    text=text.replace(/~\s*(?=\d)/g,"environ ");
    text=text.replace(/\bkm\s*\/\s*h\b/gi," kilomètres heure ");
    text=text.replace(/\bmg\s*\/\s*l\b/gi," milligrammes par litre ");
    text=text.replace(/\bg\s*\/\s*l\b/gi," grammes par litre ");
    text=text.replace(/(\d)\s*-\s*(?=\d)/g,"$1 à ");
    text=text.replace(/(\d)\s*km\b/gi,"$1 kilomètres");
    text=text.replace(/\bkm\b/gi,"kilomètres");
    text=text.replace(/(\d)\s*cm\b/gi,"$1 centimètres");
    text=text.replace(/(\d)\s*mm\b/gi,"$1 millimètres");
    text=text.replace(/(\d)\s*m²/gi,"$1 mètres carrés");
    text=text.replace(/(\d)\s*m\b/g,"$1 mètres");
    text=text.replace(/(\d)\s*kg\b/gi,"$1 kilogrammes");
    text=text.replace(/(\d)\s*t\b/g,"$1 tonnes");
    text=text.replace(/(\d)\s*h\s*(\d{2})\b/g,"$1 heures $2");
    text=text.replace(/(\d)\s*h\b/g,"$1 heures");
    text=text.replace(/(\d)\s*min\b/gi,"$1 minutes");
    text=text.replace(/(\d)\s*g\b/g,"$1 grammes");
    text=text.replace(/(\d)\s*%/g,"$1 pour cent");
    text=text.replace(/%/g," pour cent ");
    text=text.replace(/(\d)\s*°\s*c\b/gi,"$1 degrés");
    text=text.replace(/(\d)\s*°/g,"$1 degrés");
    text=text.replace(/\bn[°º]\s*/gi,"numéro ");
    text=text.replace(/²/g," carré");
    text=text.replace(/\betc\.?/gi,"et cetera");
    for(const [pattern,replacement] of LEX)text=text.replace(pattern,replacement);
    return text.replace(/\s+/g," ").replace(/\s+([,;.!?])/g,"$1").trim();
  }

  function segmentSpeech(value,maxLength=220){
    const text=String(value||"").trim();
    if(!text)return [];
    const max=Math.max(120,Math.min(400,Number(maxLength)||220));
    let sentences=[];
    try{
      if(typeof Intl!=="undefined"&&Intl.Segmenter){
        sentences=Array.from(new Intl.Segmenter("fr",{granularity:"sentence"}).segment(text),row=>row.segment.trim()).filter(Boolean);
      }
    }catch(e){}
    if(!sentences.length)sentences=(text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[text]).map(part=>part.trim()).filter(Boolean);
    const chunks=[];
    for(const sentence of sentences){
      let rest=sentence;
      while(rest.length>max){
        const window=rest.slice(0,max+1);
        const candidates=[window.lastIndexOf("; "),window.lastIndexOf(", "),window.lastIndexOf(": "),window.lastIndexOf(" ")];
        let cut=Math.max(...candidates);
        if(cut<Math.floor(max*.55))cut=max;
        chunks.push(rest.slice(0,cut).trim());
        rest=rest.slice(cut).trim();
      }
      if(rest)chunks.push(rest);
    }
    return chunks;
  }

  function quizSequence(question,letters){
    const choices=(letters||[]).map(letter=>`Réponse ${letter}. ${question.choices[letter]}`).join(" … ");
    return [
      {text:question.text,rateFactor:.97,pauseAfter:320},
      {text:choices,rateFactor:1,pauseAfter:0}
    ];
  }

  window.CODE_TTS_CORE={
    isFrench,isFranceFrench,isNatural,scoreVoice,sortVoices,selectVoice,voiceMeta,
    normalizeSpeech,segmentSpeech,quizSequence
  };
})();
