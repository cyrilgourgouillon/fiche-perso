import AbilitiesPanel from './AbilitiesPanel.jsx';
import ClassFeaturesPanel from './ClassFeaturesPanel.jsx';
import CombatPanel from './CombatPanel.jsx';
import DiceTray from '../dice/DiceTray.jsx';
import GearSection from './GearSection.jsx';
import HeaderPanel from './HeaderPanel.jsx';
import NotesPanel from './NotesPanel.jsx';
import ProficienciesPanel from './ProficienciesPanel.jsx';
import QuestsPanel from './QuestsPanel.jsx';
import SheetFooter from './SheetFooter.jsx';
import SheetNav from './SheetNav.jsx';
import SpellSlotsPanel from './SpellSlotsPanel.jsx';
import SpellsPanel from './SpellsPanel.jsx';
import WeaponsPanel from './WeaponsPanel.jsx';

/**
 * Two panels side by side on a wide screen, stacked everywhere else.
 *
 * `display: contents` below the breakpoint means the pair adds nothing to the
 * layout: the panels stay direct children of the sheet grid, in the same order.
 */
function PanelPair({ children }) {
  return <div className="panel-pair">{children}</div>;
}

export default function CharacterSheet() {
  return (
    <div className="sheet">
      <SheetNav />
      <HeaderPanel />
      <PanelPair>
        <CombatPanel />
        <DiceTray />
      </PanelPair>
      <AbilitiesPanel />
      <WeaponsPanel />
      <ClassFeaturesPanel />
      <SpellSlotsPanel />
      <SpellsPanel />
      <GearSection />
      {/* maîtrises and notes share the left column, the quest journal takes the right */}
      <div className="panel-columns">
        <ProficienciesPanel />
        <QuestsPanel />
        <NotesPanel />
      </div>
      <div className="ornament">✦ ⚔ ✦</div>
      <SheetFooter />
    </div>
  );
}
