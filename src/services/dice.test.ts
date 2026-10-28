import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import {
  criticalOf,
  parseDiceExpression,
  randomTotalLike,
  rollCheck,
  rollDie,
  rollDice,
  rollExpression,
} from './dice';

const withRandomValues = (values, callback) => {
  const originalRandom = Math.random;
  let index = 0;
  Math.random = () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
  try {
    callback();
  } finally {
    Math.random = originalRandom;
  }
};

describe('dice', () => {
  test('should roll die values within range when random values are at their bounds', () => {
    withRandomValues([0, 0.999], () => {
      assert.equal(rollDie(6), 1);
      assert.equal(rollDie(6), 6);
    });
  });

  test('should cap dice count and return consistent totals when a roll is requested', () => {
    withRandomValues([0], () => {
      const roll = rollDice(8, 25);
      assert.equal(roll.dice.length, 20);
      assert.equal(roll.total, 20);
      assert.equal(roll.label, '20d8');
      assert.deepEqual(roll.kept, roll.dice);
      assert.equal(roll.modifier, 0);
    });

    withRandomValues([0.5], () => {
      assert.equal(rollDice(6, 2, { label: 'Dégâts' }).label, 'Dégâts');
    });
  });

  test('should keep the higher or lower die when rolling with advantage or disadvantage', () => {
    withRandomValues([0.95, 0.1], () => {
      assert.deepEqual(rollCheck({ label: 'Test', bonus: 3, mode: 'avantage' }), {
        label: 'Test',
        sides: 20,
        mode: 'avantage',
        dice: [20, 3],
        kept: [20],
        modifier: 3,
        total: 23,
      });
    });

    withRandomValues([0.95, 0.1], () => {
      assert.deepEqual(rollCheck({ label: 'Test', bonus: -1, mode: 'desavantage' }).kept, [3]);
      assert.equal(rollCheck({ label: 'Test', mode: 'desavantage' }).total, 3);
    });
  });

  test('should parse dice expressions when valid and reject them when malformed', () => {
    assert.deepEqual(parseDiceExpression(' 2d6 + 3 '), { count: 2, sides: 6, modifier: 3 });
    assert.deepEqual(parseDiceExpression('d20'), { count: 1, sides: 20, modifier: 0 });
    assert.deepEqual(parseDiceExpression('1d8 - 1'), { count: 1, sides: 8, modifier: -1 });
    for (const expression of ['', '2d6+3d4', '0d6', 'd0', '2d6+-1', '1d6.5']) {
      assert.equal(parseDiceExpression(expression), null, expression);
    }
  });

  test('should apply expression modifiers and identify criticals when a d20 is rolled', () => {
    withRandomValues([0, 0.999], () => {
      assert.deepEqual(rollExpression('2d6+3'), {
        label: '2d6+3',
        sides: 6,
        dice: [1, 6],
        kept: [1, 6],
        modifier: 3,
        total: 10,
      });
      assert.equal(rollExpression('invalid'), null);
      assert.equal(randomTotalLike({ sides: 6, kept: [1, 6], modifier: 3 }), 10);
    });

    assert.equal(criticalOf({ sides: 20, kept: [20] }), 'reussite');
    assert.equal(criticalOf({ sides: 20, kept: [1] }), 'echec');
    assert.equal(criticalOf({ sides: 20, kept: [10] }), null);
    assert.equal(criticalOf({ sides: 6, kept: [6] }), null);
    assert.equal(criticalOf({ sides: 20, kept: [20, 1] }), null);
  });
});
