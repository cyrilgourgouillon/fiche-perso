import SkillItem from './SkillItem';
import { SKILLS } from '../../data/abilities';

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
