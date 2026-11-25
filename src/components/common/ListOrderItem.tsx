import ListItem from './ListItem';

interface ListOrderItemProps {
  title: string;
  position: number;
  rowCount: number;
  onMove: (position: number, direction: number) => void;
}

export default function ListOrderItem({
  title, position, rowCount, onMove,
}: ListOrderItemProps) {
  return (
    <ListItem className="list-ordering-item" contentClassName="list-order-content">
      <span className="list-order-title">{title || 'Sans titre'}</span>
      <div className="list-order-actions">
        <button
          type="button"
          className="list-order-move"
          disabled={position === 0}
          aria-label={`Monter ${title || 'l’élément'}`}
          onClick={() => onMove(position, -1)}
        >
          <span aria-hidden="true">↑</span>
        </button>
        <button
          type="button"
          className="list-order-move"
          disabled={position === rowCount - 1}
          aria-label={`Descendre ${title || 'l’élément'}`}
          onClick={() => onMove(position, 1)}
        >
          <span aria-hidden="true">↓</span>
        </button>
      </div>
    </ListItem>
  );
}
