# Revue réglementaire et juridique des contenus

**État de la revue : 20 juillet 2026 — prépublication locale, non déployée**

Ce document trace une **revue réglementaire documentée** du contenu pédagogique. Il ne constitue pas une consultation juridique, une certification officielle de l’examen ni la validation d’un avocat. Une validation juridique formelle exige un professionnel habilité et, pour les droits d’auteur, une preuve écrite de licence ou d’autorisation du titulaire des droits.

## Statut synthétique

| Domaine | Statut | Décision avant publication |
|---|---|---|
| Règles ciblées corrigées | Conforme aux sources officielles citées ci-dessous au 20/07/2026 | Tests automatiques obligatoires |
| 517 questions | Cohérence technique vérifiée ; revue juridique exhaustive non réalisée question par question | Prévoir une revue éditoriale complète et périodique |
| 100 fiches ECF | Réponses vides/fusionnées corrigées ; deux fiches d’assurance actualisées | Vérifier la liste officielle d’examen en vigueur avant de présenter ces fiches comme officielles |
| Droit d’auteur du corpus | **Bloquant** | Obtenir une autorisation écrite de redistribution ou remplacer le corpus par un contenu original/licencié |
| Confidentialité | Progression locale ; l’application ne réalise pas de requête sortante. Une voix distante peut cependant dépendre d’un service du navigateur ou du système | Information affichée dans les réglages et mode « voix locale uniquement » disponible |
| Déploiement de cette version | **Suspendu** | Montrer la maquette, obtenir l’accord d’Anton, puis lever le blocage de droits |

## Corrections réglementaires appliquées

### Feu antibrouillard arrière

La question 18 et le cours 1.3 indiquent désormais que le feu antibrouillard arrière peut être utilisé par temps de brouillard ou par chute de neige. La « forte pluie seule » a été retirée : l’article R416-7 réserve cette possibilité aux feux antibrouillard avant.

Source : [Code de la route, article R416-7 — Légifrance](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006842263/2023-03-18).

### Documents et assurance au contrôle routier

Le cours 10.2 et les questions 511 à 517 ont été réécrits. Depuis le 1er avril 2024, les papiers et la vignette d’assurance ne sont plus à présenter pour un véhicule immatriculé ; les forces de l’ordre consultent le fichier des véhicules assurés (FVA). L’obligation d’assurance demeure.

Sources :

- [Documents obligatoires lors d’un contrôle routier — Service-Public, vérifié le 2 février 2026](https://www.service-public.fr/particuliers/vosdroits/F2794)
- [Suppression de la carte verte — ministère de l’Économie](https://www.economie.gouv.fr/actualites/assurance-automobile-suppression-carte-verte-avril-2024)
- [Assurance automobile — Service-Public](https://www.service-public.fr/particuliers/vosdroits/F1362)

### Giratoires

Les nouveaux schémas distinguent la priorité à l’entrée, le placement possible selon la direction et le marquage, puis les contrôles nécessaires avant une sortie. Ils évitent de présenter la voie intérieure comme obligatoire et rappellent qu’un changement de voie reste soumis à la priorité et doit être signalé.

Sources :

- [Code de la route, article R415-10 — priorité à l’entrée du giratoire](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000006842250/2024-01-01)
- [Code de la route, article R412-9 — placement et changement de voie](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000050965688/2026-05-03)

### Gilet et triangle

Les réponses ECF corrigées précisent que le triangle se place à environ 30 mètres, sauf si cette action met la vie du conducteur en danger.

Source : [Équipements obligatoires en voiture — Service-Public](https://www.service-public.fr/particuliers/vosdroits/F19459).

## Anomalies éditoriales corrigées

- Fiches ECF 25, 55 et 81 : réponse « Rouge » replacée dans la bonne question.
- Fiches ECF 29, 35, 49, 56, 64 et 96 : blocs fusionnés ou artificiellement séparés rétablis en trois éléments cohérents.
- Fiches ECF 42 et 88 : démonstration de la sécurité enfant reclassée et complétée.
- Fiche ECF 61 : emplacement des attaches Isofix complété.
- Fiches ECF 65, 67 et 70 : questions et réponses qui avaient été fusionnées séparées.
- Fiches ECF 9 et 41 : anciennes références à l’attestation et à la vignette d’assurance remplacées par le contrôle FVA.
- Question 275 : schéma de giratoire hors sujet supprimé.

## Blocage de droits d’auteur

Le fichier `data.js` déclare `TestPermis.fr` comme source du corpus. Le site TestPermis affiche « Tous droits réservés » et le dépôt ne contient ni licence de redistribution ni autorisation écrite vérifiable. Le fait que le dépôt soit public ou que l’usage soit pédagogique ne crée pas automatiquement un droit de republication.

**Décision : ne pas déployer cette révision** tant qu’une des deux conditions suivantes n’est pas remplie :

1. une autorisation écrite couvre la reproduction, l’adaptation et la diffusion publique de ce corpus ; ou
2. les contenus concernés sont remplacés par des textes originaux, sourcés sur des références publiques et relus indépendamment.

Page de provenance consultée : [TestPermis.fr](https://www.testpermis.fr/).

## Contrôle automatique

Lancer depuis la racine du projet :

```powershell
node tools/validate-content.mjs
node tools/validate-tts.mjs
node tools/validate-app.mjs
```

Le contrôle vérifie le nombre et l’unicité des questions, la présence des bonnes réponses dans les choix, les 100 fiches ECF, l’absence de réponses ordinaires vides et plusieurs formulations réglementaires obsolètes. Il signale aussi, sans le modifier, le déséquilibre historique de la position des bonnes réponses.

## Synthèse vocale et confidentialité

L’API Web Speech distingue les voix fournies par un synthétiseur local des voix fournies par un service distant. Le réglage « voix la plus naturelle » peut sélectionner une voix distante lorsque le navigateur en propose une ; l’interface l’indique désormais explicitement. Le réglage « voix française locale uniquement » filtre strictement les voix dont `localService` vaut `true`.

Source technique : [Web Speech API — SpeechSynthesisVoice, W3C](https://webaudio.github.io/web-speech-api/).
