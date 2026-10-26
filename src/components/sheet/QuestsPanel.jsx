import AddRowButton from '../fields/AddRowButton.jsx';
import Panel from './Panel.jsx';
import QuestCard from './QuestCard.jsx';
import { QUESTS } from '../../data/sheetLists.js';
import { useListRows } from '../../hooks/useListRows.js';
import { range } from '../../utils/range.js';
import { useSheet } from '../../context/SheetContext.js';
import { useEffect, useState } from 'react';

export default function QuestsPanel() {
  const { rowCount, removable, isRowEmpty, addRow, removeRow } = useListRows(QUESTS);
  const { data } = useSheet();
  const [statusFilter, setStatusFilter] = useState('all');
  useEffect(() => {
    const reset = (event) => { if (event.detail?.section === 'quetes') setStatusFilter('all'); };
    window.addEventListener('sheet-search-reset', reset);
    return () => window.removeEventListener('sheet-search-reset', reset);
  }, []);
  const quests = range(rowCount).filter((index) => {
    const status = data[QUESTS.field(index, 'statut')];
    if (statusFilter === 'active') return status === 'proposee' || status === 'en_cours';
    return statusFilter === 'all' || status === statusFilter;
  });

  return (
    <Panel id="quetes" title="Journal de Quêtes">
      <div className="quest-filter-row">
        <label htmlFor="quest-status-filter">Afficher</label>
        <select id="quest-status-filter" className="ef" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Toutes les quêtes</option>
          <option value="active">Actives</option>
          <option value="terminee">Terminées</option>
          <option value="echouee">Échouées</option>
          <option value="abandonnee">Abandonnées</option>
        </select>
        <span>{quests.length} / {rowCount}</span>
      </div>
      <div className="quest-list">
        {quests.map((index) => (
          <QuestCard
            key={index}
            index={index}
            removable={removable}
            isRowEmpty={isRowEmpty}
            removeRow={removeRow}
          />
        ))}
      </div>
      {quests.length === 0 && <p className="filter-empty">Aucune quête dans ce filtre.</p>}
      <AddRowButton label="Ajouter une quête" onClick={() => { addRow(); setStatusFilter('all'); }} />
    </Panel>
  );
}
