export const TILE_CATALOG = [
  { id: 'header', label: 'Identité & vitalité', width: 'wide' },
  { id: 'combat', label: 'Combat', width: 'single' },
  { id: 'caracteristiques', label: 'Caractéristiques & compétences', width: 'wide' },
  { id: 'armes', label: 'Armes', width: 'single' },
  { id: 'capacites', label: 'Capacités de classe', width: 'single' },
  { id: 'emplacements_sorts', label: 'Emplacements de sorts', width: 'single' },
  { id: 'sorts', label: 'Sorts', width: 'single' },
  { id: 'pieces', label: 'Pièces', width: 'single' },
  { id: 'equipement', label: 'Équipement', width: 'single' },
  { id: 'maitrises', label: 'Entraînements & maîtrises', width: 'single' },
  { id: 'notes', label: 'Notes', width: 'wide' },
  { id: 'quetes', label: 'Journal de quêtes', width: 'wide' },
];

export const DEFAULT_TILE_LAYOUT = {
  top: ['header', 'caracteristiques'],
  left: ['combat', 'armes', 'capacites', 'pieces'],
  right: ['emplacements_sorts', 'sorts', 'equipement', 'maitrises'],
  bottom: ['notes', 'quetes'],
};

export const TILE_BY_ID = Object.fromEntries(TILE_CATALOG.map((tile) => [tile.id, tile]));

/**
 * Read the current configuration, or migrate older saves that only had a flat
 * order and optional side/width overrides. Missing blocks in a new configuration
 * stay hidden; legacy saves get the previous complete set of blocks.
 */
export function normalizeTileLayout(layout, legacyOrder, legacySides) {
  const source = layout && typeof layout === 'object' && !Array.isArray(layout)
    ? layout
    : null;

  if (!source) {
    const oldOrder = Array.isArray(legacyOrder) ? legacyOrder : [];
    const uniqueOrder = [
      'header',
      ...oldOrder.filter((id) => TILE_BY_ID[id] && id !== 'header'),
      ...TILE_CATALOG.map(({ id }) => id).filter((id) => !oldOrder.includes(id)),
    ];
    const migrated = { wide: [], left: [], right: [] };
    uniqueOrder.forEach((id) => {
      const tile = TILE_BY_ID[id];
      if (tile.width === 'wide') {
        migrated.wide.push(id);
      } else {
        const side = legacySides?.[id] === 'left' || legacySides?.[id] === 'right'
          ? legacySides[id]
          : DEFAULT_TILE_LAYOUT.left.includes(id) ? 'left' : 'right';
        migrated[side].push(id);
      }
    });
    return {
      top: migrated.wide.slice(0, 2),
      left: migrated.left,
      right: migrated.right,
      bottom: migrated.wide.slice(2),
    };
  }

  const explicitPlacements = Array.isArray(source.top) || Array.isArray(source.bottom);
  const groups = explicitPlacements
    ? ['top', 'left', 'right', 'bottom']
    : ['wide', 'left', 'right'];
  const normalized = { top: [], left: [], right: [], bottom: [] };
  const seen = new Set();
  groups.forEach((group) => {
    if (!Array.isArray(source[group])) return;
    source[group].forEach((id) => {
      const tile = TILE_BY_ID[id];
      if (!tile || seen.has(id)) return;
      const isWideGroup = group === 'wide' || group === 'top' || group === 'bottom';
      const validGroup = tile.width === 'wide' ? isWideGroup : !isWideGroup;
      if (!validGroup) return;
      seen.add(id);
      if (group === 'wide') {
        if (normalized.top.length < 2) normalized.top.push(id);
        else normalized.bottom.push(id);
      } else {
        normalized[group].push(id);
      }
    });
  });
  normalized.top = ['header', ...normalized.top.filter((id) => id !== 'header')];
  normalized.bottom = normalized.bottom.filter((id) => id !== 'header');
  return normalized;
}

export function hiddenTiles(layout) {
  const visible = new Set([...layout.top, ...layout.left, ...layout.right, ...layout.bottom]);
  return TILE_CATALOG.filter(({ id }) => !visible.has(id));
}

