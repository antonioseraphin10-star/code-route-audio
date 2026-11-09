import fs from "node:fs";
import vm from "node:vm";

function load(file, property) {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  return context.window[property];
}

const failures = [];
const warnings = [];
const data = load("data.js", "CODE_DATA");
const ecf = load("ecf_data.js", "ECF_DATA");
const images = load("images.js", "CODE_IMAGES");
const visuals = load("visuals.js", "CODE_VISUALS");

const questions = data.themes.flatMap((theme) =>
  theme.subthemes.flatMap((subtheme) => subtheme.questions)
);
const ids = questions.map((question) => question.id);

if (questions.length !== 517) failures.push(`517 questions attendues, ${questions.length} trouvées`);
if (new Set(ids).size !== ids.length) failures.push("Des identifiants de questions sont dupliqués");
if (data.totalQuestions !== questions.length) failures.push("totalQuestions ne correspond pas au corpus");

for (const question of questions) {
  const choices = Object.keys(question.choices || {});
  if (!question.text?.trim()) failures.push(`Question ${question.id} sans texte`);
  if (choices.length < 2) failures.push(`Question ${question.id} a moins de deux choix`);
  if (!choices.includes(question.answer)) failures.push(`Réponse ${question.answer} absente des choix de la question ${question.id}`);
}

for (const [id, spec] of Object.entries(images)) {
  if (!ids.includes(Number(id))) failures.push(`Le visuel ${id} ne correspond à aucune question`);
  const out = visuals.render(spec);
  if (!out) failures.push(`Le visuel ${id} ne peut pas être rendu`);
  // Refonte 2026 : tous les schémas de questions au même format 16/10.
  else if (!out.startsWith('<svg viewBox="0 0 320 200"')) failures.push(`Le visuel ${id} (${spec.type}) n'est pas au format 320×200`);
  // Règle pédagogique : jamais de croix ni de point d'exclamation qui souffle la réponse.
  // (Les vrais panneaux, comme « Autres dangers » et son « ! », ne sont pas concernés.)
  if (!["sign", "danger", "obligation", "speed_sign", "end_speed"].includes(spec.type)) {
    if (/>\s*[✕✗!]\s*</.test(out)) failures.push(`Le visuel ${id} contient un signe qui peut souffler la réponse`);
    if (spec.type === "overtaking" && /fill="#e0a400"/.test(out)) failures.push(`Le visuel ${id} montre la trajectoire du dépassement (elle souffle la réponse)`);
  }
}
if (images[275]) failures.push("La question 275 conserve un visuel de giratoire hors sujet");
const roundaboutGuides = visuals.lesson("2.11");
if (roundaboutGuides.length !== 3) failures.push("La leçon 2.11 doit contenir trois schémas pédagogiques");
if (roundaboutGuides.some((guide) => !guide.title || !guide.caption || !guide.svg)) {
  failures.push("Un schéma pédagogique de la leçon 2.11 est incomplet");
}

if (!Array.isArray(ecf) || ecf.length !== 100) failures.push(`100 fiches ECF attendues, ${ecf?.length ?? 0} trouvées`);
for (const card of ecf || []) {
  if (card.pairs?.length !== 3) failures.push(`La fiche ECF ${card.n} ne contient pas trois éléments`);
  for (const [index, pair] of (card.pairs || []).entries()) {
    if (!pair.q?.trim()) failures.push(`Fiche ECF ${card.n}, élément ${index + 1} sans question`);
    if (pair.kind === "q" && !pair.a?.trim()) failures.push(`Fiche ECF ${card.n}, question ${index + 1} sans réponse`);
  }
}

const corpus = `${fs.readFileSync("data.js", "utf8")}\n${fs.readFileSync("ecf_data.js", "utf8")}`;
const obsolete = [
  /brouillard, forte pluie/i,
  /attestation d'assurance et le permis de conduire/i,
  /vignette sur le pare-brise/i,
  /toujours garder permis, carte grise et attestation/i
];
for (const pattern of obsolete) {
  if (pattern.test(corpus)) failures.push(`Formulation obsolète encore présente : ${pattern}`);
}

const counts = questions.reduce((acc, question) => {
  acc[question.answer] = (acc[question.answer] || 0) + 1;
  return acc;
}, {});
if ((counts.A || 0) / questions.length > 0.5) {
  warnings.push(`Répartition des bonnes réponses très déséquilibrée dans data.js : ${JSON.stringify(counts)} (sans effet pour l'élève : app.js mélange l'ordre à l'affichage, contrôlé par validate-quiz)`);
}

if (failures.length) {
  console.error("ÉCHEC DE VALIDATION");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`OK — ${questions.length} questions, ${ecf.length} fiches ECF, aucune réponse ordinaire vide.`);
}
for (const warning of warnings) console.warn(`AVERTISSEMENT — ${warning}`);
