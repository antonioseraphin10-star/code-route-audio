import fs from "node:fs";
import vm from "node:vm";

function loadWindowAssignment(file, property) {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  if (!context.window[property]) throw new Error(`${property} introuvable dans ${file}`);
  return context.window[property];
}

function questionById(data, id) {
  for (const theme of data.themes) {
    for (const subtheme of theme.subthemes) {
      const question = subtheme.questions.find((item) => item.id === id);
      if (question) return question;
    }
  }
  throw new Error(`Question ${id} introuvable`);
}

function subthemeById(data, id) {
  for (const theme of data.themes) {
    const subtheme = theme.subthemes.find((item) => item.id === id);
    if (subtheme) return subtheme;
  }
  throw new Error(`Sous-thème ${id} introuvable`);
}

function cardByNumber(cards, number) {
  const card = cards.find((item) => item.n === number);
  if (!card) throw new Error(`Fiche ECF ${number} introuvable`);
  return card;
}

const data = loadWindowAssignment("data.js", "CODE_DATA");
const ecf = loadWindowAssignment("ecf_data.js", "ECF_DATA");
const images = loadWindowAssignment("images.js", "CODE_IMAGES");

// Article R416-7 du code de la route : l'antibrouillard arrière est réservé
// au brouillard ou à la chute de neige, contrairement aux feux avant.
const lightsCourse = subthemeById(data, "1.3");
const rearFog = lightsCourse.course.find((item) => /Feu antibrouillard arrière/i.test(item.s));
if (!rearFog) throw new Error("Bloc de cours sur l'antibrouillard arrière introuvable");
rearFog.s = "Feu antibrouillard arrière : il peut être utilisé uniquement par temps de brouillard ou par chute de neige. Il ne doit pas être allumé pour une forte pluie seule, car sa forte intensité risque d’éblouir les usagers qui suivent.";

Object.assign(questionById(data, 18), {
  text: "Dans quelle situation pouvez-vous allumer le feu antibrouillard arrière ?",
  choices: {
    A: "Par temps de brouillard ou par chute de neige",
    B: "En cas de forte pluie seule",
    C: "Systématiquement dès la tombée de la nuit",
    D: "Quand vous suivez un autre véhicule de près"
  },
  answer: "A"
});

// Mise à jour au 20 juillet 2026 d'après Service-Public : permis et certificat
// d'immatriculation sont présentés au contrôle ; depuis le 1er avril 2024,
// l'assurance d'un véhicule immatriculé est vérifiée via le FVA.
const documents = subthemeById(data, "10.2");
documents.course = [
  { t: "h", s: "Contrôle routier : les documents à présenter" },
  { t: "p", s: "Lors d’un contrôle en France, le conducteur doit présenter un permis de conduire en cours de validité, au format papier ou numérique, ainsi que le certificat d’immatriculation du véhicule. Une attestation de droits à conduire sécurisée peut remplacer le permis dans les situations prévues." },
  { t: "li", s: "Le certificat d’immatriculation doit être présenté même si le véhicule appartient à une autre personne." },
  { t: "li", s: "Pour une location de courte durée, une copie du certificat d’immatriculation est admise." },
  { t: "li", s: "Pour un véhicule soumis au contrôle technique, la carte grise complétée du timbre ou de la date limite de validité constitue la preuve du contrôle." },
  { t: "h", s: "Assurance : fin de la carte verte" },
  { t: "p", s: "L’assurance de responsabilité civile reste obligatoire. Depuis le 1er avril 2024, il n’est toutefois plus obligatoire de présenter une attestation ou une vignette d’assurance pour un véhicule immatriculé : les forces de l’ordre interrogent le fichier des véhicules assurés (FVA) à partir du numéro d’immatriculation." },
  { t: "li", s: "L’assureur remet un document d’information sur le véhicule assuré. Il est utile, notamment au début d’un contrat, mais ne rétablit pas l’ancienne obligation de carte verte." },
  { t: "li", s: "L’absence de papier d’assurance ne prouve donc pas un défaut d’assurance. En revanche, conduire un véhicule non assuré demeure interdit." },
  { t: "h", s: "Situations particulières" },
  { t: "li", s: "Si l’immatriculation est en cours, présentez le certificat provisoire d’immatriculation." },
  { t: "li", s: "Après l’achat d’un véhicule, effectuez la demande de changement de titulaire sur le service France Titres (ANTS)." },
  { t: "li", s: "La vignette Crit’Air est obligatoire dans une zone à faibles émissions mobilité et lorsque la circulation différenciée est instaurée. Les restrictions varient selon le lieu et la période : vérifiez la règle locale avant le trajet." },
  { t: "h", s: "À retenir" },
  { t: "p", s: "Au contrôle : permis valide et certificat d’immatriculation. Pour un véhicule immatriculé, l’assurance est vérifiée dans le FVA ; l’ancienne carte verte et la vignette d’assurance ont disparu." }
];

