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
  // narrow screens show one swipeable row of links; this opens the full list
  const [expanded, setExpanded] = useState(false);
  const expandLabel = expanded ? 'Réduire la liste des sections' : 'Voir toutes les sections';

  return (
    <nav className={expanded ? 'sheet-nav expanded' : 'sheet-nav'} aria-label="Sections de la fiche">
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
        <button
          type="button"
          className="fold-button nav-more"
          aria-expanded={expanded}
          aria-label={expandLabel}
          title={expandLabel}
          onClick={() => setExpanded(!expanded)}
        >
          <span className="fold-caret" aria-hidden="true" />
        </button>
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
    </nav>
  );
}
