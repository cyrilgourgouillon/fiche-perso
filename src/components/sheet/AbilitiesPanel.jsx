import AbilityCard from './AbilityCard.jsx';
import SkillList from './SkillList.jsx';
import Checkbox from '../fields/Checkbox.jsx';
import TextField from '../fields/TextField.jsx';
import { ABILITIES } from '../../data/abilities.js';
import { sectionAnchor } from '../../data/sections.js';
import { useSheet } from '../../context/SheetContext.js';
import { derivedProficiencyBonus, isFlagged } from '../../services/characterMath.js';

export default function AbilitiesPanel() {
  const { data } = useSheet();
  return (
    <section className="panel" id={sectionAnchor('caracteristiques')}>
      <h2 className="section-title">Caractéristiques &amp; Compétences</h2>
      <div className="abilities-layout">
        <aside className="ability-controls">
          <div className="inspiration-control">
            <div className="control-label">💡 Inspiration</div>
            <label className={`inspiration-box ${isFlagged(data, 'inspiration') ? 'active' : ''}`}>
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
    </section>
  );
}
