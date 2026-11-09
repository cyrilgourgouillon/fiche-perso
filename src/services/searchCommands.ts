/**
 * Quick commands typed in the search box: `>t:` roll, `>a:` add, `>r:` remove,
 * `>g:` go to a section, `>o:` open a tool. Parsing and resolution only — the
 * component runs the resulting actions.
 */
import { ABILITIES, SKILLS } from '../data/abilities';
import { SECTIONS } from '../data/sections';
import {
  formatModifier, savingThrowBonus, skillBonus,
} from './characterMath';
import { MAX_DICE_PER_ROLL, parseDiceExpression } from './dice';
import {
  fuzzyScore, matchingEntries, normalized, SECTION_FILTERS,
} from './search';
import {
  findInventoryItem, inventoryItems, safeText, sectionLabel, withoutIcon,
} from './searchIndex';
import type { SheetValues } from './searchIndex';

const MAX_SUGGESTIONS = 8;

export const COMMAND_LETTERS = ['t', 'a', 'r', 'g', 'o'] as const;
export type CommandLetter = (typeof COMMAND_LETTERS)[number];

export const COINS = ['pc', 'pa', 'pe', 'po', 'pp'] as const;
export type Coin = (typeof COINS)[number];

type Skill = (typeof SKILLS)[number];
type Ability = (typeof ABILITIES)[number];

/* ----------------------------------------------------------------- actions */

export type AddTarget = {
  section: string;
  names: string[];
  buttonLabel: string;
  fieldPrefix: string;
  fieldSuffix?: string;
  fieldPattern?: RegExp;
  title: string;
  detail: string;
};

type ActionBase = { title: string; detail: string; searchText?: string };

export type ExpressionAction = ActionBase & { type: 'expression'; value: string };
export type SkillAction = ActionBase & { type: 'skill'; skill: Skill };
export type SaveAction = ActionBase & { type: 'save'; ability: Ability };
export type AddAction = ActionBase & Omit<AddTarget, 'title' | 'detail'> & {
  type: 'add';
  prefillValue?: string;
  prefillQuantity?: number;
};
export type InventoryAddAction = ActionBase & {
  type: 'inventory-add'; row: number; itemName: string; amount: number; quantity: number;
};
export type CoinAction = ActionBase & {
  type: 'coin'; direction: 'add' | 'remove'; names: string[]; amount: number; coin: Coin;
};
export type InventoryRemoveAction = ActionBase & {
  type: 'inventory'; row: number; itemName: string; amount: number; quantity: number;
};
export type GotoAction = ActionBase & { type: 'goto'; section: string };
export type ToolAction = ActionBase & { type: 'tool'; tool: string; names: string[] };

export type QuickAction =
  | ExpressionAction
  | SkillAction
  | SaveAction
  | AddAction
  | InventoryAddAction
  | CoinAction
  | InventoryRemoveAction
  | GotoAction
  | ToolAction;

