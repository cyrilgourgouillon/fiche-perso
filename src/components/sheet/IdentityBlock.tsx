import LabeledField from '../fields/LabeledField';
import { useSheet } from '../../context/SheetContext';
import PixelAvatar from './PixelAvatar';

const IDENTITY_FIELDS = [
  { label: '👤 Nom du perso', name: 'nom_personnage' },
  { label: '📜 Historique', name: 'historique' },
  { label: '⚔️ Classe', name: 'classe' },
  { label: '✨ Sous-classe', name: 'sous_classe' },
  { label: '🧬 Espèce', name: 'espece' },
  { label: '⚖️ Alignement', name: 'alignement' },
];

/** "Elfe · Magicien / Évocation", dropping the separators of whatever is missing. */
const identitySummary = (data) => {
  const parts = [data.classe, data.sous_classe].map((part) => part?.trim()).filter(Boolean);
  return [data.espece?.trim(), parts.join(' / ')].filter(Boolean).join(' · ');
};

export default function IdentityBlock({ onOpenAppearance }) {
  const { data } = useSheet();
  const name = data.nom_personnage?.trim();
  const summary = identitySummary(data);

  return (
    <div className="char-name-block">
      <div className="char-title-line">
        <button
          type="button"
          className="avatar-edit-trigger"
          aria-label="Ouvrir l'apparence du personnage"
          title="Modifier l'apparence"
          onClick={onOpenAppearance}
        >
          <PixelAvatar data={data} />
        </button>
        <div className="char-title-copy">
          <div className={name ? 'char-name ef-display' : 'char-name ef-display unnamed'}>
            {name || 'Sans nom'}
          </div>
          {summary && <div className="char-name-sub">{summary}</div>}
        </div>
      </div>
      <div className="identity-fields">
        {IDENTITY_FIELDS.map((field) => (
          <LabeledField key={field.name} {...field} />
        ))}
      </div>
    </div>
  );
}
