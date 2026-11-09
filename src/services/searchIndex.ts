/**
 * The sheet search index: one flat entry per thing a player can jump to, plus
 * the grouping the results panel displays. Pure functions over the field map.
 */
import {
  CLASS_FEATURES, INVENTORY, MAGIC_ITEMS, QUESTS, SPELLS, WEAPONS,
} from '../data/sheetLists';
import { ABILITIES, SKILLS } from '../data/abilities';
import { QUEST_STATUSES } from '../data/questStatuses';
import { SECTIONS, sectionAnchor } from '../data/sections';
import { listRowCount } from './sheetRows';
import { range } from '../utils/range';
import {
  abilityModifier, formatModifier, savingThrowBonus, skillBonus,
} from './characterMath';
import { matchingEntries, normalized, scopedSearch } from './search';

export type SheetValues = Record<string, unknown>;

export type SearchBadge = {
  label: string;
  value: string;
  tone?: string;
};

export type SearchEntry = {
  /** Stable identity: the field, the selector, or the title as a last resort. */
  key: string;
  title: string;
  detail?: string;
  preview?: string;
  badges: SearchBadge[];
  largeText?: Array<{ text: string; normalized: string }>;
  searchText: string;
  hideDetail?: boolean;
  field?: string;
  targetSelector?: string;
  section: string;
  row?: number;
  kind?: 'section';
  matchContext?: string;
};

export type SearchGroup = {
  section: string;
  label: string;
  entries: SearchEntry[];
};

export const MAX_SEARCH_RESULTS = 8;

/**
 * Imported sheets may hold numbers or objects where a string is expected:
 * numbers are kept, anything else that is not text becomes empty.
 */
export const safeText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const cell = (data: SheetValues, field: string) => safeText(data[field]).trim();

/** `'💪 Force'` → `'Force'`. */
export const withoutIcon = (label: string) => label.replace(/^\S+\s/, '');

export const sectionLabel = (id: string) => SECTIONS.find((section) => section.id === id)?.label;

const badge = (label: string, value: string, tone = 'category'): SearchBadge => ({ label, value, tone });

/* ------------------------------------------------------------------ inventory */

export type InventoryItem = { row: number; itemName: string; quantity: number };

export const inventoryQuantity = (data: SheetValues, row: number) => Math.max(
  0,
  Number.parseInt(safeText(data[INVENTORY.field(row, 'quantite')]), 10) || 0,
);

/** Every named inventory row, with its stock (empty stock included). */
export const inventoryItems = (data: SheetValues): InventoryItem[] => range(listRowCount(data, INVENTORY))
  .map((row) => ({ row, itemName: cell(data, INVENTORY.field(row, 'nom')), quantity: inventoryQuantity(data, row) }))
  .filter(({ itemName }) => itemName);

export const findInventoryItem = (items: InventoryItem[], name: string) => {
  const needle = normalized(name.trim());
  return items.find(({ itemName }) => normalized(itemName) === needle);
};

/* ---------------------------------------------------------------------- index */

type AddRowsOptions = {
  detailFields?: string[];
  largeTextFields?: string[];
  previewFields?: string[];
  hideDetail?: boolean;
  badges?: (row: number) => SearchBadge[];
};

