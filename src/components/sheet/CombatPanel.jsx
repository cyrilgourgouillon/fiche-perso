import Checkbox from '../fields/Checkbox.jsx';
import TextField from '../fields/TextField.jsx';
import { sectionAnchor } from '../../data/sections.js';
import { useSheet } from '../../context/SheetContext.js';
import {
  derivedInitiative,
  derivedPassivePerception,
  formatModifier,
} from '../../services/characterMath.js';

/**
 * `hint` fields show what the sheet computes while they are empty; typing a
 * value overrides it. Armour class stays fully manual — armour, shields and
 * spells like Mage Armor make it impossible to derive.
 */
const COMBAT_FIELDS = [
  { label: '🛡️ Classe d’Armure', name: 'classe_armure', className: 'ef big' },
  {
    label: '⚡ Initiative',
    name: 'initiative',
    className: 'ef big',
    hint: (data) => formatModifier(derivedInitiative(data)),
  },
  { label: '🏃 Vitesse', name: 'vitesse', className: 'ef big' },
  { label: '📏 Taille', name: 'taille', className: 'ef medium' },
  {
    label: '👁️ Perception Passive',
    name: 'perception_passive',
    className: 'ef big',
    hint: (data) => String(derivedPassivePerception(data)),
  },
];

export default function CombatPanel() {
  const { data } = useSheet();

  return (
    <section className="panel" id={sectionAnchor('combat')}>
      <h2 className="section-title">Combat</h2>
      <div className="combat-row">
        {COMBAT_FIELDS.map(({ label, name, className, hint }) => (
          <div className="combat-block" key={name}>
            <div className="lbl">{label}</div>
            <TextField
              name={name}
              className={hint ? `${className} derived` : className}
              placeholder={hint?.(data)}
            />
          </div>
        ))}
        <div className="combat-block">
          <div className="lbl">🛡️ Bouclier</div>
          <div className="shield-toggle">
            <Checkbox name="bouclier" />
          </div>
        </div>
      </div>
    </section>
  );
}
