import { useEffect, useMemo, useState } from 'react';
import { SECTIONS, foldField, sectionAnchor } from '../../data/sections.js';
import { normalizeTileLayout } from '../../data/tileLayout.js';
import { isFlagged } from '../../services/characterMath.js';
import { useSheet } from '../../context/SheetContext.js';

const NAV_ICON_PATHS = {
  combat: ['M5 19 19 5', 'm7 5 2 2', 'm5 7 2 2', 'm17 15 2 2', 'm15 17 2 2', 'M5 5l4 4'],
  caracteristiques: ['M12 3 20 7v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z', 'm8 12 2.5 2.5L16 9'],
  armes: ['M5 19 19 5', 'm14 5 5 5', 'm5 14 5 5', 'M4 20l4-1'],
  capacites: ['m12 3 2.4 5.2L20 10l-5.6 1.8L12 17l-2.4-5.2L4 10l5.6-1.8L12 3Z', 'M19 15v4', 'M17 17h4'],
  emplacements_sorts: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  sorts: ['M5 4h5a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H5z', 'M19 4h-3a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h3z'],
  pieces: ['M12 3v18', 'M17 7.5c0-1.4-1.8-2.5-4.5-2.5S8 6.1 8 7.5s1.8 2.5 4.5 2.5S17 11.1 17 12.5 15.2 15 12.5 15 8 13.9 8 12.5', 'M5 19h14'],
  equipement: ['M5 8h14l1 12H4L5 8Z', 'M9 8V6a3 3 0 0 1 6 0v2', 'M9 12v1', 'M15 12v1'],
  maitrises: ['M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z', 'm9 12 2 2 4-4'],
  quetes: ['M5 21V4', 'M5 5c5-3 9 3 14 0v10c-5 3-9-3-14 0'],
  notes: ['M6 4h12v16H6z', 'M9 8h6', 'M9 12h6', 'M9 16h4'],
};

function SectionIcon({ id }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {(NAV_ICON_PATHS[id] ?? NAV_ICON_PATHS.notes).map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}

/** Sets every foldable section at once - the fold flags are ordinary sheet fields. */
const withAllSections = (data, collapsed, foldableSections) => ({
  ...data,
  ...Object.fromEntries(foldableSections.map(({ id }) => [foldField(id), String(collapsed)])),
});

/** Quick jumps and section controls, grouped into easy-to-scan navigation cards. */
export default function SheetNav({ open, onToggle, onOpenSettings }) {
  const { data, apply } = useSheet();
  const layout = useMemo(
    () => normalizeTileLayout(data.tile_layout, data.tile_order, data.tile_sides, data.tile_widths),
    [data.tile_layout, data.tile_order, data.tile_sides, data.tile_widths],
  );
  const sections = useMemo(() => {
    const orderedIds = [
      ...layout.top,
      ...layout.left,
      ...layout.right,
      ...layout.bottom,
    ];
    return orderedIds
      .map((id) => SECTIONS.find((section) => section.id === id))
      .filter(Boolean);
  }, [layout]);
  const foldableSections = useMemo(() => sections.filter(({ foldable }) => foldable !== false), [sections]);
  const collapsedCount = foldableSections.filter(({ id }) =>
    isFlagged(data, foldField(id)),
  ).length;
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    if (!sections.some(({ id }) => id === activeSection)) setActiveSection(sections[0]?.id ?? '');
  }, [sections, activeSection]);

  useEffect(() => {
    if (!sections.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) {
        const section = sections.find(({ id }) => sectionAnchor(id) === visible[0].target.id);
        if (section) setActiveSection(section.id);
      }
    }, { rootMargin: '-18% 0px -70% 0px', threshold: 0 });

    sections.forEach(({ id }) => {
      const element = document.getElementById(sectionAnchor(id));
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [sections]);
  return (
    <div className="sheet-nav-widget">
        <button
          type="button"
          className="sheet-tools-launcher sheet-nav-launcher"
          aria-expanded={open}
          onClick={onToggle}
        >
          <svg className="nav-launcher-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3.5 3.5h13v3h-13zM3.5 8.5h13v3h-13zM3.5 13.5h13v3h-13z" />
          </svg>
          <span>Sections</span>
        </button>
      {open && (
        <nav className="panel sheet-nav" aria-labelledby="sheet-navigation-toggle">
          <h2 className="section-heading">
            <button
              type="button"
              id="sheet-navigation-toggle"
              className="section-title nav-panel-toggle"
              aria-expanded="true"
              aria-controls="sheet-navigation-content"
              title="Masquer la navigation"
              onClick={onToggle}
            >
              Navigation
              <span className="fold-caret" aria-hidden="true" />
            </button>
          </h2>
          <div id="sheet-navigation-content">
            <div className="nav-intro">
              <span>Acces rapide aux rubriques</span>
              <span className="nav-section-count">{sections.length} sections</span>
            </div>
            <ul className="nav-links">
              {sections.map(({ id, label }, index) => (
                <li key={id}>
                  <a
                    className={`nav-link${activeSection === id ? ' active' : ''}`}
                    href={`#${sectionAnchor(id)}`}
                    aria-current={activeSection === id ? 'location' : undefined}
                    onClick={() => setActiveSection(id)}
                  >
                    <span className="nav-link-icon"><SectionIcon id={id} /></span>
                    <span className="nav-link-copy">
                      <span className="nav-link-index">{String(index + 1).padStart(2, '0')}</span>
                      <span className="nav-link-label">{label}</span>
                    </span>
                    <svg className="nav-link-arrow" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M3 8h9M8 4l4 4-4 4" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
            <div className="nav-actions">
              <span className="nav-actions-title">Organisation des sections</span>
              <div className="nav-folds">
                <button
                  type="button"
                  className="sheet-button nav-fold"
                  disabled={collapsedCount === foldableSections.length}
                  onClick={() => apply((current) => withAllSections(current, true, foldableSections))}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 5h10M3 8h10M3 11h10" /></svg>
                  Tout replier
                </button>
                <button
                  type="button"
                  className="sheet-button nav-fold"
                  disabled={collapsedCount === 0}
                  onClick={() => apply((current) => withAllSections(current, false, foldableSections))}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 5h10M3 8h10M3 11h10M8 3v10" /></svg>
                  Tout d&eacute;plier
                </button>
              </div>
              <button
                type="button"
                className="sheet-button nav-configure"
                onClick={onOpenSettings}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12M2 8h12M2 13h12M5 1v4M10 6v4M7 11v4" /></svg>
                Configurer les colonnes
              </button>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