export function buildSearchIndex(data: SheetValues): SearchEntry[] {
  const entries: SearchEntry[] = [];

  SECTIONS.forEach(({ id, label }) => {
    const targetSelector = `#${sectionAnchor(id)}`;
    entries.push({
      key: targetSelector, title: label, badges: [], searchText: label, section: id, kind: 'section', targetSelector,
    });
  });

  ABILITIES.forEach((ability) => {
    const score = cell(data, ability.key) || '—';
    const modifier = formatModifier(abilityModifier(data[ability.key]));
    const save = formatModifier(savingThrowBonus(data, ability.key));
    entries.push({
      key: ability.key,
      title: withoutIcon(ability.label),
      badges: [
        badge('Score', score, 'score'),
        badge('Mod', modifier, 'modifier'),
        badge('Jet de sauvegarde', save, save.startsWith('-') ? 'negative' : 'positive'),
      ],
      searchText: `${ability.label} ${score} ${modifier} ${save} jet de sauvegarde sauvegarde`,
      section: 'caracteristiques',
      field: ability.key,
    });
  });

  SKILLS.forEach((skill) => {
    const abilityLabel = withoutIcon(ABILITIES.find(({ key }) => key === skill.ability)?.label || skill.ability);
    const bonus = formatModifier(skillBonus(data, skill));
    const targetSelector = `[data-skill="${skill.key}"]`;
    entries.push({
      key: targetSelector,
      title: skill.label,
      detail: `Compétence · ${abilityLabel}`,
      badges: [badge('Bonus', bonus, bonus.startsWith('-') ? 'negative' : 'positive')],
      searchText: `${skill.label} ${skill.ability} ${abilityLabel} ${bonus}`,
      section: 'caracteristiques',
      targetSelector,
    });
  });

  const addRows = (list, section: string, titleField = 'nom', options: AddRowsOptions = {}) => {
    const {
      detailFields = [], largeTextFields = [], previewFields = [], hideDetail, badges: rowBadges = () => [],
    } = options;
    range(listRowCount(data, list)).forEach((row) => {
      const field = list.field(row, titleField);
      const title = cell(data, field);
      if (!title) return;
      const values = (fields: string[]) => fields.map((name) => cell(data, list.field(row, name))).filter(Boolean);
      const badges = rowBadges(row);
      entries.push({
        key: field,
        title,
        detail: values(detailFields).join(' · '),
        preview: values(previewFields).join('\n'),
        badges,
        largeText: values(largeTextFields).map((text) => ({ text, normalized: normalized(text) })),
        searchText: [
          title,
          values(detailFields.filter((name) => !largeTextFields.includes(name))).join(' · '),
          ...badges.flatMap(({ label, value }) => [label, value]),
        ].join(' '),
        hideDetail,
        field,
        section,
        row,
      });
    });
  };

  addRows(SPELLS, 'sorts', 'nom', {
    detailFields: ['notes'],
    previewFields: ['notes'],
    largeTextFields: ['notes'],
    hideDetail: true,
    badges: (row) => {
      const cantrip = data[SPELLS.field(row, 'cantrip')] === 'true';
      return [badge('Niveau', cantrip ? 'Mineur' : cell(data, SPELLS.field(row, 'niveau')) || '—', 'score')];
    },
  });
  addRows(WEAPONS, 'armes', 'nom', {
    detailFields: ['notes'],
    previewFields: ['notes'],
    largeTextFields: ['notes'],
    hideDetail: true,
    badges: (row) => {
      const bonus = cell(data, WEAPONS.field(row, 'bonus'));
      const damage = cell(data, WEAPONS.field(row, 'degats'));
      return [
        ...(bonus ? [badge('Attaque', bonus, 'modifier')] : []),
        ...(damage ? [badge('Dégâts', damage, 'score')] : []),
      ];
    },
  });
  addRows(INVENTORY, 'equipement', 'nom', {
    badges: (row) => [badge('Quantité', String(inventoryQuantity(data, row)), 'score')],
  });
  addRows(MAGIC_ITEMS, 'equipement');
  addRows(CLASS_FEATURES, 'capacites', 'titre', {
    detailFields: ['description'],
    previewFields: ['description'],
    largeTextFields: ['description'],
    hideDetail: true,
    badges: (row) => [
      ...(data[CLASS_FEATURES.field(row, 'repos_court')] === 'true' ? [badge('Recharge', 'Repos court')] : []),
      ...(data[CLASS_FEATURES.field(row, 'repos_long')] === 'true' ? [badge('Recharge', 'Repos long')] : []),
    ],
  });
  addRows(QUESTS, 'quetes', 'titre', {
    detailFields: ['pnj', 'lieu', 'recompense', 'description', 'notes'],
    previewFields: ['pnj', 'lieu', 'recompense', 'description', 'notes'],
    largeTextFields: ['description', 'notes'],
    hideDetail: true,
    badges: (row) => {
      const status = QUEST_STATUSES.find(({ value }) => value && value === data[QUESTS.field(row, 'statut')]);
      if (!status) return [];
      let tone = 'score';
      if (status.value === 'terminee') tone = 'positive';
      if (status.value === 'echouee' || status.value === 'abandonnee') tone = 'negative';
      return [badge('Statut', status.label, tone)];
    },
  });
  return entries;
}

/* --------------------------------------------------------------------- search */

/**
 * Free-text search over the visible sections. The best matches are kept, then
 * grouped by section in order of their best hit, with plain section shortcuts
 * last. `options` is the same entries flattened in display order, which is the
 * order keyboard navigation follows.
 */
export function searchSheet(
  entries: SearchEntry[],
  query: string,
  visibleSections: ReadonlySet<string>,
): { groups: SearchGroup[]; options: SearchEntry[] } {
  const scoped = scopedSearch(query);
  if (!scoped.term) return { groups: [], options: [] };

  const matches: SearchEntry[] = matchingEntries(
    entries.filter((entry) => visibleSections.has(entry.section) && (!scoped.section || entry.section === scoped.section)),
    scoped.term,
    MAX_SEARCH_RESULTS,
  );
  const groups: SearchGroup[] = [];
  matches.filter((entry) => entry.kind !== 'section').forEach((entry) => {
    const group = groups.find(({ section }) => section === entry.section);
    if (group) group.entries.push(entry);
    else groups.push({ section: entry.section, label: sectionLabel(entry.section) || 'Autres', entries: [entry] });
  });
  const sections = matches.filter((entry) => entry.kind === 'section');
  if (sections.length) groups.push({ section: 'sections', label: 'Sections', entries: sections });

  return { groups, options: groups.flatMap((group) => group.entries) };
}
