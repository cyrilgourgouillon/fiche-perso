import DieIcon from './DieIcon';
import { weaponDamageRoll, weaponDetails } from '../../services/weaponMath';
import { useDice } from '../../context/DiceContext';
import { useSheet } from '../../context/SheetContext';

export default function WeaponRollButton({ row }) {
  const { data } = useSheet();
  const { rollExpression } = useDice();
  const weapon = weaponDetails(data, row);
  const damageRoll = weaponDamageRoll(data, row);
  const label = damageRoll
    ? `Lancer les dégâts de ${weapon.name} avec le bonus d’attaque`
    : `Saisir un dé de dégâts valide pour ${weapon.name}`;

  const rollWeapon = () => {
    if (damageRoll) rollExpression(damageRoll.expression, `${weapon.name} · dégâts`);
  };

  return (
    <button
      type="button"
      className="roll-button weapon-roll-button"
      title={label}
      aria-label={label}
      disabled={!damageRoll}
      onClick={rollWeapon}
    >
      <DieIcon />
    </button>
  );
}
