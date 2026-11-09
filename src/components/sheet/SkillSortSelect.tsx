import { SKILL_SORT_OPTIONS, type SkillSortOrder } from '../../data/abilities';
import { useSheet } from '../../context/SheetContext';

const isSkillSortOrder = (value: string): value is SkillSortOrder => (
  SKILL_SORT_OPTIONS.some((option) => option.value === value)
);

export default function SkillSortSelect() {
  const { data, update } = useSheet();
  const order = data.tri_competences === 'ability' ? 'ability' : 'name';

  const changeOrder = (value: string) => {
    if (isSkillSortOrder(value)) update('tri_competences', value);
  };

  return (
    <label className="skill-sort-control">
      <span>Ordre</span>
      <select
        className="skill-sort-select"
        aria-label="Ordre des compétences"
        value={order}
        onChange={(event) => changeOrder(event.target.value)}
      >
        {SKILL_SORT_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </label>
  );
}
