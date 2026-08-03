import CharacterSheet from './components/sheet/CharacterSheet.jsx';
import DiceFlash from './components/dice/DiceFlash.jsx';
import DiceProvider from './context/DiceProvider.jsx';
import SheetProvider from './context/SheetProvider.jsx';
import Toolbar from './components/Toolbar.jsx';
import { useCharacterSheet } from './hooks/useCharacterSheet.js';
import { useSheetFile } from './hooks/useSheetFile.js';
import { useStatusMessage } from './hooks/useStatusMessage.js';

export default function App() {
  const [status, notify] = useStatusMessage();
  const { data, update, apply, theme, setTheme, replace } = useCharacterSheet({ notify });
  const { inputRef, openPicker, importFile, exportFile } = useSheetFile({
    data,
    onImport: replace,
    notify,
  });

  return (
    <SheetProvider data={data} update={update} apply={apply}>
      <DiceProvider>
        <main data-theme={theme}>
          <Toolbar
            status={status}
            theme={theme}
            onThemeChange={setTheme}
            onLoad={openPicker}
            onSave={exportFile}
          />
          <CharacterSheet />
          <DiceFlash />
          <input ref={inputRef} type="file" accept=".json" hidden onChange={importFile} />
        </main>
      </DiceProvider>
    </SheetProvider>
  );
}
