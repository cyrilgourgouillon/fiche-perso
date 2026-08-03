import { useSheetField } from '../../context/SheetContext.js';

export default function TextField({ name, className = 'ef', ...props }) {
  const [value, setValue] = useSheetField(name);
  return (
    <input
      className={className}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      {...props}
    />
  );
}
