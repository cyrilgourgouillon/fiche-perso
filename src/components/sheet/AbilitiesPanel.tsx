import AbilityCard from './AbilityCard';
import SkillList from './SkillList';
import StaticPanel from '../common/StaticPanel';
import Checkbox from '../fields/Checkbox';
import TextField from '../fields/TextField';
import { ABILITIES } from '../../data/abilities';
import { sectionAnchor } from '../../data/sections';
import { useSheet } from '../../context/SheetContext';
import { derivedProficiencyBonus, isFlagged } from '../../services/characterMath';

export default function AbilitiesPanel() {
  const { data } = useSheet();
  return (
    <StaticPanel id={sectionAnchor('caracteristiques')} title="Caractéristiques & Compétences">
      <div className="abilities-layout">
        <aside className="ability-controls">
          <div className="inspiration-control">
            <div className="control-label">💡 Inspiration</div>
            <label
              aria-label="Inspiration"
              className={`inspiration-box ${isFlagged(data, 'inspiration') ? 'active' : ''}`}
            >
              <Checkbox name="inspiration" />
            </label>
          </div>
          <div className="proficiency-box">
            <TextField
              name="bonus_maitrise"
              className="val prof-val prof-input"
              placeholder={String(derivedProficiencyBonus(data))}
            />
            <div className="lbl">
              ★ Bonus de
              <br />
              maîtrise
            </div>
          </div>
        </aside>
        <div className="stats-row">
          {ABILITIES.map((ability) => (
            <AbilityCard key={ability.key} ability={ability} />
          ))}
        </div>
      </div>
      <SkillList />
    </StaticPanel>
  );
}
