import { useSheet } from '../../context/SheetContext';
import { ABILITIES, SKILLS } from '../../data/abilities';
import RollButton from '../dice/RollButton';
import Modal from '../Modal';
import {
  abilityModifier,
  formatModifier,
  proficiencyBonus,
  savingThrowBonus,
  skillBonus,
} from '../../services/characterMath';

const ABILITY_SHORT = {
  force: 'FOR',
  dexterite: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  sagesse: 'SAG',
  charisme: 'CHA',
};

const abilityScore = (data, key) => Number(data[key] || 10);

export default function QuickReferencePanel({ open, onToggle }) {
  const { data } = useSheet();
  const profBonus = proficiencyBonus(data);

  return (
    <div className="quick-reference-widget">
        <button
          type="button"
          className="sheet-tools-launcher quick-reference-launcher"
          aria-expanded={open}
          aria-controls="quick-reference-content"
          onClick={onToggle}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
            <path d="M4 6h13M8 9h8M8 12h5M8 16h8" />
          </svg>
          <span>Carac. &amp; comp.</span>
        </button>
      <Modal
        id="quick-reference-dialog"
        open={open}
        onClose={onToggle}
        presentation="popup"
        eyebrow="Référence rapide"
        title="Caractéristiques &amp; Compétences"
        closeLabel="Fermer les caractéristiques et compétences"
        className="app-modal-popup--reference"
      >
        <section className="quick-reference-panel">
          <div id="quick-reference-content" className="quick-reference-content">
            <div className="quick-reference-prof">
              <span>Bonus de maîtrise</span>
              <strong>{formatModifier(profBonus)}</strong>
            </div>

            <section className="quick-reference-section" aria-labelledby="quick-abilities-heading">
              <h3 id="quick-abilities-heading">Caractéristiques</h3>
              <div className="quick-ability-grid">
                {ABILITIES.map((ability) => {
                  const score = abilityScore(data, ability.key);
                  const modifier = abilityModifier(data[ability.key]);
                  const save = savingThrowBonus(data, ability.key);
                  return (
                    <article className="quick-ability-card" data-ability={ability.key} key={ability.key}>
                      <div className="quick-ability-actions">
                        <div className="quick-ability-name">{ability.label.slice(ability.label.indexOf(' ') + 1)}</div>
                      </div>
                      <div className="quick-ability-values">
                        <div className="quick-ability-score">
                          <strong>{score}</strong>
                          <span>Valeur</span>
                        </div>
                        <div className="quick-ability-modifier">
                          <strong>{formatModifier(modifier)}</strong>
                          <span>Mod.</span>
                        </div>
                      </div>
                      <div className="quick-ability-save">
                        <span>Sauvegarde</span>
                        <strong>{formatModifier(save)}</strong>
                        <RollButton label={`${ability.label} · sauvegarde`} bonus={save} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="quick-reference-section" aria-labelledby="quick-skills-heading">
              <h3 id="quick-skills-heading">Compétences</h3>
              <div className="quick-skill-grid">
                {SKILLS.map((skill) => (
                  <div className="quick-skill-row" key={skill.key}>
                    <span className="quick-skill-name">{skill.label}</span>
                    <span className="quick-skill-ability" data-ability={skill.ability}>{ABILITY_SHORT[skill.ability]}</span>
                    <strong className="quick-skill-bonus">{formatModifier(skillBonus(data, skill))}</strong>
                    <RollButton label={skill.label} bonus={skillBonus(data, skill)} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </Modal>
    </div>
  );
}
