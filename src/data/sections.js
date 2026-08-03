/**
 * Every section of the sheet, in the order it appears on the page.
 *
 * The ids match the ones the panels are built with, so this list drives both the
 * jump nav and "tout replier". Adding a panel means adding it here too — the two
 * places are deliberately separate because most panels are not interchangeable
 * components, they are hand-written blocks.
 */
export const SECTIONS = [
  { id: 'combat', label: 'Combat', foldable: false },
  { id: 'des', label: 'Dés' },
  { id: 'caracteristiques', label: 'Caractéristiques', foldable: false },
  { id: 'armes', label: 'Armes' },
  { id: 'capacites', label: 'Capacités' },
  { id: 'emplacements_sorts', label: 'Emplacements' },
  { id: 'sorts', label: 'Sorts' },
  { id: 'apparence', label: 'Apparence' },
  { id: 'pieces', label: 'Pièces' },
  { id: 'equipement', label: 'Équipement' },
  { id: 'maitrises', label: 'Maîtrises' },
  { id: 'quetes', label: 'Quêtes' },
  { id: 'notes', label: 'Notes' },
];

/** Sections that can be folded — points de vie, combat and caractéristiques stay open. */
export const FOLDABLE_SECTIONS = SECTIONS.filter((section) => section.foldable !== false);

/** The sheet field holding one section's fold state. */
export const foldField = (id) => `section_${id}_replie`;

/** The anchor a jump link points at. */
export const sectionAnchor = (id) => `section-${id}`;
