import { useState } from 'react';
import DieButton from './DieButton';
import DieIcon from './DieIcon';
import RollResult from './RollResult';
import { DICE_TYPES, ROLL_MODES } from '../../data/diceTypes';
import { parseDiceExpression } from '../../services/dice';
import { useDice } from '../../context/DiceContext';
import Modal from '../Modal';

export default function DiceTray({ open, onToggle }) {
  const { log, lastRoll, mode, setMode, rollDice, rollExpression, clear } = useDice();
  const [expression, setExpression] = useState('');
  const validExpression = parseDiceExpression(expression) !== null;

  const submitExpression = (event) => {
    event.preventDefault();
    if (validExpression) rollExpression(expression);
  };

  return (
    <div className="dice-widget" id="section-des">
        <button
          type="button"
          className="dice-launcher"
          aria-controls="dice-panel-dialog"
          aria-expanded={open}
          onClick={onToggle}
        >
          <DieIcon className="die-icon" />
          <span>Lancer de dés</span>
        </button>
      <Modal
        id="dice-panel-dialog"
        open={open}
        onClose={onToggle}
        presentation="popup"
        eyebrow="Outil"
        title="Lancer de dés"
        closeLabel="Fermer le lanceur de dés"
        className="app-modal-popup--dice"
      >
        <section className="dice-panel">
          <div id="dice-panel-content">
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
              <details className="dice-log">
                <summary>
                  Historique des jets <span>{log.length - 1}</span>
                </summary>
                <div className="dice-log-list">
                  {log.slice(1).map((roll) => (
                    <RollResult key={roll.id} roll={roll} compact />
                  ))}
                  <button type="button" className="add-row" onClick={clear}>
                    Effacer l’historique
                  </button>
                </div>
              </details>
            )}
          </div>
        </section>
      </Modal>
    </div>
  );
}
