import { useState } from 'react';
import { useSheet } from '../../context/SheetContext.js';

export default function HpQuickAdjustments() {
  const { apply } = useSheet();
  const [amount, setAmount] = useState('1');
  const adjust = (action) => {
    const points = Math.max(0, Number.parseInt(amount, 10) || 0);
    if (!points) return;
    apply((data) => {
      const currentHp = Math.max(0, Number.parseInt(data.points_vie_actuel, 10) || 0);
      const maxHp = Number.parseInt(data.points_vie_max, 10);
      const tempHp = Math.max(0, Number.parseInt(data.points_vie_temp, 10) || 0);
      if (action === 'damage') {
        const tempLoss = Math.min(tempHp, points);
        const hpLoss = points - tempLoss;
        return {
          ...data,
          points_vie_temp: String(tempHp - tempLoss),
          points_vie_actuel: String(Math.max(0, currentHp - hpLoss)),
        };
      }
      if (action === 'heal') {
        const healed = currentHp + points;
        return { ...data, points_vie_actuel: String(Number.isFinite(maxHp) && maxHp >= 0 ? Math.min(maxHp, healed) : healed) };
      }
      return { ...data, points_vie_temp: String(Math.max(tempHp, points)) };
    });
  };

  return (
    <div className="hp-quick-adjust" role="group" aria-label="Ajustement rapide des points de vie">
      <div className="hp-adjust-amount">
        <label htmlFor="hp-adjust-amount">Quantité</label>
        <input id="hp-adjust-amount" className="ef" type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} />
      </div>
      <div className="hp-adjust-actions">
        <button type="button" className="sheet-button hp-adjust-damage" onClick={() => adjust('damage')}><span aria-hidden="true">−</span> Dégâts</button>
        <button type="button" className="sheet-button hp-adjust-heal" onClick={() => adjust('heal')}><span aria-hidden="true">+</span> Soins</button>
        <button type="button" className="sheet-button hp-adjust-temp" onClick={() => adjust('temp')}><span aria-hidden="true">✦</span> PV temp.</button>
      </div>
    </div>
  );
}