Object.assign(questionById(data, 511), {
  text: "Lors d’un contrôle routier en France, quels documents devez-vous normalement présenter pour conduire une voiture immatriculée ?",
  choices: {
    A: "Un permis valide et le certificat d’immatriculation du véhicule",
    B: "Une pièce d’identité et la vignette Crit’Air uniquement",
    C: "L’ancienne carte verte et le rapport papier du contrôle technique",
    D: "Une autorisation écrite du propriétaire dans tous les cas"
  },
  answer: "A"
});

Object.assign(questionById(data, 512), {
  text: "Depuis le 1er avril 2024, comment les forces de l’ordre vérifient-elles l’assurance d’un véhicule immatriculé ?",
  choices: {
    A: "En consultant le fichier des véhicules assurés avec le numéro d’immatriculation",
    B: "En exigeant la vignette verte sur le pare-brise",
    C: "En demandant systématiquement une attestation papier",
    D: "En consultant la vignette Crit’Air"
  },
  answer: "A"
});

Object.assign(questionById(data, 513), {
  text: "Pour un véhicule soumis au contrôle technique, quel élément peut en prouver la validité lors d’un contrôle routier ?",
  choices: {
    A: "La carte grise complétée du timbre ou de la date limite de validité du contrôle",
    B: "La vignette Crit’Air",
    C: "Le certificat de cession",
    D: "Une attestation manuscrite du propriétaire"
  },
  answer: "A"
});

Object.assign(questionById(data, 514), {
  text: "Si vous conduisez la voiture d’une autre personne, quels documents devez-vous pouvoir présenter lors d’un contrôle ?",
  choices: {
    A: "Votre permis valide et le certificat d’immatriculation du véhicule",
    B: "Une autorisation manuscrite du propriétaire uniquement",
    C: "Une copie du permis du propriétaire",
    D: "Le certificat de cession du véhicule"
  },
  answer: "A"
});

Object.assign(questionById(data, 515), {
  text: "Pour une voiture immatriculée, devez-vous encore présenter une attestation d’assurance lors d’un contrôle routier ?",
  choices: {
    A: "Non, l’assurance est contrôlée dans le FVA depuis le 1er avril 2024",
    B: "Oui, ainsi que la vignette verte sur le pare-brise",
    C: "Oui, mais uniquement sous forme papier",
    D: "Non, car l’assurance automobile n’est plus obligatoire"
  },
  answer: "A"
});

Object.assign(questionById(data, 516), {
  text: "Après l’achat d’un véhicule, où effectuez-vous la demande de changement de titulaire du certificat d’immatriculation ?",
  choices: {
    A: "Sur le service France Titres (ANTS) ou auprès d’un professionnel habilité",
    B: "Uniquement au commissariat",
    C: "Lors du prochain contrôle routier",
    D: "Auprès de l’assureur, sans démarche d’immatriculation"
  },
  answer: "A"
});

Object.assign(questionById(data, 517), {
  text: "Quand la vignette Crit’Air est-elle obligatoire ?",
  choices: {
    A: "Dans une ZFE-m et lorsque la circulation différenciée est instaurée",
    B: "Partout en France et en permanence",
    C: "Uniquement pour remplacer les papiers d’assurance",
    D: "Seulement sur autoroute"
  },
  answer: "A"
});

// Fiches ECF : corrections des extractions fusionnées et mise à jour de l'assurance.
cardByNumber(ecf, 9).pairs = [
  { kind: "q", q: "Quels documents devez-vous présenter lors d’un contrôle et comment l’assurance est-elle vérifiée ?", a: "Présenter un permis valide et le certificat d’immatriculation. Pour un véhicule immatriculé, l’assurance est vérifiée par les forces de l’ordre dans le FVA depuis le 1er avril 2024." },
  { kind: "demo", q: "Vérifiez la présence du certificat d’immatriculation du véhicule.", a: "Présenter le certificat d’immatriculation. Une copie n’est admise que dans les cas prévus, notamment pour une location de courte durée." },
  { kind: "q", q: "Pourquoi l’alerte auprès des services de secours doit-elle être rapide et précise ?", a: "Pour permettre aux services de secours d’apporter des moyens adaptés aux victimes dans le délai le plus court." }
];

