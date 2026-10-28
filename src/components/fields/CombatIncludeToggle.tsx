import CombatIncludeCheckbox from './CombatIncludeCheckbox';

export default function CombatIncludeToggle({ name, defaultField, ariaLabel }) {
  return (
    <label className="combat-include-toggle">
      <CombatIncludeCheckbox name={name} defaultField={defaultField} aria-label={ariaLabel} />
      <span>Résumé combat</span>
    </label>
  );
}
