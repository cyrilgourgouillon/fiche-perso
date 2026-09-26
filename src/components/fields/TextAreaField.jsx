import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSheetField } from '../../context/SheetContext.js';

export default function TextAreaField({ name, className = 'ef', ...props }) {
  const [value, setValue] = useSheetField(name);
  const [preview, setPreview] = useState(false);
  const fieldVariants = className.split(/\s+/).filter((classNamePart) => classNamePart && classNamePart !== 'ef').join(' ');

  return (
    <div className={`markdown-field ${fieldVariants}`}>
      <div className="markdown-field-toolbar">
        <button
          type="button"
          className="markdown-toggle"
          aria-pressed={preview}
          onClick={() => setPreview((current) => !current)}
        >
          {preview ? 'Modifier' : 'Aperçu'}
        </button>
      </div>
      {preview ? (
        <div className={`ef ${fieldVariants} markdown-preview`}>
          {value ? <ReactMarkdown>{value}</ReactMarkdown> : <span className="markdown-placeholder">{props.placeholder}</span>}
        </div>
      ) : (
        <textarea
          className={className}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          {...props}
        />
      )}
    </div>
  );
}
