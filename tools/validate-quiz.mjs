// Test du moteur de quiz (app.js) sans navigateur : faux DOM minimal + vraies données.
// Vérifie que l'écran, la voix, le clavier, la correction et les résultats
// utilisent tous l'ordre mélangé (item.shown), jamais l'ordre d'origine du corpus.
import fs from "node:fs";
import vm from "node:vm";

const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

// Élément factice qui garde ce qu'on y écrit (innerHTML, textContent, style…).
function fakeElement() {
  const element = {
    innerHTML: "", textContent: "", value: "", checked: false, style: {}, className: "",
    classList: { _set: new Set(), add(c) { this._set.add(c); }, remove(c) { this._set.delete(c); }, contains(c) { return this._set.has(c); } },
    setAttribute() {}, getAttribute() { return null; }, appendChild() {}, insertAdjacentHTML() {},
    focus() {}, click() {}, remove() {}, querySelector: () => fakeElement(),
  };
  return element;
}

// Hasard reproductible : un test qui passe ou échoue par chance ne prouve rien.
const SEEDED_RANDOM = "Math.random = (() => { let s = 20261108; return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648); })();";

function loadApp({ storage, storageThrowsOnAccess = false }) {
  const elements = new Map();
  const keyListeners = [];
  const document = {
    querySelector: (selector) => {
      if (!elements.has(selector)) elements.set(selector, fakeElement());
      return elements.get(selector);
    },
    querySelectorAll: () => [],
    getElementById: (id) => document.querySelector(`#${id}`),
    createElement: () => fakeElement(),
    addEventListener: (type, fn) => { if (type === "keydown") keyListeners.push(fn); },
    body: fakeElement(),
  };
  const context = {
    document,
    navigator: { userAgent: "node-test" },
    location: { protocol: "file:" },
    setTimeout: (fn) => { fn(); return 0; },
    clearTimeout() {},
    confirm: () => true,
    console,
    Intl,
  };
  if (storageThrowsOnAccess) {
    Object.defineProperty(context, "localStorage", { get() { throw new Error("SecurityError: cookies bloqués"); } });
  } else {
    context.localStorage = storage;
  }
  context.window = context;
  context.self = context;
  context.top = context;
  context.addEventListener = () => {};
  context.scrollTo = () => {};
  vm.createContext(context);
  vm.runInContext(SEEDED_RANDOM, context);
  for (const file of ["data.js", "visuals.js", "images.js", "ecf_data.js", "tts.js", "app.js"]) {
    vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  }
  vm.runInContext("globalThis.__App = App; globalThis.__Store = Store; globalThis.__TTS = TTS;", context);
  const spoken = [];
  context.__TTS.speakChunks = (chunks) => { spoken.push(chunks); };
  const press = (key) => keyListeners.forEach((fn) => fn({ key, ctrlKey: false, metaKey: false, altKey: false, preventDefault() {} }));
  return { App: context.__App, Store: context.__Store, html: (sel) => document.querySelector(sel).innerHTML, spoken, press };
}

function memoryStorage() {
  const data = new Map();
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => { data.set(k, String(v)); }, data };
}

const storage = memoryStorage();
const { App, Store, html, spoken, press } = loadApp({ storage });
const themes = vm.runInNewContext(fs.readFileSync("data.js", "utf8") + ";window.CODE_DATA", { window: {} }).themes;

// --- 1. Le mélange garde le bon texte de réponse et toutes les propositions ---
let checked = 0;
themes.forEach((theme, ti) => theme.subthemes.forEach((_, si) => {
  App.quiz = null;
  App.startSubQuiz(ti, si); // une leçon sans question (10.6) ne lance pas de quiz
  for (const item of App.quiz ? App.quiz.list : []) {
    const { q, shown } = item;
    assert(Object.values(q.choices).sort().join("|") === Object.values(shown.choices).sort().join("|"), `Question ${q.id} : propositions perdues ou dupliquées après mélange`);
    assert(shown.choices[shown.answer] === q.choices[q.answer], `Question ${q.id} : la bonne réponse affichée ne correspond plus`);
    assert(JSON.stringify(Object.keys(shown.choices)) === JSON.stringify(Object.keys(q.choices).sort()), `Question ${q.id} : lettres affichées hors ordre A, B, C…`);
    checked++;
  }
}));
assert(checked === 517, `517 questions mélangées attendues, ${checked} vérifiées`);

// --- 2. La lettre A n'est plus la bonne réponse les deux tiers du temps ---
const counts = {};
let total = 0;
for (let run = 0; run < 20; run++) {
  themes.forEach((_, ti) => {
    App.startThemeQuiz(ti);
    for (const item of App.quiz.list) { counts[item.shown.answer] = (counts[item.shown.answer] || 0) + 1; total++; }
  });
}
const shareA = counts.A / total;
assert(shareA > 0.25 && shareA < 0.4, `Part de « A » après mélange hors de 25–40 % : ${(shareA * 100).toFixed(1)} %`);

