import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync("index.html","utf8");
const marker="<script>";
const start=html.lastIndexOf(marker);
const end=html.indexOf("</script>",start);
if(start<0||end<0)throw new Error("Script principal introuvable dans index.html");
new vm.Script(html.slice(start+marker.length,end),{filename:"index-inline.js"});

const swContext={self:{addEventListener(){}},URL,caches:{},fetch(){}};
new vm.Script(fs.readFileSync("sw.js","utf8"),{filename:"sw.js"});

const required=["data.js","visuals.js","images.js","ecf_data.js","tts.js","manifest.json"];
const missing=required.filter(file=>!fs.existsSync(file));
if(missing.length)throw new Error(`Ressources manquantes : ${missing.join(", ")}`);

const sw=fs.readFileSync("sw.js","utf8");
for(const file of required.filter(file=>file.endsWith(".js"))){
  if(!sw.includes(`"./${file}"`))throw new Error(`${file} absent du cache hors ligne`);
}

console.log(`OK — script principal compilé et ${required.length} ressources PWA présentes.`);
