import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSheet, serializeSheet } from './sheetSerializer.js';
import { readStoredSheet, writeStoredSheet } from './sheetStorage.js';

const sampleSheet = {
  nom_personnage: 'Kresk',
  classe: 'Guerrier',
  niveau: '5',
  theme: 'fighter',
  textarea_mode: 'visual',
  reduce_motion: 'true',
  force: '20',
  save_force: 'true',
  points_vie_max: '49',
  points_vie_actuel: '36',
  classe_armure: '16',
  perception: 'true',
  caracteristique_incantation: 'intelligence',
  magie_pacte: 'true',
  emplacements_sorts_niveau_2: '2',
  emplacements_sorts_niveau_3: '',
  emplacement_sort_1_1: 'true',
  emplacement_sort_1_3: 'false',
  pc: '4',
  section_notes_replie: 'false',
  notes: 'Notes de campagne',
  arme1_nom: 'Pique',
  arme1_degats: '1d10 perforant',
  capacite1: 'Second souffle',
  capacite_utilisee1: 'false',
  capacite1_repos_court: 'true',
  capacites_lignes: '1',
  sort1_nom: 'Bouclier',
  sort1_niveau: '1',
  inventaire1_nom: 'Potion',
  inventaire1_quantite: '2',
  lien_magique1: 'Hache en argent',
  trait1: 'Endurance implacable',
  quete1_titre: 'Gnomes en garde',
  quete1_statut: 'terminee',
  quete1_replie: 'true',
  armes_lignes: '1',
  sorts_lignes: '1',
  liens_magiques_lignes: '1',
  quetes_lignes: '1',
};

const asObject = (data) => JSON.parse(serializeSheet(data));

test('should serialize growable collections as arrays when converting the flat sheet model', () => {
  const serialized = asObject(sampleSheet);

  assert.equal(serialized.metadata.version, '2.0');
  assert.deepEqual(serialized.character.identity, {
    characterName: 'Kresk',
    class: 'Guerrier',
  });
  assert.deepEqual(serialized.life, {
    level: '5',
    hitPoints: { maximum: '49', current: '36' },
  });
  assert.deepEqual(serialized.characteristics.abilities, { force: '20' });
  assert.deepEqual(serialized.characteristics.savingThrows, { force: 'true' });
  assert.deepEqual(serialized.characteristics.skills.perception, { proficient: 'true' });
  assert.deepEqual(serialized.combat.armorClass, '16');
  assert.deepEqual(serialized.spells.casting.ability, 'intelligence');
  assert.deepEqual(serialized.spells.known, [{ niveau: '1', nom: 'Bouclier' }]);
  assert.deepEqual(serialized.spellSlots, {
    pactMagic: 'true',
    levels: [
      { level: 1, slots: [{ number: 1, used: 'true' }, { number: 3, used: 'false' }] },
      { level: 2, override: '2' },
      { level: 3, override: '' },
    ],
  });
  assert.deepEqual(serialized.weapons, [{ nom: 'Pique', degats: '1d10 perforant' }]);
  assert.deepEqual(serialized.classFeatures, [
    { titre: 'Second souffle', repos_court: 'true', utilisee: 'false' },
  ]);
  assert.deepEqual(serialized.equipment.inventory, [{ nom: 'Potion', quantite: '2' }]);
  assert.deepEqual(serialized.equipment.magicItems, ['Hache en argent']);
  assert.deepEqual(serialized.quests, [
    { titre: 'Gnomes en garde', statut: 'terminee', replie: 'true' },
  ]);
  assert.deepEqual(serialized.character.traits, ['Endurance implacable']);
  assert.equal(serialized.settings.theme, 'fighter');
  assert.equal(serialized.settings.textAreaMode, 'visual');
  assert.equal(serialized.settings.sections.notes.folded, 'false');
  assert.equal(serialized.notes.notes, 'Notes de campagne');
});

test('should preserve the flat sheet model when round-tripping through v2', () => {
  assert.deepEqual(parseSheet(serializeSheet(sampleSheet)), sampleSheet);
});

test('should import legacy envelopes and bare field maps when parsing old sheet data', () => {
  const legacyEnvelope = {
    metadata: { version: '1.1' },
    data: sampleSheet,
  };
  assert.deepEqual(parseSheet(JSON.stringify(legacyEnvelope)), sampleSheet);
  assert.deepEqual(parseSheet(JSON.stringify(sampleSheet)), sampleSheet);
});

