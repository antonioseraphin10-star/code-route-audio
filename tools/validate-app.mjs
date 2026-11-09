import fs from "node:fs";
import vm from "node:vm";

const failures = [];
const html = fs.readFileSync("index.html", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));

// 1. Tous les fichiers JavaScript doivent compiler (le code est dans app.js depuis la PR #3).
const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((m) => m[1]);
if (!scripts.includes("app.js")) failures.push("app.js n'est pas chargé par index.html");
for (const file of [...scripts, "sw.js"]) {
  try {
    new vm.Script(fs.readFileSync(file, "utf8"), { filename: file });
  } catch (error) {
    failures.push(`${file} ne compile pas : ${error.message}`);
  }
}

// 2. Chaque ressource locale de la page et du manifeste doit exister
//    et être dans le cache hors ligne du service worker.
const local = (url) => !/^(https?:|data:|#)/.test(url);
const pageRefs = [...html.matchAll(/\s(?:src|href)="([^"]+)"/g)].map((m) => m[1]).filter(local);
const iconRefs = (manifest.icons || []).map((icon) => icon.src.replace(/^\.\//, ""));
const assetsBlock = sw.match(/const ASSETS = \[([\s\S]*?)\];/);
const cached = assetsBlock ? [...assetsBlock[1].matchAll(/"\.\/([^"]*)"/g)].map((m) => m[1]) : [];
if (!assetsBlock) failures.push("Liste ASSETS introuvable dans sw.js");

for (const file of new Set([...pageRefs, ...iconRefs, "index.html"])) {
  if (!fs.existsSync(file)) failures.push(`Ressource manquante : ${file}`);
  if (!cached.includes(file)) failures.push(`${file} absent du cache hors ligne (sw.js)`);
}
for (const file of cached.filter(Boolean)) {
  if (!fs.existsSync(file)) failures.push(`sw.js met en cache un fichier inexistant : ${file}`);
}
if (!/const CACHE = "cdlr-v\d+";/.test(sw)) failures.push("Nom de cache sw.js illisible (attendu cdlr-vN)");

// 3. Le service worker doit copier la réponse avant de la rendre à la page.
if (/c\.put\([^)]*res\.clone\(\)\)/.test(sw)) {
  failures.push("sw.js clone la réponse trop tard (dans c.put) : le cache ne se met jamais à jour");
}

// 4. La page ne doit pas planter si le stockage du navigateur est bloqué.
//    Règle : localStorage n'est utilisé que dans storageGet/storageSet, chacun dans un try…catch.
//    (Le comportement réel est testé par validate-quiz avec un stockage qui plante.)
const app = fs.readFileSync("app.js", "utf8");
const code = app.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");
const storageLines = code.split("\n").filter((line) => /\blocalStorage\b/.test(line));
const allowed = /^(const storageGet=k=>\{try\{return localStorage\.getItem\(k\);\}catch\(e\)|  try\{localStorage\.setItem\(k,v\);return true;\})/;
const unguarded = storageLines.filter((line) => !allowed.test(line));
if (storageLines.length !== 2 || unguarded.length) {
  failures.push(`app.js utilise localStorage hors de storageGet/storageSet (navigation privée = page blanche) : ${unguarded.map((l) => l.trim().slice(0, 60)).join(" | ") || storageLines.length + " usages"}`);
}

if (failures.length) {
  console.error("ÉCHEC DE VALIDATION APP");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`OK — ${scripts.length + 1} scripts compilés, ${cached.length} ressources hors ligne vérifiées, stockage protégé.`);
}
