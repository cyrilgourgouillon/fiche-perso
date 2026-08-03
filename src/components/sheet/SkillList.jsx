import SkillItem from './SkillItem.jsx';
import { SKILLS } from '../../data/abilities.js';

export default function SkillList() {
  return (
    <div className="skills-section">
      <h3 className="subsection-title">Compétences</h3>
      <div className="skills-cols">
        {SKILLS.map((skill) => (
          <SkillItem key={skill.key} skill={skill} />
        ))}
      </div>
    </div>
  );
}
