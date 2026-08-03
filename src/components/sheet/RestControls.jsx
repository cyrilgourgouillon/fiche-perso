import { afterLongRest, afterShortRest } from '../../services/rest.js';
import { useArmedAction } from '../../hooks/useArmedAction.js';
import { useSheet } from '../../context/SheetContext.js';

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

/**
 * A rest overwrites tracked values with no way back, so it takes two clicks: the
 * first turns the button into a confirmation, the second applies the rest.
 */
function RestButton({ icon, name, effect, onConfirm }) {
  const { armed, trigger, disarm } = useArmedAction(onConfirm);
  const title = armed ? `Confirmer : ${name.toLowerCase()} — ${effect}` : `${name} : ${effect}`;

  return (
    <button
      type="button"
      className={armed ? 'sheet-button rest-button armed' : 'sheet-button rest-button'}
      title={title}
      aria-label={title}
      onClick={trigger}
      onBlur={disarm}
      onMouseLeave={disarm}
    >
      {armed ? `${icon} Confirmer ?` : `${icon} ${name}`}
    </button>
  );
}

export default function RestControls() {
  const { apply } = useSheet();

  return (
    <div className="rest-row">
      {RESTS.map(({ icon, name, effect, transform }) => (
        <RestButton
          key={name}
          icon={icon}
          name={name}
          effect={effect}
          onConfirm={() => apply(transform)}
        />
      ))}
    </div>
  );
}
