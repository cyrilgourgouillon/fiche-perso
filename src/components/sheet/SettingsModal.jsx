import Modal from '../Modal.jsx';
import { THEMES } from '../../data/themes.js';
import { useSheet } from '../../context/SheetContext.js';
import {
  DEFAULT_TILE_LAYOUT,
  hiddenTiles,
  normalizeTileLayout,
  TILE_BY_ID,
} from '../../data/tileLayout.js';
import { DEFAULT_TEXTAREA_MODE } from '../../services/sheetSerializer.js';

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
  const { data, update, apply } = useSheet();
  const layout = normalizeTileLayout(data.tile_layout, data.tile_order, data.tile_sides, data.tile_widths);
  const hidden = hiddenTiles(layout);

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
  const place = (id, destination) => {
    if (id === 'header' || (id === 'caracteristiques' && destination !== 'top' && destination !== 'bottom')) return;
    const groups = ['top', 'left', 'right', 'bottom'];
    const source = groups.find((group) => layout[group].includes(id));
    if (!source || source === destination || !groups.includes(destination)) return;
    const index = layout[source].indexOf(id);
    const nextLayout = Object.fromEntries(groups.map((group) => [
      group,
      layout[group].filter((tileId) => tileId !== id),
    ]));
    nextLayout[destination].splice(Math.min(index, nextLayout[destination].length), 0, id);
    saveLayout(nextLayout);
  };
  const remove = (group, id) => {
    if (id === 'header') return;
    saveLayout({ ...layout, [group]: layout[group].filter((tileId) => tileId !== id) });
  };
  const add = (id, group) => {
    if (id === 'header' || (id === 'caracteristiques' && group !== 'top' && group !== 'bottom')) return;
    saveLayout({ ...layout, [group]: [...layout[group], id] });
  };
  const resetConfiguration = () => apply((current) => ({
    ...current,
    tile_layout: cloneDefaultLayout(),
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Paramètres de la fiche"
      eyebrow="Chroniques"
      closeLabel="Fermer les paramètres"
      className="app-modal--settings"
    >
        <section className="settings-section" aria-labelledby="settings-theme-title">
          <h3 id="settings-theme-title">Th&egrave;me</h3>
          <label className="settings-theme-picker">
            <span>Apparence de la fiche</span>
            <select value={theme} onChange={(event) => onThemeChange(event.target.value)}>
              {THEMES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </section>

        <section className="settings-section" aria-labelledby="settings-textarea-title">
          <h3 id="settings-textarea-title">Zones de texte</h3>
          <label className="settings-theme-picker">
            <span>Mode d&rsquo;affichage par d&eacute;faut</span>
            <select
              value={data.textarea_mode || DEFAULT_TEXTAREA_MODE}
              onChange={(event) => update('textarea_mode', event.target.value)}
            >
              <option value="edit">&Eacute;dition</option>
              <option value="visual">Visuel (Markdown)</option>
            </select>
          </label>
        </section>

        <section className="settings-section" aria-labelledby="settings-motion-title">
          <h3 id="settings-motion-title">Accessibilit&eacute;</h3>
          <label className="settings-motion-toggle">
            <input
              type="checkbox"
              checked={data.reduce_motion === 'true'}
              onChange={(event) => update('reduce_motion', event.target.checked ? 'true' : 'false')}
            />
            <span>R&eacute;duire les animations</span>
          </label>
          <p className="settings-motion-description">
            Raccourcit les animations et d&eacute;sactive le d&eacute;filement fluide.
          </p>
        </section>

        <section className="settings-section" aria-labelledby="settings-order-title">
          <div className="settings-section-heading">
            <div>
              <h3 id="settings-order-title">Disposition des blocs</h3>
              <p>Choisissez une largeur et un emplacement pour chaque bloc. Caract&eacute;ristiques &amp; comp&eacute;tences reste en pleine largeur pour garder les comp&eacute;tences lisibles. Utilisez les fl&egrave;ches pour changer l&rsquo;ordre.</p>
              <p className="settings-responsive-note">La disposition &agrave; deux colonnes s&rsquo;applique uniquement aux grands &eacute;crans. Sur les petits &eacute;crans, la fiche s&rsquo;affiche automatiquement sur une seule colonne.</p>
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
                      <span className="settings-tile-name">
                        <strong>{String(index + 1).padStart(2, '0')}</strong>
                        {TILE_BY_ID[id].label}
                        {id === 'caracteristiques' && <small className="settings-width-label">2 colonnes uniquement</small>}
                      </span>
                      {id === 'header' ? (
                        <span className="settings-fixed-label">Toujours en haut</span>
                      ) : (
                        <span className="settings-tile-actions">
                          <button type="button" aria-label={`Monter ${TILE_BY_ID[id].label} dans ${GROUP_LABELS[group]}`} disabled={index === 0 || (group === 'top' && index === 1 && layout.top[0] === 'header')} onClick={() => move(group, id, -1)}>&uarr;</button>
                          <button type="button" aria-label={`Descendre ${TILE_BY_ID[id].label} dans ${GROUP_LABELS[group]}`} disabled={index === layout[group].length - 1} onClick={() => move(group, id, 1)}>&darr;</button>
                          <select
                            className="settings-placement-select"
                            aria-label={`Largeur et emplacement de ${TILE_BY_ID[id].label}`}
                            title="Changer la largeur et l'emplacement"
                            value={group}
                            onChange={(event) => place(id, event.target.value)}
                          >
                            <optgroup label="Pleine largeur">
                              <option value="top">2 colonnes &middot; au-dessus</option>
                              <option value="bottom">2 colonnes &middot; en dessous</option>
                            </optgroup>
                            {id !== 'caracteristiques' && (
                              <optgroup label="Une colonne">
                                <option value="left">1 colonne &middot; gauche</option>
                                <option value="right">1 colonne &middot; droite</option>
                              </optgroup>
                            )}
                          </select>
                          <button type="button" className="settings-remove-tile" title={`Masquer ${TILE_BY_ID[id].label}`} aria-label={`Masquer ${TILE_BY_ID[id].label}`} onClick={() => remove(group, id)}>&minus;</button>
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
              <p>Choisissez la largeur et la position pour r&eacute;afficher un bloc.</p>
            </div>
            {hidden.length ? (
              <ul className="settings-hidden-list">
                {hidden.map(({ id, label }) => (
                  <li className="settings-hidden-block" key={id}>
                    <span className="settings-tile-name">
                      {label}
                      {id === 'caracteristiques' && <small className="settings-width-label">2 colonnes uniquement</small>}
                    </span>
                    <span className={`settings-hidden-actions${id === 'caracteristiques' ? ' settings-hidden-actions-wide-only' : ''}`}>
                      <button type="button" className="settings-add-tile" title="Ajouter en pleine largeur au-dessus des colonnes" aria-label={`Ajouter ${label} sur deux colonnes au-dessus`} onClick={() => add(id, 'top')}>2 col. &uarr;</button>
                      <button type="button" className="settings-add-tile" title="Ajouter en pleine largeur sous les colonnes" aria-label={`Ajouter ${label} sur deux colonnes en dessous`} onClick={() => add(id, 'bottom')}>2 col. &darr;</button>
                      {id !== 'caracteristiques' && (
                        <>
                          <button type="button" className="settings-add-tile" title="Ajouter sur une colonne &agrave; gauche" aria-label={`Ajouter ${label} sur une colonne &agrave; gauche`} onClick={() => add(id, 'left')}>1 col. &larr;</button>
                          <button type="button" className="settings-add-tile" title="Ajouter sur une colonne &agrave; droite" aria-label={`Ajouter ${label} sur une colonne &agrave; droite`} onClick={() => add(id, 'right')}>1 col. &rarr;</button>
                        </>
                      )}
                    </span>
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
    </Modal>
  );
}
