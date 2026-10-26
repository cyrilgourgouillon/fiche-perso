import { useState } from 'react';
import Panel from './Panel.jsx';
import TextField from '../fields/TextField.jsx';
import { useSheet } from '../../context/SheetContext.js';

const COIN_TYPES = ['pc', 'pa', 'pe', 'po', 'pp'];

export default function MoneyPanel() {
  const { apply } = useSheet();
  const [amount, setAmount] = useState('1');
  const [coin, setCoin] = useState('po');

  const adjust = (direction) => {
    const quantity = Number.parseInt(amount, 10);
    if (!Number.isSafeInteger(quantity) || quantity < 1) return;

    apply((data) => {
      const stored = Number.parseInt(data[coin], 10);
      const current = Number.isSafeInteger(stored) && stored >= 0 ? stored : 0;
      const next = direction === 'add' ? current + quantity : Math.max(0, current - quantity);
      if (!Number.isSafeInteger(next)) return data;
      return { ...data, [coin]: String(next) };
    });
  };

  return (
    <Panel as="div" id="pieces" title="Pièces">
      <div className="money-grid">
        {COIN_TYPES.map((coin) => (
          <div className="coin-block" key={coin}>
            <div className="coin-label">{coin.toUpperCase()}</div>
            <TextField name={coin} />
          </div>
        ))}
      </div>
      <div className="money-quick-adjust" role="group" aria-label="Ajustement rapide des pièces">
        <div className="money-adjust-field">
          <label htmlFor="money-adjust-amount">Quantité</label>
          <input
            id="money-adjust-amount"
            className="ef"
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="money-adjust-field">
          <label htmlFor="money-adjust-coin">Pièce</label>
          <select id="money-adjust-coin" value={coin} onChange={(event) => setCoin(event.target.value)}>
            {COIN_TYPES.map((type) => <option value={type} key={type}>{type.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="money-adjust-actions">
          <button type="button" className="sheet-button money-adjust-remove" onClick={() => adjust('remove')}>
            <span aria-hidden="true">−</span> Retirer
          </button>
          <button type="button" className="sheet-button money-adjust-add" onClick={() => adjust('add')}>
            <span aria-hidden="true">+</span> Ajouter
          </button>
        </div>
      </div>
    </Panel>
  );
}
