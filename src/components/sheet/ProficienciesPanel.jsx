import Checkbox from '../fields/Checkbox.jsx';
import Panel from './Panel.jsx';
import TextAreaField from '../fields/TextAreaField.jsx';

const ARMOR_PROFICIENCIES = [
  { name: 'armures_legeres', label: 'Légères' },
  { name: 'armures_intermediaires', label: 'Intermédiaires' },
  { name: 'armures_lourdes', label: 'Lourdes' },
  { name: 'armures_boucliers', label: 'Boucliers' },
];

export default function ProficienciesPanel() {
  return (
    <Panel id="maitrises" title="Entraînements & Maîtrises">
      <div className="three-col">
        <div>
          <div className="meta-label">🛡️ Armures</div>
          {ARMOR_PROFICIENCIES.map(({ name, label }) => (
            <label className="proficiency-item" key={name}>
              <Checkbox name={name} /> {label}
            </label>
          ))}
        </div>
        <div>
          <div className="meta-label">⚔️ Maîtrises d’armes</div>
          <TextAreaField name="armes_maitrises" className="ef short" />
        </div>
        <div>
          <div className="meta-label">🔧 Outils</div>
          <TextAreaField name="outils_maitrises" className="ef short" />
        </div>
      </div>
    </Panel>
  );
}
