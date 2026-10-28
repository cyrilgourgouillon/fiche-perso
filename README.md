# Chroniques — Fiche de personnage

<https://github.com/cyrilgourgouillon/fiche-perso>

Chroniques est une fiche de personnage 100 % navigateur : aucune inscription, aucun serveur,
aucune base de données. La fiche est enregistrée dans le navigateur et peut être exportée
ou importée au format JSON. L’interface est entièrement en français.

## Fonctionnalités

- Fiche complète : stats, compétences, armes, sorts, équipement, quêtes et notes.
- Portrait pixel-art personnalisable.
- Calculs automatiques pour bonus et emplacements de sorts, y compris la magie de pacte de l’occultiste.
- Dés, jets et historique des derniers lancers.
- Recherche et navigation rapide par sections.
- Paramètres de mise en page, thèmes, affichage des zones de texte et réduction des animations.
- Sauvegarde auto, import/export JSON et mode hors ligne.
- Liaison directe avec un fichier JSON sur Chrome, Edge et Vivaldi pour ordinateur.

### Nouveautés

- Recherche rapide.
- Navigation de sections.
- Référence rapide de carac. et compétences.
- Paramètres avancés de disposition.
- Résumé de combat et apparence personnalisable.

## Démarrage rapide

```bash
npm install
npm run dev      # http://localhost:5173/fiche-perso/
npm run lint
npm test
npm run build
npm run preview
```

Les dépendances sont React 19 et Vite. ESLint applique les règles Airbnb adaptées à TypeScript
et React. Les tests utilisent le runner natif de Node.js.

## Organisation du code

- `src/components/` contient les composants d’interface, regroupés par domaine (`sheet`, `dice`, `fields`).
- `src/context/` expose les contextes partagés de la fiche et des dés.
- `src/data/` rassemble les listes et constantes utilisées par l’interface.
- `src/hooks/` contient les intégrations React réutilisables.
- `src/services/` regroupe les calculs, la persistance, l’import/export et les intégrations navigateur.
- `src/utils/` contient les utilitaires génériques sans dépendance au domaine de la fiche.
- `styles/` contient les feuilles de style par zone. `style.css` est leur point d’entrée : l’ordre des imports
  définit la cascade et doit être conservé lors de changements CSS.
- `src/services/*.test.js` contient les tests du runner natif Node.js. `npm test` les exécute.
- `public/` contient les ressources statiques copiées telles quelles dans la sortie de production.

Gardez la logique métier hors des composants lorsque celle-ci peut être partagée ou testée seule, et
ajoutez les nouvelles règles de données près des modules qui les consomment. Les fichiers de `dist/`
sont générés par Vite et ne doivent pas être modifiés à la main.

## Fonctionnement des données

La fiche est enregistrée sous la clé `perso_sheet` du navigateur. Le format v2 regroupe les
attributs selon les modules de la fiche : `character`, `life`, `characteristics`, `combat`,
`spells`, `spellSlots`, `weapons`, `classFeatures`, `equipment`, `proficiencies`, `quests`, `notes`
et `settings`. Les collections liées à un module sont stockées dans ce module sous forme de tableaux.

```json
{
  "metadata": { "version": "2.0" },
  "character": {
    "identity": { "characterName": "Kresk", "class": "Guerrier" },
    "traits": ["Endurance implacable"]
  },
  "life": { "level": "5", "hitPoints": { "maximum": "49", "current": "36" } },
  "characteristics": {
    "abilities": { "force": "20" },
    "savingThrows": { "force": "true" },
    "skills": { "perception": { "proficient": "true" } }
  },
  "spells": {
    "casting": { "ability": "intelligence" },
    "known": [{ "nom": "Bouclier", "niveau": "1" }]
  },
  "spellSlots": {
    "levels": [{ "level": 1, "slots": [{ "number": 1, "used": "true" }] }]
  },
  "weapons": [{ "nom": "Pique", "degats": "1d10 perforant" }],
  "equipment": {
    "currency": { "gold": "238" },
    "inventory": [{ "nom": "Potion", "quantite": "2" }],
    "magicItems": ["Hache en argent"]
  },
  "quests": [{ "titre": "Gnomes en garde", "statut": "terminee" }]
}
```

Les cases à cocher restent enregistrées sous forme de chaînes `'true' / 'false'`. Les tableaux
utilisent un objet par ligne pour conserver ensemble les champs d’une même entrée.

L’import accepte ce format, l’ancien format de production `{ metadata, data }`, les anciennes maps
de champs et la première forme de travail v2 `{ metadata, character, lists }`. Les données importées
sont converties vers le modèle utilisé par l’interface ; les prochaines sauvegardes et exports sont
écrits au format v2 groupé.

Sur les navigateurs de bureau compatibles avec la File System Access API, « Lier un fichier »
permet de lire et d’écrire directement la fiche liée. Les changements sont enregistrés après
300 ms et les modifications faites ailleurs sont détectées toutes les 2 secondes ou au retour
du focus. En cas de conflit, le fichier sur disque prévaut. Le lien est mémorisé dans IndexedDB ;
après redémarrage, utilisez « Reconnecter » si le navigateur redemande l’autorisation. Sur les
autres navigateurs, l’import et l’export JSON habituels restent disponibles.
  