// --- 3. Écran, voix, correction : tout suit l'ordre affiché ---
// On cherche une série dont la 1re question a vraiment changé de lettre,
// sinon le test ne distinguerait pas l'ordre mélangé de l'ordre d'origine.
let moved = null;
for (let attempt = 0; attempt < 50 && !moved; attempt++) {
  App.startThemeQuiz(1, true);
  const item = App.quiz.list[0];
  if (item.shown.answer !== item.q.answer) moved = item;
}
assert(moved, "Impossible de trouver une question dont la bonne lettre a changé (mélange inactif ?)");
if (moved) {
  const screen = html("#app");
  const pairs = [...screen.matchAll(/<span class="key">([A-E])<\/span><span class="ctxt">([^<]*)<\/span>/g)].map((m) => [m[1], m[2]]);
  const expected = Object.entries(moved.shown.choices).map(([letter, text]) => [letter, esc(text)]);
  assert(JSON.stringify(pairs) === JSON.stringify(expected), `Écran du quiz : choix affichés ${JSON.stringify(pairs)} au lieu de ${JSON.stringify(expected)}`);

  const read = spoken.at(-1) || [];
  const expectedSpeech = Object.keys(moved.shown.choices).map((letter) => `Réponse ${letter}. ${moved.shown.choices[letter]}`).join(" … ");
  assert(read[0]?.text === moved.q.text && read[1]?.text === expectedSpeech, "Lecture vocale : les lettres lues ne correspondent pas aux lettres affichées");

  // Clavier : taper la lettre affichée de la bonne réponse doit compter juste.
  const before = Store.st.totalAnswered;
  press(moved.shown.answer.toLowerCase());
  assert(App.quiz.answered && App.quiz.correct === 1, "Clavier : la lettre affichée de la bonne réponse n'est pas comptée juste");
  assert(Store.st.totalAnswered === before + 1, "La réponse doit être enregistrée dans les statistiques");
  assert(JSON.parse(storage.data.get("cdlr_stats")).totalAnswered === before + 1, "La progression doit être sauvegardée");
}

// --- 4. Mauvaise réponse : message de correction et écran des résultats ---
press("Enter");
const second = App.quiz.list[1];
const wrong = Object.keys(second.shown.choices).find((letter) => letter !== second.shown.answer);
App.answer(wrong);
assert(App.quiz.missed.length === 1, "Une mauvaise lettre doit être comptée fausse");
assert(html("#fb").includes(`<b>${second.shown.answer}</b> : ${esc(second.shown.choices[second.shown.answer])}`), "Correction : la bonne lettre/réponse annoncée ne correspond pas à l'écran");
App.quiz.i = App.quiz.list.length - 1;
App.next(); // fin de série → écran des résultats
assert(html("#app").includes(`✓ ${second.shown.answer} : ${esc(second.shown.choices[second.shown.answer])}`), "Résultats : la bonne réponse de l'erreur n'est pas celle affichée pendant la série");

// --- 5. Rattrapage et série refaite : nouveau mélange, cohérent ---
const oldShown = App.quiz.list[0].shown;
App.retryAll();
assert(App.quiz.list[0].shown !== oldShown, "« Refaire la série » doit remélanger les choix");
App.quiz.missed = [second];
App.retryMissed();
const retried = App.quiz.list[0];
assert(App.quiz.list.length === 1 && retried.q.id === second.q.id, "Le rattrapage doit reprendre la question ratée");
assert(retried.shown !== second.shown && retried.shown.choices[retried.shown.answer] === retried.q.choices[retried.q.answer], "Le rattrapage doit remélanger en gardant la bonne réponse");

// --- 6. Stockage bloqué : méthodes qui échouent, puis accès lui-même interdit ---
const blocked = { getItem() { throw new Error("SecurityError"); }, setItem() { throw new Error("QuotaExceededError"); } };
for (const [label, options] of [["méthodes en erreur", { storage: blocked }], ["accès interdit", { storageThrowsOnAccess: true }]]) {
  try {
    const app = loadApp(options).App;
    app.startSubQuiz(0, 0);
    app.answer(app.quiz.list[0].shown.answer);
    assert(app.quiz.correct === 1, `Stockage bloqué (${label}) : le quiz doit rester utilisable`);
  } catch (error) {
    failures.push(`Stockage bloqué (${label}) : l'app plante — ${error.message}`);
  }
}

if (failures.length) {
  console.error("ÉCHEC DE VALIDATION QUIZ");
  for (const failure of [...new Set(failures)].slice(0, 30)) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`OK — ${checked} questions mélangées sans erreur ; « A » bonne réponse ${(shareA * 100).toFixed(1)} % du temps (66,3 % avant) ; écran, voix, clavier, correction, résultats, rattrapage et stockage bloqué cohérents.`);
}
