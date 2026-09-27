import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSheetField } from '../../context/SheetContext.js';

export default function TextAreaField({ name, className = 'ef', ...props }) {
  const [value, setValue] = useSheetField(name);
  const [preview, setPreview] = useState(false);
  const fieldVariants = className.split(/\s+/).filter((classNamePart) => classNamePart && classNamePart !== 'ef').join(' ');

  return (
    <div className={`markdown-field ${fieldVariants}`}>
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
      <button
        type="button"
        className="markdown-toggle"
        aria-label={preview ? 'Modifier le texte' : 'Afficher l’aperçu Markdown'}
        aria-pressed={preview}
        title={preview ? 'Modifier' : 'Aperçu Markdown'}
        onClick={() => setPreview((current) => !current)}
      >
        {preview ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
