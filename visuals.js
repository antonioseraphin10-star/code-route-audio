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
    priority_right_danger:`<path d="M 0,-22 L 0,22 M -22,0 L 22,0" stroke="${C.black}" stroke-width="7"/>`
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

  /* ---------- FEU TRICOLORE ---------- */
  function trafficLight(s){
    const state=s.state||"red", arrow=s.arrow||null;
    const on={red:state==="red",amber:state==="amber"||state==="orange",green:state==="green"};
    const lamp=(cy,col,active)=>`<circle cx="45" cy="${cy}" r="17" fill="${active?col:"#2a2f36"}" ${active?`filter="url(#glow)"`:""}/>`;
    let g=`<defs><filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    g+=`<rect x="14" y="6" width="62" height="138" rx="14" fill="#15191f"/>`;
    g+=lamp(36,C.red,on.red)+lamp(75,C.amber,on.amber);
    if(arrow && on.green){
      g+=`<circle cx="45" cy="114" r="17" fill="#0c0f13"/>`+
         `<g transform="translate(45,114)">`+arrowShape(arrow,C.green)+`</g>`;
    }else{
      g+=lamp(114,C.green,on.green);
    }
    return svg(90,150,g);
  }
  function arrowShape(dir,col){
    if(dir==="left")return `<path d="M 12,0 L -10,0 M -10,0 L 0,-9 M -10,0 L 0,9" stroke="${col}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    if(dir==="right")return `<path d="M -12,0 L 10,0 M 10,0 L 0,-9 M 10,0 L 0,9" stroke="${col}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    return `<path d="M 0,12 L 0,-10 M 0,-10 L -9,0 M 0,-10 L 9,0" stroke="${col}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  /* ---------- MARQUAGES AU SOL (vue de dessus) ---------- */
  function marking(id){
    const W=160,H=200;
    let road=`<rect x="0" y="0" width="${W}" height="${H}" fill="${C.road}"/>`+
      `<rect x="6" y="0" width="5" height="${H}" fill="#cfd6dd" opacity=".5"/>`+
      `<rect x="${W-11}" y="0" width="5" height="${H}" fill="#cfd6dd" opacity=".5"/>`;
    const cx=W/2;
    const dash=(x)=>{let d="";for(let y=8;y<H;y+=34){d+=`<rect x="${x-3}" y="${y}" width="6" height="20" fill="${C.line}"/>`;}return d;};
    const solid=(x)=>`<rect x="${x-3}" y="0" width="6" height="${H}" fill="${C.line}"/>`;
    let m="";
    if(id==="continuous")m=solid(cx);
    else if(id==="dashed")m=dash(cx);
    else if(id==="mixed")m=solid(cx-7)+dash(cx+7);
    else if(id==="double_continuous")m=solid(cx-7)+solid(cx+7);
    else if(id==="zebra"){for(let x=14;x<W-14;x+=20)m+=`<rect x="${x}" y="70" width="11" height="60" fill="${C.line}"/>`;}
    else if(id==="stop_line")m=dash(cx)+`<rect x="14" y="120" width="${W-28}" height="10" fill="${C.line}"/>`;
    else if(id==="give_way_line"){for(let x=16;x<W-14;x+=22)m+=`<path d="M ${x},120 l 14,0 l -7,12 Z" fill="${C.line}"/>`;m+=dash(cx);}
    else if(id==="cycle_lane"){m=dash(cx-20);m+=`<rect x="${cx+6}" y="0" width="5" height="${H}" fill="${C.line}"/>`+
      `<g transform="translate(${cx+34},100) scale(.8)"><circle cx="-10" cy="8" r="9" fill="none" stroke="${C.line}" stroke-width="3"/><circle cx="12" cy="8" r="9" fill="none" stroke="${C.line}" stroke-width="3"/><path d="M-10,8 L0,-10 L10,-10 M0,-10 L12,8 M-10,8 L6,8" stroke="${C.line}" stroke-width="3" fill="none"/></g>`;}
    else m=dash(cx);
    return svg(W,H,road+m);
  }

  /* ---------- SCHÉMAS DE CARREFOUR (vue de dessus) ---------- */
  function intersection(s){
    const id=s.id||"priority_right";
    const W=220,H=200;
    const bg=`<rect width="${W}" height="${H}" fill="${C.grass}"/>`;
    const roadV=`<rect x="${W/2-34}" y="0" width="68" height="${H}" fill="${C.road}"/>`;
    const roadH=`<rect x="0" y="${H/2-34}" width="${W}" height="68" fill="${C.road}"/>`;
    const dashV=()=>{let d="";for(let y=6;y<H;y+=26){if(y<H/2-38||y>H/2+38)d+=`<rect x="${W/2-2}" y="${y}" width="4" height="14" fill="${C.line}"/>`;}return d;};
    const dashH=()=>{let d="";for(let x=6;x<W;x+=26){if(x<W/2-38||x>W/2+38)d+=`<rect x="${x}" y="${H/2-2}" width="14" height="4" fill="${C.line}"/>`;}return d;};
    // voiture (carrosserie + pare-brise) orientée: dir up/down/left/right
    const veh=(x,y,col,dir)=>{
      const rot={up:0,down:180,left:90,right:-90}[dir]||0;
      return `<g transform="translate(${x},${y}) rotate(${rot})">`+
        `<rect x="-13" y="-20" width="26" height="40" rx="6" fill="${col}"/>`+
        `<rect x="-9" y="-15" width="18" height="11" rx="2" fill="#e8eef5" opacity=".9"/>`+
        `<rect x="-9" y="4" width="18" height="9" rx="2" fill="#1f2733" opacity=".35"/></g>`;
    };
    const arrow=(x1,y1,x2,y2,col)=>{
      const ang=Math.atan2(y2-y1,x2-x1)/RAD;
      const [ax,ay]=[x2,y2];
      const p1=polar(ax,ay,12,180-ang+150), p2=polar(ax,ay,12,180-ang-150);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`+
        `<polygon points="${ax},${ay} ${p1.join(',')} ${p2.join(',')}" fill="${col}"/>`;
    };
    let scene=bg;
    if(id==="roundabout"){
      scene=bg+`<circle cx="${W/2}" cy="${H/2}" r="92" fill="${C.road}"/>`+
        `<circle cx="${W/2}" cy="${H/2}" r="40" fill="${C.grass}"/>`+
        `<circle cx="${W/2}" cy="${H/2}" r="40" fill="none" stroke="${C.line}" stroke-width="3" stroke-dasharray="8 8"/>`;
      // fleche sens anti-horaire (rond-point français)
      scene+=`<g fill="none" stroke="${C.line}" stroke-width="5"><path d="M ${W/2+66},${H/2} A 66,66 0 0 1 ${W/2},${H/2+66}"/></g>`;
      const [hx,hy]=polar(W/2,H/2,66,-90); // bottom
      scene+=`<polygon points="${W/2-6},${H/2+62} ${W/2+6},${H/2+62} ${W/2},${H/2+74}" fill="${C.line}"/>`;
      scene+=veh(W/2-16,H-26,C.blue,"up");
      scene+=`<text x="${W/2}" y="${H-4}" font-size="12" fill="${C.ink}" text-anchor="middle" font-family="Arial">vous</text>`;
      return svg(W,H,scene);
    }
    scene+=roadH+roadV+dashV()+dashH();
    if(id==="priority_right"){
      scene+=veh(W/2-16,H-30,C.blue,"up");          // vous (bas)
      scene+=veh(W-30,H/2-16,C.red,"left");          // autre (droite)
      scene+=`<text x="${W-30}" y="${H/2-40}" font-size="22" fill="${C.red}" text-anchor="middle" font-weight="bold">!</text>`;
      scene+=`<text x="${W/2-16}" y="${H-6}" font-size="12" fill="${C.white}" text-anchor="middle" font-family="Arial">vous</text>`;
    }else if(id==="stop"){
      scene+=veh(W/2-16,H-30,C.blue,"up");
      scene+=`<rect x="${W/2-34}" y="${H/2+34}" width="68" height="9" fill="${C.line}"/>`;
      scene+=`<g transform="translate(${W/2-46},${H-44}) scale(.42)">`+innerStop()+`</g>`;
    }else if(id==="yield"){
      scene+=veh(W/2-16,H-30,C.blue,"up");
      scene+=`<g transform="translate(${W/2-50},${H-50}) scale(.42)">`+innerYield()+`</g>`;
    }else if(id==="t_junction"){
      scene=bg+roadH+`<rect x="${W/2-34}" y="${H/2-34}" width="68" height="${H/2+34}" fill="${C.road}"/>`+dashH();
      scene+=veh(W/2-16,H-30,C.blue,"up");
    }else{
      scene+=veh(W/2-16,H-30,C.blue,"up");
      scene+=veh(W-30,H/2-16,C.red,"left");
    }
    return svg(W,H,scene);
  }
  function innerStop(){const pts=[];for(let i=0;i<8;i++){const a=22.5+i*45;pts.push(polar(60,60,56,a).join(","));}
    return `<polygon points="${pts.join(' ')}" fill="${C.red}"/><text x="60" y="60" font-size="30" font-weight="900" font-family="Arial" text-anchor="middle" dominant-baseline="central" fill="#fff">STOP</text>`;}
  function innerYield(){return `<polygon points="60,104 8,16 112,16" fill="#fff"/><polygon points="60,104 8,16 112,16" fill="none" stroke="${C.red}" stroke-width="12" stroke-linejoin="round"/>`;}

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
    return svg(W,H,`<rect width="${W}" height="${H}" fill="#0f172a" rx="14"/>`+beams+body+lamps);
  }

  /* ---------- DISPATCH ---------- */
  function render(spec){
    if(!spec||!spec.type) return "";
    try{
      switch(spec.type){
        case "speedometer": return speedometer(spec);
        case "speed_sign": return speedSign(spec.value);
        case "end_speed": return endSpeed(spec.value);
        case "sign": return (SIGNS[spec.id]||SIGNS.no_vehicles)();
        case "danger": return dangerTriangle(spec.picto);
        case "obligation": return obligation(spec.picto);
        case "traffic_light": return trafficLight(spec);
        case "marking": return marking(spec.id);
        case "intersection": return intersection(spec);
        case "vehicle_lights": return vehicleLights(spec.id);
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
    {label:"STOP carrefour",spec:{type:"intersection",id:"stop"}},
    {label:"Cédez carrefour",spec:{type:"intersection",id:"yield"}},
    {label:"Feux de route",spec:{type:"vehicle_lights",id:"main_beam"}},
    {label:"Feux de croisement",spec:{type:"vehicle_lights",id:"dipped"}},
    {label:"Feux de brouillard",spec:{type:"vehicle_lights",id:"fog"}},
    {label:"Feux de détresse",spec:{type:"vehicle_lights",id:"hazard"}}
  ];

  window.CODE_VISUALS = { render, catalog: CATALOG };
})();