export const ADD_TARGETS: AddTarget[] = [
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

/** The inventory target: its names also prefix `>r:` removals. */
export const EQUIPMENT_TARGET = ADD_TARGETS.find(({ fieldPrefix }) => fieldPrefix === 'inventaire');

const COIN_NAMES = ['piece', 'pieces', 'monnaie', 'gold', 'coin', 'coins'];
const COIN_SECTION = 'pieces';
const EQUIPMENT_SECTION = 'equipement';

/** Stand-in "target" for coins so one prefix matcher covers every `>a:` keyword. */
export const COIN_TARGET = { section: COIN_SECTION, names: COIN_NAMES } as const;

export const TOOL_ACTIONS: ToolAction[] = [
  {
    type: 'tool', tool: 'sections', names: ['section', 'sections', 'navigation'], title: 'Ouvrir la navigation', detail: 'Parcourir les sections de la fiche',
  },
  {
    type: 'tool', tool: 'dice', names: ['des', 'de', 'dice', 'lancer'], title: 'Ouvrir les dés', detail: 'Afficher le plateau de dés',
  },
  {
    type: 'tool', tool: 'quick-reference', names: ['reference', 'rappel', 'aide rapide'], title: 'Ouvrir le rappel rapide', detail: 'Afficher les références rapides',
  },
  {
    type: 'tool', tool: 'appearance', names: ['apparence', 'portrait'], title: 'Ouvrir l’apparence', detail: 'Modifier le portrait du personnage',
  },
  {
    type: 'tool', tool: 'settings', names: ['parametre', 'parametres', 'reglages'], title: 'Ouvrir les paramètres', detail: 'Configurer la fiche',
  },
  {
    type: 'tool', tool: 'shortcuts', names: ['raccourci', 'raccourcis', 'clavier'], title: 'Ouvrir les raccourcis clavier', detail: 'Afficher les commandes clavier',
  },
];

const coinAction = (direction: 'add' | 'remove', amount = 1, coin: Coin = 'po'): CoinAction => ({
  type: 'coin',
  direction,
  names: COIN_NAMES,
  amount,
  coin,
  title: direction === 'add' ? 'Ajouter des pièces' : 'Retirer des pièces',
  detail: direction === 'add' ? 'Ajouter une quantité à la bourse' : 'Retirer une quantité de la bourse',
});

const addAction = ({ title, detail, ...target }: AddTarget, extra: Partial<AddAction> = {}): AddAction => ({
  type: 'add', ...target, title, detail, ...extra,
});

/** The section an action writes to or opens, when it has one. */
export function actionSection(action: QuickAction): string | null {
  switch (action.type) {
    case 'add':
    case 'goto':
      return action.section;
    case 'inventory-add':
    case 'inventory':
      return EQUIPMENT_SECTION;
    case 'coin':
      return COIN_SECTION;
    default:
      return null;
  }
}

/** A key unique among the suggestions of one command. */
export function quickActionKey(action: QuickAction): string {
  switch (action.type) {
    case 'expression': return `expression-${action.value}`;
    case 'skill': return `skill-${action.skill.key}`;
    case 'save': return `save-${action.ability.key}`;
    case 'add': return `add-${action.buttonLabel}`;
    case 'inventory-add': return `inventory-add-${action.row}`;
    case 'coin': return `coin-${action.direction}-${action.coin}`;
    case 'inventory': return `inventory-${action.row}`;
    case 'goto': return `goto-${action.section}`;
    default: return `tool-${action.tool}`;
  }
}

export const hiddenSectionMessage = (section: string) => `Le bloc ${sectionLabel(section) || section} est masqué : réaffichez-le dans Paramètres › Disposition des blocs.`;

/* ------------------------------------------------------------------ parsing */

export type ParsedCommand = {
  /** Everything typed after `>`. */
  text: string;
  /** False when `text` does not even have the `letter:argument` shape. */
  wellFormed: boolean;
  rawCommand: string;
  /** The command letter, when `rawCommand` is one. */
  command: CommandLetter | null;
  hasSeparator: boolean;
  /** Whitespace typed between `:` and the argument. */
  spacing: string;
  argument: string;
};

/** The one parser for the `>letter: argument` grammar. `null` when the query is not a command. */
export function parseCommand(query: string): ParsedCommand | null {
  const marker = /^\s*>\s*([\s\S]*)$/u.exec(query);
  if (!marker) return null;
  const [, text] = marker;
  const parts = /^([^:\s]*)(?::(\s*)([\s\S]*))?$/u.exec(text);
  if (!parts) {
    return {
      text, wellFormed: false, rawCommand: '', command: null, hasSeparator: false, spacing: '', argument: '',
    };
  }
  const [, rawCommand, spacing, argument] = parts;
  const letter = rawCommand.toLowerCase();
  return {
    text,
    wellFormed: true,
    rawCommand,
    command: (COMMAND_LETTERS as readonly string[]).includes(letter) ? letter as CommandLetter : null,
    hasSeparator: spacing !== undefined,
    spacing: spacing ?? '',
    argument: argument ?? '',
  };
}

/** A complete `>letter:` prefix: what makes the query a runnable command. */
export const isActiveCommand = (parsed: ParsedCommand | null) => Boolean(parsed?.command && parsed.hasSeparator);

/** Help stays open on an empty query and while a command letter is still being typed. */
export function wantsSearchHelp(query: string) {
  if (!query.trim()) return true;
  const parsed = parseCommand(query);
  return Boolean(parsed) && !isActiveCommand(parsed);
}

/** How many characters of `value` normalize to `normalizedPrefix` (combining marks included). */
function rawLengthForNormalizedPrefix(value: string, normalizedPrefix: string) {
  for (let length = 1; length <= value.length; length += 1) {
    const next = value.slice(length, length + 1);
    if (normalized(value.slice(0, length)) === normalizedPrefix && !/^\p{M}/u.test(next)) return length;
  }
  return 0;
}

type NamedCandidate<T> = { keyword: string; target: T };

const byLongestKeyword = <T>(candidates: NamedCandidate<T>[]) => [...candidates]
  .sort((left, right) => right.keyword.length - left.keyword.length);

export type PrefixMatch<T> = {
  target: T;
  /** The keyword as typed. */
  label: string;
  /** Whatever follows the keyword, leading spaces included. */
  remainder: string;
};

/** The longest keyword the argument starts with (accent- and case-insensitive). */
function matchPrefix<T>(raw: string, candidates: NamedCandidate<T>[]): PrefixMatch<T> | null {
  const text = raw.trimStart();
  const value = normalized(text.trimEnd());
  const match = candidates.find(({ keyword }) => value === keyword || value.startsWith(`${keyword} `));
  if (!match) return null;
  const length = rawLengthForNormalizedPrefix(text, match.keyword) || match.keyword.length;
  return { target: match.target, label: text.slice(0, length), remainder: text.slice(length) };
}

type AddKeywordTarget = AddTarget | typeof COIN_TARGET;

const ADD_KEYWORDS = byLongestKeyword<AddKeywordTarget>([...ADD_TARGETS, COIN_TARGET]
  .flatMap((target) => target.names.map((keyword) => ({ keyword, target }))));
const COIN_KEYWORDS = byLongestKeyword(COIN_NAMES.map((keyword) => ({ keyword, target: COIN_TARGET })));
const EQUIPMENT_KEYWORDS = byLongestKeyword(EQUIPMENT_TARGET.names.map((keyword) => ({ keyword, target: EQUIPMENT_TARGET })));

/** `>a:` keyword (`sort`, `objet magique`, `pièces`…) and what follows it. */
export const matchAddKeyword = (raw: string) => matchPrefix(raw, ADD_KEYWORDS);

/** Drops a leading inventory keyword (`équipement potion` → `potion`). */
const withoutEquipmentKeyword = (raw: string) => {
  const match = matchPrefix(raw, EQUIPMENT_KEYWORDS);
  return (match ? match.remainder : raw).trim();
};

export const isPositiveAmount = (amount: number) => Number.isSafeInteger(amount) && amount >= 1;

/** `potion 3` → `{ name: 'potion', amount: 3 }`; no trailing number means one. */
export function splitTrailingAmount(value: string) {
  const match = /^(.*?)\s+(\d+)$/u.exec(value.trim());
  return match ? { name: match[1].trim(), amount: Number(match[2]) } : { name: value.trim(), amount: 1 };
}

/* --------------------------------------------------------------- resolution */

export type CommandResolution = {
  action: QuickAction | null;
  /** Why the command cannot run, shown instead of the suggestions. */
  error?: string;
};

const NONE: CommandResolution = { action: null };
const INVALID_QUANTITY = 'Quantité invalide : indiquez un nombre entier positif après le nom.';

function resolveCoin(raw: string, direction: 'add' | 'remove'): CoinAction | null {
  const match = matchPrefix(raw, COIN_KEYWORDS);
  if (!match) return null;
  const amountMatch = /^(\d+)?\s*(pc|pa|pe|po|pp)?$/i.exec(match.remainder.trim());
  if (!amountMatch) return null;
  const amount = Number(amountMatch[1] || '1');
  if (!isPositiveAmount(amount)) return null;
  return coinAction(direction, amount, (amountMatch[2] || 'po').toLowerCase() as Coin);
}

const DICE_SHAPE = /^\s*(\d*)\s*d\s*\d+\s*(?:[+-]\s*\d+)?\s*$/i;

function resolveDice(raw: string): CommandResolution | null {
  const expression = raw.trim();
  const parsed = parseDiceExpression(expression);
  if (parsed) {
    return {
      action: {
        type: 'expression', value: expression, title: `Lancer ${expression}`, detail: 'Expression de dés',
      },
    };
  }
  const shape = DICE_SHAPE.exec(expression);
  if (!shape) return null;
  return {
    action: null,
    error: Number(shape[1] || '1') > MAX_DICE_PER_ROLL
      ? `${MAX_DICE_PER_ROLL} dés maximum par lancer.`
      : 'Expression de dés invalide.',
  };
}

const skillAction = (data: SheetValues, skill: Skill): SkillAction => ({
  type: 'skill', skill, title: `Lancer ${skill.label}`, detail: `Compétence · ${formatModifier(skillBonus(data, skill))}`,
});

const saveAction = (data: SheetValues, ability: Ability): SaveAction => ({
  type: 'save',
  ability,
  title: `Jet de sauvegarde · ${withoutIcon(ability.label)}`,
  detail: `Sauvegarde · ${formatModifier(savingThrowBonus(data, ability.key))}`,
});

function resolveRoll(raw: string, data: SheetValues): CommandResolution {
  const dice = resolveDice(raw);
  if (dice) return dice;
  const value = normalized(raw.trim());
  const skill = SKILLS.find(({ key, label }) => normalized(key) === value || normalized(label) === value
    || (value === 'acrobatie' && key === 'acrobaties'));
  if (skill) return { action: skillAction(data, skill) };
  const ability = ABILITIES.find(({ key, label }) => normalized(key) === value || normalized(withoutIcon(label)) === value);
  return ability ? { action: saveAction(data, ability) } : NONE;
}

const amountLabel = (amount: number, name: string) => `${amount > 1 ? `${amount} × ` : ''}${name}`;

function resolveAdd(raw: string, data: SheetValues): CommandResolution {
  const keyword = matchAddKeyword(raw);
  if (!keyword) return NONE;
  if (keyword.target === COIN_TARGET) {
    const coin = resolveCoin(raw, 'add');
    return coin ? { action: coin } : NONE;
  }

  const target = keyword.target as AddTarget;
  const remainder = keyword.remainder.trim();
  if (target !== EQUIPMENT_TARGET || !remainder) return { action: addAction(target, { prefillValue: remainder }) };

  // `>a:équipement potion 3`: top up an existing row, or create one with that quantity.
  const items = inventoryItems(data);
  const exact = findInventoryItem(items, remainder);
  const { name, amount } = exact ? { name: exact.itemName, amount: 1 } : splitTrailingAmount(remainder);
  if (!name || !isPositiveAmount(amount)) return { action: null, error: INVALID_QUANTITY };

  const item = exact || findInventoryItem(items, name);
  if (item) {
    return {
      action: {
        type: 'inventory-add',
        row: item.row,
        itemName: item.itemName,
        amount,
        quantity: item.quantity,
        title: `Ajouter ${amountLabel(amount, item.itemName)}`,
        detail: `Quantité en stock : ${item.quantity}`,
      },
    };
  }
  return {
    action: addAction(target, {
      names: [target.names[0]],
      prefillValue: name,
      prefillQuantity: amount,
      title: `Ajouter ${amountLabel(amount, name)}`,
      detail: 'Nouvel objet · Équipement',
    }),
  };
}

const inventoryRemoveAction = (row: number, itemName: string, quantity: number, amount: number): InventoryRemoveAction => ({
  type: 'inventory',
  row,
  itemName,
  amount,
  quantity,
  title: `Retirer ${amountLabel(amount, itemName)}`,
  detail: `Quantité en stock : ${quantity}`,
});

function resolveRemove(raw: string, data: SheetValues): CommandResolution {
  const coin = resolveCoin(raw, 'remove');
  if (coin) return { action: coin };

  const value = withoutEquipmentKeyword(raw);
  if (!value) return NONE;
  const items = inventoryItems(data).filter(({ quantity }) => quantity > 0);
  const exact = findInventoryItem(items, value);
  if (exact) return { action: inventoryRemoveAction(exact.row, exact.itemName, exact.quantity, 1) };

  const { name, amount } = splitTrailingAmount(value);
  if (!name || !isPositiveAmount(amount)) return { action: null, error: INVALID_QUANTITY };
  const item = findInventoryItem(items, name);
  return item ? { action: inventoryRemoveAction(item.row, item.itemName, item.quantity, amount) } : NONE;
}

const sectionAliases = (id: string) => SECTION_FILTERS.filter((filter) => filter.section === id).map(({ alias }) => alias);

function resolveGoto(raw: string): CommandResolution {
  const value = normalized(raw.trim());
  const section = SECTIONS.find(({ id, label }) => normalized(id) === value || normalized(label) === value
    || sectionAliases(id).includes(value));
  return section
    ? {
      action: {
        type: 'goto', section: section.id, title: `Aller à ${section.label}`, detail: 'Ouvrir cette section',
      },
    }
    : NONE;
}

/**
 * The action an exact command names, or why it cannot run. Actions landing in
 * a hidden block are refused with an explanation rather than run into nothing.
 */
export function resolveCommand(
  parsed: ParsedCommand | null,
  data: SheetValues,
  visibleSections: ReadonlySet<string>,
): CommandResolution {
  if (!isActiveCommand(parsed) || !parsed.argument.trim()) return NONE;
  const raw = parsed.argument;
  let resolution = NONE;
  if (parsed.command === 't') resolution = resolveRoll(raw, data);
  if (parsed.command === 'a') resolution = resolveAdd(raw, data);
  if (parsed.command === 'r') resolution = resolveRemove(raw, data);
  if (parsed.command === 'g') resolution = resolveGoto(raw);

  const section = resolution.action && actionSection(resolution.action);
  if (section && !visibleSections.has(section)) return { action: null, error: hiddenSectionMessage(section) };
  return resolution;
}

/** Fuzzy-matched choices for the typed command, the exact action first when there is one. */
export function commandSuggestions(
  parsed: ParsedCommand | null,
  data: SheetValues,
  visibleSections: ReadonlySet<string>,
  resolution: CommandResolution = resolveCommand(parsed, data, visibleSections),
): QuickAction[] {
  if (!isActiveCommand(parsed) || resolution.error) return [];
  const value = normalized(parsed.argument.trim());
  const pick = (options: QuickAction[], term = value) => (term ? matchingEntries(options, term, MAX_SUGGESTIONS) : options.slice(0, MAX_SUGGESTIONS));
  const visible = (action: QuickAction) => {
    const section = actionSection(action);
    return !section || visibleSections.has(section);
  };

  if (parsed.command === 't') {
    if (resolution.action?.type === 'expression') return [resolution.action];
    const options: QuickAction[] = [
      ...SKILLS.map((skill) => skillAction(data, skill)),
      ...ABILITIES.map((ability) => saveAction(data, ability)),
    ];
    const searchKey = (action: QuickAction) => {
      if (action.type === 'skill') return `${action.skill.key} ${action.skill.label}`;
      if (action.type === 'save') return `${action.ability.key} ${withoutIcon(action.ability.label)}`;
      return '';
    };
    return pick(options.map((option) => ({ ...option, searchText: normalized(`${option.title} ${searchKey(option)}`) })));
  }

  if (resolution.action) return [resolution.action];

  if (parsed.command === 'a') {
    return pick([
      ...ADD_TARGETS.map((target) => addAction(target, { searchText: `${target.title} ${target.names.join(' ')}` })),
      { ...coinAction('add'), searchText: `Ajouter des pièces ${COIN_NAMES.join(' ')}` },
    ].filter(visible));
  }

  if (parsed.command === 'r') {
    const query = withoutEquipmentKeyword(parsed.argument);
    const { name, amount } = splitTrailingAmount(query);
    const options: QuickAction[] = [
      { ...coinAction('remove'), searchText: `Retirer des pièces ${COIN_NAMES.join(' ')}` },
      ...inventoryItems(data)
        .filter(({ quantity }) => quantity > 0)
        .map(({ row, itemName, quantity }) => ({ ...inventoryRemoveAction(row, itemName, quantity, amount), searchText: itemName })),
    ];
    return pick(options.filter(visible), name);
  }

  if (parsed.command === 'g') {
    return pick(SECTIONS
      .filter(({ id }) => visibleSections.has(id))
      .map(({ id, label }): GotoAction => ({
        type: 'goto', section: id, title: `Aller à ${label}`, detail: 'Ouvrir cette section', searchText: `${id} ${label} ${sectionAliases(id).join(' ')}`,
      })));
  }

  return pick(TOOL_ACTIONS.map((tool) => ({ ...tool, searchText: `${tool.title} ${tool.names.join(' ')}` })));
}

/* ------------------------------------------------------------------ effects */

/**
 * The new purse value after a coin action, computed up front so the updater
 * stays pure and the notification reports what really changed. `null` when
 * the total would overflow.
 */
export function coinChange(data: SheetValues, action: CoinAction): { value: string; changed: number } | null {
  const stored = Number.parseInt(safeText(data[action.coin]), 10);
  const current = Number.isSafeInteger(stored) && stored >= 0 ? stored : 0;
  if (action.direction === 'remove') {
    const changed = Math.min(action.amount, current);
    return { value: String(current - changed), changed };
  }
  const next = current + action.amount;
  return Number.isSafeInteger(next) ? { value: String(next), changed: action.amount } : null;
}

/* ---------------------------------------------------------- syntax colouring */

/** The `>a:`/`>r:` keyword the syntax preview colours, when the argument has one. */
export function syntaxKeyword(command: string, argument: string) {
  if (command !== 'a' && command !== 'r') return null;
  const keyword = matchAddKeyword(argument);
  if (!keyword) return null;
  if (command === 'a' && keyword.target === COIN_TARGET && !resolveCoin(argument, 'add')) return null;
  return keyword;
}

/**
 * How much of the text after a keyword names something already on the sheet
 * (or a valid coin amount), so the preview can tell it from free text.
 */
export function recognizedValueLength(
  keyword: PrefixMatch<AddKeywordTarget>,
  entries: ReadonlyArray<{ section: string; title: string }>,
) {
  const rawValue = keyword.remainder.trim();
  const value = normalized(rawValue);
  if (!value) return 0;
  if (keyword.target === COIN_TARGET) {
    return resolveCoin(`${keyword.label}${keyword.remainder}`, 'remove') ? rawValue.length : 0;
  }

  return entries
    .filter((entry) => entry.section === keyword.target.section)
    .reduce((longest, entry) => {
      const title = normalized(entry.title);
      if (title.startsWith(value)) return Math.max(longest, rawValue.length);
      if (value.startsWith(title)) return Math.max(longest, rawLengthForNormalizedPrefix(rawValue, title));
      return Number.isFinite(fuzzyScore(value, title)) ? Math.max(longest, rawValue.length) : longest;
    }, 0);
}
