import AddRowButton from '../fields/AddRowButton.jsx';
import Panel from './Panel.jsx';
import QuestCard from './QuestCard.jsx';
import { QUESTS } from '../../data/sheetLists.js';
import { useListRows } from '../../hooks/useListRows.js';
import { range } from '../../utils/range.js';

export default function QuestsPanel() {
  const { rowCount, addRow } = useListRows(QUESTS);

  return (
    <Panel id="quetes" title="Journal de Quêtes">
      <div className="quest-list">
        {range(rowCount).map((index) => (
          <QuestCard key={index} index={index} />
        ))}
      </div>
      <AddRowButton label="Ajouter une quête" onClick={addRow} />
    </Panel>
  );
}
