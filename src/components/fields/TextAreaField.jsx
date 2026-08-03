import { useSheetField } from '../../context/SheetContext.js';

export default function TextAreaField({ name, className = 'ef', ...props }) {
  const [value, setValue] = useSheetField(name);
  return (
    <textarea
      className={className}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      {...props}
    />
  );
}
