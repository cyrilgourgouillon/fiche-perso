import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_TILE_LAYOUT,
  TILE_CATALOG,
  hiddenTiles,
  normalizeTileLayout,
} from './tileLayout';

test('should migrate legacy order into wide and side placements when no current layout exists', () => {
  const layout = normalizeTileLayout(
    null,
    ['sorts', 'notes', 'combat'],
    { sorts: 'left', combat: 'right' },
    { sorts: true, notes: true },
  );

  assert.deepEqual(layout, {
    top: ['header', 'sorts'],
    left: ['armes', 'capacites', 'pieces'],
    right: ['combat', 'emplacements_sorts', 'equipement', 'maitrises'],
    bottom: ['notes', 'caracteristiques', 'quetes'],
  });
});

test('should discard unknown and repeated tiles and place required wide tiles when normalizing current groups', () => {
  const layout = normalizeTileLayout({
    top: ['notes', 'header', 'header', 'missing'],
    left: ['combat', 'notes', 'caracteristiques', 'sorts'],
    right: ['sorts', 'armes'],
    bottom: ['notes', 'quetes'],
  });

  assert.deepEqual(layout, {
    top: ['header', 'notes', 'caracteristiques'],
    left: ['combat', 'sorts'],
    right: ['armes'],
    bottom: ['quetes'],
  });
});

test('should migrate legacy wide groups into top and bottom when using the earlier layout shape', () => {
  const layout = normalizeTileLayout({
    wide: ['notes', 'header', 'caracteristiques', 'quetes'],
    left: ['combat', 'caracteristiques'],
    right: ['sorts', 'unknown'],
  });

  assert.deepEqual(layout, {
    top: ['header', 'notes'],
    left: ['combat'],
    right: ['sorts'],
    bottom: ['caracteristiques', 'quetes'],
  });
});

test('should report catalog tiles not placed in the layout when some sections are hidden', () => {
  const layout = {
    top: DEFAULT_TILE_LAYOUT.top,
    left: DEFAULT_TILE_LAYOUT.left,
    right: DEFAULT_TILE_LAYOUT.right,
    bottom: ['notes'],
  };
  const hidden = hiddenTiles({
    ...layout,
  }).map(({ id }) => id);
  const visible = [...layout.top, ...layout.left, ...layout.right, ...layout.bottom];

  assert.deepEqual(hidden, ['quetes']);
  assert.equal(hidden.length + visible.length, TILE_CATALOG.length);
});