cardByNumber(ecf, 25).pairs = [
  { kind: "q", q: "Quel est le risque de circuler avec un frein de parking mal desserré ?", a: "Une dégradation du système de freinage." },
  { kind: "q", q: "De quelle couleur est le voyant qui indique une défaillance du système de freinage ?", a: "Rouge." },
  { kind: "q", q: "Hors autoroute ou endroit dangereux, en cas de panne ou d’accident, où doit être placé le triangle de présignalisation ?", a: "À environ 30 mètres du véhicule, ou avant un virage ou un sommet de côte. Ne pas le placer si cette action met la vie en danger." }
];

cardByNumber(ecf, 29).pairs = [
  { kind: "q", q: "Quelles précautions prendre pour que les enfants installés à l’arrière ne puissent pas ouvrir les portières ?", a: "Actionner la sécurité enfant sur les deux portières arrière." },
  { kind: "demo", q: "Montrez le voyant signalant la mauvaise fermeture d’une portière.", a: "Montrer le voyant correspondant sur le tableau de bord ; son apparence dépend du véhicule." },
  { kind: "q", q: "Citez les trois manières d’évaluer l’état de conscience d’une victime.", a: "Lui poser des questions simples, lui secouer doucement les épaules et lui prendre la main en lui demandant d’exécuter un geste simple." }
];

cardByNumber(ecf, 35).pairs = [
  { kind: "q", q: "Dans quel cas peut-on utiliser l’avertisseur sonore en agglomération ?", a: "Uniquement en cas de danger immédiat." },
  { kind: "demo", q: "Sans l’actionner, montrez la commande de l’avertisseur sonore.", a: "Montrer la commande, généralement située au centre du volant." },
  { kind: "q", q: "Pourquoi ne faut-il pas laisser une personne en perte de connaissance allongée sur le dos ?", a: "Elle risque de s’étouffer à cause de liquides présents dans la gorge ou de la chute de la langue vers l’arrière." }
];

cardByNumber(ecf, 41).pairs = [
  { kind: "q", q: "Quels documents devez-vous présenter lors d’un contrôle routier ?", a: "Un permis de conduire valide et le certificat d’immatriculation du véhicule. Depuis le 1er avril 2024, les papiers d’assurance ne sont plus à présenter pour un véhicule immatriculé." },
  { kind: "q", q: "Comment les forces de l’ordre vérifient-elles désormais l’assurance d’un véhicule immatriculé ?", a: "Elles consultent le fichier des véhicules assurés (FVA) avec le numéro d’immatriculation." },
  { kind: "q", q: "Qu’est-ce qu’une hémorragie ?", a: "C’est une perte de sang prolongée qui ne s’arrête pas et imbibe un mouchoir en quelques secondes." }
];

cardByNumber(ecf, 49).pairs = [
  { kind: "q", q: "Quel risque présente le maintien prolongé du recyclage de l’air ?", a: "Une mauvaise visibilité due à l’apparition de buée sur les surfaces vitrées." },
  { kind: "demo", q: "Montrez la commande de recyclage de l’air.", a: "Montrer la commande correspondante sur le bloc de ventilation du véhicule." },
  { kind: "q", q: "Quels sont les risques pour une personne inconsciente allongée sur le dos ?", a: "L’arrêt respiratoire et l’arrêt cardiaque." }
];

for (const number of [42, 88]) {
  cardByNumber(ecf, number).pairs = [
    { kind: "q", q: "Si la sécurité enfant est enclenchée, est-il possible d’ouvrir la portière arrière depuis l’extérieur ?", a: "Oui." },
    { kind: "demo", q: "Indiquez où se situe la sécurité enfant sur l’une des portières arrière du véhicule.", a: "Montrer le dispositif placé sur le chant de la portière arrière ; son emplacement exact dépend du véhicule." },
    { kind: "q", q: "Quels sont les risques pour une personne victime d’une hémorragie ?", a: "Une détresse circulatoire et un arrêt cardiaque." }
  ];
}

cardByNumber(ecf, 55).pairs = [
  { kind: "q", q: "Quel est le risque de circuler avec un frein de parking mal desserré ?", a: "Une dégradation du système de freinage." },
  { kind: "q", q: "De quelle couleur est le voyant qui indique une défaillance du système de freinage ?", a: "Rouge." },
  { kind: "q", q: "Comment arrêter une hémorragie ?", a: "Appuyer fortement sur l’endroit qui saigne avec les doigts ou la paume de la main, en interposant si possible un tissu propre." }
];

for (const number of [56, 96]) {
  cardByNumber(ecf, number).pairs = [
    { kind: "q", q: "Quelles sont les conséquences d’une panne d’un feu de croisement ?", a: "Une mauvaise visibilité et le risque d’être confondu avec un deux-roues." },
    { kind: "demo", q: "Montrez où s’effectue le changement d’une ampoule à l’avant du véhicule.", a: "Montrer l’accès au bloc optique concerné ; son emplacement exact dépend du véhicule." },
    { kind: "q", q: "Citez les trois manières d’évaluer l’état de conscience d’une victime.", a: "Lui poser des questions simples, lui secouer doucement les épaules et lui prendre la main en lui demandant d’exécuter un geste simple." }
  ];
}

