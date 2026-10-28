/** The dice of the tray, in the order they sit on a table. `shape` drives the CSS silhouette. */
export const DICE_TYPES = [
  { sides: 4, shape: 'd4' },
  { sides: 6, shape: 'd6' },
  { sides: 8, shape: 'd8' },
  { sides: 10, shape: 'd10' },
  { sides: 12, shape: 'd12' },
  { sides: 20, shape: 'd20' },
  { sides: 100, shape: 'd100' },
];

export const ROLL_MODES = [
  { value: 'normal', label: 'Normal', short: '=' },
  { value: 'avantage', label: 'Avantage', short: '▲' },
  { value: 'desavantage', label: 'Désavantage', short: '▼' },
];
