import { ABILITIES, SKILLS } from '../../data/abilities.js';
import { CLASS_FEATURES, CLASS_FEATURES_USED, SPELLS, WEAPONS } from '../../data/sheetLists.js';
import { range } from '../../utils/range.js';
import { listRowCount } from '../../services/sheetRows.js';
import { spellSlotField, spellSlotRows } from '../../services/spellSlots.js';
import {
  derivedInitiative,
  derivedPassivePerception,
  derivedSpellAttackBonus,
  derivedSpellSaveDC,
  formatModifier,
  proficiencyBonus,
  savingThrowBonus,
  skillBonus,
  spellcastingAbility,
  spellcastingModifier,
} from '../../services/characterMath.js';
import { useSheet } from '../../context/SheetContext.js';
import Checkbox from '../fields/Checkbox.jsx';
import PixelAvatar from './PixelAvatar.jsx';

const text = (value) => (typeof value === 'string' ? value.trim() : '');
const valueOr = (value, fallback = '—') => text(value) || fallback;
const displayModifier = (value, fallback) => {
  const raw = text(value);
  if (!raw) return fallback === null ? '—' : formatModifier(fallback);
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? formatModifier(numeric) : raw;
};
const included = (data, includeField, contentField) => {
  if (data[includeField] !== undefined) return data[includeField] === 'true';
  return Boolean(text(data[contentField]));
};
const flagged = (data, field) => data[field] === 'true';

function SummarySection({ title, className = '', children, emptyMessage, hasContent = true }) {
  return (
    <section className={'summary-card ' + className}>
      <h3>{title}</h3>
      {hasContent ? children : <p className="summary-empty">{emptyMessage}</p>}
    </section>
  );
}

function DeathMarks({ data, name, label, tone }) {
  return (
    <div className={'summary-death-group ' + tone}>
      <span>{label}</span>
      <div role="img" aria-label={label}>
        {range(3).map((index) => (
          <i key={index} className={flagged(data, name + '_' + (index + 1)) ? 'marked' : ''} />
        ))}
      </div>
    </div>
  );
}

