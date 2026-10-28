import { useMemo } from 'react';
import { useSheet } from '../../context/SheetContext';
import { normalizeTileLayout } from '../../data/tileLayout';
import AbilitiesPanel from './AbilitiesPanel';
import ClassFeaturesPanel from './ClassFeaturesPanel';
import CombatPanel from './CombatPanel';
import EquipmentPanel from './EquipmentPanel';
import HeaderPanel from './HeaderPanel';
import MoneyPanel from './MoneyPanel';
import NotesPanel from './NotesPanel';
import ProficienciesPanel from './ProficienciesPanel';
import QuestsPanel from './QuestsPanel';
import SheetFooter from './SheetFooter';
import SpellSlotsPanel from './SpellSlotsPanel';
import SpellsPanel from './SpellsPanel';
import WeaponsPanel from './WeaponsPanel';

const TILE_COMPONENTS = {
  header: HeaderPanel,
  combat: CombatPanel,
  caracteristiques: AbilitiesPanel,
  armes: WeaponsPanel,
  capacites: ClassFeaturesPanel,
  emplacements_sorts: SpellSlotsPanel,
  sorts: SpellsPanel,
  pieces: MoneyPanel,
  equipement: EquipmentPanel,
  maitrises: ProficienciesPanel,
  quetes: QuestsPanel,
  notes: NotesPanel,
};

export default function CharacterSheet({ onOpenAppearance }) {
  const { data } = useSheet();
  const layout = useMemo(
    () => normalizeTileLayout(data.tile_layout, data.tile_order, data.tile_sides, data.tile_widths),
    [data.tile_layout, data.tile_order, data.tile_sides, data.tile_widths],
  );
  const renderWideTile = (id) => {
    const Tile = TILE_COMPONENTS[id];
    return (
      <div key={id} className="tile-frame tile-frame-wide">
        <Tile {...(id === 'header' ? { onOpenAppearance } : {})} />
      </div>
    );
  };

  return (
    <div className="sheet sheet-custom-order">
      {layout.top.map(renderWideTile)}
      {(layout.left.length > 0 || layout.right.length > 0) && (
        <div className="tile-columns">
          {['left', 'right'].map((side) => (
            <div key={side} className="tile-column" data-side={side}>
              {layout[side].map((id) => {
                const Tile = TILE_COMPONENTS[id];
                return <div key={id} className="tile-frame"><Tile /></div>;
              })}
            </div>
          ))}
        </div>
      )}
      {layout.bottom.map(renderWideTile)}
      <div className="ornament">&#10022; &#9876; &#10022;</div>
      <SheetFooter />
    </div>
  );
}

