import { useSheet } from '../../context/SheetContext.js';
import { AVATAR_RACES, avatarRaceFor } from './PixelAvatar.jsx';
import PixelAvatar from './PixelAvatar.jsx';

const SHIRT_STYLES = [
  { value: 'tunic', label: 'Tunique' },
  { value: 'doublet', label: 'Pourpoint' },
  { value: 'robe', label: 'Robe' },
  { value: 'armor', label: 'Armure' },
  { value: 'cape', label: 'Cape' },
  { value: 'tabard', label: 'Tabard' },
];

const TROUSER_STYLES = [
  { value: 'straight', label: 'Droites' },
  { value: 'puffy', label: 'Bouffantes' },
  { value: 'leggings', label: 'Ajustées' },
  { value: 'shorts', label: 'Courtes' },
  { value: 'greaves', label: 'Jambières' },
  { value: 'cargo', label: 'Cargo' },
];

const WEAPONS = [
  { value: 'none', label: 'Aucune' },
  { value: 'axe', label: 'Hache' },
  { value: 'sword_one', label: 'Épée à une main' },
  { value: 'sword_two', label: 'Épée à deux mains' },
  { value: 'bow', label: 'Arc' },
  { value: 'sword_shield', label: 'Épée et bouclier' },
  { value: 'boxing', label: 'Boxe (gants)' },
];

const GENDERS = [
  { value: 'male', label: 'Masculin' },
  { value: 'female', label: 'Féminin' },
];

const COLORS = [
  { value: 'crimson', label: 'Écarlate', color: '#b84f48' },
  { value: 'ocean', label: 'Azur', color: '#397a9a' },
  { value: 'teal', label: 'Émeraude', color: '#438b78' },
  { value: 'plum', label: 'Améthyste', color: '#775a91' },
  { value: 'gold', label: 'Miel', color: '#d09a3d' },
  { value: 'charcoal', label: 'Ardoise', color: '#4d5364' },
  { value: 'brown', label: 'Marron', color: '#8b5e3c' },
  { value: 'black', label: 'Noir', color: '#27272a' },
  { value: 'white', label: 'Blanc', color: '#f3f1e9' },
];

function StyleChoices({ label, field, options, selected, onChange, className = '', asSelect = false }) {
  return (
    <fieldset className={`avatar-choice-group ${className}`.trim()}>
      <legend>{label}</legend>
      {asSelect ? (
        <select
          className="ef avatar-style-select"
          aria-label={label}
          value={selected}
          onChange={(event) => onChange(field, event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <div className="avatar-style-options">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="avatar-style-button"
              aria-pressed={selected === option.value}
              onClick={() => onChange(field, option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </fieldset>
  );
}

function ColorChoices({ label, field, selected, onChange }) {
  return (
    <fieldset className="avatar-choice-group avatar-color-group">
      <legend>{label}</legend>
      <div className="avatar-color-options">
        {COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            className="avatar-color-button"
            style={{ '--swatch': color.color }}
            aria-label={color.label}
            aria-pressed={selected === color.value}
            title={color.label}
            onClick={() => onChange(field, color.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}

export default function AvatarEditor() {
  const { data, update } = useSheet();
  const race = avatarRaceFor(data);
  const shirtStyle = data.avatar_shirt_style || 'tunic';
  const trousersStyle = data.avatar_trousers_style || 'straight';
  const shirtColor = data.avatar_shirt_color || 'teal';
  const trousersColor = data.avatar_trousers_color || 'plum';
  const gender = data.avatar_gender || 'male';
  const weapon = data.avatar_weapon || 'none';

  return (
    <section className="avatar-workshop" aria-label="Atelier d’avatar">
      <div className="avatar-workshop-heading">
        <PixelAvatar data={data} />
        <div>
          <h3>Petit héro, grande aventure</h3>
          <p>Compose ton aventurier en pixels.</p>
        </div>
      </div>

      <div className="avatar-identity-controls">
        <StyleChoices
          label="Genre"
          field="avatar_gender"
          options={GENDERS}
          selected={gender}
          onChange={update}
          className="avatar-gender-group"
        />

        <label className="avatar-race-field">
          <span>Race du sprite</span>
          <select className="ef" value={race} onChange={(event) => update('avatar_race', event.target.value)}>
            {AVATAR_RACES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="avatar-outfit-grid">
        <div className="avatar-outfit-card">
          <StyleChoices label="Haut" field="avatar_shirt_style" options={SHIRT_STYLES} selected={shirtStyle} onChange={update} asSelect />
          <ColorChoices label="Couleur du haut" field="avatar_shirt_color" selected={shirtColor} onChange={update} />
        </div>
        <div className="avatar-outfit-card">
          <StyleChoices label="Pantalon" field="avatar_trousers_style" options={TROUSER_STYLES} selected={trousersStyle} onChange={update} asSelect />
          <ColorChoices label="Couleur du pantalon" field="avatar_trousers_color" selected={trousersColor} onChange={update} />
        </div>
      </div>

      <label className="avatar-race-field avatar-weapon-field">
        <span>Arme</span>
        <select className="ef" value={weapon} onChange={(event) => update('avatar_weapon', event.target.value)}>
          {WEAPONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
    </section>
  );
}
