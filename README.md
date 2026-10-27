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
  npm run build
  npm run preview
  ```

  Les seules dépendances sont React 19 et Vite. Il n’y a pas de suite de tests ni de linter
  configurés.

  ## Fonctionnement des données

  La fiche entière est représentée comme une map plate de clés vers valeurs, stockée sous la clé
  `perso_sheet` dans un objet `{ metadata, data }`. Les cases à cocher sont enregistrées sous forme de
  chaînes `'true' / 'false'`.

  Chaque réglage est simplement un autre champ de cette structure : nombre de lignes, état plié,
  thème choisi, disposition des blocs, etc. Cela permet d’exporter, importer et conserver une
  compatibilité avec les fichiers plus anciens.

  Sur les navigateurs de bureau compatibles avec la File System Access API, « Lier un fichier »
  permet de lire et d’écrire directement la fiche liée. Les changements sont enregistrés après
  300 ms et les modifications faites ailleurs sont détectées toutes les 2 secondes ou au retour
  du focus. En cas de conflit, le fichier sur disque prévaut. Le lien est mémorisé dans IndexedDB ;
  après redémarrage, utilisez « Reconnecter » si le navigateur redemande l’autorisation. Sur les
  autres navigateurs, l’import et l’export JSON habituels restent disponibles.
  