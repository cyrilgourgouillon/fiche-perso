import { DEFAULT_THEME } from '../data/themes.js';

const FORMAT_VERSION = '1.1';
const FALLBACK_FILE_NAME = 'kresk';
const ILLEGAL_FILE_NAME_CHARS = /[\\/:*?"<>|]/g;

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
      data,
    },
    null,
    2,
  );

/** Accepts both the envelope format and a bare field map. Throws on invalid JSON. */
export const parseSheet = (text) => {
  const parsed = JSON.parse(text);
  return parsed.data || parsed;
};

export const sheetFileName = (data) => {
  const name = (data.nom_personnage || FALLBACK_FILE_NAME).trim().replace(ILLEGAL_FILE_NAME_CHARS, '-');
  return `${name || FALLBACK_FILE_NAME}.json`;
};
