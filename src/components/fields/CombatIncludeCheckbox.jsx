import { useSheet } from '../../context/SheetContext.js';

/** Existing filled entries are included until the player explicitly changes the flag. */
export default function CombatIncludeCheckbox({ name, defaultChecked = false, defaultField, ...props }) {
  const { data, update } = useSheet();
  const initialValue = defaultField ? data[defaultField]?.trim() : defaultChecked;
  const checked = data[name] === undefined ? Boolean(initialValue) : data[name] === 'true';

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => update(name, event.target.checked ? 'true' : 'false')}
      {...props}
    />
  );
}
