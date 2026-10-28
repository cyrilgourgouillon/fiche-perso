import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { useSheet, useSheetField } from '../../context/SheetContext';

export default function TextAreaField({ name, className = 'ef', ...props }) {
  const { data } = useSheet();
  const [value, setValue] = useSheetField(name);
  const [previewOverride, setPreviewOverride] = useState(null);
  const preview = previewOverride ?? (data.textarea_mode === 'visual');
  const fieldVariants = className.split(/\s+/).filter((classNamePart) => classNamePart && classNamePart !== 'ef').join(' ');

  return (
    <div className={`markdown-field ${fieldVariants}`} data-mode={preview ? 'visual' : 'edit'}>
      <textarea
        className={className}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        {...props}
        aria-hidden={preview ? 'true' : undefined}
        tabIndex={preview ? -1 : props.tabIndex}
      />
      <div className={`ef ${fieldVariants} markdown-preview`} aria-hidden={!preview}>
        {value ? <ReactMarkdown remarkPlugins={[remarkBreaks]}>{value}</ReactMarkdown> : <span className="markdown-placeholder">{props.placeholder}</span>}
      </div>
      <button
        type="button"
        className="markdown-toggle"
        aria-label={preview ? 'Modifier le texte' : 'Afficher l’aperçu Markdown'}
        aria-pressed={preview}
        title={preview ? 'Modifier' : 'Aperçu Markdown'}
        onClick={() => setPreviewOverride((current) => !(current ?? (data.textarea_mode === 'visual')))}
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
