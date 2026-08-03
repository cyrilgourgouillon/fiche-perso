import { useState } from 'react';
import DieButton from './DieButton.jsx';
import DieIcon from './DieIcon.jsx';
import Panel from '../sheet/Panel.jsx';
import RollResult from './RollResult.jsx';
import { DICE_TYPES, ROLL_MODES } from '../../data/diceTypes.js';
import { parseDiceExpression } from '../../services/dice.js';
import { useDice } from '../../context/DiceContext.js';

export default function DiceTray() {
  const { log, lastRoll, mode, setMode, rollDice, rollExpression, clear } = useDice();
  const [expression, setExpression] = useState('');
  const validExpression = parseDiceExpression(expression) !== null;

  const submitExpression = (event) => {
    event.preventDefault();
    if (validExpression) rollExpression(expression);
  };

  return (
    <Panel id="des" title="Lancer de Dés">
      <div className="dice-modes">
        {ROLL_MODES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={mode === value ? 'dice-mode active' : 'dice-mode'}
            data-mode={value}
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="dice-help">
        Le mode s’applique aux jets de d20 : cliquez le dé{' '}
        <DieIcon className="die-icon inline" /> d’une compétence, d’une sauvegarde ou d’une
        caractéristique sur la fiche pour la lancer.
      </p>

      <div className="dice-tray">
        {DICE_TYPES.map(({ sides, shape }) => (
          <DieButton key={sides} sides={sides} shape={shape} onClick={() => rollDice(sides)} />
        ))}
      </div>

      <form className="dice-expression" onSubmit={submitExpression}>
        <input
          className="ef"
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          placeholder="ex. 2d6+3"
          aria-label="Lancer une expression de dés"
        />
        {/* the button is dimmed until the expression parses, so it says why */}
        <button
          type="submit"
          className="sheet-button dice-submit"
          disabled={!validExpression}
          title={validExpression ? `Lancer ${expression}` : 'Entrez une expression, par exemple 2d6+3'}
        >
          Lancer
        </button>
      </form>

      {lastRoll && (
        <div className="dice-last" key={lastRoll.id}>
          <RollResult roll={lastRoll} />
        </div>
      )}

      {log.length > 1 && (
        <div className="dice-log">
          <div className="meta-label">🎲 Derniers jets</div>
          {log.slice(1).map((roll) => (
            <RollResult key={roll.id} roll={roll} compact />
          ))}
          <button type="button" className="add-row" onClick={clear}>
            Effacer l’historique
          </button>
        </div>
      )}
    </Panel>
  );
}
