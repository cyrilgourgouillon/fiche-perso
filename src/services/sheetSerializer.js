import { DEFAULT_THEME } from '../data/themes.js';

const FORMAT_VERSION = '1.1';
const FALLBACK_FILE_NAME = 'kresk';
const ILLEGAL_FILE_NAME_CHARS = /[\\/:*?"<>|]/g;
export const DEFAULT_TEXTAREA_MODE = 'edit';
export const DEFAULT_REDUCE_MOTION = 'false';

export const normalizeTextAreaMode = (data) => ({
  ...data,
  textarea_mode: data.textarea_mode === 'visual' ? 'visual' : DEFAULT_TEXTAREA_MODE,
});

export const normalizeReducedMotion = (data) => ({
  ...data,
  reduce_motion: data.reduce_motion === 'true' ? 'true' : DEFAULT_REDUCE_MOTION,
});

/** Wraps the raw field map in a metadata envelope — the on-disk / stored format. */
export const serializeSheet = (data) =>
  JSON.stringify(
    {
      metadata: {
        name: data.nom_personnage || 'Sans titre',
        classe: data.classe || '',
        niveau: data.niveau || '',
        theme: data.theme || DEFAULT_THEME,
        generatedAt: new Date().toISOString(),
        version: FORMAT_VERSION,
      },
      data: normalizeReducedMotion(normalizeTextAreaMode(data)),
    },
    null,
    2,
  );

/** Move notes stored in legacy class-feature titles/traits into descriptions. */
export const normalizeClassFeatureNotes = (data) => {
  const normalized = { ...data };
  const featureRows = new Map();

  Object.keys(data).forEach((key) => {
    const match = key.match(/^capacite(\d+)$/);
    if (match) featureRows.set(Number(match[1]), data[key]);
  });

  const moveNote = (row, title, note) => {
    const cleanTitle = title.trim();
    const cleanNote = note.trim();
    if (!cleanTitle || !cleanNote) return;

    normalized[`capacite${row}`] = cleanTitle;
    const descriptionField = `capacite${row}_description`;
    if (!normalized[descriptionField]) normalized[descriptionField] = cleanNote;
    featureRows.set(row, cleanTitle);
  };

  // Some older sheets kept the title and note together in `capaciteN`.
  featureRows.forEach((title, row) => {
    if (typeof title !== 'string') return;
    const separator = title.indexOf(':');
    if (separator >= 0) moveNote(row, title.slice(0, separator), title.slice(separator + 1));

    const descriptionField = `capacite${row}_description`;
    const legacyNote = data[`capacite${row}_note`] || data[`capacite${row}_notes`];
    if (!normalized[descriptionField] && typeof legacyNote === 'string' && legacyNote.trim()) {
      normalized[descriptionField] = legacyNote.trim();
    }
  });

  // Older exports also stored class features in `traitN` as “Title: note”.
  Object.keys(data).forEach((key) => {
    const match = key.match(/^trait\d+$/);
    if (!match || typeof data[key] !== 'string') return;
    const separator = data[key].indexOf(':');
    if (separator < 0) return;

    const legacyTitle = data[key].slice(0, separator).trim();
    const row = [...featureRows.entries()].find(([, title]) =>
      typeof title === 'string' && title.trim().toLocaleLowerCase() === legacyTitle.toLocaleLowerCase(),
    )?.[0];
    if (row !== undefined) moveNote(row, featureRows.get(row), data[key].slice(separator + 1));
  });

  return normalized;
};

/** Accepts both the envelope format and a bare field map. Throws on invalid JSON. */
export const parseSheet = (text) => {
  const parsed = JSON.parse(text);
  return normalizeReducedMotion(normalizeTextAreaMode(normalizeClassFeatureNotes(parsed.data || parsed)));
};

export const sheetFileName = (data) => {
  const name = (data.nom_personnage || FALLBACK_FILE_NAME).trim().replace(ILLEGAL_FILE_NAME_CHARS, '-');
  return `${name || FALLBACK_FILE_NAME}.json`;
};
