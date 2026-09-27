import AbilitiesPanel from './AbilitiesPanel.jsx';
import AppearancePanel from './AppearancePanel.jsx';
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

export default function CharacterSheet() {
  return (
    <div className="sheet">
      <HeaderPanel />
      <CombatPanel />
      <AbilitiesPanel />
      <WeaponsPanel />
      <div className="features-spell-layout">
        <ClassFeaturesPanel />
        <div className="spell-side-column">
          <SpellSlotsPanel />
          <MoneyPanel />
        </div>
      </div>
      <SpellsPanel />
      <EquipmentPanel />
      {/* maîtrises and notes share the left column, the quest journal takes the right */}
      <div className="panel-columns">
        <ProficienciesPanel />
        <QuestsPanel />
        <NotesPanel />
        <AppearancePanel />
      </div>
      <div className="ornament">✦ ⚔ ✦</div>
      <SheetFooter />
    </div>
  );
}
