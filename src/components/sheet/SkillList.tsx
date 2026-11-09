import SkillItem from './SkillItem';
import SkillSortSelect from './SkillSortSelect';
import { SKILLS, sortSkills } from '../../data/abilities';
import { useSheet } from '../../context/SheetContext';

export default function SkillList() {
  const { data } = useSheet();
  const skills = sortSkills(SKILLS, data.tri_competences === 'ability' ? 'ability' : 'name');

  return (
    <div className="skills-section">
      <h3 className="subsection-title">Compétences</h3>
      <div className="skills-cols">
        {skills.map((skill) => (
          <SkillItem key={skill.key} skill={skill} />
        ))}
      </div>
      <div className="skills-sort-footer">
        <SkillSortSelect />
      </div>
    </div>
  );
}