cardByNumber(ecf, 61).pairs = [
  { kind: "q", q: "Peut-on fixer tous les types de sièges enfant sur des attaches Isofix ?", a: "Non, uniquement les sièges compatibles avec ce type d’attache." },
  { kind: "demo", q: "Indiquez où se situent les attaches Isofix dans le véhicule.", a: "Montrer les points d’ancrage entre le dossier et l’assise des places arrière concernées, selon le véhicule." },
  { kind: "q", q: "Comment vérifier la respiration d’une victime ?", a: "Regarder si le ventre et la poitrine se soulèvent et sentir l’air à l’expiration." }
];

cardByNumber(ecf, 64).pairs = [
  { kind: "q", q: "Pour un capot qui s’ouvre depuis l’avant du véhicule, à quoi sert le dispositif de sécurité ?", a: "À empêcher l’ouverture du capot en circulation en cas de mauvais verrouillage." },
  { kind: "demo", q: "Procédez à l’ouverture du capot puis à sa fermeture en vous assurant de son verrouillage.", a: "Effectuer la manipulation selon le véhicule et vérifier le verrouillage complet du capot." },
  { kind: "q", q: "Quels sont les risques pour une personne victime d’une hémorragie ?", a: "Une détresse circulatoire et un arrêt cardiaque." }
];

cardByNumber(ecf, 65).pairs = [
  { kind: "q", q: "Pourquoi doit-on régler la hauteur des feux ?", a: "Pour ne pas éblouir les autres usagers." },
  { kind: "demo", q: "Montrez la commande de réglage de hauteur des feux.", a: "Ce dispositif se situe en général à gauche du volant ; son emplacement exact dépend du véhicule." },
  { kind: "q", q: "Comment et pourquoi protéger une zone de danger en cas d’accident de la route ?", a: "Délimiter clairement et largement la zone de danger de façon visible afin de protéger les victimes et d’éviter un suraccident." }
];

cardByNumber(ecf, 67).pairs = [
  { kind: "q", q: "Quel est l’intérêt de la position « nuit » du rétroviseur intérieur ?", a: "Ne pas être ébloui par les feux du véhicule suiveur." },
  { kind: "demo", q: "Mettez le rétroviseur intérieur en position « nuit ».", a: "Si le véhicule possède un système automatique, l’indiquer." },
  { kind: "q", q: "Comment est composé le signal d’alerte du système d’alerte et d’information des populations diffusé par les sirènes ?", a: "Il comporte le signal national d’alerte, modulé sur trois cycles successifs, puis un signal continu de fin d’alerte." }
];

cardByNumber(ecf, 70).pairs = [
  { kind: "q", q: "Quelle est la conséquence d’un niveau insuffisant du liquide de frein ?", a: "Une perte d’efficacité du freinage." },
  { kind: "demo", q: "Montrez où s’effectue le contrôle du niveau du liquide de frein.", a: "Montrer le bocal et vérifier que le niveau est situé entre les repères minimum et maximum." },
  { kind: "q", q: "En cas de panne ou d’accident, quel équipement doit être porté avant de quitter le véhicule ?", a: "Le gilet de haute visibilité doit être enfilé avant de quitter le véhicule." }
];

cardByNumber(ecf, 81).pairs = [
  { kind: "q", q: "Quel est le risque de circuler avec un frein de parking mal desserré ?", a: "Une dégradation du système de freinage." },
  { kind: "q", q: "De quelle couleur est le voyant qui indique une défaillance du système de freinage ?", a: "Rouge." },
  { kind: "q", q: "Hors autoroute ou endroit dangereux, en cas de panne ou d’accident, où doit être placé le triangle de présignalisation ?", a: "À environ 30 mètres du véhicule, ou avant un virage ou un sommet de côte. Ne pas le placer si cette action met la vie en danger." }
];

// La question 275 porte sur une voie d'accélération : l'ancien giratoire était
// hors sujet et pouvait induire l'apprenant en erreur.
delete images[275];

fs.writeFileSync("data.js", `window.CODE_DATA = ${JSON.stringify(data)};\n`, "utf8");
fs.writeFileSync("ecf_data.js", `window.ECF_DATA = ${JSON.stringify(ecf)};\n`, "utf8");
fs.writeFileSync("images.js", `window.CODE_IMAGES = ${JSON.stringify(images)};\n`, "utf8");

console.log("Corrections de contenu appliquées : data.js, ecf_data.js et images.js");
