/* ============================================================
   visuals.js — Bibliothèque d'illustrations SVG pour le Code de la Route
   API : CODE_VISUALS.render(spec) -> chaîne SVG (ou "")
   Tous les visuels sont vectoriels, précis et fonctionnent hors-ligne.
   ============================================================ */
(function(){
  "use strict";
  const RAD = Math.PI/180;
  const f = n => (Math.round(n*100)/100);
  function polar(cx,cy,r,deg){return [f(cx+r*Math.cos(deg*RAD)), f(cy - r*Math.sin(deg*RAD))];}
  function svg(w,h,inner){
    return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" class="cdlr-visual" role="img">${inner}</svg>`;
  }
  const C = {red:"#d6181f",blue:"#0d3a86",white:"#ffffff",black:"#111418",grey:"#8a96a3",
    road:"#5b636b",roadDark:"#474e55",line:"#f4f6f8",green:"#1faa4e",amber:"#f3a712",
    sky:"#cfe6f7",grass:"#bfe3a8",ink:"#1f2733"};

  /* ---------- COMPTEUR DE VITESSE ---------- */
  function speedometer(s){
    const speed = Math.max(0, +s.speed||0);
    const limit = s.limit!=null ? +s.limit : null;
    let max = Math.max(80, Math.ceil((speed*1.18)/20)*20);
    if(max>260) max=260;
    const W=270,H=210, cx=135, cy=130, R=104;
    const a0=210, a1=-30, sweep=a0-a1; // 240°
    const ang = v => a0 - (Math.min(v,max)/max)*sweep;
    let inner = `<rect x="3" y="3" width="${W-6}" height="${H-6}" rx="18" fill="#0f172a"/>`;
    // arc de fond
    const [sx,sy]=polar(cx,cy,R,a0), [ex,ey]=polar(cx,cy,R,a1);
    inner += `<path d="M ${sx} ${sy} A ${R} ${R} 0 1 1 ${ex} ${ey}" fill="none" stroke="#283549" stroke-width="14" stroke-linecap="round"/>`;
    // zone rouge (au-delà de la limite) si limit fournie
    if(limit!=null && limit<max){
      const [lx,ly]=polar(cx,cy,R,ang(limit));
      inner += `<path d="M ${lx} ${ly} A ${R} ${R} 0 ${ (ang(limit)-a1)>180?1:0 } 1 ${ex} ${ey}" fill="none" stroke="${C.red}" stroke-width="14" stroke-linecap="round" opacity=".9"/>`;
    }
    // graduations
    for(let v=0; v<=max; v+=20){
      const A=ang(v), [x1,y1]=polar(cx,cy,R-12,A), [x2,y2]=polar(cx,cy,R-2,A);
      inner += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9fb0c7" stroke-width="2.4"/>`;
      const [tx,ty]=polar(cx,cy,R-26,A);
      inner += `<text x="${tx}" y="${ty+4}" fill="#cdd9ea" font-size="13" font-family="Arial" text-anchor="middle">${v}</text>`;
    }
    for(let v=10; v<max; v+=20){const A=ang(v),[x1,y1]=polar(cx,cy,R-7,A),[x2,y2]=polar(cx,cy,R-2,A);
      inner += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#5b6b82" stroke-width="1.4"/>`;}
    // aiguille
    const A=ang(speed), [nx,ny]=polar(cx,cy,R-16,A), [bx,by]=polar(cx,cy,16,A-180);
    inner += `<line x1="${bx}" y1="${by}" x2="${nx}" y2="${ny}" stroke="${C.red}" stroke-width="4.5" stroke-linecap="round"/>`;
    inner += `<circle cx="${cx}" cy="${cy}" r="11" fill="#e8eef7" stroke="#0f172a" stroke-width="3"/>`;
    // afficheur numérique
    inner += `<rect x="${cx-46}" y="${cy+24}" width="92" height="34" rx="8" fill="#0b1220" stroke="#283549"/>`;
    inner += `<text x="${cx}" y="${cy+47}" fill="#ffffff" font-size="22" font-weight="bold" font-family="Arial" text-anchor="middle">${speed} <tspan font-size="12" fill="#9fb0c7">km/h</tspan></text>`;
    inner += `<text x="${cx}" y="42" fill="#7d8ba1" font-size="12" font-family="Arial" text-anchor="middle">COMPTEUR</text>`;
    // badge limite
    if(limit!=null){
      inner += `<g transform="translate(${W-40},42)">`+
        `<circle r="22" fill="#fff"/><circle r="22" fill="none" stroke="${C.red}" stroke-width="6"/>`+
        `<text y="6" font-size="20" font-weight="bold" font-family="Arial" text-anchor="middle" fill="${C.black}">${limit}</text></g>`;
    }
    return svg(W,H,inner);
  }

  /* ---------- PANNEAU DE LIMITATION DE VITESSE ---------- */
  function speedSign(value){
    const v=String(value), fs = v.length>=3?40:48;
    return svg(120,120,
      `<circle cx="60" cy="60" r="56" fill="#fff"/>`+
      `<circle cx="60" cy="60" r="50" fill="none" stroke="${C.red}" stroke-width="13"/>`+
      `<text x="60" y="60" font-size="${fs}" font-weight="900" font-family="Arial" text-anchor="middle" dominant-baseline="central" fill="${C.black}">${v}</text>`);
  }
  function endSpeed(value){
    const v=String(value);
    return svg(120,120,
      `<circle cx="60" cy="60" r="56" fill="#fff"/>`+
      `<circle cx="60" cy="60" r="52" fill="none" stroke="#5b636b" stroke-width="6"/>`+
      `<text x="60" y="60" font-size="46" font-weight="800" font-family="Arial" text-anchor="middle" dominant-baseline="central" fill="#6b7280">${v}</text>`+
      `<line x1="22" y1="96" x2="98" y2="24" stroke="#3b4250" stroke-width="6"/>`+
      `<line x1="30" y1="100" x2="106" y2="28" stroke="#3b4250" stroke-width="6"/>`);
  }

  /* ---------- PANNEAUX RÉGLEMENTAIRES (catalogue) ---------- */
  const SIGNS = {
    stop(){
      const pts=[];for(let i=0;i<8;i++){const a=22.5+i*45;pts.push(polar(60,60,56,a).join(","));}
      return svg(120,120,
        `<polygon points="${pts.join(' ')}" fill="${C.red}"/>`+
        `<polygon points="${pts.join(' ')}" fill="none" stroke="#fff" stroke-width="4"/>`+
        `<text x="60" y="60" font-size="30" font-weight="900" font-family="Arial" text-anchor="middle" dominant-baseline="central" fill="#fff" letter-spacing="1">STOP</text>`);
    },
    yield(){
      return svg(120,120,
        `<polygon points="60,104 8,16 112,16" fill="#fff"/>`+
        `<polygon points="60,104 8,16 112,16" fill="none" stroke="${C.red}" stroke-width="12" stroke-linejoin="round"/>`);
    },
    no_entry(){
      return svg(120,120,
        `<circle cx="60" cy="60" r="56" fill="${C.red}"/>`+
        `<rect x="24" y="50" width="72" height="20" rx="3" fill="#fff"/>`);
    },
    no_overtaking(){
      return svg(120,120,
        `<circle cx="60" cy="60" r="56" fill="#fff"/>`+
        `<circle cx="60" cy="60" r="50" fill="none" stroke="${C.red}" stroke-width="11"/>`+
        car(40,72,C.red,true)+car(80,72,"#2b3440",true));
    },
    no_overtaking_end(){
      return svg(120,120,
        `<circle cx="60" cy="60" r="56" fill="#fff"/>`+
        `<circle cx="60" cy="60" r="52" fill="none" stroke="#5b636b" stroke-width="5"/>`+
        car(40,72,"#9aa3ad",true)+car(80,72,"#9aa3ad",true)+
        `<line x1="24" y1="96" x2="96" y2="24" stroke="#3b4250" stroke-width="6"/>`);
    },
    no_parking(){
      return svg(120,120,
        `<circle cx="60" cy="60" r="56" fill="${C.blue}"/>`+
        `<circle cx="60" cy="60" r="50" fill="none" stroke="${C.red}" stroke-width="11"/>`+
        `<line x1="28" y1="92" x2="92" y2="28" stroke="${C.red}" stroke-width="11"/>`);
    },
    no_stopping(){
      return svg(120,120,
        `<circle cx="60" cy="60" r="56" fill="${C.blue}"/>`+
        `<circle cx="60" cy="60" r="50" fill="none" stroke="${C.red}" stroke-width="11"/>`+
        `<line x1="28" y1="92" x2="92" y2="28" stroke="${C.red}" stroke-width="11"/>`+
        `<line x1="28" y1="28" x2="92" y2="92" stroke="${C.red}" stroke-width="11"/>`);
    },
    no_vehicles(){
      return svg(120,120,`<circle cx="60" cy="60" r="56" fill="#fff"/><circle cx="60" cy="60" r="50" fill="none" stroke="${C.red}" stroke-width="13"/>`);
    },
    priority_road(){
      return svg(120,120,`<rect x="30" y="30" width="60" height="60" transform="rotate(45 60 60)" fill="#fcd116" stroke="#fff" stroke-width="7"/>`);
    },
    end_priority(){
      return svg(120,120,`<rect x="30" y="30" width="60" height="60" transform="rotate(45 60 60)" fill="#fcd116" stroke="#fff" stroke-width="7"/>`+
        `<line x1="34" y1="86" x2="86" y2="34" stroke="#3b4250" stroke-width="6"/>`);
    },
    parking(){
      return svg(120,120,`<rect x="14" y="14" width="92" height="92" rx="9" fill="${C.blue}"/>`+
        `<text x="60" y="62" font-size="64" font-weight="900" font-family="Arial" text-anchor="middle" dominant-baseline="central" fill="#fff">P</text>`);
    },
    dead_end(){
      return svg(120,120,`<rect x="14" y="14" width="92" height="92" rx="9" fill="${C.blue}"/>`+
        `<rect x="55" y="48" width="10" height="48" fill="#fff"/><rect x="36" y="38" width="48" height="10" fill="${C.red}"/>`);
    },
    one_way(){
      return svg(140,92,`<rect x="6" y="6" width="128" height="80" rx="9" fill="${C.blue}"/>`+
        `<path d="M 28,46 L 102,46 M 102,46 L 84,31 M 102,46 L 84,61" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
  };
  // petite voiture vue de dessus (pour panneaux dépassement)
  function car(cx,cy,col,small){
    const w=small?18:24,h=small?30:38;
    return `<g transform="translate(${cx-w/2},${cy-h/2})">`+
      `<rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="${col}"/>`+
      `<rect x="${w*0.18}" y="${h*0.16}" width="${w*0.64}" height="${h*0.22}" rx="2" fill="#dfe6ee" opacity=".85"/>`+
      `<rect x="${w*0.18}" y="${h*0.6}" width="${w*0.64}" height="${h*0.22}" rx="2" fill="#dfe6ee" opacity=".6"/></g>`;
  }

  /* ---------- PANNEAUX DE DANGER (triangle) ---------- */
  function dangerTriangle(picto){
    const inner = `<polygon points="60,12 110,100 10,100" fill="#fff"/>`+
      `<polygon points="60,16 105,98 15,98" fill="none" stroke="${C.red}" stroke-width="11" stroke-linejoin="round"/>`;
    const p = DANGER[picto]||DANGER.generic;
    return svg(120,118, inner + `<g transform="translate(60,72)">`+p+`</g>`);
  }
  const DANGER = {
    generic:`<text y="20" font-size="46" font-weight="900" font-family="Arial" text-anchor="middle" fill="${C.black}">!</text>`,
    bend_right:`<path d="M -8,24 C -8,2 8,2 8,-12 L 8,-22" fill="none" stroke="${C.black}" stroke-width="8" stroke-linecap="round"/><polygon points="8,-30 1,-16 15,-16" fill="${C.black}"/>`,
    bend_left:`<path d="M 8,24 C 8,2 -8,2 -8,-12 L -8,-22" fill="none" stroke="${C.black}" stroke-width="8" stroke-linecap="round"/><polygon points="-8,-30 -15,-16 -1,-16" fill="${C.black}"/>`,
    double_bend:`<path d="M -6,26 C -6,12 8,10 8,-2 C 8,-12 -6,-14 -6,-26" fill="none" stroke="${C.black}" stroke-width="7" stroke-linecap="round"/>`,
    slippery:`<rect x="-13" y="-6" width="26" height="14" rx="3" fill="${C.black}"/><circle cx="-7" cy="11" r="4" fill="${C.black}"/><circle cx="7" cy="11" r="4" fill="${C.black}"/><path d="M -20,22 q 8,-8 16,0 M 4,22 q 8,-8 16,0" fill="none" stroke="${C.black}" stroke-width="3"/>`,
    pedestrian:`<circle cx="0" cy="-18" r="6" fill="${C.black}"/><path d="M 0,-12 L 0,8 M 0,-6 L -9,2 M 0,-6 L 9,-2 M 0,8 L -7,24 M 0,8 L 7,22" stroke="${C.black}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    children:`<g transform="translate(-8,0) scale(.8)"><circle cx="0" cy="-16" r="5" fill="${C.black}"/><path d="M0,-11 L0,6 M0,-6 L-7,0 M0,-6 L7,-2 M0,6 L-6,20 M0,6 L6,18" stroke="${C.black}" stroke-width="4.5" fill="none" stroke-linecap="round"/></g><g transform="translate(9,2) scale(.95)"><circle cx="0" cy="-16" r="5" fill="${C.black}"/><path d="M0,-11 L0,6 M0,-6 L-7,-1 M0,-6 L7,2 M0,6 L-6,20 M0,6 L6,18" stroke="${C.black}" stroke-width="4.5" fill="none" stroke-linecap="round"/></g>`,
    animals:`<path d="M -18,16 L -14,-4 Q -12,-14 -2,-14 L 10,-14 Q 18,-14 18,-6 L 14,-6 Q 12,-10 6,-10 L 8,16 L 2,16 L 0,-2 L -8,-2 L -10,16 Z" fill="${C.black}"/><path d="M 12,-14 L 16,-24 M 16,-14 L 22,-22" stroke="${C.black}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    roadworks:`<circle cx="0" cy="-20" r="6" fill="${C.black}"/><path d="M0,-14 L0,4 M0,-9 L -10,-4 M0,-9 L 8,-14 L 18,-6" stroke="${C.black}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M -12,22 L 12,22 L 6,4 L -6,4 Z" fill="${C.black}"/>`,
    traffic_light:`<rect x="-9" y="-26" width="18" height="48" rx="5" fill="${C.black}"/><circle cx="0" cy="-15" r="5" fill="${C.red}"/><circle cx="0" cy="-1" r="5" fill="${C.amber}"/><circle cx="0" cy="13" r="5" fill="${C.green}"/>`,
    roundabout:`<g fill="none" stroke="${C.black}" stroke-width="6"><path d="M 0,-16 A 16,16 0 0 1 14,8"/><path d="M 14,8 A 16,16 0 0 1 -14,8"/><path d="M -14,8 A 16,16 0 0 1 0,-16"/></g><polygon points="0,-22 -7,-12 7,-12" fill="${C.black}"/>`,
    cyclists:`<circle cx="-12" cy="14" r="9" fill="none" stroke="${C.black}" stroke-width="4"/><circle cx="14" cy="14" r="9" fill="none" stroke="${C.black}" stroke-width="4"/><path d="M -12,14 L -2,-8 L 10,-8 M -2,-8 L 14,14 M -12,14 L 6,14" stroke="${C.black}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="2" cy="-16" r="5" fill="${C.black}"/>`,
    narrowing:`<path d="M -16,24 L -6,-22 M 16,24 L 6,-22" stroke="${C.black}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    bumps:`<path d="M -22,18 Q -11,-10 0,18 Q 11,-10 22,18" fill="none" stroke="${C.black}" stroke-width="7" stroke-linecap="round"/>`,
    priority_right_danger:`<path d="M 0,-22 L 0,22 M -22,0 L 22,0" stroke="${C.black}" stroke-width="7"/>`,
    descent:`<path d="M -22,-12 L 22,14" stroke="${C.black}" stroke-width="7" stroke-linecap="round"/><path d="M 22,14 l -3,-13 l 13,5 z" fill="${C.black}"/>`,
    ascent:`<path d="M -22,14 L 22,-12" stroke="${C.black}" stroke-width="7" stroke-linecap="round"/><path d="M 22,-12 l -13,-3 l 5,13 z" fill="${C.black}"/>`,
    wind:`<path d="M -22,-8 q 16,-9 28,-1 t 16,3" fill="none" stroke="${C.black}" stroke-width="5" stroke-linecap="round"/><path d="M -22,8 q 16,-9 28,-1 t 16,3" fill="none" stroke="${C.black}" stroke-width="5" stroke-linecap="round"/>`,
    two_way:`<path d="M -9,-22 L -9,22 M 9,-22 L 9,22 M -9,-22 L -15,-11 M -9,-22 L -3,-11 M 9,22 L 3,11 M 9,22 L 15,11" stroke="${C.black}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    tunnel:`<path d="M -20,22 L -20,-2 A 20,24 0 0 1 20,-2 L 20,22" fill="none" stroke="${C.black}" stroke-width="7" stroke-linejoin="round"/>`,
    slope:`<path d="M -22,16 L 22,-14" stroke="${C.black}" stroke-width="7" stroke-linecap="round"/>`
  };

  /* ---------- PANNEAUX D'OBLIGATION (rond bleu) ---------- */
  function obligation(picto){
    const arrows = {
      straight:`<path d="M 0,28 L 0,-20 M 0,-28 L -14,-10 M 0,-28 L 14,-10" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      left:`<path d="M 28,0 L -20,0 M -28,0 L -10,-14 M -28,0 L -10,14" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      right:`<path d="M -28,0 L 20,0 M 28,0 L 10,-14 M 28,0 L 10,14" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      straight_right:`<path d="M -10,28 L -10,-6 Q -10,-14 0,-14 L 18,-14 M 26,-14 L 10,-26 M 26,-14 L 10,-2" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      roundabout:`<g fill="none" stroke="#fff" stroke-width="8"><path d="M 2,-20 A 20,20 0 0 1 18,12"/><path d="M 18,12 A 20,20 0 0 1 -16,14"/><path d="M -16,14 A 20,20 0 0 1 0,-20"/></g><polygon points="6,-26 -4,-16 10,-12" fill="#fff"/>`,
      keep_right:`<path d="M 6,-26 C 6,-10 -16,8 -16,26 M 6,-26 L -6,-14 M 6,-26 L 14,-12" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      bike:`<circle cx="-13" cy="8" r="11" fill="none" stroke="#fff" stroke-width="4"/><circle cx="15" cy="8" r="11" fill="none" stroke="#fff" stroke-width="4"/><path d="M -13,8 L -2,-14 L 12,-14 M -2,-14 L 15,8 M -13,8 L 8,8" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`,
      pedestrian:`<circle cx="0" cy="-18" r="7" fill="#fff"/><path d="M0,-11 L0,9 M0,-5 L-10,1 M0,-5 L10,-1 M0,9 L-8,26 M0,9 L8,24" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>`
    };
    const p = arrows[picto]||arrows.straight;
    return svg(120,120, `<circle cx="60" cy="60" r="56" fill="${C.blue}"/><g transform="translate(60,60)">`+p+`</g>`);
  }

  /* ============================================================
     STYLE COMMUN DES SCHÉMAS (refonte novembre 2026)
     - Questions : toujours viewBox 320×200 (format 16/10), vue de dessus.
     - Couleurs douces, « Vous » = voiture bleue avec étiquette posée à côté
       (jamais sur la chaussée ni sur un autre élément).
     - Règle pédagogique conservée : le dessin ne montre jamais la réponse
       (pas de flèche « qui passe en premier », pas de croix « interdit »).
     ============================================================ */
  const FW=320, FH=200;
  const P={asphalt:"#4a5058",line:"#f7f7f4",grass:"#dfe8d3",walk:"#d6d3cb",you:"#1f4f9e",other:"#c9562c",
    grey:"#8a929a",ink:"#1c2126",bg:"#eef0ea",post:"#7c8288",glass:"#dfe9f5",island:"#c9dcb9",hint:"#e0a400"};
  const FONT='font-family="Segoe UI,system-ui,-apple-system,Roboto,Arial,sans-serif"';

  // Voiture vue de dessus, centrée en (x,y), qui pointe vers le haut avant rotation (degrés, sens horaire).
  function topCar(x,y,rot,color,o){
    o=o||{};
    const w=o.w||22,h=o.h||38;
    return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot||0)})">`+
      `<rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="5" fill="${color}"/>`+
      `<rect x="${-w/2+3}" y="${-h/2+6}" width="${w-6}" height="${h*0.19}" rx="2" fill="${P.glass}" opacity=".95"/>`+
      `<rect x="${-w/2+3}" y="${h/2-h*0.24}" width="${w-6}" height="${h*0.13}" rx="2" fill="${P.glass}" opacity=".6"/>`+
      (o.blink?`<circle cx="${w/2-1}" cy="${-h/2+4}" r="3.4" fill="${P.hint}" stroke="#fff" stroke-width="1"/>`:"")+`</g>`;
  }
  function pill(x,y,text,color,w){
    const width=w||Math.round(text.length*6.6+22);
    return `<g transform="translate(${f(x)},${f(y)})" ${FONT}><rect width="${width}" height="22" rx="11" fill="#fff" stroke="${color}" stroke-width="1.5"/>`+
      `<text x="${width/2}" y="15" text-anchor="middle" font-size="11.5" font-weight="700" fill="${color}">${text}</text></g>`;
  }
  const youTag=(x,y)=>pill(x-21,y-11,"Vous",P.you,42);
  function step(x,y,n,text,w){
    return `<g transform="translate(${x},${y})" ${FONT}><rect width="${w}" height="24" rx="12" fill="#fff" stroke="${P.you}" stroke-width="1.5"/>`+
      `<circle cx="12" cy="12" r="9" fill="${P.you}"/><text x="12" y="16" text-anchor="middle" font-size="11.5" font-weight="700" fill="#fff">${n}</text>`+
      `<text x="26" y="16.5" font-size="12" font-weight="600" fill="${P.ink}">${text}</text></g>`;
  }
  const dashLine=(x1,y1,x2,y2,len,gap,width)=>`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${P.line}" stroke-width="${width||3}" stroke-dasharray="${len||12} ${gap||10}"/>`;
  // Flèche de trajectoire (jaune) : tracé SVG + pointe orientée selon le dernier segment.
  function trail(d,ex,ey,dx,dy,color){
    const col=color||P.hint, n=Math.hypot(dx,dy)||1, ux=dx/n, uy=dy/n;
    const tip=[ex+ux*9,ey+uy*9], l=[ex-uy*6,ey+ux*6], r=[ex+uy*6,ey-ux*6];
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`+
      `<polygon points="${tip.map(f).join(",")} ${l.map(f).join(",")} ${r.map(f).join(",")}" fill="${col}"/>`;
  }
  // Insère un SVG existant (panneau, compteur…) dans le cadre 320×200.
  function nest(svgStr,x,y,w,h,align){
    return String(svgStr).replace(/^<svg viewBox="([^"]+)"[^>]*>/,`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="$1" preserveAspectRatio="${align||"xMidYMid"} meet">`);
  }
  // Panneau vu de face sur son poteau, au bord de la route.
  function roadside(signSvg){
    let s=`<rect width="${FW}" height="${FH}" fill="${P.bg}"/>`;
    s+=`<rect y="160" width="${FW}" height="40" fill="${P.grass}"/><rect y="178" width="${FW}" height="22" fill="${P.asphalt}"/>`;
    s+=dashLine(0,189,FW,189,14,12,2.5);
    s+=`<rect x="157" y="100" width="6" height="70" rx="2" fill="${P.post}"/>`;
    s+=nest(signSvg,104,-4,112,112,"xMidYMax"); // panneau posé sur le poteau, même rectangulaire
    return svg(FW,FH,s);
  }
  // Objet sur fond neutre (compteur, avant du véhicule).
  function plate(objSvg){
    return svg(FW,FH,`<rect width="${FW}" height="${FH}" fill="${P.bg}"/>`+nest(objSvg,20,8,280,184));
  }
  // Route verticale de largeur 140 (voie de droite = x 160–230), utilisée par plusieurs scènes.
  function verticalRoad(){
    return `<rect width="${FW}" height="${FH}" fill="${P.grass}"/><rect x="86" y="0" width="148" height="${FH}" fill="${P.walk}"/>`+
      `<rect x="90" y="0" width="140" height="${FH}" fill="${P.asphalt}"/>`;
  }

  /* ---------- FEU TRICOLORE (sur poteau, ligne d'arrêt, votre voiture) ---------- */
  function trafficLight(s){
    const state=s.state||"red", arrow=s.arrow||null;
    const on={red:state==="red",amber:state==="amber"||state==="orange",green:state==="green"};
    let g=verticalRoad()+dashLine(160,0,160,FH);
    g+=`<line x1="162" y1="98" x2="229" y2="98" stroke="${P.line}" stroke-width="5"/>`;
    g+=`<rect x="253" y="94" width="5" height="62" rx="2" fill="${P.post}"/>`;
    g+=`<rect x="237" y="10" width="38" height="88" rx="10" fill="#24292e"/>`;
    const lamp=(cy,col,active)=>(active?`<circle cx="256" cy="${cy}" r="15" fill="${col}" opacity=".22"/>`:"")+
      `<circle cx="256" cy="${cy}" r="10" fill="${active?col:"#3a4046"}"/>`;
    g+=lamp(30,"#e5483e",on.red)+lamp(54,"#f2a516",on.amber);
    if(arrow&&!on.green){ // flèche orange clignotante à côté du feu principal (tourne-à-droite au rouge)
      g+=`<rect x="280" y="66" width="26" height="26" rx="6" fill="#24292e"/><circle cx="293" cy="79" r="9" fill="#14181c"/>`+
        `<g transform="translate(293,79) scale(.55)">${arrowShape(arrow,"#f2a516")}</g>`;
    }
    if(arrow&&on.green){
      g+=`<circle cx="256" cy="78" r="10" fill="#14181c"/><g transform="translate(256,78) scale(.62)">${arrowShape(arrow,"#3fbf6e")}</g>`;
    }else g+=lamp(78,"#3fbf6e",on.green);
    g+=topCar(195,150,0,P.you)+youTag(132,150);
    return svg(FW,FH,g);
  }
  function arrowShape(dir,col){
    if(dir==="left")return `<path d="M 12,0 L -10,0 M -10,0 L 0,-9 M -10,0 L 0,9" stroke="${col}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    if(dir==="right")return `<path d="M -12,0 L 10,0 M 10,0 L 0,-9 M 10,0 L 0,9" stroke="${col}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    return `<path d="M 0,12 L 0,-10 M 0,-10 L -9,0 M 0,-10 L 9,0" stroke="${col}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  /* ---------- MARQUAGES AU SOL (vue de dessus) ---------- */
  function marking(id){
    const cx=160;
    const dash=x=>dashLine(x,0,x,FH,20,14,5);
    const solid=x=>`<rect x="${x-2.5}" y="0" width="5" height="${FH}" fill="${P.line}"/>`;
    let m="", carY=150;
    if(id==="continuous")m=solid(cx);
    else if(id==="dashed")m=dash(cx);
    else if(id==="mixed")m=solid(cx-6)+dash(cx+6);
    else if(id==="double_continuous")m=solid(cx-6)+solid(cx+6);
    else if(id==="zebra"){for(let x=98;x<226;x+=18)m+=`<rect x="${x}" y="58" width="10" height="56" fill="${P.line}"/>`;m+=dashLine(cx,0,cx,52,20,14,5)+dashLine(cx,120,cx,FH,20,14,5);carY=162;}
    else if(id==="stop_line"){m=dash(cx)+`<rect x="162" y="96" width="67" height="8" fill="${P.line}"/>`;carY=150;}
    else if(id==="give_way_line"){m=dash(cx);for(let x=164;x<224;x+=16)m+=`<path d="M ${x},96 l 12,0 l -6,10 Z" fill="${P.line}"/>`;carY=150;}
    else if(id==="cycle_lane"){
      m=dash(135)+`<rect x="192" y="0" width="4" height="${FH}" fill="${P.line}"/>`+
        `<g transform="translate(213,100) scale(.75)" stroke="${P.line}" stroke-width="3" fill="none"><circle cx="-10" cy="8" r="9"/><circle cx="12" cy="8" r="9"/><path d="M-10,8 L0,-10 L10,-10 M0,-10 L12,8 M-10,8 L6,8"/></g>`;
      return svg(FW,FH,verticalRoad()+m+topCar(164,150,0,P.you)+youTag(52,150));
    }
    else m=dash(cx);
    return svg(FW,FH,verticalRoad()+m+topCar(195,carY,0,P.you)+youTag(268,carY));
  }

  /* ---------- CARREFOURS (vue de dessus) ---------- */
  // Route horizontale y 70–130, route verticale x 130–190, conduite à droite.
  function crossroads(tee){
    let s=`<rect width="${FW}" height="${FH}" fill="${P.grass}"/>`;
    s+=`<rect x="0" y="66" width="${FW}" height="68" fill="${P.walk}"/>`;
    s+=tee?`<rect x="126" y="66" width="68" height="134" fill="${P.walk}"/>`:`<rect x="126" y="0" width="68" height="${FH}" fill="${P.walk}"/>`;
    s+=`<rect x="0" y="70" width="${FW}" height="60" fill="${P.asphalt}"/>`;
    s+=tee?`<rect x="130" y="70" width="60" height="130" fill="${P.asphalt}"/>`:`<rect x="130" y="0" width="60" height="${FH}" fill="${P.asphalt}"/>`;
    s+=dashLine(0,100,124,100)+dashLine(196,100,FW,100)+(tee?"":dashLine(160,0,160,64))+dashLine(160,138,160,FH);
    return s;
  }
  function postSign(x,y,inner){ // petit panneau de face sur poteau (inner : SVG 120×120)
    return `<rect x="${x-1.5}" y="${y}" width="3" height="30" fill="${P.post}"/>`+nest(inner,x-17,y-32,34,34);
  }
  function roundaboutScene(){
    const cx=160,cy=100;
    let s=`<rect width="${FW}" height="${FH}" fill="${P.grass}"/>`;
    s+=`<rect x="134" y="0" width="52" height="${FH}" fill="${P.asphalt}"/><rect x="0" y="74" width="${FW}" height="52" fill="${P.asphalt}"/>`;
    s+=`<circle cx="${cx}" cy="${cy}" r="72" fill="${P.asphalt}"/>`;
    s+=`<circle cx="${cx}" cy="${cy}" r="51" fill="none" stroke="${P.line}" stroke-width="2.5" stroke-dasharray="9 8" opacity=".85"/>`;
    s+=`<circle cx="${cx}" cy="${cy}" r="30" fill="${P.island}" stroke="${P.walk}" stroke-width="4"/>`;
    // Flèches neutres : sens de circulation dans l'anneau (antihoraire), rien de plus.
    const arc=(a1,a2)=>{const p1=polar(cx,cy,62,a1),p2=polar(cx,cy,62,a2),t=a2*RAD;
      return trail(`M ${p1[0]},${p1[1]} A 62 62 0 0 0 ${p2[0]},${p2[1]}`,p2[0],p2[1],-Math.sin(t),-Math.cos(t),P.line);};
    s+=arc(20,55)+arc(200,235);
    s+=`<line x1="161" y1="176" x2="185" y2="176" stroke="${P.line}" stroke-width="4" stroke-dasharray="6 4"/>`;
    s+=topCar(173,186,0,P.you,{w:18,h:30})+youTag(104,186);
    s+=topCar(222,100,0,P.other,{w:18,h:30});
    s+=topCar(116.9,56.9,-135,P.grey,{w:18,h:30});
    return svg(FW,FH,s);
  }
  function intersection(s){
    const id=s.id||"priority_right";
    if(id==="roundabout")return roundaboutScene();
    let g=crossroads(id==="t_junction");
    if(id==="yield"){
      g+=`<line x1="161" y1="135" x2="190" y2="135" stroke="${P.line}" stroke-width="4" stroke-dasharray="6 4"/>`;
      g+=`<polygon points="166,141 186,141 176,155" fill="none" stroke="${P.line}" stroke-width="2.5"/>`;
      g+=postSign(214,148,SIGNS.yield());
      g+=topCar(176,182,0,P.you)+youTag(116,184)+topCar(60,115,90,P.other);
    }else if(id==="stop"){
      g+=`<rect x="161" y="133" width="29" height="6" fill="${P.line}"/>`;
      g+=postSign(214,148,SIGNS.stop());
      g+=topCar(176,176,0,P.you)+youTag(116,180);
    }else if(id==="priority_right"){
      g+=topCar(176,176,0,P.you)+youTag(116,180)+topCar(262,85,-90,P.other);
    }else if(id==="t_junction"){
      g+=topCar(176,176,0,P.you)+youTag(116,180);
    }else{
      g+=topCar(176,176,0,P.you)+youTag(116,180)+topCar(262,85,-90,P.other);
    }
    return svg(FW,FH,g);
  }

  /* ---------- GUIDES PÉDAGOGIQUES : CARREFOUR À SENS GIRATOIRE (leçon 2.11) ----------
     Cadre 400×262. Anneau centré (200,131) : îlot r 36, chaussée jusqu'à r 76,
     voie extérieure r ≈ 66, voie intérieure r ≈ 46. Voies d'accès : x 172–228 et y 103–159.
     Toutes les étiquettes sont dans l'herbe, jamais sur la chaussée. */
  function roundaboutGuide(mode){
    const W=400,H=262,cx=200,cy=131;
    let s=`<rect width="${W}" height="${H}" fill="${P.grass}"/>`;
    s+=`<rect x="172" y="0" width="56" height="${H}" fill="${P.asphalt}"/><rect x="0" y="103" width="${W}" height="56" fill="${P.asphalt}"/>`;
    s+=`<circle cx="${cx}" cy="${cy}" r="76" fill="${P.asphalt}"/>`;
    s+=`<circle cx="${cx}" cy="${cy}" r="56" fill="none" stroke="${P.line}" stroke-width="2.5" stroke-dasharray="9 8" opacity=".85"/>`;
    s+=`<circle cx="${cx}" cy="${cy}" r="36" fill="${P.island}" stroke="${P.walk}" stroke-width="4"/>`;
    s+=`<line x1="201" y1="211" x2="227" y2="211" stroke="${P.line}" stroke-width="4" stroke-dasharray="6 4"/>`;
    const pt=(r,a)=>polar(cx,cy,r,a);
    if(mode==="priority"){
      s+=topCar(153.3,177.7,135,P.other);
      s+=`<path d="M 112,203 L 140,190" stroke="${P.ink}" stroke-width="1.5"/>`+pill(14,192,"Déjà engagé",P.other,98);
      s+=topCar(214,240,0,P.you)+youTag(262,240);
      s+=step(8,10,1,"Ralentir",86)+step(8,40,2,"Regarder à gauche",140)+step(262,10,3,"S'engager si libre",132);
    }else if(mode==="lanes"){
      const a=pt(66,290),b=pt(66,345);
      s+=trail(`M 220,262 L 220,214 Q 220,197 ${a[0]},${a[1]} A 66 66 0 0 0 ${b[0]},${b[1]} Q 280,145 300,145 L 388,145`,388,145,1,0,P.you);
      const c=pt(46,300),d=pt(46,170);
      s+=trail(`M 206,262 L 206,214 Q 206,186 ${c[0]},${c[1]} A 46 46 0 1 0 ${d[0]},${d[1]} Q 140,117 120,117 L 12,117`,12,117,-1,0,"#d9822b");
      s+=topCar(220,242,0,P.you,{w:18,h:30})+topCar(223,91.2,-60,"#d9822b",{w:18,h:30});
      s+=pill(6,10,"Sortie proche : voie extérieure",P.you,190)+pill(6,38,"À gauche : intérieur possible","#b0641c",176);
      s+=pill(242,10,"Le marquage prime",P.ink,128);
      s+=youTag(262,242);
    }else{
      for(let x=292;x<330;x+=9)s+=`<rect x="${x}" y="106" width="5" height="50" fill="${P.line}" opacity=".95"/>`;
      const a=pt(66,300),b=pt(66,345);
      s+=trail(`M ${a[0]},${a[1]} A 66 66 0 0 0 ${b[0]},${b[1]} Q 280,145 300,145 L 388,145`,388,145,1,0,P.you);
      s+=topCar(246.7,177.7,45,P.you,{blink:true});
      s+=`<g transform="translate(352,82) scale(.8)" stroke="${P.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"><circle cx="-12" cy="10" r="9"/><circle cx="14" cy="10" r="9"/><path d="M-12 10 L-2 -8 L10 -6 L14 10 M-2 -8 L6 10 L-12 10"/><circle cx="0" cy="-16" r="4" fill="${P.ink}"/></g>`;
      s+=`<g transform="translate(312,186)" fill="${P.ink}"><circle cx="0" cy="-16" r="6"/><path d="M-5 -8 L6 -8 L10 14 L3 14 L0 1 L-4 14 L-11 14 Z"/></g>`;
      s+=step(8,10,1,"Clignotant à droite",150)+step(8,40,2,"Rétroviseur, angle mort",172);
      s+=step(236,224,3,"Piétons et cyclistes",158);
      s+=`<g ${FONT}><rect x="6" y="214" width="150" height="40" rx="10" fill="#fff" stroke="${P.ink}" stroke-width="1.2"/>`+
        `<text x="81" y="230" text-anchor="middle" font-size="11.5" font-weight="700" fill="${P.ink}">Ne jamais couper</text>`+
        `<text x="81" y="246" text-anchor="middle" font-size="11.5" font-weight="700" fill="${P.ink}">la voie extérieure</text></g>`;
    }
    return svg(W,H,s);
  }

  function lesson(id){
    if(id!=="2.11") return [];
    return [
      {
        kicker:"SCHÉMA 1 SUR 3 · PRIORITÉ",
        title:"Entrer sans gêner les véhicules déjà engagés",
        caption:"Ralentissez avant la ligne, observez la circulation dans l’anneau et ne vous engagez que si aucun usager prioritaire n’est contraint de freiner.",
        svg:roundaboutGuide("priority")
      },
      {
        kicker:"SCHÉMA 2 SUR 3 · PLACEMENT",
        title:"Choisir une voie sans transformer une pratique en obligation",
        caption:"Pour une sortie proche, restez en principe à l’extérieur. Pour aller à gauche ou faire demi-tour, la voie intérieure est possible si le marquage le permet ; chaque changement de voie doit rester sans danger.",
        svg:roundaboutGuide("lanes")
      },
      {
        kicker:"SCHÉMA 3 SUR 3 · SORTIE",
        title:"Signaler, contrôler, puis protéger les usagers vulnérables",
        caption:"Annoncez la sortie avec le clignotant droit, contrôlez rétroviseurs et angle mort, puis vérifiez le passage piéton et les cyclistes avant de quitter le giratoire.",
        svg:roundaboutGuide("exit")
      }
    ];
  }

  /* ---------- FEUX DU VÉHICULE (vue avant) ---------- */
  function vehicleLights(id){
    const W=220,H=150;
    let beams="";
    const left=46,right=174,ly=78;
    function beam(x,col,len,spread){return `<polygon points="${x},${ly} ${x-spread},${ly+len} ${x+spread},${ly+len}" fill="${col}" opacity=".5"/>`;}
    if(id==="main_beam"){beams=beam(left,"#fff7cc",62,28)+beam(right,"#fff7cc",62,28);}
    else if(id==="dipped"){beams=beam(left,"#fff7cc",34,18)+beam(right,"#fff7cc",34,18);}
    else if(id==="fog"){beams=beam(left,"#fff2b0",26,22)+beam(right,"#fff2b0",26,22);}
    else if(id==="position"){beams="";}
    const lampCol = id==="hazard"?C.amber:(id==="position"?"#ffd9a0":"#fff4c2");
    const blink = id==="hazard";
    let body=`<rect x="24" y="40" width="172" height="62" rx="16" fill="#243042"/>`+
      `<rect x="40" y="20" width="140" height="34" rx="12" fill="#2e3c52"/>`+
      `<rect x="60" y="24" width="100" height="22" rx="8" fill="#9fb4cf" opacity=".5"/>`+
      `<rect x="36" y="96" width="148" height="14" rx="6" fill="#1a2331"/>`;
    let lamps=`<ellipse cx="${left}" cy="${ly}" rx="16" ry="13" fill="${lampCol}" stroke="#cfd8e3" stroke-width="2"/>`+
      `<ellipse cx="${right}" cy="${ly}" rx="16" ry="13" fill="${lampCol}" stroke="#cfd8e3" stroke-width="2"/>`;
    if(blink) lamps=`<ellipse cx="26" cy="64" rx="9" ry="11" fill="${C.amber}"/><ellipse cx="194" cy="64" rx="9" ry="11" fill="${C.amber}"/>`+lamps.replace(new RegExp(lampCol,'g'),"#3a4658");
    return svg(W,H,`<rect width="${W}" height="${H}" fill="#1c2126" rx="14"/>`+beams+body+lamps);
  }

  /* ---------- SCÈNES (vue de dessus) ---------- */
  // DISTANCE DE SÉCURITÉ entre deux véhicules (voie de droite)
  function distance(){
    let s=verticalRoad()+dashLine(160,0,160,FH);
    s+=`<rect x="165" y="66" width="60" height="66" rx="4" fill="#fff" opacity=".14" stroke="${P.hint}" stroke-width="2" stroke-dasharray="6 4"/>`;
    s+=topCar(195,44,0,P.grey)+topCar(195,156,0,P.you);
    s+=`<path d="M 244,68 L 244,130 M 244,68 l -5,8 M 244,68 l 5,8 M 244,130 l -5,-8 M 244,130 l 5,-8" stroke="${P.ink}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    s+=`<text x="252" y="103" font-size="12" font-weight="700" fill="${P.ink}" ${FONT}>distance</text>`;
    s+=youTag(268,160);
    return svg(FW,FH,s);
  }

  // DÉPASSEMENT (ligne discontinue ou continue selon la question)
  function overtaking(spec){
    const forbidden = spec && spec.id === 'forbidden';
    let s=verticalRoad();
    s+=forbidden?`<rect x="157.5" y="0" width="5" height="${FH}" fill="${P.line}"/>`:dashLine(160,0,160,FH,20,14,5);
    s+=topCar(195,62,0,P.grey);
    s+=topCar(195,150,0,P.you)+youTag(268,150);
    return svg(FW,FH,s);
  }

  // INSERTION / SORTIE D'AUTOROUTE
  function motorway(spec){
    const id = (spec && spec.id) || 'insertion';
    let s=`<rect width="${FW}" height="${FH}" fill="${P.grass}"/>`;
    s+=`<rect x="196" y="0" width="108" height="${FH}" fill="${P.walk}"/><rect x="200" y="0" width="100" height="${FH}" fill="${P.asphalt}"/>`;
    s+=dashLine(250,0,250,FH,20,14,4);
    if(id==='exit'){
      s+=`<path d="M 200,74 Q 150,100 112,${FH} L 160,${FH} Q 178,140 200,128 Z" fill="${P.asphalt}"/>`;
      s+=dashLine(200,74,200,128,8,6,3);
      s+=trail(`M 225,30 Q 222,82 186,120`,186,120,-0.7,0.7);
      s+=topCar(150,162,-150,P.you)+youTag(74,160);
      s+=`<text x="16" y="24" font-size="13" font-weight="700" fill="${P.ink}" ${FONT}>Sortie</text>`;
    }else{
      s+=`<path d="M 112,${FH} Q 150,112 200,82 L 200,136 Q 176,148 160,${FH} Z" fill="${P.asphalt}"/>`;
      s+=dashLine(200,82,200,136,8,6,3);
      s+=trail(`M 150,140 Q 178,116 216,104`,216,104,1,-0.32);
      s+=topCar(138,166,32,P.you)+youTag(74,170);
      s+=`<text x="16" y="24" font-size="13" font-weight="700" fill="${P.ink}" ${FONT}>Insertion</text>`;
    }
    return svg(FW,FH,s);
  }

  // ANGLES MORTS D'UN POIDS LOURD (vu de dessus, cabine vers le haut)
  function blindSpot(){
    const z="rgba(184,50,42,.28)";
    let s=`<rect width="${FW}" height="${FH}" fill="${P.asphalt}"/>`+dashLine(100,0,100,FH,20,14,4)+dashLine(220,0,220,FH,20,14,4);
    s+=`<rect x="134" y="0" width="52" height="16" fill="${z}"/>`;            // devant la cabine
    s+=`<rect x="186" y="14" width="68" height="104" fill="${z}"/>`;          // côté droit (passager), le plus grand
    s+=`<rect x="98" y="34" width="36" height="46" fill="${z}"/>`;            // côté gauche, près de la cabine
    s+=`<rect x="134" y="186" width="52" height="14" fill="${z}"/>`;          // derrière la remorque
    s+=`<rect x="136" y="18" width="48" height="36" rx="7" fill="#243a55"/><rect x="141" y="22" width="38" height="10" rx="2" fill="${P.glass}"/>`;
    s+=`<rect x="134" y="58" width="52" height="128" rx="4" fill="#5a7391"/>`;
    s+=pill(8,168,"Zones d'angles morts","#b8322a",128);
    return svg(FW,FH,s);
  }

  /* ---------- DISPATCH ---------- */
  function render(spec){
    if(!spec||!spec.type) return "";
    try{
      switch(spec.type){
        case "speedometer": return plate(speedometer(spec));
        case "speed_sign": return roadside(speedSign(spec.value));
        case "end_speed": return roadside(endSpeed(spec.value));
        case "sign": return roadside((SIGNS[spec.id]||SIGNS.no_vehicles)());
        case "danger": return roadside(dangerTriangle(spec.picto));
        case "obligation": return roadside(obligation(spec.picto));
        case "traffic_light": return trafficLight(spec);
        case "marking": return marking(spec.id);
        case "intersection": return intersection(spec);
        case "roundabout_guide": return roundaboutGuide(spec.mode||"priority");
        case "vehicle_lights": return plate(vehicleLights(spec.id));
        case "distance": return distance();
        case "overtaking": return overtaking(spec);
        case "motorway": return motorway(spec);
        case "blind_spot": return blindSpot();
        default: return "";
      }
    }catch(e){return "";}
  }

  // Catalogue pour la galerie de test / référence des specs valides
  const CATALOG = [
    {label:"Compteur 90 (limite 80)",spec:{type:"speedometer",speed:90,limit:80}},
    {label:"Compteur 130",spec:{type:"speedometer",speed:130}},
    {label:"Limite 50",spec:{type:"speed_sign",value:50}},
    {label:"Limite 110",spec:{type:"speed_sign",value:110}},
    {label:"Fin limite 70",spec:{type:"end_speed",value:70}},
    {label:"STOP",spec:{type:"sign",id:"stop"}},
    {label:"Cédez",spec:{type:"sign",id:"yield"}},
    {label:"Sens interdit",spec:{type:"sign",id:"no_entry"}},
    {label:"Interdit dépasser",spec:{type:"sign",id:"no_overtaking"}},
    {label:"Stationnement interdit",spec:{type:"sign",id:"no_parking"}},
    {label:"Arrêt+stat. interdit",spec:{type:"sign",id:"no_stopping"}},
    {label:"Danger !",spec:{type:"danger",picto:"generic"}},
    {label:"Virage droite",spec:{type:"danger",picto:"bend_right"}},
    {label:"Chaussée glissante",spec:{type:"danger",picto:"slippery"}},
    {label:"Passage piétons (danger)",spec:{type:"danger",picto:"pedestrian"}},
    {label:"Enfants",spec:{type:"danger",picto:"children"}},
    {label:"Animaux",spec:{type:"danger",picto:"animals"}},
    {label:"Travaux",spec:{type:"danger",picto:"roadworks"}},
    {label:"Feu tricolore (danger)",spec:{type:"danger",picto:"traffic_light"}},
    {label:"Rond-point (danger)",spec:{type:"danger",picto:"roundabout"}},
    {label:"Cyclistes (danger)",spec:{type:"danger",picto:"cyclists"}},
    {label:"Oblig. tout droit",spec:{type:"obligation",picto:"straight"}},
    {label:"Oblig. à droite",spec:{type:"obligation",picto:"right"}},
    {label:"Oblig. rond-point",spec:{type:"obligation",picto:"roundabout"}},
    {label:"Piste cyclable",spec:{type:"obligation",picto:"bike"}},
    {label:"Feu rouge",spec:{type:"traffic_light",state:"red"}},
    {label:"Feu vert",spec:{type:"traffic_light",state:"green"}},
    {label:"Feu orange",spec:{type:"traffic_light",state:"amber"}},
    {label:"Feu flèche gauche",spec:{type:"traffic_light",state:"green",arrow:"left"}},
    {label:"Ligne continue",spec:{type:"marking",id:"continuous"}},
    {label:"Ligne discontinue",spec:{type:"marking",id:"dashed"}},
    {label:"Ligne mixte",spec:{type:"marking",id:"mixed"}},
    {label:"Passage piétons",spec:{type:"marking",id:"zebra"}},
    {label:"Ligne d'effet STOP",spec:{type:"marking",id:"stop_line"}},
    {label:"Carrefour priorité droite",spec:{type:"intersection",id:"priority_right"}},
    {label:"Rond-point",spec:{type:"intersection",id:"roundabout"}},
    {label:"Giratoire · priorité",spec:{type:"roundabout_guide",mode:"priority"}},
    {label:"Giratoire · placement",spec:{type:"roundabout_guide",mode:"lanes"}},
    {label:"Giratoire · sortie",spec:{type:"roundabout_guide",mode:"exit"}},
    {label:"STOP carrefour",spec:{type:"intersection",id:"stop"}},
    {label:"Cédez carrefour",spec:{type:"intersection",id:"yield"}},
    {label:"Feux de route",spec:{type:"vehicle_lights",id:"main_beam"}},
    {label:"Feux de croisement",spec:{type:"vehicle_lights",id:"dipped"}},
    {label:"Feux de brouillard",spec:{type:"vehicle_lights",id:"fog"}},
    {label:"Feux de détresse",spec:{type:"vehicle_lights",id:"hazard"}},
    {label:"Distance de sécurité",spec:{type:"distance"}},
    {label:"Dépassement",spec:{type:"overtaking",id:"car"}},
    {label:"Dépassement interdit",spec:{type:"overtaking",id:"forbidden"}},
    {label:"Insertion autoroute",spec:{type:"motorway",id:"insertion"}},
    {label:"Sortie autoroute",spec:{type:"motorway",id:"exit"}},
    {label:"Angles morts camion",spec:{type:"blind_spot"}},
    {label:"Route prioritaire",spec:{type:"sign",id:"priority_road"}},
    {label:"Fin priorité",spec:{type:"sign",id:"end_priority"}},
    {label:"Parking",spec:{type:"sign",id:"parking"}},
    {label:"Impasse",spec:{type:"sign",id:"dead_end"}},
    {label:"Sens unique",spec:{type:"sign",id:"one_way"}},
    {label:"Danger pente",spec:{type:"danger",picto:"descent"}},
    {label:"Danger vent",spec:{type:"danger",picto:"wind"}},
    {label:"Danger tunnel",spec:{type:"danger",picto:"tunnel"}},
    {label:"Circulation double sens",spec:{type:"danger",picto:"two_way"}}
  ];

  window.CODE_VISUALS = { render, lesson, catalog: CATALOG };
})();
