import { useSheetField } from '../../context/SheetContext.js';

/** `fallback` is the option to show while the field is untouched. */
export default function SelectField({ name, options, className = 'ef', fallback = '', ...props }) {
  const [value, setValue] = useSheetField(name);
  return (
    <select
      className={className}
      value={value || fallback}
      onChange={(event) => setValue(event.target.value)}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
