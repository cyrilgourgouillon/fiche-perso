import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import {
  coinChange, commandSuggestions, parseCommand, resolveCommand, wantsSearchHelp,
} from './searchCommands';
import type { CoinAction, QuickAction } from './searchCommands';

const ALL_SECTIONS = new Set([
  'combat', 'caracteristiques', 'armes', 'capacites', 'emplacements_sorts', 'sorts', 'pieces', 'equipement', 'maitrises', 'quetes', 'notes',
]);

const resolve = (query: string, data = {}, visible: ReadonlySet<string> = ALL_SECTIONS) => resolveCommand(parseCommand(query), data, visible);

const addedSection = (action: QuickAction | null) => (action?.type === 'add' ? action.section : null);

describe('searchCommands', () => {
  describe('parseCommand', () => {
    test('should split the command letter, spacing and argument when a command is typed', () => {
      assert.deepEqual(parseCommand('  > A:  sort feu'), {
        text: 'A:  sort feu', wellFormed: true, rawCommand: 'A', command: 'a', hasSeparator: true, spacing: '  ', argument: 'sort feu',
      });
    });

    test('should return null when the query is not a command', () => {
      assert.equal(parseCommand('sort: feu'), null);
    });

    test('should flag unknown letters and malformed commands', () => {
      assert.equal(parseCommand('>x:feu').command, null);
      assert.equal(parseCommand('>t :feu').wellFormed, false);
      assert.equal(parseCommand('>t').hasSeparator, false);
    });

    test('should keep the help open until a command letter and separator are typed', () => {
      assert.equal(wantsSearchHelp(''), true);
      assert.equal(wantsSearchHelp('>'), true);
      assert.equal(wantsSearchHelp('>t'), true);
      assert.equal(wantsSearchHelp('>t:'), false);
      assert.equal(wantsSearchHelp('dragon'), false);
    });
  });

  describe('>a: routing', () => {
    test('should add a quest whatever the accents and case', () => {
      assert.equal(addedSection(resolve('>a:quête').action), 'quetes');
      assert.equal(addedSection(resolve('>a:QUÊTE').action), 'quetes');
      assert.equal(addedSection(resolve('>a:Quete').action), 'quetes');
    });

    test('should add a class feature whatever the accents and case', () => {
      assert.equal(addedSection(resolve('>a:capacité').action), 'capacites');
      assert.equal(addedSection(resolve('>a:Capacité Rage').action), 'capacites');
    });

    test('should add a spell with its name prefilled', () => {
      const { action } = resolve('>a:Sort Boule de feu');
      assert.equal(action?.type, 'add');
      assert.equal(addedSection(action), 'sorts');
      assert.equal(action?.type === 'add' && action.prefillValue, 'Boule de feu');
    });

    test('should add a magic link rather than an inventory item named "magique"', () => {
      const { action } = resolve('>a:objet magique');
      assert.equal(action?.type === 'add' && action.fieldPrefix, 'lien_magique');
    });

    test('should create a new inventory row with its quantity when the item is unknown', () => {
      const { action } = resolve('>a:équipement Potion 3');
      assert.equal(action?.type, 'add');
      if (action?.type !== 'add') return;
      assert.equal(action.fieldPrefix, 'inventaire');
      assert.equal(action.prefillValue, 'Potion');
      assert.equal(action.prefillQuantity, 3);
    });

    test('should top up an existing inventory row when the item is already carried', () => {
      const data = {
        inventaire_lignes: '2', inventaire1_nom: 'Corde', inventaire2_nom: 'Potion de soins', inventaire2_quantite: '2',
      };
      const { action } = resolve('>a:Équipement potion de soins 4', data);
      assert.deepEqual(action && { ...action }, {
        type: 'inventory-add',
        row: 1,
        itemName: 'Potion de soins',
        amount: 4,
        quantity: 2,
        title: 'Ajouter 4 × Potion de soins',
        detail: 'Quantité en stock : 2',
      });
    });

    test('should refuse an invalid inventory quantity', () => {
      const resolution = resolve('>a:équipement Potion 0');
      assert.equal(resolution.action, null);
      assert.ok(resolution.error);
      assert.deepEqual(commandSuggestions(parseCommand('>a:équipement Potion 0'), {}, ALL_SECTIONS), []);
    });

    test('should add coins with the typed amount and coin', () => {
      const { action } = resolve('>a:pièces 12 PA');
      assert.equal(action?.type === 'coin' && `${action.direction} ${action.amount} ${action.coin}`, 'add 12 pa');
    });

    test('should refuse to add into a hidden block and say why', () => {
      const visible = new Set([...ALL_SECTIONS].filter((section) => section !== 'sorts'));
      const resolution = resolve('>a:sort Boule de feu', {}, visible);
      assert.equal(resolution.action, null);
      assert.match(resolution.error, /Sorts est masqué/);
      assert.equal(
        commandSuggestions(parseCommand('>a:'), {}, visible).some((action) => addedSection(action) === 'sorts'),
        false,
      );
    });
  });

  describe('>r: removal', () => {
    test('should read the coin amount to remove', () => {
      const { action } = resolve('>r:pieces 10 po');
      assert.equal(action?.type, 'coin');
      if (action?.type !== 'coin') return;
      assert.equal(action.direction, 'remove');
      assert.equal(action.amount, 10);
      assert.equal(action.coin, 'po');
    });

    test('should remove a carried item with the requested amount', () => {
      const data = { inventaire1_nom: 'Torche', inventaire1_quantite: '5' };
      const { action } = resolve('>r:équipement torche 2', data);
      assert.equal(action?.type === 'inventory' && `${action.amount}/${action.quantity}`, '2/5');
    });
  });

  describe('coinChange', () => {
    const removal: CoinAction = {
      type: 'coin', direction: 'remove', names: [], amount: 15, coin: 'po', title: '', detail: '',
    };

    test('should report only what was actually removed when the purse runs short', () => {
      assert.deepEqual(coinChange({ po: '7' }, removal), { value: '0', changed: 7 });
    });

    test('should add to a purse holding a number or nothing', () => {
      assert.deepEqual(coinChange({ po: 3 }, { ...removal, direction: 'add' }), { value: '18', changed: 15 });
      assert.deepEqual(coinChange({}, { ...removal, direction: 'add' }), { value: '15', changed: 15 });
    });
  });

  describe('>t: rolls', () => {
    test('should resolve a dice expression', () => {
      const { action } = resolve('>t: 2d6+3 ');
      assert.equal(action?.type === 'expression' && action.value, '2d6+3');
    });

    test('should refuse more than twenty dice instead of rolling fewer', () => {
      const resolution = resolve('>t:100d6');
      assert.equal(resolution.action, null);
      assert.match(resolution.error, /20 dés maximum/);
    });

    test('should resolve a skill or a saving throw by name', () => {
      assert.equal(resolve('>t:Acrobatie').action?.type, 'skill');
      assert.equal(resolve('>t:dextérité').action?.type, 'save');
    });
  });

  describe('>g: navigation', () => {
    test('should go to a visible section and refuse a hidden one', () => {
      assert.equal(resolve('>g:Équipement').action?.type, 'goto');
      assert.ok(resolve('>g:quêtes', {}, new Set(['combat'])).error);
    });
  });
});
