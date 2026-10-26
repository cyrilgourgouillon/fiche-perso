import { useEffect, useRef } from 'react';
import { THEMES } from '../../data/themes.js';
import { useSheet } from '../../context/SheetContext.js';
import {
  DEFAULT_TILE_LAYOUT,
  hiddenTiles,
  normalizeTileLayout,
  TILE_BY_ID,
} from '../../data/tileLayout.js';

const GROUP_LABELS = {
  top: 'Au-dessus des colonnes',
  left: 'Colonne gauche',
  right: 'Colonne droite',
  bottom: 'Sous les colonnes',
};

function cloneDefaultLayout() {
  return Object.fromEntries(Object.entries(DEFAULT_TILE_LAYOUT).map(([group, ids]) => [group, [...ids]]));
}

export default function SettingsModal({ open, onClose, theme, onThemeChange }) {
  const dialogRef = useRef(null);
  const { data, update, apply } = useSheet();
  const layout = normalizeTileLayout(data.tile_layout, data.tile_order, data.tile_sides);
  const hidden = hiddenTiles(layout);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const saveLayout = (nextLayout) => update('tile_layout', nextLayout);
  const move = (group, id, offset) => {
    if (id === 'header') return;
    const index = layout[group].indexOf(id);
    const destination = index + offset;
    if (index < 0 || destination < 0 || destination >= layout[group].length) return;
    if (group === 'top' && destination === 0 && layout.top[0] === 'header') return;
    const nextGroup = [...layout[group]];
    nextGroup.splice(index, 1);
    nextGroup.splice(destination, 0, id);
    saveLayout({ ...layout, [group]: nextGroup });
  };
  const moveWide = (id, destination) => {
    if (id === 'header') return;
    saveLayout({
      ...layout,
      top: layout.top.filter((tileId) => tileId !== id),
      bottom: layout.bottom.filter((tileId) => tileId !== id),
      [destination]: [...layout[destination], id],
    });
  };
  const moveColumn = (id, destination) => {
    const source = layout.left.includes(id) ? 'left' : 'right';
    const index = layout[source].indexOf(id);
    if (index < 0 || source === destination) return;
    const nextLayout = {
      ...layout,
      [source]: layout[source].filter((tileId) => tileId !== id),
      [destination]: [...layout[destination]],
    };
    nextLayout[destination].splice(Math.min(index, nextLayout[destination].length), 0, id);
    saveLayout(nextLayout);
  };
  const remove = (group, id) => {
    if (id === 'header') return;
    saveLayout({ ...layout, [group]: layout[group].filter((tileId) => tileId !== id) });
  };
  const add = (id, group) => {
    if (id === 'header') return;
    saveLayout({ ...layout, [group]: [...layout[group], id] });
  };
  const resetConfiguration = () => apply((current) => ({
    ...current,
    tile_layout: cloneDefaultLayout(),
  }));

  return (
    <dialog
      ref={dialogRef}
      className="settings-dialog"
      aria-labelledby="settings-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="settings-dialog-content">
        <header className="settings-heading">
          <div>
            <p className="settings-eyebrow">Chroniques</p>
            <h2 id="settings-title">Param&egrave;tres de la fiche</h2>
          </div>
          <button type="button" className="settings-close" aria-label="Fermer les param&egrave;tres" onClick={onClose}>&times;</button>
        </header>

        <section className="settings-section" aria-labelledby="settings-theme-title">
          <h3 id="settings-theme-title">Th&egrave;me</h3>
          <label className="settings-theme-picker">
            <span>Apparence de la fiche</span>
            <select value={theme} onChange={(event) => onThemeChange(event.target.value)}>
              {THEMES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </section>

        <section className="settings-section" aria-labelledby="settings-order-title">
          <div className="settings-section-heading">
            <div>
              <h3 id="settings-order-title">Disposition des blocs</h3>
              <p>Placez les blocs pleine largeur au-dessus ou sous les colonnes. Ajoutez les autres &agrave; gauche ou &agrave; droite, puis ordonnez-les.</p>
            </div>
            <button type="button" className="sheet-button settings-reset" onClick={resetConfiguration}>R&eacute;initialiser la configuration</button>
          </div>

          <div className="settings-layout-zones">
            {['top', 'left', 'right', 'bottom'].map((group) => (
              <section className={`settings-layout-zone settings-layout-zone-${group}`} key={group} aria-labelledby={`settings-zone-${group}`}>
                <h4 id={`settings-zone-${group}`}>{GROUP_LABELS[group]}</h4>
                <p className="settings-zone-hint">{group === 'top' || group === 'bottom'
                  ? 'Blocs pleine largeur'
                  : 'Blocs sur une colonne'}</p>
                <ol className="settings-tile-list" aria-label={GROUP_LABELS[group]}>
                  {layout[group].map((id, index) => (
                    <li className={`settings-layout-block${id === 'header' ? ' settings-layout-block-fixed' : ''}`} key={id}>
                      <span className="settings-tile-name"><strong>{String(index + 1).padStart(2, '0')}</strong>{TILE_BY_ID[id].label}</span>
                      {id === 'header' ? (
                        <span className="settings-fixed-label">Toujours en haut</span>
                      ) : (
                        <span className="settings-tile-actions">
                          <button type="button" aria-label={`Monter ${TILE_BY_ID[id].label} dans ${GROUP_LABELS[group]}`} disabled={index === 0 || (group === 'top' && index === 1 && layout.top[0] === 'header')} onClick={() => move(group, id, -1)}>&uarr;</button>
                          <button type="button" aria-label={`Descendre ${TILE_BY_ID[id].label} dans ${GROUP_LABELS[group]}`} disabled={index === layout[group].length - 1} onClick={() => move(group, id, 1)}>&darr;</button>
                          {group === 'top' && <button type="button" className="settings-placement-button" aria-label={`Placer ${TILE_BY_ID[id].label} sous les colonnes`} title="Placer après les colonnes" onClick={() => moveWide(id, 'bottom')}>Après</button>}
                          {group === 'bottom' && <button type="button" className="settings-placement-button" aria-label={`Placer ${TILE_BY_ID[id].label} au-dessus des colonnes`} title="Placer avant les colonnes" onClick={() => moveWide(id, 'top')}>Avant</button>}
                          {group === 'left' && <button type="button" className="settings-column-button" aria-label={`Déplacer ${TILE_BY_ID[id].label} vers la colonne droite`} title="Déplacer vers la colonne droite" onClick={() => moveColumn(id, 'right')}>&rarr;</button>}
                          {group === 'right' && <button type="button" className="settings-column-button" aria-label={`Déplacer ${TILE_BY_ID[id].label} vers la colonne gauche`} title="Déplacer vers la colonne gauche" onClick={() => moveColumn(id, 'left')}>&larr;</button>}
                          <button type="button" className="settings-remove-tile" aria-label={`Masquer ${TILE_BY_ID[id].label}`} onClick={() => remove(group, id)}>&minus;</button>
                        </span>
                      )}
                    </li>
                  ))}
                  {!layout[group].length && <li className="settings-layout-empty">Aucun bloc affich&eacute;</li>}
                </ol>
              </section>
            ))}
          </div>

          <section className="settings-hidden-zone" aria-labelledby="settings-hidden-title">
            <div>
              <h4 id="settings-hidden-title">R&eacute;serve de blocs masqu&eacute;s</h4>
              <p>Les blocs ici ne figurent pas sur la fiche ni dans la navigation.</p>
            </div>
            {hidden.length ? (
              <ul className="settings-hidden-list">
                {hidden.map(({ id, label, width }) => (
                  <li className="settings-hidden-block" key={id}>
                    <span className="settings-tile-name"><span>{label}<small>{width === 'wide' ? 'Pleine largeur' : 'Une colonne'}</small></span></span>
                    {width === 'wide' ? (
                      <span className="settings-hidden-actions">
                        <button type="button" className="settings-add-tile" aria-label={`Ajouter ${label} au-dessus des colonnes`} onClick={() => add(id, 'top')}>Au-dessus</button>
                        <button type="button" className="settings-add-tile" aria-label={`Ajouter ${label} sous les colonnes`} onClick={() => add(id, 'bottom')}>En dessous</button>
                      </span>
                    ) : (
                      <span className="settings-hidden-actions">
                        <button type="button" className="settings-add-tile" aria-label={`Ajouter ${label} à gauche`} onClick={() => add(id, 'left')}>Gauche</button>
                        <button type="button" className="settings-add-tile" aria-label={`Ajouter ${label} à droite`} onClick={() => add(id, 'right')}>Droite</button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="settings-layout-empty">Tous les blocs sont affich&eacute;s.</p>
            )}
          </section>
        </section>

        <footer className="settings-footer">
          <span>Vos changements sont enregistr&eacute;s automatiquement.</span>
          <button type="button" className="settings-done" onClick={onClose}>Termin&eacute;</button>
        </footer>
      </div>
    </dialog>
  );
}

