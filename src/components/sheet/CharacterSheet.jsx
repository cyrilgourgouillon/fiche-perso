import AbilitiesPanel from './AbilitiesPanel.jsx';
import ClassFeaturesPanel from './ClassFeaturesPanel.jsx';
import CombatPanel from './CombatPanel.jsx';
import EquipmentPanel from './EquipmentPanel.jsx';
import HeaderPanel from './HeaderPanel.jsx';
import MoneyPanel from './MoneyPanel.jsx';
import NotesPanel from './NotesPanel.jsx';
import ProficienciesPanel from './ProficienciesPanel.jsx';
import QuestsPanel from './QuestsPanel.jsx';
import SheetFooter from './SheetFooter.jsx';
import SpellSlotsPanel from './SpellSlotsPanel.jsx';
import SpellsPanel from './SpellsPanel.jsx';
import WeaponsPanel from './WeaponsPanel.jsx';

export default function CharacterSheet({ onOpenAppearance }) {
  return (
    <div className="sheet">
      <HeaderPanel onOpenAppearance={onOpenAppearance} />
      <CombatPanel />
      <AbilitiesPanel />
      <WeaponsPanel />
      <div className="middle-layout">
        <div className="middle-column">
          <ClassFeaturesPanel />
          <SpellSlotsPanel />
          <MoneyPanel />
          <ProficienciesPanel />
          <NotesPanel />
        </div>
        <div className="middle-column">
          <SpellsPanel />
          <EquipmentPanel />
        </div>
      </div>
      <QuestsPanel />
      <div className="ornament">✦ ⚔ ✦</div>
      <SheetFooter />
    </div>
  );
}
