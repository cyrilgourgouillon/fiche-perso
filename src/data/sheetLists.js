/**
 * The sheet's growable lists.
 *
 * Field keys are 1-based (`arme1_nom`), row indexes are 0-based everywhere in
 * the code. `rowFields(row)` lists every key a row owns, which is what adding
 * and removing rows shuffles around.
 */

/** One field per row: `capacite3`. */
const singleFieldList = (key, defaultRows, prefix) => ({
  key,
  defaultRows,
  field: (row) => `${prefix}${row + 1}`,
  rowFields: (row) => [`${prefix}${row + 1}`],
});

/** Several named fields per row: `arme3_nom`. */
const multiFieldList = (key, defaultRows, prefix, fields) => ({
  key,
  defaultRows,
  fields,
  field: (row, name) => `${prefix}${row + 1}_${name}`,
  rowFields: (row) => fields.map((name) => `${prefix}${row + 1}_${name}`),
});

export const WEAPONS = multiFieldList('armes', 6, 'arme', ['nom', 'bonus', 'degats', 'notes', 'combat']);

// Keep the original `capaciteN` and `capacite_utiliseeN` keys so old sheets
// retain their titles and used state. New fields simply default to blank/false.
export const CLASS_FEATURES = {
  key: 'capacites',
  defaultRows: 8,
  field: (row, name = 'titre') => name === 'titre' ? `capacite${row + 1}` : `capacite${row + 1}_${name}`,
  rowFields: (row) => [
    `capacite${row + 1}`,
    `capacite${row + 1}_description`,
    `capacite${row + 1}_repos_court`,
    `capacite${row + 1}_repos_long`,
    `capacite_utilisee${row + 1}`,
    `capacite${row + 1}_combat`,
  ],
};

export const CLASS_FEATURES_USED = singleFieldList('capacites_utilisees', 8, 'capacite_utilisee');

export const SPELLS = multiFieldList('sorts', 8, 'sort', [
  'niveau',
  'nom',
  'temps',
  'portee',
  'concentration',
  'rituel',
  'materiel',
  'notes',
  'combat',
]);

export const MAGIC_ITEMS = singleFieldList('liens_magiques', 3, 'lien_magique');

/** Quests are never removed, only folded away — `replie` is that fold state. */
export const QUESTS = multiFieldList('quetes', 2, 'quete', [
  'titre',
  'statut',
  'pnj',
  'lieu',
  'recompense',
  'description',
  'notes',
  'replie',
]);
