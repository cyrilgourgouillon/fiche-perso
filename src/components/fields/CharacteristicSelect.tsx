import { useSheetField } from '../../context/SheetContext';
import { ABILITIES } from '../../data/abilities';

const CHARACTERISTIC_OPTIONS = ABILITIES.map(({ key, label }) => ({ value: key, label }));

export default function CharacteristicSelect({
  name, includeNone = false, fallback = '', className = 'ef', ...props
}) {
  const [value, setValue] = useSheetField(name);
  const options = includeNone
    ? [{ value: '', label: 'Aucune' }, ...CHARACTERISTIC_OPTIONS]
    : CHARACTERISTIC_OPTIONS;
  const selectedValue = value || fallback;

  return (
    <select
      {...props}
      name={name}
      className={`${className} characteristic-select`}
      value={selectedValue}
      data-ability={CHARACTERISTIC_OPTIONS.some(({ value: ability }) => ability === selectedValue)
        ? selectedValue
        : undefined}
      onChange={(event) => setValue(event.target.value)}
    >
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          data-ability={option.value || undefined}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}
