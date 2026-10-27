import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Modal from '../Modal.jsx';
import { afterLongRest, afterShortRest } from '../../services/rest.js';
import { useSheet } from '../../context/SheetContext.js';
import { spellSlotRows, usesPactMagic } from '../../services/spellSlots.js';

const RESTS = [
  {
    icon: '☕',
    name: 'Repos court',
    effect: 'Efface les jets de sauvegarde contre la mort',
    transform: afterShortRest,
  },
  {
    icon: '🌙',
    name: 'Repos long',
    effect: 'PV au maximum, PV temporaires effacés, emplacements de sorts récupérés',
    transform: afterLongRest,
  },
];

const marked = (value) => value === true || value === 'true';
const displayValue = (value) => value === undefined || value === '' ? '—' : value;

function restChanges(data, nextData, rest) {
  const changes = [];
  const deathSaves = [
    { key: 'mort_succes', label: 'Succès' },
    { key: 'mort_echecs', label: 'Échecs' },
  ];

  deathSaves.forEach(({ key, label }) => {
    const count = (source) => [1, 2, 3].filter((index) => marked(source[`${key}_${index}`])).length;
    const before = count(data);
    const after = count(nextData);
    if (before !== after) changes.push({ label: `Jets de sauvegarde contre la mort, ${label.toLowerCase()}`, before, after });
  });

  Object.keys(data).forEach((field) => {
    const match = field.match(/^capacite(\d+)_repos_(court|long)$/);
    if (!match || match[2] !== rest || !marked(data[field])) return;
    const usedField = `capacite_utilisee${match[1]}`;
    if (!marked(data[usedField]) || marked(nextData[usedField])) return;
    changes.push({
      label: data[`capacite${match[1]}`] || `Capacité ${match[1]}`,
      before: 'Utilisée',
      after: 'Disponible',
    });
  });

  const beforeHp = displayValue(data.points_vie_actuel);
  const afterHp = displayValue(nextData.points_vie_actuel);
  if (beforeHp !== afterHp) {
    const maxHp = displayValue(nextData.points_vie_max);
    changes.push({ label: 'Points de vie actuels', before: beforeHp, after: `${afterHp}${afterHp !== '—' ? ` / ${maxHp}` : ''}` });
  }

  const beforeTempHp = Number.parseInt(data.points_vie_temp, 10) || 0;
  const afterTempHp = Number.parseInt(nextData.points_vie_temp, 10) || 0;
  if (beforeTempHp !== afterTempHp) changes.push({ label: 'Points de vie temporaires', before: beforeTempHp, after: afterTempHp });

  const beforeHitDice = displayValue(data.des_vie);
  const afterHitDice = displayValue(nextData.des_vie);
  if (beforeHitDice !== afterHitDice) {
    const maxHitDice = displayValue(nextData.des_vie_max);
    changes.push({
      label: 'Dés de vie',
      before: beforeHitDice,
      after: afterHitDice !== '—' && maxHitDice !== '—' ? `${afterHitDice} / ${maxHitDice}` : afterHitDice,
    });
  }

  const beforeSlots = spellSlotRows(data);
  const afterSlots = spellSlotRows(nextData);
  beforeSlots.forEach(({ spellLevel, total, spent }) => {
    const after = afterSlots.find((row) => row.spellLevel === spellLevel);
    if (spent !== after.spent) {
      changes.push({
        label: `Emplacements de sorts, niveau ${spellLevel}`,
        before: `${spent}/${total} dépensé${spent > 1 ? 's' : ''}`,
        after: `${after.spent}/${after.total} dépensé${after.spent > 1 ? 's' : ''}`,
      });
    }
  });

  return changes;
}

export default function RestControls() {
  const { data, apply } = useSheet();
  const [selectedRest, setSelectedRest] = useState(null);
  const [completedRest, setCompletedRest] = useState(null);
  const statusTimerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(statusTimerRef.current), []);

  const preview = selectedRest ? restChanges(data, selectedRest.transform(data), selectedRest.rest) : [];
  const confirmRest = () => {
    if (!selectedRest) return;
    const restName = selectedRest.name;
    const restIcon = selectedRest.icon;
    apply(selectedRest.transform);
    setCompletedRest({ name: restName, icon: restIcon });
    window.clearTimeout(statusTimerRef.current);
    statusTimerRef.current = window.setTimeout(() => setCompletedRest(null), 2200);
    setSelectedRest(null);
  };

  return (
    <>
      <div className="rest-row">
      {RESTS.map(({ icon, name, effect, transform }) => (
        <button
          key={name}
          type="button"
          className="sheet-button rest-button"
          title={`${name} : ${effect}`}
          onClick={() => setSelectedRest({ icon, name, effect, transform, rest: name === 'Repos court' ? 'court' : 'long' })}
        >
          {icon} {name}
        </button>
      ))}
      </div>
      {completedRest && createPortal(
        <div
          className="rest-success-overlay"
          role="status"
          aria-label={`${completedRest.name} terminé`}
        >
          <div className="rest-success-content">
            <span className="rest-success-emoji" aria-hidden="true">{completedRest.icon}</span>
            <span className="rest-success-label">Repos terminé</span>
          </div>
        </div>,
        document.querySelector('main'),
      )}
      <Modal
        open={Boolean(selectedRest)}
        onClose={() => setSelectedRest(null)}
        title={selectedRest ? `${selectedRest.icon} ${selectedRest.name}` : ''}
        eyebrow="Confirmation"
        closeLabel="Fermer la confirmation de repos"
        className="app-modal--rest"
      >
        {selectedRest && (
          <div className="rest-dialog-content">
            <p className="rest-dialog-description">{selectedRest.effect}</p>
            {selectedRest.rest === 'court' && usesPactMagic(data) && (
              <p className="rest-dialog-note">Magie de pacte : les emplacements d’occultiste/warlock dépensés reviennent après ce repos court.</p>
            )}
            <h3>Changements prévus</h3>
            {preview.length ? (
              <ul className="rest-change-list">
                {preview.map(({ label, before, after }, index) => (
                  <li key={`${label}-${index}`}>
                    <span>{label}</span>
                    <strong>
                      <span className="rest-change-before">{before}</span>{' '}
                      <span aria-hidden="true">→</span>{' '}
                      <span className="rest-change-after">{after}</span>
                    </strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rest-no-changes">Aucune statistique suivie ne changera avec ce repos.</p>
            )}
            <div className="rest-dialog-actions">
              <button type="button" className="sheet-button" onClick={() => setSelectedRest(null)}>Annuler</button>
              <button type="button" className="sheet-button rest-confirm" onClick={confirmRest}>Confirmer le repos</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
