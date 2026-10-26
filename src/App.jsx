import { useEffect, useState } from 'react';
import CharacterSheet from './components/sheet/CharacterSheet.jsx';
import CombatSummary from './components/sheet/CombatSummary.jsx';
import DiceTray from './components/dice/DiceTray.jsx';
import DiceFlash from './components/dice/DiceFlash.jsx';
import SheetNav from './components/sheet/SheetNav.jsx';
import AppearancePanel from './components/sheet/AppearancePanel.jsx';
import QuickReferencePanel from './components/sheet/QuickReferencePanel.jsx';
import SheetSearch from './components/sheet/SheetSearch.jsx';
import ShortcutsHelp from './components/sheet/ShortcutsHelp.jsx';
import SettingsModal from './components/sheet/SettingsModal.jsx';
import { KEYBOARD_SHORTCUTS } from './data/keyboardShortcuts.js';
import DiceProvider from './context/DiceProvider.jsx';
import SheetProvider from './context/SheetProvider.jsx';
import Toolbar from './components/Toolbar.jsx';
import { useCharacterSheet } from './hooks/useCharacterSheet.js';
import { useSheetFile } from './hooks/useSheetFile.js';
import { useStatusMessage } from './hooks/useStatusMessage.js';

export default function App() {
  const [showCombatSummary, setShowCombatSummary] = useState(false);
  const [toolbarHidden, setToolbarHidden] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const toggleTool = (tool) => setActiveTool((current) => current === tool ? null : tool);
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

  useEffect(() => {
    let previousY = window.scrollY;
    const handleScroll = () => {
      const currentY = Math.max(0, window.scrollY);
      const delta = currentY - previousY;

      if (currentY <= 8) {
        setToolbarHidden(false);
      } else if (Math.abs(delta) >= 6) {
        const toolbar = document.getElementById('toolbar');
        if (delta < 0 || !toolbar?.contains(document.activeElement)) {
          setToolbarHidden(delta > 0);
        }
      }

      if (Math.abs(delta) >= 6 || currentY <= 8) previousY = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const toolByKey = Object.fromEntries(KEYBOARD_SHORTCUTS
      .filter(({ command }) => ['sections', 'quick-reference', 'appearance', 'dice'].includes(command))
      .map(({ key, command }) => [key.toLowerCase(), command]));
    const isTyping = (target) => target instanceof HTMLElement && (
      target.isContentEditable || target.closest('input, textarea, select, [contenteditable="true"]')
    );
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (key === 'escape' && (showShortcuts || activeTool)) {
        event.preventDefault();
        if (showShortcuts) setShowShortcuts(false);
        else setActiveTool(null);
        return;
      }
      if (showShortcuts) {
        if (key === '?') setShowShortcuts(false);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        if (!showCombatSummary) {
          event.preventDefault();
          setActiveTool('search');
        }
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping(event.target)) return;
      if (key === '/' && !showCombatSummary) {
        event.preventDefault();
        setActiveTool('search');
      } else if (key === '?') {
        event.preventDefault();
        setShowShortcuts(true);
      } else if (key === 'd') {
        toggleTool('dice');
      } else if (!showCombatSummary && toolByKey[key]) {
        toggleTool(toolByKey[key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, showCombatSummary, showShortcuts]);

  return (
    <SheetProvider data={data} update={update} apply={apply}>
      <DiceProvider>
        <main
          data-theme={theme}
          data-view={showCombatSummary ? 'combat-summary' : 'sheet'}
          data-toolbar-hidden={toolbarHidden ? 'true' : undefined}
        >
          <Toolbar
            status={status}
            onOpenSettings={() => setActiveTool('settings')}
            onLoad={openPicker}
            onSave={exportFile}
            onToggleCombatSummary={() => setShowCombatSummary((current) => !current)}
            combatSummaryOpen={showCombatSummary}
          />
          {showCombatSummary ? <CombatSummary onBack={() => setShowCombatSummary(false)} /> : <CharacterSheet onOpenAppearance={() => setActiveTool("appearance")} />}
          <div className="sheet-tools" role="group" aria-label="Outils de la fiche">
            {!showCombatSummary && (
              <SheetSearch open={activeTool === 'search'} onToggle={() => toggleTool('search')} />
            )}
            {!showCombatSummary && (
              <QuickReferencePanel open={activeTool === 'quick-reference'} onToggle={() => toggleTool('quick-reference')} />
            )}
            {!showCombatSummary && (
              <SheetNav
                open={activeTool === 'sections'}
                onToggle={() => toggleTool('sections')}
                onOpenSettings={() => setActiveTool('settings')}
              />
            )}
            <DiceTray open={activeTool === 'dice'} onToggle={() => toggleTool('dice')} />
            {!showCombatSummary && (
              <AppearancePanel open={activeTool === 'appearance'} onToggle={() => toggleTool('appearance')} />
            )}
            <ShortcutsHelp
              open={showShortcuts}
              onToggle={() => setShowShortcuts((current) => !current)}
              onClose={() => setShowShortcuts(false)}
            />
          </div>
          <SettingsModal
            open={activeTool === 'settings'}
            onClose={() => setActiveTool(null)}
            theme={theme}
            onThemeChange={setTheme}
          />
          <DiceFlash />
          <input ref={inputRef} type="file" accept=".json" hidden onChange={importFile} />
        </main>
      </DiceProvider>
    </SheetProvider>
  );
}
