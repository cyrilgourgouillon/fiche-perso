import { DEFAULT_THEME } from '../data/themes';
import {
  CLASS_FEATURES,
  CLASS_FEATURES_USED,
  INVENTORY,
  MAGIC_ITEMS,
  QUESTS,
  SPELLS,
  WEAPONS,
} from '../data/sheetLists';
import { ABILITIES, SKILLS } from '../data/abilities';
import { listRowCount } from './sheetRows';

const FORMAT_VERSION = '2.0';
const FALLBACK_FILE_NAME = 'kresk';
const ILLEGAL_FILE_NAME_CHARS = /[\\/:*?"<>|]/g;
const ARRAY_LISTS = [
  { key: 'weapons', path: ['weapons'], list: WEAPONS, fields: WEAPONS.fields, rowPattern: /^arme(\d+)_/ },
  { key: 'spells', path: ['spells', 'known'], list: SPELLS, fields: SPELLS.fields, rowPattern: /^sort(\d+)_/ },
  {
    key: 'classFeatures',
    path: ['classFeatures'],
    list: CLASS_FEATURES,
    fields: ['titre', 'description', 'repos_court', 'repos_long', 'utilisee', 'combat'],
    rowPattern: /^capacite(?:_utilisee)?(\d+)/,
    field: (row, name) =>
      name === 'titre'
        ? CLASS_FEATURES.field(row)
        : name === 'utilisee'
          ? CLASS_FEATURES_USED.field(row)
          : CLASS_FEATURES.field(row, name),
  },
  { key: 'inventory', path: ['equipment', 'inventory'], list: INVENTORY, fields: INVENTORY.fields, rowPattern: /^inventaire(\d+)_/ },
  { key: 'quests', path: ['quests'], list: QUESTS, fields: QUESTS.fields, rowPattern: /^quete(\d+)_/ },
];
const SIMPLE_ARRAY_LISTS = [
  { key: 'magicItems', path: ['equipment', 'magicItems'], list: MAGIC_ITEMS, rowPattern: /^lien_magique(\d+)$/ },
];
const LIST_FIELD_PATTERN =
  /^(?:arme\d+_|sort\d+_|capacite\d+(?:_|$)|capacite_utilisee\d+$|inventaire\d+_|quete\d+_|lien_magique\d+$|trait\d+$|(?:armes|sorts|capacites|inventaire|quetes|liens_magiques)_lignes$)/;
const TRAIT_FIELD_PATTERN = /^trait(\d+)$/;
const SPELL_SLOT_PATTERN = /^emplacement_sort_(\d+)_(\d+)$/;
const SPELL_SLOT_OVERRIDE_PATTERN = /^emplacements_sorts_niveau_(\d+)$/;

const SCALAR_FIELDS = new Map();
const addFields = (path, fields) => {
  fields.forEach((field) => SCALAR_FIELDS.set(field, [...path, field]));
};
const addFieldMap = (path, fields) => {
  Object.entries(fields).forEach(([field, name]) => SCALAR_FIELDS.set(field, [...path, name]));
};

addFieldMap(['character', 'identity'], {
  nom: 'name',
  nom_personnage: 'characterName',
  classe: 'class',
  sous_classe: 'subclass',
  espece: 'species',
  historique: 'background',
  alignement: 'alignment',
});
addFieldMap(['character', 'background'], {
  trait_personnalite: 'personality',
  ideal: 'ideal',
  lien: 'bond',
  defaut: 'flaw',
  histoire: 'storyFlag',
  histoire_skill: 'historySkillNotes',
});
SCALAR_FIELDS.set('apparence', ['character', 'appearance', 'description']);
addFieldMap(['character', 'appearance', 'avatar'], {
  avatar_gender: 'gender',
  avatar_race: 'race',
  avatar_shirt_color: 'shirtColor',
  avatar_shirt_style: 'shirtStyle',
  avatar_trousers_color: 'trousersColor',
  avatar_trousers_style: 'trousersStyle',
  avatar_weapon: 'weapon',
  avatar_hat_color: 'hatColor',
  avatar_hat_style: 'hatStyle',
});

addFieldMap(['life'], {
  niveau: 'level',
  px: 'experience',
  inspiration: 'inspiration',
});
addFieldMap(['life', 'hitPoints'], {
  points_vie_max: 'maximum',
  points_vie_actuel: 'current',
  points_vie_temp: 'temporary',
});
addFieldMap(['life', 'hitDice'], {
  des_vie: 'remaining',
  des_vie_max: 'maximum',
});
addFieldMap(['life', 'deathSaves'], {
  mort_succes: 'successes',
  mort_echecs: 'failures',
});

ABILITIES.forEach(({ key }) => {
  SCALAR_FIELDS.set(key, ['characteristics', 'abilities', key]);
  SCALAR_FIELDS.set(`save_${key}`, ['characteristics', 'savingThrows', key]);
});
addFieldMap(['characteristics'], { bonus_maitrise: 'proficiencyBonus' });
SKILLS.forEach(({ key }) => {
  SCALAR_FIELDS.set(key, ['characteristics', 'skills', key, 'proficient']);
  SCALAR_FIELDS.set(`${key}_particularite`, ['characteristics', 'skills', key, 'multiplier']);
});
SCALAR_FIELDS.set('discretion_particularite', ['characteristics', 'skills', 'discretion', 'multiplier']);

addFieldMap(['combat'], {
  classe_armure: 'armorClass',
  bouclier: 'shield',
  initiative: 'initiative',
  vitesse: 'speed',
  taille: 'size',
  perception_passive: 'passivePerception',
});

addFieldMap(['spells', 'casting'], {
  caracteristique_incantation: 'ability',
  modificateur_incantation: 'modifier',
  dd_sauvegarde: 'saveDifficulty',
  bonus_attaque_sort: 'attackBonus',
});
SCALAR_FIELDS.set('magie_pacte', ['spellSlots', 'pactMagic']);

addFieldMap(['proficiencies', 'armor'], {
  armures_legeres: 'light',
  armures_intermediaires: 'medium',
  armures_lourdes: 'heavy',
  armures_boucliers: 'shields',
});
addFieldMap(['proficiencies'], {
  armes_maitrises: 'weapons',
  outils_maitrises: 'tools',
  langues: 'languages',
});

addFieldMap(['equipment', 'currency'], {
  pc: 'copper',
  pa: 'silver',
  pe: 'electrum',
  po: 'gold',
  pp: 'platinum',
});
addFieldMap(['equipment'], { equipement: 'notes' });
addFields(['notes'], ['notes']);
addFieldMap(['settings'], {
  theme: 'theme',
  textarea_mode: 'textAreaMode',
  reduce_motion: 'reduceMotion',
  tile_layout: 'tileLayout',
  quest_status_filter: 'questStatusFilter',
});

const setPath = (target, path, value) => {
  let current = target;
  path.slice(0, -1).forEach((key) => {
    if (!isRecord(current[key])) current[key] = {};
    current = current[key];
  });
  current[path.at(-1)] = value;
};

const getPath = (target, path) => {
  let current = target;
  for (const key of path.slice(0, -1)) {
    if (current === undefined || current === null) return undefined;
    if (!isRecord(current)) throw new TypeError(`Expected "${path.join('.')}" to contain an object`);
    current = current[key];
  }
  if (current === undefined || current === null) return undefined;
  if (!isRecord(current)) throw new TypeError(`Expected "${path.join('.')}" to contain an object`);
  return current[path.at(-1)];
};

export const DEFAULT_TEXTAREA_MODE = 'edit';
export const DEFAULT_REDUCE_MOTION = 'false';

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const serializedRowCount = (data, list, rowPattern) => {
  const highestStoredRow = Object.keys(data).reduce((highest, key) => {
    const match = key.match(rowPattern);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return Math.max(listRowCount(data, list), highestStoredRow);
};

export const normalizeTextAreaMode = (data) => ({
  ...data,
  textarea_mode: data.textarea_mode === 'visual' ? 'visual' : DEFAULT_TEXTAREA_MODE,
});

export const normalizeReducedMotion = (data) => ({
  ...data,
  reduce_motion: data.reduce_motion === 'true' ? 'true' : DEFAULT_REDUCE_MOTION,
});

/** Converts the flat UI model to the array-based on-disk and stored format. */
export const serializeSheet = (data) => {
  const normalized = normalizeReducedMotion(normalizeTextAreaMode(data));
  const modules = {};

  Object.entries(normalized).forEach(([key, value]) => {
    const sectionFold = key.match(/^section_(.+)_replie$/);
    if (sectionFold) {
      setPath(modules, ['settings', 'sections', sectionFold[1], 'folded'], value);
      return;
    }
    if (LIST_FIELD_PATTERN.test(key) || SPELL_SLOT_PATTERN.test(key) || SPELL_SLOT_OVERRIDE_PATTERN.test(key)) {
      return;
    }
    const path = SCALAR_FIELDS.get(key);
    if (path) {
      setPath(modules, path, value);
      return;
    }
    setPath(modules, ['other', key], value);
  });

  ARRAY_LISTS.forEach(({ path, list, fields, field = list.field, rowPattern }) => {
    setPath(modules, path, Array.from({ length: serializedRowCount(data, list, rowPattern) }, (_, row) =>
      Object.fromEntries(
        fields.flatMap((name) => {
          const fieldName = field(row, name);
          return fieldName in normalized ? [[name, normalized[fieldName]]] : [];
        }),
      ),
    ));
  });

  SIMPLE_ARRAY_LISTS.forEach(({ path, list, rowPattern }) => {
    setPath(modules, path, Array.from({ length: serializedRowCount(data, list, rowPattern) }, (_, row) => {
      const field = list.field(row);
      return field in normalized ? normalized[field] : '';
    }));
  });

  const traitRows = Object.entries(normalized)
    .map(([key]) => key.match(TRAIT_FIELD_PATTERN))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  setPath(modules, ['character', 'traits'], Array.from({ length: Math.max(0, ...traitRows) }, (_, index) =>
    normalized[`trait${index + 1}`] || '',
  ));

  const spellSlots = [];
  const slotNumbers = new Map();
  Object.entries(normalized).forEach(([key, value]) => {
    const slot = key.match(SPELL_SLOT_PATTERN);
    if (slot) {
      const [, level, number] = slot;
      const levelNumber = Number(level);
      const slotNumber = Number(number);
      const slots = slotNumbers.get(levelNumber) || new Map();
      slots.set(slotNumber, value);
      slotNumbers.set(levelNumber, slots);
      return;
    }
    const override = key.match(SPELL_SLOT_OVERRIDE_PATTERN);
    if (override) {
      const levelNumber = Number(override[1]);
      const levelData = spellSlots.find((entry) => entry.level === levelNumber) || { level: levelNumber };
      levelData.override = value;
      if (!spellSlots.includes(levelData)) spellSlots.push(levelData);
    }
  });
  slotNumbers.forEach((slots, level) => {
    const levelData = spellSlots.find((entry) => entry.level === level) || { level };
    levelData.slots = [...slots.entries()]
      .sort(([a], [b]) => a - b)
      .map(([number, used]) => ({ number, used }));
    if (!spellSlots.includes(levelData)) spellSlots.push(levelData);
  });
  setPath(modules, ['spellSlots', 'levels'], spellSlots.sort((a, b) => a.level - b.level));

  return JSON.stringify(
    {
      metadata: {
        name: data.nom_personnage || 'Sans titre',
        classe: data.classe || '',
        niveau: data.niveau || '',
        theme: data.theme || DEFAULT_THEME,
        generatedAt: new Date().toISOString(),
        version: FORMAT_VERSION,
      },
      ...modules,
    },
    null,
    2,
  );
};

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

const flattenArrayLists = (character, lists) => {
  const flattened = { ...character };

  ARRAY_LISTS.forEach(({ key, list, fields, field = list.field }) => {
    if (!(key in lists)) return;
    if (!Array.isArray(lists[key])) throw new TypeError(`Expected "${key}" to be an array`);
    const rows = lists[key];
    const rowCount = Math.max(1, rows.length);
    const countField = `${list.key}_lignes`;
    if (rowCount === list.defaultRows) delete flattened[countField];
    else flattened[countField] = String(rowCount);
    rows.forEach((row, index) => {
      if (!isRecord(row)) throw new TypeError(`Expected "${key}[${index}]" to be an object`);
      fields.forEach((name) => {
        if (name in row) flattened[field(index, name)] = row[name];
      });
    });
  });

  SIMPLE_ARRAY_LISTS.forEach(({ key, list }) => {
    if (!(key in lists)) return;
    if (!Array.isArray(lists[key])) throw new TypeError(`Expected "${key}" to be an array`);
    const rows = lists[key];
    const rowCount = Math.max(1, rows.length);
    const countField = `${list.key}_lignes`;
    if (rowCount === list.defaultRows) delete flattened[countField];
    else flattened[countField] = String(rowCount);
    rows.forEach((value, index) => {
      if (typeof value !== 'string') throw new TypeError(`Expected "${key}[${index}]" to be a string`);
      flattened[list.field(index)] = value;
    });
  });

  if ('traits' in lists) {
    if (!Array.isArray(lists.traits)) throw new TypeError('Expected "traits" to be an array');
    lists.traits.forEach((value, index) => {
      if (typeof value !== 'string') throw new TypeError(`Expected "traits[${index}]" to be a string`);
      flattened[`trait${index + 1}`] = value;
    });
  }

  return flattened;
};

const flattenModules = (modules) => {
  const flattened = {};
  SCALAR_FIELDS.forEach((path, key) => {
    const value = getPath(modules, path);
    if (value !== undefined) flattened[key] = value;
  });

  const knownModules = ['character', 'life', 'characteristics', 'combat', 'spells', 'spellSlots', 'equipment', 'proficiencies', 'notes', 'settings', 'other'];
  knownModules.forEach((module) => {
    const value = modules[module];
    if (value !== undefined && !isRecord(value)) throw new TypeError(`Expected "${module}" to be an object`);
  });

  if (modules.character?.traits !== undefined && !Array.isArray(modules.character.traits)) {
    throw new TypeError('Expected "character.traits" to be an array');
  }
  if (Array.isArray(modules.character?.traits)) {
    modules.character.traits.forEach((value, index) => {
      if (typeof value !== 'string') throw new TypeError(`Expected "character.traits[${index}]" to be a string`);
      flattened[`trait${index + 1}`] = value;
    });
  }

  ARRAY_LISTS.forEach(({ path, list, fields, field = list.field }) => {
    const rows = getPath(modules, path);
    if (rows === undefined) return;
    if (!Array.isArray(rows)) throw new TypeError(`Expected "${path.join('.')}" to be an array`);
    const rowCount = Math.max(1, rows.length);
    const countField = `${list.key}_lignes`;
    if (rowCount === list.defaultRows) delete flattened[countField];
    else flattened[countField] = String(rowCount);
    rows.forEach((row, index) => {
      if (!isRecord(row)) throw new TypeError(`Expected "${path.join('.')}[${index}]" to be an object`);
      fields.forEach((name) => {
        if (name in row) flattened[field(index, name)] = row[name];
      });
    });
  });

  SIMPLE_ARRAY_LISTS.forEach(({ path, list }) => {
    const rows = getPath(modules, path);
    if (rows === undefined) return;
    if (!Array.isArray(rows)) throw new TypeError(`Expected "${path.join('.')}" to be an array`);
    const rowCount = Math.max(1, rows.length);
    const countField = `${list.key}_lignes`;
    if (rowCount === list.defaultRows) delete flattened[countField];
    else flattened[countField] = String(rowCount);
    rows.forEach((value, index) => {
      if (typeof value !== 'string') throw new TypeError(`Expected "${path.join('.')}[${index}]" to be a string`);
      flattened[list.field(index)] = value;
    });
  });

  const foldedSections = modules.settings?.sections;
  if (foldedSections !== undefined) {
    if (!isRecord(foldedSections)) throw new TypeError('Expected "settings.sections" to be an object');
    Object.entries(foldedSections).forEach(([section, state]) => {
      if (!isRecord(state)) throw new TypeError(`Expected "settings.sections.${section}" to be an object`);
      if ('folded' in state) flattened[`section_${section}_replie`] = state.folded;
    });
  }

  const slots = modules.spellSlots;
  if (slots !== undefined) {
    if (!isRecord(slots)) throw new TypeError('Expected "spellSlots" to be an object');
    if ('pactMagic' in slots) flattened.magie_pacte = slots.pactMagic;
    if ('levels' in slots) {
      if (!Array.isArray(slots.levels)) throw new TypeError('Expected "spellSlots.levels" to be an array');
      slots.levels.forEach((levelData, index) => {
        if (!isRecord(levelData) || !Number.isInteger(levelData.level) || levelData.level < 1) {
          throw new TypeError(`Expected "spellSlots.levels[${index}]" to have a positive integer level`);
        }
        if ('override' in levelData) {
          flattened[`emplacements_sorts_niveau_${levelData.level}`] = levelData.override;
        }
        if (levelData.slots !== undefined) {
          if (!Array.isArray(levelData.slots)) throw new TypeError(`Expected "spellSlots.levels[${index}].slots" to be an array`);
          levelData.slots.forEach((slot, slotIndex) => {
            if (!isRecord(slot) || !Number.isInteger(slot.number) || slot.number < 1 || !('used' in slot)) {
              throw new TypeError(`Expected "spellSlots.levels[${index}].slots[${slotIndex}]" to have a positive integer number and used value`);
            }
            flattened[`emplacement_sort_${levelData.level}_${slot.number}`] = slot.used;
          });
        }
      });
    }
  }

  if (modules.other !== undefined && !isRecord(modules.other)) throw new TypeError('Expected "other" to be an object');
  if (isRecord(modules.other)) Object.assign(flattened, modules.other);
  return flattened;
};

/** Accepts grouped v2, the previous in-progress v2 shape, legacy envelopes, and bare field maps. */
export const parseSheet = (text) => {
  const parsed = JSON.parse(text);
  if (!isRecord(parsed)) throw new TypeError('Expected a JSON object');

  let data;
  if ('lists' in parsed && 'character' in parsed) {
    if (!isRecord(parsed.character)) throw new TypeError('Expected "character" to be an object');
    const lists = parsed.lists ?? {};
    if (!isRecord(lists)) throw new TypeError('Expected "lists" to be an object');
    data = flattenArrayLists(parsed.character, lists);
  } else if ('life' in parsed || 'characteristics' in parsed || 'spellSlots' in parsed) {
    data = flattenModules(parsed);
  } else {
    data = isRecord(parsed.data) ? parsed.data : parsed;
  }

  return normalizeReducedMotion(normalizeTextAreaMode(normalizeClassFeatureNotes(data)));
};

export const sheetFileName = (data) => {
  const name = (data.nom_personnage || FALLBACK_FILE_NAME).trim().replace(ILLEGAL_FILE_NAME_CHARS, '-');
  return `${name || FALLBACK_FILE_NAME}.json`;
};
