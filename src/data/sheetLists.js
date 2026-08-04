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

export const WEAPONS = multiFieldList('armes', 6, 'arme', ['nom', 'bonus', 'degats', 'notes']);

export const CLASS_FEATURES = singleFieldList('capacites', 8, 'capacite');

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
