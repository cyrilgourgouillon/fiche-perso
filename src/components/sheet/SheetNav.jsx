import { useState } from 'react';
import { FOLDABLE_SECTIONS, SECTIONS, foldField, sectionAnchor } from '../../data/sections.js';
import { isFlagged } from '../../services/characterMath.js';
import { useSheet } from '../../context/SheetContext.js';

/** Sets every foldable section at once — the fold flags are ordinary sheet fields. */
const withAllSections = (data, collapsed) => ({
  ...data,
  ...Object.fromEntries(FOLDABLE_SECTIONS.map(({ id }) => [foldField(id), String(collapsed)])),
});

/**
 * Jump links and a fold-everything pair.
 *
 * The sheet runs to eight screens on a phone, which is a lot of thumb between
 * "Combat" and "Notes".
 */
export default function SheetNav() {
  const { data, apply } = useSheet();
  const collapsedCount = FOLDABLE_SECTIONS.filter(({ id }) =>
    isFlagged(data, foldField(id)),
  ).length;
  const [open, setOpen] = useState(false);

  return (
    <div className="sheet-nav-widget">
      {!open ? (
        <button
          type="button"
          className="sheet-tools-launcher sheet-nav-launcher"
          aria-expanded="false"
          onClick={() => setOpen(true)}
        >
          <svg className="nav-launcher-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 4.5h14M3 10h14M3 15.5h14" />
            <circle cx="6" cy="4.5" r="1.4" />
            <circle cx="13" cy="10" r="1.4" />
            <circle cx="8" cy="15.5" r="1.4" />
          </svg>
          <span>Sections</span>
        </button>
      ) : (
        <nav
          className="panel sheet-nav"
          aria-labelledby="sheet-navigation-toggle"
        >
          <h2 className="section-heading">
            <button
              type="button"
              id="sheet-navigation-toggle"
              className="section-title nav-panel-toggle"
              aria-expanded="true"
              aria-controls="sheet-navigation-content"
              title="Masquer la navigation"
              onClick={() => setOpen(false)}
            >
              Navigation
              <span className="fold-caret" aria-hidden="true" />
            </button>
          </h2>
          <div id="sheet-navigation-content">
            <div className="nav-bar">
              <ul className="nav-links">
                {SECTIONS.map(({ id, label }) => (
                  <li key={id}>
                    <a className="nav-link" href={`#${sectionAnchor(id)}`}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="nav-folds">
              <button
                type="button"
                className="sheet-button nav-fold"
                disabled={collapsedCount === FOLDABLE_SECTIONS.length}
                onClick={() => apply((current) => withAllSections(current, true))}
              >
                Tout replier
              </button>
              <button
                type="button"
                className="sheet-button nav-fold"
                disabled={collapsedCount === 0}
                onClick={() => apply((current) => withAllSections(current, false))}
              >
                Tout déplier
              </button>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
