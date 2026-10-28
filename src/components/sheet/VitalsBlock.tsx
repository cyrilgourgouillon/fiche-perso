import DeathSaves from './DeathSaves';
import LabeledField from '../fields/LabeledField';
import RestControls from './RestControls';
import TextField from '../fields/TextField';
import { MAX_CHARACTER_LEVEL, MIN_CHARACTER_LEVEL } from '../../data/spellSlotTable';
import HpQuickAdjustments from './HpQuickAdjustments';

const HIT_POINT_FIELDS = [
  { label: '📈 Max', name: 'points_vie_max' },
  { label: '⚡ Actuel', name: 'points_vie_actuel' },
  { label: '❄️ Temp', name: 'points_vie_temp' },
];

const HIT_DICE_FIELDS = [
  { label: '🎲 Dés de vie Max', name: 'des_vie_max' },
  { label: '🎲 Dés de vie', name: 'des_vie' },
];

export default function VitalsBlock() {
  return (
    <div>
      <div className="vitals-top-grid">
        <div>
          <div className="meta-label">📊 Niveau</div>
          <TextField
            name="niveau"
            className="ef big"
            type="number"
            min={MIN_CHARACTER_LEVEL}
            max={MAX_CHARACTER_LEVEL}
          />
        </div>
        <LabeledField label="⭐ PX" name="px" className="ef big" />
      </div>

      <h2 className="section-title">❤️ Points de Vie</h2>
      <div className="hp-row">
        {HIT_POINT_FIELDS.map((field) => (
          <LabeledField key={field.name} {...field} className="ef big" centered />
        ))}
      </div>

      <HpQuickAdjustments />

      <DeathSaves />

      <div className="hit-dice-grid">
        {HIT_DICE_FIELDS.map((field) => (
          <LabeledField key={field.name} {...field} className="ef big" />
        ))}
      </div>

      <RestControls />
    </div>
  );
}