export default function CombatSummary({ onBack }) {
  const { data } = useSheet();
  const weapons = range(listRowCount(data, WEAPONS))
    .map((row) => ({
      name: data[WEAPONS.field(row, 'nom')],
      bonus: data[WEAPONS.field(row, 'bonus')],
      damage: data[WEAPONS.field(row, 'degats')],
      notes: data[WEAPONS.field(row, 'notes')],
      included: included(data, WEAPONS.field(row, 'combat'), WEAPONS.field(row, 'nom')),
    }))
    .filter((weapon) => text(weapon.name) && weapon.included);

  const features = range(listRowCount(data, CLASS_FEATURES))
    .map((row) => ({
      title: data[CLASS_FEATURES.field(row)],
      description: data[CLASS_FEATURES.field(row, 'description')],
      used: flagged(data, CLASS_FEATURES_USED.field(row)),
      shortRest: flagged(data, CLASS_FEATURES.field(row, 'repos_court')),
      longRest: flagged(data, CLASS_FEATURES.field(row, 'repos_long')),
      included: included(data, CLASS_FEATURES.field(row, 'combat'), CLASS_FEATURES.field(row)),
    }))
    .filter((feature) => text(feature.title) && feature.included);

  const spells = range(listRowCount(data, SPELLS))
    .map((row) => ({
      level: data[SPELLS.field(row, 'niveau')],
      name: data[SPELLS.field(row, 'nom')],
      time: data[SPELLS.field(row, 'temps')],
      range: data[SPELLS.field(row, 'portee')],
      notes: data[SPELLS.field(row, 'notes')],
      concentration: flagged(data, SPELLS.field(row, 'concentration')),
      ritual: flagged(data, SPELLS.field(row, 'rituel')),
      included: included(data, SPELLS.field(row, 'combat'), SPELLS.field(row, 'nom')),
    }))
    .filter((spell) => text(spell.name) && spell.included);

  const hasRecordedSpells = range(listRowCount(data, SPELLS))
    .some((row) => Boolean(text(data[SPELLS.field(row, 'nom')])));
  const slots = spellSlotRows(data).filter((slot) => slot.total > 0);
  const hasSpellcasting =
    hasRecordedSpells ||
    ['caracteristique_incantation', 'modificateur_incantation', 'dd_sauvegarde', 'bonus_attaque_sort']
      .some((field) => Boolean(text(data[field]))) ||
    Object.entries(data).some(([field, value]) => /^emplacement_sort_\d+_\d+$/.test(field) && value === 'true') ||
    Object.entries(data).some(([field, value]) => /^emplacements_sorts_niveau_\d+$/.test(field) && Boolean(text(value)));
  const spellAbility = ABILITIES.find((ability) => ability.key === spellcastingAbility(data));
  const identity = [
    'Niveau ' + valueOr(data.niveau, '1'),
    text(data.espece),
    [text(data.classe), text(data.sous_classe)].filter(Boolean).join(' / '),
  ].filter(Boolean).join(' · ');
  const hitPoints = valueOr(data.points_vie_actuel) + ' / ' + valueOr(data.points_vie_max);

  return (
    <article className="combat-summary">
      <header className="summary-heading">
        <div className="summary-identity">
          <p>Résumé de combat</p>
          <div className="summary-title-line">
            <PixelAvatar data={data} />
            <h2>{valueOr(data.nom_personnage, 'Sans nom')}</h2>
          </div>
          <div>{identity}</div>
        </div>
        <div className="summary-actions">
          <button type="button" className="sheet-button" onClick={onBack}>Retour à la fiche</button>
          <button type="button" className="sheet-button summary-print" onClick={() => window.print()}>
            Imprimer / PDF
          </button>
        </div>
      </header>

      <div className="summary-stat-strip">
        <div className="summary-stat summary-hit-points">
          <span>Points de vie</span>
          <strong>{hitPoints}</strong>
          {text(data.points_vie_temp) && <small>{data.points_vie_temp} temporaires</small>}
        </div>
        <div className="summary-stat">
          <span>CA</span><strong>{valueOr(data.classe_armure)}</strong>
          {flagged(data, 'bouclier') && <small>Bouclier actif</small>}
        </div>
        <div className="summary-stat"><span>Initiative</span><strong>{displayModifier(data.initiative, derivedInitiative(data))}</strong></div>
        <div className="summary-stat"><span>Vitesse</span><strong>{valueOr(data.vitesse)}</strong></div>
        <div className="summary-stat"><span>Maîtrise</span><strong>{formatModifier(proficiencyBonus(data))}</strong></div>
        <div className="summary-stat"><span>Perception passive</span><strong>{valueOr(data.perception_passive, String(derivedPassivePerception(data)))}</strong></div>
        <div className="summary-stat"><span>Inspiration</span><strong>{flagged(data, 'inspiration') ? 'Oui' : 'Non'}</strong></div>
      </div>

      <div className="summary-columns">
        <div className="summary-column">
          <SummarySection title="Jets de sauvegarde" className="summary-saves">
            <div className="summary-abilities">
              {ABILITIES.map((ability) => (
                <div key={ability.key}>
                  <span>{ability.label.replace(/^\S+\s*/, '')}</span>
                  <strong>{formatModifier(savingThrowBonus(data, ability.key))}</strong>
                </div>
              ))}
            </div>
            <div className="summary-death-saves">
              <DeathMarks data={data} name="mort_succes" label="Succès" tone="success" />
              <DeathMarks data={data} name="mort_echecs" label="Échecs" tone="failure" />
            </div>
          </SummarySection>

          <SummarySection title="Compétences" className="summary-skill-card">
            <div className="summary-skills">
              {SKILLS.map((skill) => (
                <div key={skill.key}>
                  <span>{skill.label}</span>
                  <strong>{formatModifier(skillBonus(data, skill))}</strong>
                </div>
              ))}
            </div>
          </SummarySection>
        </div>

        <div className="summary-column">
          <SummarySection
            title="Capacités de classe"
            className="summary-features"
            emptyMessage="Cochez Résumé combat à côté d’une capacité pour l’ajouter ici."
            hasContent={features.length > 0}
          >
            <ul className="summary-entry-list">
              {features.length > 0 && features.map((feature, index) => (
                <li key={index} className={feature.used ? 'feature-used' : ''}>
                  <div className="summary-entry-top">
                    <strong>{text(feature.title)}</strong>
                    <span>{feature.used ? 'Utilisée' : ''}</span>
                  </div>
                  {text(feature.description) && <div className="summary-entry-detail">{text(feature.description)}</div>}
                  {(feature.shortRest || feature.longRest) && (
                    <small>Récupération : {[feature.shortRest && 'repos court', feature.longRest && 'repos long'].filter(Boolean).join(' / ')}</small>
                  )}
                </li>
              ))}
            </ul>
          </SummarySection>

          <SummarySection
            title="Attaques"
            className="summary-attacks"
            emptyMessage="Ajoutez des armes sur la fiche et cochez Combat pour les afficher ici."
            hasContent={weapons.length > 0}
          >
            <ul className="summary-entry-list">
              {weapons.length > 0 && weapons.map((weapon, index) => (
                <li key={index}>
                  <div className="summary-entry-top">
                    <strong>{text(weapon.name)}</strong>
                    <b>{displayModifier(weapon.bonus, null)}</b>
                  </div>
                  <div className="summary-entry-detail">
                    {text(weapon.damage) || 'Dégâts non renseignés'}
                    {text(weapon.notes) && <span> · {text(weapon.notes)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </SummarySection>
        </div>

        <div className="summary-column">
          {hasSpellcasting && (
            <SummarySection title="Incantation" className="summary-spell-meta">
              <div className="summary-spell-stats">
                <div><span>Caractéristique</span><strong>{spellAbility?.label.replace(/^\S+\s*/, '') || '—'}</strong></div>
                <div><span>Modificateur</span><strong>{formatModifier(spellcastingModifier(data))}</strong></div>
                <div><span>DD</span><strong>{valueOr(data.dd_sauvegarde, String(derivedSpellSaveDC(data)))}</strong></div>
                <div><span>Attaque</span><strong>{displayModifier(data.bonus_attaque_sort, derivedSpellAttackBonus(data))}</strong></div>
              </div>
            </SummarySection>
          )}

          {slots.length > 0 && (
            <SummarySection title="Emplacements de sorts" className="summary-slot-card">
              <div className="summary-slots">
                {slots.map((slot) => {
                  return (
                    <div
                      key={slot.spellLevel}
                      className="summary-slot-level"
                    >
                      <span>Niveau {slot.spellLevel}</span>
                      <div className="summary-slot-boxes">
                        {range(slot.total).map((slotIndex) => (
                          <Checkbox
                            key={slotIndex}
                            name={spellSlotField(slot.spellLevel, slotIndex)}
                            aria-label={`Emplacement de sort niveau ${slot.spellLevel}, ${slotIndex + 1}`}
                            disabled
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SummarySection>
          )}

          <SummarySection
            title="Sorts en combat"
            className="summary-spells"
            emptyMessage="Cochez Combat à côté d’un sort pour l’ajouter ici."
            hasContent={spells.length > 0}
          >
            <ul className="summary-entry-list">
              {spells.length > 0 && spells.map((spell, index) => (
                <li key={index}>
                  <div className="summary-entry-top">
                    <strong>{text(spell.name)}</strong>
                    <span>{text(spell.level) === '0' ? 'Mineur' : 'Niv. ' + valueOr(spell.level)}</span>
                  </div>
                  <div className="summary-entry-detail">
                    {[text(spell.time), text(spell.range), spell.concentration && 'Concentration', spell.ritual && 'Rituel']
                      .filter(Boolean)
                      .join(' · ') || 'Détails non renseignés'}
                    {text(spell.notes) && <span> · {text(spell.notes)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </SummarySection>
        </div>
      </div>
    </article>
  );
}
