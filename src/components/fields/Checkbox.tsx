import { useSheetFlag } from '../../context/SheetContext';

export default function Checkbox({ name, ...props }) {
  const [checked, setChecked] = useSheetFlag(name);
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => setChecked(event.target.checked)}
      {...props}
    />
  );
}
