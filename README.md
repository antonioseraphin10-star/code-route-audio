# 🚦 Code de la Route — Révision Audio

[![Validation](https://github.com/antonioseraphin10-star/code-route-audio/actions/workflows/validation.yml/badge.svg)](https://github.com/antonioseraphin10-star/code-route-audio/actions/workflows/validation.yml)

Application web (PWA) pour réviser le **code de la route** (permis B) avec **lecture vocale** des questions et un **tableau de bord de progression**.

**▶️ Ouvrir l'application : https://antonioseraphin10-star.github.io/code-route-audio/**

(La page GitHub du dépôt montre le code ; l'application elle-même est à l'adresse `github.io` ci-dessus.)

👉 **Installation sur iPhone / iPad / Android** : ouvre l'adresse dans le navigateur, puis « **Ajouter à l'écran d'accueil** ». L'app s'installe comme une vraie application et fonctionne **hors-ligne**.

## Fonctionnalités
- 🔊 Lecture automatique avec sélection de la meilleure voix française, rythme naturel et pauses pédagogiques
- 📚 10 thématiques · 67 leçons · **517 questions** avec correction immédiate
- 📖 Fiches de cours lisibles et écoutables
- 🎯 Quiz par leçon, par thème, ou « quiz surprise » de 40 questions
- 🔀 Ordre des réponses mélangé à chaque série : impossible de deviner « A » par habitude
- 📊 Suivi graphique : précision globale et par thème, activité, courbe de progression, points faibles
- 🔁 Rejeu des erreurs · ⬇️ export / ⬆️ import de la progression
- 📱 PWA installable, responsive, 100 % hors-ligne

## Réglages
Roue dentée ⚙️ :

- **voix la plus naturelle** : privilégie une voix française améliorée ou neuronale disponible dans le navigateur ;
- **voix locale uniquement** : exclut les services vocaux distants et conserve un fonctionnement strictement hors ligne ;
- choix manuel de la voix, vitesse de lecture et pauses naturelles ;
- bouton de comparaison avec un exemple proche d'une vraie question.

## Confidentialité
La progression est stockée **localement** sur l'appareil (`localStorage`) et le code de l'application n'envoie aucune donnée à un serveur.

Une voix marquée **« service vocal distant »** peut toutefois transmettre le texte au service de synthèse du navigateur ou du système. Pour exclure ce traitement, choisir **« voix française locale uniquement »** dans les réglages.

## Conformité des contenus

Une revue réglementaire ciblée a été réalisée le 20 juillet 2026 et documentée dans [`CONFORMITE-CONTENUS.md`](CONFORMITE-CONTENUS.md). Elle a notamment actualisé les règles relatives aux papiers d'assurance, au feu antibrouillard arrière et aux carrefours à sens giratoire.

Cette revue n'est ni une certification officielle de l'examen ni un avis juridique. La redistribution du corpus déclaré comme provenant de TestPermis.fr reste **bloquée** en l'absence d'une licence ou d'une autorisation écrite vérifiable.

## Pour modifier l'application

Aucune installation : c'est un site statique (HTML, CSS, JavaScript), sans dépendance.

| Fichier | Rôle |
|---|---|
| `index.html`, `style.css` | page et apparence |
| `app.js` | écrans, quiz, progression, réglages |
| `tts.js` | choix de la voix et préparation du texte lu |
| `data.js` | thèmes, leçons et 517 questions |
| `ecf_data.js` | 100 fiches de l'examinateur |
| `visuals.js`, `images.js` | illustrations SVG et leur lien avec les questions |
| `sw.js` | cache hors ligne (PWA) |
| `tools/` | contrôles automatiques |

**Tester en local** (le service worker exige une adresse `http`, pas `file://`) :

```bash
python -m http.server 8080
```

puis ouvrir http://localhost:8080.

**Lancer les contrôles** (Node.js 18 ou plus) :

```bash
npm test
```

Ils vérifient le contenu, la voix, la liste des fichiers hors ligne et le moteur de quiz. GitHub les relance à chaque envoi (badge « Validation » en haut).

**Après toute modification d'un fichier de l'application**, augmenter le numéro de `CACHE` dans `sw.js` (`cdlr-v13` → `cdlr-v14`). Sinon, les téléphones qui ont installé l'app gardent l'ancienne version.

---
Support pédagogique indépendant de révision. Vérifier les règles à jour sur les sources officielles avant publication ou usage professionnel.
