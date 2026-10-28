/** Dice rolling. Everything here is a plain value — no React, no storage. */

const D20 = 20;
const MAX_DICE_PER_ROLL = 20;

/** Uniform in 1..sides. */
export const rollDie = (sides) => Math.floor(Math.random() * sides) + 1;

const sum = (numbers) => numbers.reduce((total, value) => total + value, 0);

const total = (dice, modifier) => sum(dice) + modifier;

/**
 * A plain roll of `count` dice, e.g. the tray's buttons.
 * Returns the shape every roll shares: `{ label, dice, kept, modifier, total }`.
 */
export const rollDice = (sides, count = 1, { label } = {}) => {
  const dice = Array.from({ length: Math.min(count, MAX_DICE_PER_ROLL) }, () => rollDie(sides));
  return {
    label: label || `${dice.length}d${sides}`,
    sides,
    dice,
    kept: dice,
    modifier: 0,
    total: sum(dice),
  };
};

/**
 * A d20 check against a bonus, honouring advantage: both dice are kept in
 * `dice` so the log can show the one that was dropped.
 */
export const rollCheck = ({ label, bonus = 0, mode = 'normal' }) => {
  const twice = mode === 'avantage' || mode === 'desavantage';
  const dice = twice ? [rollDie(D20), rollDie(D20)] : [rollDie(D20)];
  const kept = [mode === 'desavantage' ? Math.min(...dice) : Math.max(...dice)];

  return { label, sides: D20, mode, dice, kept, modifier: bonus, total: total(kept, bonus) };
};

const DICE_EXPRESSION = /^\s*(\d*)\s*d\s*(\d+)\s*(?:([+-])\s*(\d+))?\s*$/i;

/** Parses `2d6+3`, `d20`, `1d8 - 1`. Returns `null` when it is not a dice expression. */
export const parseDiceExpression = (input) => {
  const match = DICE_EXPRESSION.exec(input || '');
  if (!match) return null;

  const [, count, sides, sign, modifier] = match;
  const parsed = {
    count: Number(count || 1),
    sides: Number(sides),
    modifier: modifier ? Number(modifier) * (sign === '-' ? -1 : 1) : 0,
  };
  return parsed.sides > 0 && parsed.count > 0 ? parsed : null;
};

/** Rolls a typed expression such as the damage line of a weapon. */
export const rollExpression = (input) => {
  const parsed = parseDiceExpression(input);
  if (!parsed) return null;

  const { count, sides, modifier } = parsed;
  const dice = Array.from({ length: Math.min(count, MAX_DICE_PER_ROLL) }, () => rollDie(sides));
  return {
    label: input.trim(),
    sides,
    dice,
    kept: dice,
    modifier,
    total: total(dice, modifier),
  };
};

/**
 * A plausible total for the tumbling animation: the same dice as `roll`, thrown
 * again, so the number that flickers has the right magnitude.
 */
export const randomTotalLike = (roll) =>
  roll.kept.reduce((running) => running + rollDie(roll.sides), 0) + roll.modifier;

/** Delays between tumbles, slowing down like a die losing momentum. */
export const TUMBLE_DELAYS_MS = [45, 45, 50, 55, 65, 80, 100, 130, 175, 230];

/** A natural 20 or a natural 1 on a d20 — worth showing differently. */
export const criticalOf = (roll) => {
  if (roll.sides !== D20 || roll.kept.length !== 1) return null;
  if (roll.kept[0] === D20) return 'reussite';
  if (roll.kept[0] === 1) return 'echec';
  return null;
};