test('should import the earlier v2 envelope when parsing in-progress sheet data', () => {
  const previousV2 = {
    metadata: { version: '2.0' },
    character: { nom_personnage: 'Kresk', force: '20' },
    lists: {
      weapons: [{ nom: 'Pique' }],
      spells: [{ nom: 'Bouclier', niveau: '1' }],
      classFeatures: [{ titre: 'Second souffle' }],
      inventory: [{ nom: 'Potion', quantite: '2' }],
      magicItems: ['Hache'],
      quests: [{ titre: 'Gnomes' }],
      traits: ['Robuste'],
    },
  };
  const parsed = parseSheet(JSON.stringify(previousV2));

  assert.equal(parsed.nom_personnage, 'Kresk');
  assert.equal(parsed.force, '20');
  assert.equal(parsed.arme1_nom, 'Pique');
  assert.equal(parsed.sort1_nom, 'Bouclier');
  assert.equal(parsed.capacite1, 'Second souffle');
  assert.equal(parsed.inventaire1_quantite, '2');
  assert.equal(parsed.lien_magique1, 'Hache');
  assert.equal(parsed.quete1_titre, 'Gnomes');
  assert.equal(parsed.trait1, 'Robuste');
});

test('should read legacy and v2 storage and write v2 when persisting sheet data', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = new Map([
    ['perso_sheet', JSON.stringify({ metadata: { version: '1.1' }, data: sampleSheet })],
  ]);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });

  try {
    assert.deepEqual(readStoredSheet(), sampleSheet);
    storage.set('perso_sheet', serializeSheet(sampleSheet));
    assert.deepEqual(readStoredSheet(), sampleSheet);
    assert.equal(writeStoredSheet(sampleSheet), true);
    const saved = JSON.parse(storage.get('perso_sheet'));
    assert.equal(saved.metadata.version, '2.0');
    assert.ok(Array.isArray(saved.weapons));
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  }
});

test('should preserve rows beyond defaults when legacy row counts are missing', () => {
  const legacy = {
    arme7_nom: 'Arc long',
    sort9_nom: 'Téléportation',
    capacite9: 'Fougue',
    inventaire3_nom: 'Ration',
    quete10_titre: 'Dernière quête',
    lien_magique4: 'Anneau',
    trait12: 'Trait',
  };
  const parsed = parseSheet(serializeSheet(legacy));

  assert.equal(parsed.arme7_nom, 'Arc long');
  assert.equal(parsed.sort9_nom, 'Téléportation');
  assert.equal(parsed.capacite9, 'Fougue');
  assert.equal(parsed.inventaire3_nom, 'Ration');
  assert.equal(parsed.quete10_titre, 'Dernière quête');
  assert.equal(parsed.lien_magique4, 'Anneau');
  assert.equal(parsed.trait12, 'Trait');
  assert.equal(parsed.armes_lignes, '7');
  assert.equal(parsed.sorts_lignes, '9');
  assert.equal(parsed.capacites_lignes, '9');
  assert.equal(parsed.inventaire_lignes, '3');
  assert.equal(parsed.quetes_lignes, '10');
  assert.equal(parsed.liens_magiques_lignes, '4');
});

test('should keep default row counts implicit when importing and exporting a sheet', () => {
  const legacy = { capacite_utilisee8: 'true', capacite8: 'Fougue' };
  const parsed = parseSheet(serializeSheet(legacy));

  assert.equal(parsed.capacites_lignes, undefined);
  assert.equal(parsed.capacite_utilisee8, 'true');
  assert.equal(parsed.capacite8, 'Fougue');
});

test('should normalize historical class-feature notes when importing legacy data', () => {
  const parsed = parseSheet(
    JSON.stringify({
      data: {
        capacite1: 'Second souffle',
        trait1: 'Second souffle: Récupère des points de vie',
      },
    }),
  );

  assert.equal(parsed.capacite1, 'Second souffle');
  assert.equal(parsed.capacite1_description, 'Récupère des points de vie');
});

test('should reject invalid JSON and malformed collections when importing a sheet', () => {
  assert.throws(() => parseSheet('{'), SyntaxError);
  assert.throws(() => parseSheet('[]'), /Expected a JSON object/);
  assert.throws(() => parseSheet(JSON.stringify({ character: [], lists: {} })), /Expected "character" to be an object/);
  assert.throws(() => parseSheet(JSON.stringify({ character: {}, lists: [] })), /Expected "lists" to be an object/);
  assert.throws(
    () => parseSheet(JSON.stringify({ character: {}, lists: { weapons: {} } })),
    /Expected "weapons" to be an array/,
  );
  assert.throws(
    () => parseSheet(JSON.stringify({ character: {}, lists: { quests: [null] } })),
    /Expected "quests\[0\]" to be an object/,
  );
  assert.throws(
    () => parseSheet(JSON.stringify({ character: {}, lists: { magicItems: [1] } })),
    /Expected "magicItems\[0\]" to be a string/,
  );
  assert.throws(
    () => parseSheet(JSON.stringify({ metadata: {}, character: { identity: 'Kresk' }, life: {} })),
    /Expected "character.identity.name" to contain an object/,
  );
  assert.throws(
    () => parseSheet(JSON.stringify({
      metadata: {}, character: {}, life: {}, weapons: {},
    })),
    /Expected "weapons" to be an array/,
  );
  assert.throws(
    () => parseSheet(JSON.stringify({
      metadata: {}, character: {}, life: {}, spellSlots: { levels: {} },
    })),
    /Expected "spellSlots.levels" to be an array/,
  );
});
