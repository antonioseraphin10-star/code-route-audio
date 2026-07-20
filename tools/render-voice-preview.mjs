import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const output=process.argv[2]||"voice-settings-preview.html";
const root=process.cwd();
let html=fs.readFileSync(path.join(root,"index.html"),"utf8");

// Copie de prévisualisation uniquement : les scripts restent ceux du projet,
// mais utilisent des URL absolues parce que le fichier est rendu hors du dépôt.
html=html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\s*/i,"");
for(const file of ["data.js","visuals.js","images.js","ecf_data.js","tts.js"]){
  html=html.replace(`src="${file}"`,`src="${pathToFileURL(path.join(root,file)).href}"`);
}
html=html.replace(/App\.start\(\);\s*<\/script>/,"App.start();\nsetTimeout(()=>App.openSettings(),250);\n</script>");
html=html.replace("</head>","<style>.modal-bg{backdrop-filter:blur(5px)}</style></head>");

fs.writeFileSync(output,html,"utf8");
console.log(output);
