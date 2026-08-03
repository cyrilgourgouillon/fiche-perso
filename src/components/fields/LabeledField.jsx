import TextField from './TextField.jsx';

/** A caption above a text field — the recurring layout across every panel. */
export default function LabeledField({ label, name, centered = false, ...props }) {
  return (
    <div>
      <div className={centered ? 'meta-label center' : 'meta-label'}>{label}</div>
      <TextField name={name} {...props} />
    </div>
  );
}
