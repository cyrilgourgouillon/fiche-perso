import { foldField, sectionAnchor } from '../../data/sections.js';
import { useSheetFlag } from '../../context/SheetContext.js';

/**
 * Panel whose body can be folded away by clicking its title.
 *
 * The fold state is stored as a regular sheet field, so it is saved to local
 * storage and travels with the JSON export. A section missing from the data —
 * an older save, or a section added later — starts expanded.
 */
export default function Panel({ id, title, children, as: Tag = 'section', className = 'panel' }) {
  const [collapsed, setCollapsed] = useSheetFlag(foldField(id));
  const classes = [className, collapsed && 'collapsed'].filter(Boolean).join(' ');

  return (
    <Tag className={classes || undefined} id={sectionAnchor(id)}>
      {/*
        A heading wrapping the button: the title is still one click, and the sheet
        gets an outline to navigate by. The children stay direct descendants — the
        appearance and equipment panels are flex columns whose textarea stretches
        to fill them, which a wrapper element would break.
      */}
      <h2 className="section-heading">
        <button
          type="button"
          className="section-title"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed(!collapsed)}
        >
          {title}
          <span className="fold-caret" aria-hidden="true" />
        </button>
      </h2>
      {!collapsed && children}
    </Tag>
  );
}
