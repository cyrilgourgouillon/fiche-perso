import { useEffect, useState } from 'react';
import CharacterSheet from './components/sheet/CharacterSheet.jsx';
import CombatSummary from './components/sheet/CombatSummary.jsx';
import DiceTray from './components/dice/DiceTray.jsx';
import DiceFlash from './components/dice/DiceFlash.jsx';
import SheetNav from './components/sheet/SheetNav.jsx';
import DiceProvider from './context/DiceProvider.jsx';
import SheetProvider from './context/SheetProvider.jsx';
import Toolbar from './components/Toolbar.jsx';
import { useCharacterSheet } from './hooks/useCharacterSheet.js';
import { useSheetFile } from './hooks/useSheetFile.js';
import { useStatusMessage } from './hooks/useStatusMessage.js';

export default function App() {
  const [showCombatSummary, setShowCombatSummary] = useState(false);
  const [status, notify] = useStatusMessage();
  const { data, update, apply, theme, setTheme, replace } = useCharacterSheet({ notify });
  const { inputRef, openPicker, importFile, exportFile } = useSheetFile({
    data,
    onImport: replace,
    notify,
  });

  useEffect(() => {
    if (showCombatSummary) window.scrollTo(0, 0);
  }, [showCombatSummary]);

  return (
    <SheetProvider data={data} update={update} apply={apply}>
      <DiceProvider>
        <main data-theme={theme} data-view={showCombatSummary ? 'combat-summary' : 'sheet'}>
          <Toolbar
            status={status}
            theme={theme}
            onThemeChange={setTheme}
            onLoad={openPicker}
            onSave={exportFile}
            onToggleCombatSummary={() => setShowCombatSummary((current) => !current)}
            combatSummaryOpen={showCombatSummary}
          />
          {showCombatSummary ? <CombatSummary onBack={() => setShowCombatSummary(false)} /> : <CharacterSheet />}
          <div className="sheet-tools" role="group" aria-label="Outils de la fiche">
            {!showCombatSummary && <SheetNav />}
            <DiceTray />
          </div>
          <DiceFlash />
          <input ref={inputRef} type="file" accept=".json" hidden onChange={importFile} />
        </main>
      </DiceProvider>
    </SheetProvider>
  );
}
