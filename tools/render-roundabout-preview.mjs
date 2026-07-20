import fs from "node:fs";
import vm from "node:vm";

const output = process.argv[2] || "roundabout-course-preview.svg";
const context = { window: {} };
vm.runInNewContext(fs.readFileSync("visuals.js", "utf8"), context, { filename: "visuals.js" });
const guides = context.window.CODE_VISUALS.lesson("2.11");
if (guides.length !== 3) throw new Error("Trois schémas de giratoire étaient attendus");

const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function innerSvg(source) {
  return source.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
}

function wrap(text, max) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (line && `${line} ${word}`.length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textLines(lines, x, y, size, color, lineHeight, weight=400) {
  return `<text x="${x}" y="${y}" font-family="Segoe UI,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">`+
    lines.map((line, index) => `<tspan x="${x}" dy="${index ? lineHeight : 0}">${escapeXml(line)}</tspan>`).join("")+`</text>`;
}

function card(guide, x, y, width, visualWidth) {
  const titleLines = wrap(guide.title, width < 600 ? 34 : 62);
  const captionLines = wrap(guide.caption, width < 600 ? 54 : 92);
  const headerHeight = 62 + titleLines.length*30 + captionLines.length*22;
  const scale = visualWidth/640;
  const visualHeight = 360*scale;
  const height = headerHeight + visualHeight + 28;
  const visualX = x+(width-visualWidth)/2;
  const visualY = y+headerHeight;
  return {
    height,
    svg:`<g filter="url(#shadow)"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="22" fill="#fff" stroke="#e2e8f0"/></g>`+
      `<text x="${x+24}" y="${y+34}" font-family="Segoe UI,Arial,sans-serif" font-size="13" font-weight="900" letter-spacing="1.1" fill="#2563eb">${escapeXml(guide.kicker)}</text>`+
      textLines(titleLines,x+24,y+70,24,"#172033",30,800)+
      textLines(captionLines,x+24,y+70+titleLines.length*30+12,16,"#475569",22,400)+
      `<g transform="translate(${visualX},${visualY}) scale(${scale})">${innerSvg(guide.svg)}</g>`
  };
}

const W=1200,H=1500;
const first=card(guides[0],100,250,490,450);
const second=card(guides[1],610,250,490,450);
const rowHeight=Math.max(first.height,second.height);
const third=card(guides[2],100,250+rowHeight+24,1000,760);
const buttonY=250+rowHeight+24+third.height+28;

const document=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#0f172a"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#020617" flood-opacity=".18"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <g font-family="Segoe UI,Arial,sans-serif">
    <g transform="translate(100,34)">
      <rect width="48" height="48" rx="13" fill="#fff"/><text x="24" y="33" text-anchor="middle" font-size="27">🚦</text>
      <text x="64" y="22" font-size="22" font-weight="800" fill="#fff">Code de la Route</text>
      <text x="64" y="42" font-size="12" font-weight="600" fill="#cbd5e1">RÉVISION AUDIO · PERMIS B</text>
    </g>
    <g transform="translate(824,41)"><rect width="276" height="34" rx="17" fill="#fef3c7"/><text x="138" y="22" text-anchor="middle" font-size="12" font-weight="900" fill="#92400e">APERÇU LOCAL · NON DÉPLOYÉ</text></g>
    <text x="100" y="115" font-size="14" fill="#cbd5e1">Accueil  ›  La circulation routière  ›  Cours 2.11</text>
    <text x="100" y="159" font-size="28" font-weight="900" fill="#fff">📖 2.11 — Les carrefours à sens giratoire</text>
    <g transform="translate(100,186)">
      <rect width="1000" height="48" rx="14" fill="#0f172a" stroke="#334155"/>
      <rect x="12" y="7" width="34" height="34" rx="9" fill="#fff"/><text x="29" y="30" text-anchor="middle" font-size="17">▶</text>
      <text x="60" y="30" font-size="14" fill="#fff">Écouter la leçon et les explications des schémas</text>
      <rect x="796" y="21" width="180" height="6" rx="3" fill="#334155"/>
    </g>
    ${first.svg}
    ${second.svg}
    ${third.svg}
    <g transform="translate(100,${buttonY})"><rect width="1000" height="58" rx="14" fill="#2563eb"/><text x="500" y="37" text-anchor="middle" font-size="18" font-weight="800" fill="#fff">🎯 Passer au quiz de cette leçon</text></g>
    <text x="600" y="${buttonY+100}" text-anchor="middle" font-size="13" fill="#cbd5e1">Support pédagogique indépendant · prévisualisation avant validation et déploiement</text>
  </g>
</svg>`;

fs.writeFileSync(output, document, "utf8");
console.log(output);
