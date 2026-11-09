import { useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import {
  CLASS_FEATURES, INVENTORY, MAGIC_ITEMS, QUESTS, SPELLS, WEAPONS,
} from '../../data/sheetLists';
import { ABILITIES, SKILLS } from '../../data/abilities';
import { QUEST_STATUSES } from '../../data/questStatuses';
import { SECTIONS, foldField, sectionAnchor } from '../../data/sections';
import { normalizeTileLayout } from '../../data/tileLayout';
import { listRowCount, withRowRemoved } from '../../services/sheetRows';
import { range } from '../../utils/range';
import {
  abilityModifier, formatModifier, savingThrowBonus, skillBonus,
} from '../../services/characterMath';
import { parseDiceExpression } from '../../services/dice';
import {
  fuzzyScore, matchingEntries, normalized, scopedSearch, SECTION_FILTERS,
} from '../../services/search';
import { useSheet } from '../../context/SheetContext';
import { useDice } from '../../context/DiceContext';

const withoutIcon = (label) => label.replace(/^\S+\s/, '');
const badge = (label, value, tone = 'category') => ({ label, value, tone });
const SEARCH_HISTORY_KEY = 'fiche-perso-search-history';

type SearchBadge = {
  label: string;
  value: string;
  tone?: string;
};

type QuickAction = ((
  | { type: 'expression'; value: string; title: string; detail: string }
  | { type: 'skill'; skill: (typeof SKILLS)[number]; title: string; detail: string }
  | { type: 'save'; ability: (typeof ABILITIES)[number]; title: string; detail: string }
  | {
    type: 'add';
    section: string;
    names: string[];
    buttonLabel: string;
    fieldPrefix: string;
    fieldSuffix?: string;
    fieldPattern?: RegExp;
    prefillValue?: string;
    prefillQuantity?: string;
    title: string;
    detail: string;
  }
  | {
    type: 'inventory-add';
    row: number;
    itemName: string;
    amount: number;
    quantity: number;
    title: string;
    detail: string;
  }
  | {
    type: 'coin';
    direction: 'add' | 'remove';
    names: string[];
    amount: string;
    coin: string;
    title: string;
    detail: string;
  }
  | {
    type: 'inventory';
    row: number;
    itemName: string;
    amount: number;
    quantity: number;
    title: string;
    detail: string;
  }
  | { type: 'goto'; section: string; title: string; detail: string }
  | { type: 'tool'; tool: string; names: string[]; title: string; detail: string }
) & {
  searchText?: string;
  skill?: (typeof SKILLS)[number];
  ability?: (typeof ABILITIES)[number];
  value?: string;
  section?: string;
  buttonLabel?: string;
  fieldPrefix?: string;
  fieldSuffix?: string;
  fieldPattern?: RegExp;
  prefillValue?: string;
  prefillQuantity?: string;
  amount?: string;
  coin?: string;
  row?: number;
  itemName?: string;
  tool?: string;
});

type AddRowsOptions = {
  largeTextFields?: string[];
  previewFields?: string[];
  hideDetail?: boolean;
};

const ADD_ACTIONS = [
  {
    section: 'armes', names: ['arme', 'armes', 'weapon', 'weapons'], buttonLabel: 'Ajouter une arme', fieldPrefix: 'arme', fieldSuffix: '_nom', title: 'Ajouter une arme', detail: 'Nouvelle entrée · Armes',
  },
  {
    section: 'capacites', names: ['capacite', 'capacites', 'competence de classe', 'class feature'], buttonLabel: 'Ajouter une capacité', fieldPrefix: 'capacite', fieldPattern: /^capacite\d+$/, title: 'Ajouter une capacité', detail: 'Nouvelle entrée · Capacités',
  },
  {
    section: 'sorts', names: ['sort', 'sorts', 'spell', 'spells'], buttonLabel: 'Ajouter un sort', fieldPrefix: 'sort', fieldSuffix: '_nom', title: 'Ajouter un sort', detail: 'Nouvelle entrée · Sorts',
  },
  {
    section: 'equipement', names: ['equipement', 'equipment', 'objet', 'objets', 'inventaire', 'item', 'items'], buttonLabel: 'Ajouter un objet', fieldPrefix: 'inventaire', fieldSuffix: '_nom', title: 'Ajouter un objet', detail: 'Nouvelle entrée · Équipement',
  },
  {
    section: 'equipement', names: ['lien', 'lien magique', 'liens magiques', 'objet magique', 'objets magiques', 'magic item', 'magic items'], buttonLabel: 'Ajouter un lien magique', fieldPrefix: 'lien_magique', fieldPattern: /^lien_magique\d+$/, title: 'Ajouter un lien magique', detail: 'Nouvelle entrée · Équipement',
  },
  {
    section: 'quetes', names: ['quete', 'quetes', 'quest', 'quests'], buttonLabel: 'Ajouter une quête', fieldPrefix: 'quete', fieldSuffix: '_titre', title: 'Ajouter une quête', detail: 'Nouvelle entrée · Quêtes',
  },
];

const COIN_ACTION = {
  type: 'coin' as const,
  direction: 'add' as const,
  names: ['piece', 'pieces', 'monnaie', 'gold', 'coin', 'coins'],
  amount: '1',
  coin: 'po',
  title: 'Ajouter des pièces',
  detail: 'Ajouter une quantité à la bourse',
};

const EQUIPMENT_NAMES = ['equipement', 'equipment', 'objet', 'objets', 'inventaire', 'item', 'items'];

const TOOL_ACTIONS = [
  {
    tool: 'sections', names: ['section', 'sections', 'navigation'], title: 'Ouvrir la navigation', detail: 'Parcourir les sections de la fiche',
  },
  {
    tool: 'dice', names: ['des', 'de', 'dice', 'lancer'], title: 'Ouvrir les dés', detail: 'Afficher le plateau de dés',
  },
  {
    tool: 'quick-reference', names: ['reference', 'rappel', 'aide rapide'], title: 'Ouvrir le rappel rapide', detail: 'Afficher les références rapides',
  },
  {
    tool: 'appearance', names: ['apparence', 'portrait'], title: 'Ouvrir l’apparence', detail: 'Modifier le portrait du personnage',
  },
  {
    tool: 'settings', names: ['parametre', 'parametres', 'reglages'], title: 'Ouvrir les paramètres', detail: 'Configurer la fiche',
  },
  {
    tool: 'shortcuts', names: ['raccourci', 'raccourcis', 'clavier'], title: 'Ouvrir les raccourcis clavier', detail: 'Afficher les commandes clavier',
  },
];

function resolveCoinAction(rawValue, direction: 'add' | 'remove'): QuickAction | null {
  const value = normalized(rawValue.trim());
  const match = [...COIN_ACTION.names]
    .sort((left, right) => right.length - left.length)
    .find((name) => value === name || value.startsWith(`${name} `));
  if (!match) return null;

  const remainder = rawValue.trim().slice(match.length).trim();
  const coinMatch = /^(\d+)?\s*(pc|pa|pe|po|pp)?$/i.exec(remainder);
  if (!coinMatch) return null;
  const amount = Number(coinMatch[1] || '1');
  if (!Number.isSafeInteger(amount) || amount < 1) return null;
  return {
    ...COIN_ACTION,
    direction,
    amount: String(amount),
    coin: (coinMatch[2] || 'po').toLowerCase(),
    title: direction === 'add' ? 'Ajouter des pièces' : 'Retirer des pièces',
    detail: direction === 'add' ? 'Ajouter une quantité à la bourse' : 'Retirer une quantité de la bourse',
  };
}

function inventoryValue(rawValue) {
  const trimmedValue = rawValue.trim();
  const value = normalized(trimmedValue);
  const prefix = [...EQUIPMENT_NAMES]
    .sort((left, right) => right.length - left.length)
    .find((name) => value === name || value.startsWith(`${name} `));
  return prefix ? trimmedValue.slice(prefix.length).trim() : trimmedValue;
}

function inventoryAction(data, row: number, itemName: string, amount: number): QuickAction {
  const quantity = Math.max(0, Number.parseInt(data[INVENTORY.field(row, 'quantite')], 10) || 0);
  return {
    type: 'inventory',
    row,
    itemName,
    amount,
    quantity,
    title: `Retirer ${amount > 1 ? `${amount} × ` : ''}${itemName}`,
    detail: `Quantité en stock : ${quantity}`,
  };
}

function resolveInventoryAction(rawValue, data): QuickAction | null {
  const value = inventoryValue(rawValue);
  if (!value) return null;
  const rows = range(listRowCount(data, INVENTORY))
    .map((row) => ({
      row,
      itemName: String(data[INVENTORY.field(row, 'nom')] || '').trim(),
      quantity: Math.max(0, Number.parseInt(data[INVENTORY.field(row, 'quantite')], 10) || 0),
    }))
    .filter(({ itemName, quantity }) => itemName && quantity > 0);
  const exact = rows.find(({ itemName }) => normalized(itemName) === normalized(value));
  if (exact) return inventoryAction(data, exact.row, exact.itemName, 1);

  const amountMatch = /^(.*?)\s+(\d+)$/u.exec(value);
  const name = amountMatch?.[1]?.trim() || value;
  const amount = amountMatch ? Number(amountMatch[2]) : 1;
  if (!Number.isSafeInteger(amount) || amount < 1 || !name) return null;
  const match = rows.find(({ itemName }) => normalized(itemName) === normalized(name));
  return match ? inventoryAction(data, match.row, match.itemName, amount) : null;
}

function resolveInventoryAddAction(rawValue, data): QuickAction | null {
  const value = inventoryValue(rawValue);
  if (!value || value === normalized(rawValue.trim())) return null;

  const rows = range(listRowCount(data, INVENTORY))
    .map((row) => ({
      row,
      itemName: String(data[INVENTORY.field(row, 'nom')] || '').trim(),
      quantity: Math.max(0, Number.parseInt(data[INVENTORY.field(row, 'quantite')], 10) || 0),
    }))
    .filter(({ itemName }) => itemName);
  const exact = rows.find(({ itemName }) => normalized(itemName) === normalized(value));
  const amountMatch = /^(.*?)\s+(\d+)$/u.exec(value);
  const itemName = exact?.itemName || amountMatch?.[1]?.trim() || value;
  let amount = 1;
  if (!exact && amountMatch) amount = Number(amountMatch[2]);
  if (!Number.isSafeInteger(amount) || amount < 1 || !itemName) return null;

  const row = rows.find(({ itemName: candidate }) => normalized(candidate) === normalized(itemName));
  if (row) {
    return {
      type: 'inventory-add',
      row: row.row,
      itemName: row.itemName,
      amount,
      quantity: row.quantity,
      title: `Ajouter ${amount > 1 ? `${amount} × ` : ''}${row.itemName}`,
      detail: `Quantité en stock : ${row.quantity}`,
    };
  }

  return {
    type: 'add',
    section: 'equipement',
    names: ['equipement'],
    buttonLabel: 'Ajouter un objet',
    fieldPrefix: 'inventaire',
    fieldSuffix: '_nom',
    prefillValue: itemName,
    prefillQuantity: String(amount),
    title: `Ajouter ${amount > 1 ? `${amount} × ` : ''}${itemName}`,
    detail: 'Nouvel objet · Équipement',
  };
}

function hasInvalidInventoryQuantity(rawValue) {
  const value = inventoryValue(rawValue);
  if (normalized(value) === normalized(rawValue.trim())) return false;
  const quantityMatch = /^(.*?)\s+(\d+)$/u.exec(value);
  if (!quantityMatch) return false;
  const quantity = Number(quantityMatch[2]);
  return !quantityMatch[1].trim() || !Number.isSafeInteger(quantity) || quantity < 1;
}

function resolveAddAction(rawValue): QuickAction | null {
  const coinAction = resolveCoinAction(rawValue, 'add');
  if (coinAction) return coinAction;

  const value = normalized(rawValue.trim());
  const candidates = ADD_ACTIONS
    .flatMap((action) => action.names.map((name) => ({ action, name })))
    .sort((left, right) => right.name.length - left.name.length);
  const match = candidates.find(({ name }) => value === name || value.startsWith(`${name} `));
  if (match) {
    const remainder = rawValue.trim().slice(match.name.length).trim();
    return { type: 'add', ...match.action, prefillValue: remainder };
  }
  return null;
}

function addActionPrefix(rawValue): {
  action: typeof ADD_ACTIONS[number] | typeof COIN_ACTION;
  label: string;
  remainder: string;
} | null {
  const value = normalized(rawValue.trim());
  const candidates = [...ADD_ACTIONS, COIN_ACTION]
    .flatMap((action) => action.names.map((name) => ({ action, name })))
    .sort((left, right) => right.name.length - left.name.length);
  const match = candidates.find(({ name }) => value === name || value.startsWith(`${name} `));
  if (!match) return null;

  const trimmedValue = rawValue.trim();
  return {
    action: match.action,
    label: trimmedValue.slice(0, match.name.length),
    remainder: trimmedValue.slice(match.name.length),
  };
}

function rawLengthForNormalizedPrefix(value, normalizedPrefix) {
  let rawPrefix = '';
  for (const character of value) {
    rawPrefix += character;
    if (normalized(rawPrefix) === normalizedPrefix) return rawPrefix.length;
  }
  return 0;
}

function recognizedAddValueLength(
  actionPrefix: NonNullable<ReturnType<typeof addActionPrefix>>,
  entries: Array<{ section: string; title: string }>,
) {
  const rawValue = actionPrefix.remainder.trim();
  const value = normalized(rawValue);
  if (!value) return 0;
  if (actionPrefix.action === COIN_ACTION) {
    return resolveCoinAction(`${actionPrefix.label}${actionPrefix.remainder}`, 'remove')?.type === 'coin'
      ? rawValue.length
      : 0;
  }

  let recognizedLength = 0;
  entries
    .filter((entry) => entry.section === ('section' in actionPrefix.action ? actionPrefix.action.section : undefined))
    .forEach((entry) => {
      const title = normalized(entry.title);
      if (title.startsWith(value)) {
        recognizedLength = Math.max(recognizedLength, rawValue.length);
      } else if (value.startsWith(title)) {
        recognizedLength = Math.max(recognizedLength, rawLengthForNormalizedPrefix(rawValue, title));
      } else if (Number.isFinite(fuzzyScore(value, title))) {
        recognizedLength = Math.max(recognizedLength, rawValue.length);
      }
    });
  return recognizedLength;
}

function sheetSearchEntries(data) {
  const entries = [];
  SECTIONS.forEach(({ id, label }) => {
    entries.push({
      title: label,
      badges: [],
      searchText: label,
      section: id,
      kind: 'section',
      targetSelector: `#${sectionAnchor(id)}`,
    });
  });
  ABILITIES.forEach((ability) => {
    const score = data[ability.key] || '—';
    const modifier = formatModifier(abilityModifier(data[ability.key]));
    const save = formatModifier(savingThrowBonus(data, ability.key));
    entries.push({
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
    entries.push({
      title: skill.label,
      detail: `Compétence · ${abilityLabel}`,
      badges: [
        badge('Bonus', bonus, bonus.startsWith('-') ? 'negative' : 'positive'),
      ],
      searchText: `${skill.label} ${skill.ability} ${abilityLabel} ${bonus}`,
      section: 'caracteristiques',
      targetSelector: `[data-skill="${skill.key}"]`,
    });
  });
  const addRows = (
    list,
    section: string,
    titleField = 'nom',
    detailFields: string[] = [],
    getBadges: (row: number) => SearchBadge[] = () => [],
    options: AddRowsOptions = {},
  ) => {
    range(listRowCount(data, list)).forEach((row) => {
      const title = String(data[list.field(row, titleField)] || '').trim();
      if (!title) return;
      const detail = detailFields.map((field) => data[list.field(row, field)]).filter(Boolean).join(' · ');
      const largeTextFields = options.largeTextFields || [];
      const searchableDetail = detailFields
        .filter((field) => !largeTextFields.includes(field))
        .map((field) => data[list.field(row, field)])
        .filter(Boolean)
        .join(' · ');
      const badges = getBadges(row);
      const largeText = largeTextFields
        .map((field) => String(data[list.field(row, field)] || '').trim())
        .filter(Boolean);
      entries.push({
        title,
        detail,
        preview: (options.previewFields || []).map((field) => data[list.field(row, field)]).filter(Boolean).join('\n'),
        badges,
        largeText: largeText.map((text) => ({ text, normalized: normalized(text) })),
        searchText: [title, searchableDetail, ...badges.flatMap(({ label, value }) => [label, value])].join(' '),
        hideDetail: options.hideDetail,
        field: list.field(row, titleField),
        section,
        row,
      });
    });
  };
  addRows(SPELLS, 'sorts', 'nom', ['notes'], (row) => {
    const level = SPELLS.field(row, 'niveau');
    const cantrip = data[SPELLS.field(row, 'cantrip')] === 'true';
    return [badge('Niveau', cantrip ? 'Mineur' : data[level] || '—', 'score')];
  }, { hideDetail: true, previewFields: ['notes'], largeTextFields: ['notes'] });
  addRows(WEAPONS, 'armes', 'nom', ['notes'], (row) => [
    ...(data[WEAPONS.field(row, 'bonus')] ? [badge('Attaque', data[WEAPONS.field(row, 'bonus')], 'modifier')] : []),
    ...(data[WEAPONS.field(row, 'degats')] ? [badge('Dégâts', data[WEAPONS.field(row, 'degats')], 'score')] : []),
  ], { hideDetail: true, previewFields: ['notes'], largeTextFields: ['notes'] });
  addRows(INVENTORY, 'equipement', 'nom', [], (row) => [
    badge('Quantité', String(Math.max(0, Number.parseInt(data[INVENTORY.field(row, 'quantite')], 10) || 0)), 'score'),
  ]);
  addRows(MAGIC_ITEMS, 'equipement');
  addRows(CLASS_FEATURES, 'capacites', 'titre', ['description'], (row) => [
    ...(data[CLASS_FEATURES.field(row, 'repos_court')] === 'true' ? [badge('Recharge', 'Repos court')] : []),
    ...(data[CLASS_FEATURES.field(row, 'repos_long')] === 'true' ? [badge('Recharge', 'Repos long')] : []),
  ], { hideDetail: true, previewFields: ['description'], largeTextFields: ['description'] });
  addRows(QUESTS, 'quetes', 'titre', ['pnj', 'lieu', 'recompense', 'description', 'notes'], (row) => {
    const status = QUEST_STATUSES.find(({ value }) => value === data[QUESTS.field(row, 'statut')]);
    let tone = 'score';
    if (status?.value === 'terminee') tone = 'positive';
    if (status?.value === 'echouee' || status?.value === 'abandonnee') tone = 'negative';
    return status?.value ? [badge('Statut', status.label, tone)] : [];
  }, { hideDetail: true, previewFields: ['pnj', 'lieu', 'recompense', 'description', 'notes'], largeTextFields: ['description', 'notes'] });
  return entries;
}

function quickCommandMatch(query) {
  const match = /^\s*>\s*([tagor]):\s*(.*)$/i.exec(query);
  return match ? { command: match[1].toLowerCase(), value: match[2] } : null;
}

function searchContextHint(isQuickCommand, quickCommand, scoped) {
  if (isQuickCommand) {
    if (quickCommand?.command === 't') {
      return 'Choisissez une compétence, une caractéristique ou une expression de dés.';
    }
    if (quickCommand?.command === 'g') return 'Choisissez une section à ouvrir.';
    if (quickCommand?.command === 'o') return 'Choisissez l’outil à ouvrir.';
    if (quickCommand?.command === 'r') return 'Choisissez des pièces ou un objet de l’inventaire à retirer.';
    return '';
  }
  if (scoped.section) {
    const section = SECTIONS.find(({ id }) => id === scoped.section);
    return `Recherche limitée à ${section?.label || 'cette section'}.`;
  }
  return 'Résultats classés par pertinence ; utilisez les flèches pour les parcourir.';
}

function parseQuickAction(query, data): QuickAction | null {
  const match = /^\s*>\s*([targ]):\s*(.+)$/i.exec(query);
  if (!match) return null;
  const [, rawCommand, rawValue] = match;
  const command = rawCommand.toLowerCase();
  const value = normalized(rawValue.trim());
  if (!value) return null;

  if (command === 't') {
    const expression = parseDiceExpression(rawValue);
    if (expression) {
      return {
        type: 'expression', value: rawValue.trim(), title: `Lancer ${rawValue.trim()}`, detail: 'Expression de dés',
      };
    }
    const skill = SKILLS.find(({ key, label }) => normalized(key) === value || normalized(label) === value || (value === 'acrobatie' && key === 'acrobaties'));
    if (skill) {
      return {
        type: 'skill', skill, title: `Lancer ${skill.label}`, detail: `Test de compétence · ${formatModifier(skillBonus(data, skill))}`,
      };
    }
    const ability = ABILITIES.find(({ key, label }) => normalized(key) === value || normalized(withoutIcon(label)) === value);
    if (ability) {
      return {
        type: 'save',
        ability,
        title: `Jet de sauvegarde · ${withoutIcon(ability.label)}`,
        detail: `Sauvegarde · ${formatModifier(savingThrowBonus(data, ability.key))}`,
      };
    }
  }

  if (command === 'a') {
    if (hasInvalidInventoryQuantity(rawValue)) return null;
    return resolveInventoryAddAction(rawValue, data) || resolveAddAction(rawValue);
  }

  if (command === 'r') {
    return resolveCoinAction(rawValue, 'remove') || resolveInventoryAction(rawValue, data);
  }

  if (command === 'g') {
    const section = SECTIONS.find(({ id, label }) => normalized(id) === value || normalized(label) === value
      || SECTION_FILTERS.some((filter) => filter.section === id && filter.alias === value));
    if (section) {
      return {
        type: 'goto', section: section.id, title: `Aller à ${section.label}`, detail: 'Ouvrir cette section',
      };
    }
  }
  return null;
}

function quickActionSuggestions(query, data, visibleSections): QuickAction[] {
  const match = /^\s*>\s*([tagor]):\s*(.*)$/i.exec(query);
  if (!match) return [];
  const [, rawCommand, rawValue] = match;
  const command = rawCommand.toLowerCase();
  const value = normalized(rawValue.trim());

  if (command === 't') {
    const expression = parseQuickAction(query, data);
    if (expression?.type === 'expression') return [expression];
    const options: QuickAction[] = [
      ...SKILLS.map((skill) => ({
        type: 'skill' as const,
        skill,
        title: `Lancer ${skill.label}`,
        detail: `Compétence · ${formatModifier(skillBonus(data, skill))}`,
        searchText: `${skill.key} ${skill.label}`,
      })),
      ...ABILITIES.map((ability) => ({
        type: 'save' as const,
        ability,
        title: `Jet de sauvegarde · ${withoutIcon(ability.label)}`,
        detail: `Sauvegarde · ${formatModifier(savingThrowBonus(data, ability.key))}`,
        searchText: `${ability.key} ${withoutIcon(ability.label)}`,
      })),
    ];
    return value ? matchingEntries(options.map((option) => ({
      ...option,
      searchText: normalized(`${option.title} ${option.searchText}`),
    })), value, 8) : options.slice(0, 8);
  }

  if (command === 'a') {
    if (hasInvalidInventoryQuantity(rawValue)) return [];
    const resolvedInventoryAction = resolveInventoryAddAction(rawValue, data);
    if (resolvedInventoryAction) return [resolvedInventoryAction];
    const exact = resolveAddAction(rawValue);
    if (exact) return [exact];
    const options: QuickAction[] = [
      ...ADD_ACTIONS.map((action) => ({ type: 'add' as const, ...action, searchText: `${action.title} ${action.names.join(' ')}` })),
      { ...COIN_ACTION, searchText: `${COIN_ACTION.title} ${COIN_ACTION.names.join(' ')}` },
    ];
    return value ? matchingEntries(options, value, 8) : options;
  }

  if (command === 'r') {
    const exact = resolveCoinAction(rawValue, 'remove')
      || resolveInventoryAction(rawValue, data);
    if (exact) return [exact];
    const coinOption: QuickAction = {
      ...COIN_ACTION,
      direction: 'remove',
      title: 'Retirer des pièces',
      detail: 'Retirer une quantité de la bourse',
      searchText: `Retirer des pièces ${COIN_ACTION.names.join(' ')}`,
    };
    const inventoryQuery = inventoryValue(rawValue);
    const quantityMatch = /^(.*?)\s+(\d+)$/u.exec(inventoryQuery);
    const requestedAmount = quantityMatch ? Number(quantityMatch[2]) : 1;
    if (quantityMatch && (!Number.isSafeInteger(requestedAmount) || requestedAmount < 1 || !quantityMatch[1].trim())) {
      return [];
    }
    const searchValue = quantityMatch ? quantityMatch[1].trim() : inventoryQuery;
    const inventoryOptions = range(listRowCount(data, INVENTORY))
      .map((row) => ({
        row,
        itemName: String(data[INVENTORY.field(row, 'nom')] || '').trim(),
        quantity: Math.max(0, Number.parseInt(data[INVENTORY.field(row, 'quantite')], 10) || 0),
      }))
      .filter(({ itemName, quantity }) => itemName && quantity > 0)
      .map(({ row, itemName }) => ({
        ...inventoryAction(data, row, itemName, requestedAmount),
        searchText: itemName,
      }));
    const options = [coinOption, ...inventoryOptions];
    const searchTerm = searchValue || (inventoryQuery ? value : '');
    return searchTerm ? matchingEntries(options, searchTerm, 8) : options.slice(0, 8);
  }

  if (command === 'g') {
    const options: QuickAction[] = SECTIONS
      .filter(({ id }) => visibleSections.has(id))
      .map(({ id, label }) => ({
        type: 'goto' as const,
        section: id,
        title: `Aller à ${label}`,
        detail: 'Ouvrir cette section',
        searchText: `${id} ${label} ${SECTION_FILTERS.filter((filter) => filter.section === id).map(({ alias }) => alias).join(' ')}`,
      }));
    return value ? matchingEntries(options, value, 8) : options.slice(0, 8);
  }

  const options: QuickAction[] = TOOL_ACTIONS.map((tool) => ({
    type: 'tool' as const,
    ...tool,
    searchText: `${tool.title} ${tool.names.join(' ')}`,
  }));
  return value ? matchingEntries(options, value, 8) : options;
}

function QuickActionExample({ action, entries }) {
  let prefix: string;
  let argument: string;
  switch (action.type) {
    case 'expression':
      prefix = 't';
      argument = action.value;
      break;
    case 'skill':
      prefix = 't';
      argument = action.skill.label;
      break;
    case 'save':
      prefix = 't';
      argument = withoutIcon(action.ability.label);
      break;
    case 'add': {
      const [name] = action.names;
      prefix = 'a';
      argument = `${name}${action.prefillValue ? ` ${action.prefillValue}` : ''}${action.prefillQuantity && action.prefillQuantity !== '1' ? ` ${action.prefillQuantity}` : ''}`;
      break;
    }
    case 'inventory-add':
      prefix = 'a';
      argument = `équipement ${action.itemName}${action.amount > 1 ? ` ${action.amount}` : ''}`;
      break;
    case 'coin': {
      const [name] = action.names;
      prefix = action.direction === 'add' ? 'a' : 'r';
      argument = `${name} ${action.amount} ${action.coin}`;
      break;
    }
    case 'inventory':
      prefix = 'r';
      argument = `${action.itemName}${action.amount > 1 ? ` ${action.amount}` : ''}`;
      break;
    case 'goto':
      prefix = 'g';
      argument = SECTIONS.find(({ id }) => id === action.section)?.label || action.section;
      break;
    case 'tool': {
      const [name] = action.names;
      prefix = 'o';
      argument = name;
      break;
    }
    default:
      return null;
  }

  return <SearchExample prefix={prefix} entries={entries}>{argument}</SearchExample>;
}

function SearchExample({
  prefix, children, filter = false, entries = [],
}) {
  const addPrefix = !filter && (prefix === 'a' || prefix === 'r') ? addActionPrefix(children) : null;
  const recognizedLength = addPrefix ? recognizedAddValueLength(addPrefix, entries) : 0;
  const leadingSpace = addPrefix?.remainder.match(/^\s*/u)?.[0] || '';
  return (
    <code>
      {!filter && <span className="search-token-marker">&gt;</span>}
      <span className={filter ? 'search-token-filter' : 'search-token-command'}>{prefix}</span>
      <span className="search-token-separator">:</span>
      {addPrefix ? (
        <>
          <span className="search-token-argument is-valid">{addPrefix.label}</span>
          <span className={`search-token-argument ${recognizedLength ? 'is-recognized-value' : 'is-user-text'}`}>{addPrefix.remainder.slice(0, leadingSpace.length + recognizedLength)}</span>
          <span className="search-token-argument is-user-text">{addPrefix.remainder.slice(leadingSpace.length + recognizedLength)}</span>
        </>
      ) : (
        <span className={`search-token-argument is-${filter ? 'query' : 'valid'}`}>{children}</span>
      )}
    </code>
  );
}

function highlightedQuery(query, quickSuggestions, entries) {
  const commandMatch = /^\s*>\s*([\s\S]*)$/u.exec(query);
  if (commandMatch) {
    const [, commandText] = commandMatch;
    const commandParts = /^([^:\s]*)(?::(\s*)([\s\S]*))?$/u.exec(commandText);
    const [, rawCommand = '', spacing = '', argument = ''] = commandParts || [];
    const command = rawCommand.toLowerCase();
    const recognizedCommand = /^[tagor]$/i.test(rawCommand);
    const actionPrefix = ((command === 'a' && resolveAddAction(argument))
      || (command === 'r' && (resolveCoinAction(argument, 'remove') || addActionPrefix(argument))))
      ? addActionPrefix(argument)
      : null;
    const recognizedLength = actionPrefix ? recognizedAddValueLength(actionPrefix, entries) : 0;
    const leadingSpace = actionPrefix?.remainder.match(/^\s*/u)?.[0] || '';
    const recognizedEnd = leadingSpace.length + recognizedLength;
    let argumentState = 'invalid';
    if (!argument.trim()) argumentState = 'pending';
    else if (quickSuggestions.length) argumentState = 'valid';
    return (
      <>
        <span className="search-token-marker">&gt;</span>
        {rawCommand && (
          <span className={recognizedCommand ? 'search-token-command' : 'search-token-argument is-invalid'}>{rawCommand}</span>
        )}
        {commandParts?.[2] !== undefined && (
          <>
            <span className="search-token-separator">:</span>
            {spacing}
            {actionPrefix ? (
              <>
                <span className="search-token-argument is-valid">{actionPrefix.label}</span>
                {recognizedEnd > 0 && <span className="search-token-argument is-recognized-value">{actionPrefix.remainder.slice(0, recognizedEnd)}</span>}
                {recognizedEnd < actionPrefix.remainder.length && <span className="search-token-argument is-user-text">{actionPrefix.remainder.slice(recognizedEnd)}</span>}
              </>
            ) : (
              <span className={`search-token-argument is-${recognizedCommand ? argumentState : 'invalid'}`}>{argument}</span>
            )}
          </>
        )}
        {!rawCommand && commandText && <span className="search-token-argument is-invalid">{commandText}</span>}
      </>
    );
  }

  const match = /^(\s*)([^:\s]+)(:)(\s*)([\s\S]*)$/u.exec(query);
  if (!match) return <span className="search-token-query">{query}</span>;

  const [, leading, rawPrefix, separator, spacing, argument] = match;
  const prefix = normalized(rawPrefix);
  const sectionFilter = SECTION_FILTERS.some(({ alias }) => alias === prefix);
  if (!sectionFilter) return <span className="search-token-query">{query}</span>;

  return (
    <>
      {leading}
      <span className="search-token-filter">{rawPrefix}</span>
      <span className="search-token-separator">{separator}</span>
      {spacing}
      <span className="search-token-argument is-query">{argument}</span>
    </>
  );
}

export default function SheetSearch({ open, onToggle, notify }) {
  const { data, apply } = useSheet();
  const { roll, rollExpression } = useDice();
  const layout = useMemo(
    () => normalizeTileLayout(data.tile_layout, data.tile_order, data.tile_sides, data.tile_widths),
    [data.tile_layout, data.tile_order, data.tile_sides, data.tile_widths],
  );
  const visibleSections = useMemo(
    () => new Set([...layout.top, ...layout.left, ...layout.right, ...layout.bottom]),
    [layout],
  );
  const [query, setQuery] = useState('');
  const [searchHelpOpen, setSearchHelpOpen] = useState(true);
  const [pendingTarget, setPendingTarget] = useState(null);
  const [expandedResults, setExpandedResults] = useState({});
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const entries = useMemo(() => sheetSearchEntries(data), [data]);
  const quickAction = useMemo(() => parseQuickAction(query, data), [query, data]);
  const quickSuggestions = useMemo(() => quickActionSuggestions(query, data, visibleSections), [query, data, visibleSections]);
  const hasQuery = Boolean(query);
  const isQuickCommand = /^\s*>/.test(query);
  const quickCommand = quickCommandMatch(query);
  const scoped = scopedSearch(query);
  const matchingResults = !isQuickCommand && scoped.term.length >= 1
    ? matchingEntries(
      entries
        .filter((entry) => visibleSections.has(entry.section))
        .filter((entry) => !scoped.section || entry.section === scoped.section),
      scoped.term,
    )
    : [];
  const searchResults = [
    ...matchingResults.filter((entry) => entry.kind !== 'section'),
    ...matchingResults.filter((entry) => entry.kind === 'section'),
  ].slice(0, 8);
  const contentGroups = searchResults
    .filter((entry) => entry.kind !== 'section')
    .reduce((groups, entry) => {
      const label = SECTIONS.find(({ id }) => id === entry.section)?.label || 'Autres';
      const group = groups.find(({ section }) => section === entry.section);
      if (group) group.entries.push(entry);
      else groups.push({ section: entry.section, label, entries: [entry] });
      return groups;
    }, []);
  const sectionResults = searchResults.filter((entry) => entry.kind === 'section');
  const groupedResults = sectionResults.length
    ? [...contentGroups, { section: 'sections', label: 'Sections', entries: sectionResults }]
    : contentGroups;
  let keyboardResults = searchResults;
  if (isQuickCommand) keyboardResults = quickSuggestions;

  useEffect(() => {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Unable to remove saved search history.', error);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSearchHelpOpen(true);
    }
  }, [open]);

  useEffect(() => {
    const setCommandQuery = (event) => {
      const nextQuery = event.detail?.query;
      if (typeof nextQuery !== 'string') return;
      setQuery(nextQuery);
      setExpandedResults({});
    };
    window.addEventListener('sheet-search-set-query', setCommandQuery);
    return () => window.removeEventListener('sheet-search-set-query', setCommandQuery);
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    const isCommandMode = trimmedQuery.startsWith('>');
    const hasRecognizedCommand = /^>\s*[tagor]\s*:/i.test(trimmedQuery);
    setSearchHelpOpen(!trimmedQuery || (isCommandMode && !hasRecognizedCommand));
    setActiveResultIndex(0);
  }, [query]);

  useEffect(() => {
    if (activeResultIndex >= keyboardResults.length) setActiveResultIndex(0);
  }, [activeResultIndex, keyboardResults.length]);

  useEffect(() => {
    document.querySelector(`[data-option-index="${activeResultIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeResultIndex, query]);

  useEffect(() => {
    if (!pendingTarget) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(pendingTarget.selector);
      if (pendingTarget.action === 'add') {
        if (pendingTarget.stage === 'add') {
          const addButton = [...(target?.querySelectorAll<HTMLButtonElement>('.add-row') || [])]
            .find((button) => normalized(button.textContent).includes(normalized(pendingTarget.buttonLabel)));
          if (!addButton) {
            setPendingTarget(null);
            return;
          }
          addButton.click();
          if (pendingTarget.fieldPrefix === 'inventaire' && !pendingTarget.prefillValue) {
            notify('✓ Nouvelle ligne d’inventaire créée', 'success');
          }
          setPendingTarget((current) => (current ? {
            ...current,
            stage: current.prefillValue ? 'fill' : 'focus',
          } : current));
          return;
        }

        const fields = [...document.querySelectorAll<HTMLElement>(`[data-field^="${pendingTarget.fieldPrefix}"]`)];
        const field = fields.filter((item) => {
          const name = item.getAttribute('data-field');
          return pendingTarget.fieldPattern
            ? pendingTarget.fieldPattern.test(name)
            : (!pendingTarget.fieldSuffix || name.endsWith(pendingTarget.fieldSuffix));
        }).at(-1);
        if (field && pendingTarget.stage === 'fill') {
          const fieldName = field.getAttribute('data-field');
          apply((current) => ({
            ...current,
            [fieldName]: pendingTarget.prefillValue,
            ...(pendingTarget.prefillQuantity
              ? { [fieldName.replace(/_nom$/u, '_quantite')]: pendingTarget.prefillQuantity }
              : {}),
          }));
          if (pendingTarget.fieldPrefix === 'inventaire') {
            notify(`✓ Ajout réussi à l’inventaire : ${pendingTarget.prefillQuantity || '1'} × ${pendingTarget.prefillValue}`, 'success');
          }
          setPendingTarget((current) => (current ? { ...current, stage: 'focus', fieldName } : current));
          return;
        }
        const focusField = pendingTarget.fieldName
          ? document.querySelector<HTMLElement>(`[data-field="${pendingTarget.fieldName}"]`)
          : field;
        if (focusField) {
          const top = focusField.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
          focusField.focus({ preventScroll: true });
        }
        setPendingTarget(null);
        return;
      }
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (pendingTarget.focus) target?.focus({ preventScroll: true });
      setPendingTarget(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [apply, notify, pendingTarget]);

  const openSearchResult = (entry) => {
    window.dispatchEvent(new CustomEvent('sheet-search-reset', { detail: { section: entry.section } }));
    apply((current) => ({
      ...current,
      [foldField(entry.section)]: 'false',
      ...(entry.section === 'quetes' && entry.row !== undefined
        ? { [QUESTS.field(entry.row, 'replie')]: 'false' }
        : {}),
    }));
    setPendingTarget({
      selector: entry.targetSelector || `[data-field="${entry.field}"]`,
      focus: Boolean(entry.field),
    });
    setQuery('');
    setExpandedResults({});
    onToggle();
  };

  const runQuickAction = (action: QuickAction | null = quickAction) => {
    if (!action) return;
    if (action.type === 'expression') rollExpression(action.value);
    if (action.type === 'skill') roll(action.skill.label, skillBonus(data, action.skill));
    if (action.type === 'save') roll(`${withoutIcon(action.ability.label)} · Sauvegarde`, savingThrowBonus(data, action.ability.key));
    if (action.type === 'add') {
      const {
        section, buttonLabel, fieldPrefix, fieldSuffix, fieldPattern,
      } = action;
      window.dispatchEvent(new CustomEvent('sheet-search-reset', { detail: { section } }));
      apply((current) => ({ ...current, [foldField(section)]: 'false' }));
      setPendingTarget({
        selector: `#${sectionAnchor(section)}`,
        action: 'add',
        stage: 'add',
        buttonLabel,
        fieldPrefix,
        fieldSuffix,
        fieldPattern,
        prefillValue: action.prefillValue,
        prefillQuantity: action.prefillQuantity,
      });
    }
    if (action.type === 'inventory-add') {
      const nextQuantity = action.quantity + action.amount;
      if (!Number.isSafeInteger(nextQuantity)) {
        notify(`⚠ Quantité trop élevée pour ${action.itemName}`, 'warning');
        return;
      }
      window.dispatchEvent(new CustomEvent('sheet-search-reset', { detail: { section: 'equipement' } }));
      apply((current) => ({
        ...current,
        [INVENTORY.field(action.row, 'quantite')]: String(nextQuantity),
        [foldField('equipement')]: 'false',
      }));
      notify(`✓ Ajout réussi : ${action.amount} × ${action.itemName}`, 'success');
      setPendingTarget({ selector: `#${sectionAnchor('equipement')}` });
    }
    if (action.type === 'coin') {
      const amount = Number.parseInt(action.amount, 10);
      if (Number.isSafeInteger(amount) && amount > 0) {
        let changedAmount = amount;
        apply((current) => {
          const stored = Number.parseInt(current[action.coin], 10);
          const currentAmount = Number.isSafeInteger(stored) && stored >= 0 ? stored : 0;
          if (action.direction === 'remove') changedAmount = Math.min(amount, currentAmount);
          const nextAmount = action.direction === 'remove'
            ? Math.max(0, currentAmount - amount)
            : currentAmount + amount;
          return Number.isSafeInteger(nextAmount) ? { ...current, [action.coin]: String(nextAmount) } : current;
        });
        const verb = action.direction === 'remove' ? 'Retrait' : 'Ajout';
        notify(`✓ ${verb} réussi : ${changedAmount} ${action.coin}`, 'success');
        setPendingTarget({ selector: `#${sectionAnchor('pieces')}`, focus: true });
      }
    }
    if (action.type === 'inventory') {
      if (action.amount > action.quantity) {
        notify(`⚠ Quantité insuffisante : ${action.itemName} en stock (${action.quantity})`, 'warning');
        return;
      }
      window.dispatchEvent(new CustomEvent('sheet-search-reset', { detail: { section: 'equipement' } }));
      apply((current) => {
        const nextQuantity = action.quantity - action.amount;
        const next = nextQuantity === 0
          ? withRowRemoved(current, INVENTORY, action.row)
          : {
            ...current,
            [INVENTORY.field(action.row, 'quantite')]: String(nextQuantity),
          };
        return { ...next, [foldField('equipement')]: 'false' };
      });
      notify(`✓ Retrait réussi : ${action.amount} × ${action.itemName}`, 'success');
      setPendingTarget({ selector: `#${sectionAnchor('equipement')}` });
    }
    if (action.type === 'goto') {
      window.dispatchEvent(new CustomEvent('sheet-search-reset', { detail: { section: action.section } }));
      apply((current) => ({ ...current, [foldField(action.section)]: 'false' }));
      setPendingTarget({ selector: `#${sectionAnchor(action.section)}` });
    }
    if (action.type === 'tool') {
      window.dispatchEvent(new CustomEvent('sheet-search-open-tool', { detail: { tool: action.tool } }));
    }
    setQuery('');
    setExpandedResults({});
    if (action.type !== 'add' && action.type !== 'inventory-add' && action.type !== 'coin' && action.type !== 'inventory' && action.type !== 'goto') setPendingTarget(null);
    if (action.type !== 'tool') onToggle();
  };

  const activateKeyboardResult = () => {
    const active = keyboardResults[activeResultIndex];
    if (active) {
      if (isQuickCommand) runQuickAction(active);
      else openSearchResult(active);
      return;
    }
    if (quickAction) runQuickAction(quickAction);
  };

  const setResultExpanded = (entry) => {
    const key = entry.field || entry.targetSelector || entry.title;
    setExpandedResults((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="sheet-search-widget">
      <button
        type="button"
        className="sheet-tools-launcher sheet-search-launcher"
        aria-expanded={open}
        aria-controls="sheet-search-panel"
        aria-label="Rechercher et commandes rapides"
        onClick={onToggle}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 5 5" />
        </svg>
        <span>Rechercher</span>
      </button>
      <Modal
        id="sheet-search-panel"
        isOpen={open}
        onClose={onToggle}
        title="Rechercher et commandes rapides"
        headerActions={<kbd>Échap</kbd>}
        initialFocus="#sheet-search-input"
        closeLabel="Fermer la recherche"
        className="app-modal--search"
      >
        {open && (
          <div className="global-search-panel">
            <div className="search-input-block">
              <div className="sheet-search">
                <div className="search-field">
                  <input
                    id="sheet-search-input"
                    className="ef"
                    type="search"
                    aria-label="Rechercher et commandes rapides"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setExpandedResults({});
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown' && keyboardResults.length) {
                        event.preventDefault();
                        setActiveResultIndex((current) => (current + 1) % keyboardResults.length);
                      } else if (event.key === 'ArrowUp' && keyboardResults.length) {
                        event.preventDefault();
                        setActiveResultIndex((current) => (current - 1 + keyboardResults.length) % keyboardResults.length);
                      } else if (event.key === 'Enter') {
                        event.preventDefault();
                        activateKeyboardResult();
                      }
                    }}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>
              {hasQuery && (
                <div className="search-query-preview" aria-hidden="true">
                  <span className="search-query-preview-label">Syntaxe</span>
                  <span className="search-query-preview-value">{highlightedQuery(query, quickSuggestions, entries)}</span>
                </div>
              )}
              <aside className="search-help" aria-label="Aide à la recherche">
                <button
                  type="button"
                  className="search-help-toggle"
                  aria-expanded={searchHelpOpen}
                  aria-controls="search-help-content"
                  onClick={() => setSearchHelpOpen((current) => !current)}
                >
                  <span>Que pouvez-vous écrire&nbsp;?</span>
                  <span className="search-help-caret" aria-hidden="true" />
                </button>
                {searchHelpOpen && (
                  <>
                    <div className="search-help-legend" aria-label="Légende des couleurs">
                      <span>
                        <i className="is-command" aria-hidden="true" />
                        Commande reconnue
                      </span>
                      <span>
                        <i className="is-valid" aria-hidden="true" />
                        Action correspondante
                      </span>
                      <span>
                        <i className="is-invalid" aria-hidden="true" />
                        Aucune correspondance
                      </span>
                      <span>
                        <i className="is-query" aria-hidden="true" />
                        Texte recherché
                      </span>
                    </div>
                    <div id="search-help-content" className="search-help-groups">
                      <section className="search-help-group" aria-labelledby="search-help-plain-title">
                        <h3 id="search-help-plain-title">Recherche en texte libre</h3>
                        <ul>
                          <li>
                            <span>Rechercher dans la fiche</span>
                            <code className="search-token-query">acrobaties</code>
                          </li>
                        </ul>
                      </section>
                      <section className="search-help-group" aria-labelledby="search-help-filter-title">
                        <h3 id="search-help-filter-title">Recherche avec filtre de section</h3>
                        <ul>
                          <li>
                            <span>Limiter la recherche à une section</span>
                            <SearchExample prefix="sort" filter>boule de feu</SearchExample>
                            <SearchExample prefix="quête" filter>dragon</SearchExample>
                          </li>
                        </ul>
                      </section>
                      <section className="search-help-group" aria-labelledby="search-help-commands-title">
                        <h3 id="search-help-commands-title">Commandes</h3>
                        <ul>
                          <li>
                            <span>Lancer une compétence, une sauvegarde ou des dés</span>
                            <SearchExample prefix="t">acrobaties</SearchExample>
                            <SearchExample prefix="t">force</SearchExample>
                            <SearchExample prefix="t">d20+4</SearchExample>
                            <SearchExample prefix="t">2d6+3</SearchExample>
                          </li>
                          <li>
                            <span>Ajouter un élément</span>
                            <SearchExample prefix="a" entries={entries}>quête</SearchExample>
                            <SearchExample prefix="a" entries={entries}>sort boule de feu</SearchExample>
                            <SearchExample prefix="a" entries={entries}>arme</SearchExample>
                            <SearchExample prefix="a" entries={entries}>capacité</SearchExample>
                            <SearchExample prefix="a" entries={entries}>équipement</SearchExample>
                            <SearchExample prefix="a" entries={entries}>équipement Potion 3</SearchExample>
                            <SearchExample prefix="a" entries={entries}>lien magique</SearchExample>
                            <SearchExample prefix="a" entries={entries}>pièce 10 po</SearchExample>
                          </li>
                          <li>
                            <span>Retirer un objet de l’inventaire ou des pièces</span>
                            <SearchExample prefix="r" entries={entries}>équipement</SearchExample>
                            <SearchExample prefix="r">pieces 10 po</SearchExample>
                          </li>
                          <li>
                            <span>Accéder à une section</span>
                            <SearchExample prefix="g">sorts</SearchExample>
                            <SearchExample prefix="g">caractéristiques</SearchExample>
                          </li>
                          <li>
                            <span>Ouvrir un outil</span>
                            <SearchExample prefix="o">dés</SearchExample>
                            <SearchExample prefix="o">référence</SearchExample>
                          </li>
                        </ul>
                      </section>
                    </div>
                  </>
                )}
              </aside>
            </div>
            {query.trim() && (!isQuickCommand || (quickCommand && quickCommand.command !== 'a')) && (
              <p className="search-context-hint" aria-live="polite">
                {searchContextHint(isQuickCommand, quickCommand, scoped)}
              </p>
            )}
            {isQuickCommand && !quickCommand && query.trim() !== '>' && (
              <p className="search-context-hint search-command-error" role="status" aria-live="polite">
                <span className="search-command-error-icon" aria-hidden="true">!</span>
                <span>
                  <strong>Commande inconnue</strong>
                  <small>Utilisez &gt;t:, &gt;a:, &gt;r:, &gt;g: ou &gt;o:.</small>
                </span>
              </p>
            )}
            {(isQuickCommand ? Boolean(quickCommand) : Boolean(query.trim())) && (
              <div className="sheet-search-results" role="listbox" aria-label="Résultats de recherche">
                {isQuickCommand && quickCommand && (
                  <div className="sheet-search-result-group" data-section="quick-actions" role="group" aria-label="Actions rapides">
                    <h3>Actions rapides</h3>
                    {quickSuggestions.map((action, index) => (
                      <button type="button" role="option" data-option-index={index} aria-selected={activeResultIndex === index} className={activeResultIndex === index ? 'search-option-active' : undefined} key={`${action.type}-${action.skill?.key || action.ability?.key || action.buttonLabel || action.section || action.value || action.tool || action.coin || action.row}`} onClick={() => runQuickAction(action)}>
                        <strong>{action.title}</strong>
                        <span>
                          {action.detail}
                          {' · Exemple : '}
                          <QuickActionExample action={action} entries={entries} />
                        </span>
                      </button>
                    ))}
                    {quickSuggestions.length === 0 && quickCommand?.command === 't' && (
                      <p className="search-empty-state" role="status">Saisissez une compétence, une caractéristique ou une formule de dés, comme d20+4.</p>
                    )}
                    {quickSuggestions.length === 0 && quickCommand?.command === 'a' && <p className="search-empty-state" role="status">Aucun élément à ajouter ne correspond à cette recherche.</p>}
                    {quickSuggestions.length === 0 && quickCommand?.command === 'r' && <p className="search-empty-state" role="status">Aucune pièce ou aucun objet disponible ne correspond à cette recherche.</p>}
                    {quickSuggestions.length === 0 && quickCommand?.command === 'g' && <p className="search-empty-state" role="status">Aucune section ne correspond à cette recherche.</p>}
                    {quickSuggestions.length === 0 && quickCommand?.command === 'o' && <p className="search-empty-state" role="status">Aucun outil ne correspond à cette recherche.</p>}
                  </div>
                )}
                {groupedResults.map((group) => (
                  <div className="sheet-search-result-group" data-section={group.section} role="group" aria-label={group.label} key={group.section}>
                    <h3>{group.label}</h3>
                    {group.entries.map((entry) => {
                      const index = keyboardResults.indexOf(entry);
                      const key = entry.field || entry.targetSelector || entry.title;
                      return (
                        <div className="search-result-item" key={key}>
                          <button type="button" role="option" data-option-index={index} aria-selected={activeResultIndex === index} className={activeResultIndex === index ? 'search-option-active' : undefined} onClick={() => openSearchResult(entry)}>
                            <strong>{entry.title}</strong>
                            {entry.detail && !entry.hideDetail && <span>{entry.detail}</span>}
                            {entry.badges?.length > 0 && (
                              <span className="search-result-values" aria-label={entry.badges.map(({ label, value }) => `${label} ${value}`).join(', ')}>
                                {entry.badges.map(({ label, value, tone }) => (
                                  <span className={`search-result-value search-result-value-${tone}`} key={`${label}-${value}`}>
                                    <small>{label}</small>
                                    <b>{value}</b>
                                  </span>
                                ))}
                              </span>
                            )}
                            <span className="search-result-open-label">Aller au champ →</span>
                            {entry.matchContext && (
                              <span className="search-match-context">{entry.matchContext}</span>
                            )}
                          </button>
                          {entry.preview && (
                            <button type="button" className="search-result-details-toggle" aria-expanded={Boolean(expandedResults[key])} onClick={() => setResultExpanded(entry)}>
                              {expandedResults[key] ? 'Masquer les détails' : 'Afficher les détails'}
                            </button>
                          )}
                          {entry.preview && expandedResults[key] && <p className="search-result-preview">{entry.preview}</p>}
                        </div>
                      );
                    })}
                  </div>
                ))}
                {!groupedResults.length && !isQuickCommand && query.trim() && (
                  <p className="search-empty-state" role="status">Aucun résultat pour cette recherche.</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
