import RemoveRowButton from './RemoveRowButton';
import TextField from './TextField';
import { range } from '../../utils/range';

/** Table of sheet fields, one row per list entry. */
export default function FieldTable({
  columns,
  rowCount,
  fieldName,
  className,
  onRemoveRow,
  isRowEmpty,
}) {
  return (
    <table className={className}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.field}>{column.header}</th>
          ))}
          {onRemoveRow && <th className="row-actions" aria-label="Actions" />}
        </tr>
      </thead>
      <tbody>
        {range(rowCount).map((rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column) => (
              <td key={column.field} className={column.cellClassName} data-label={column.header}>
                {column.render ? (
                  column.render(rowIndex)
                ) : (
                  <TextField
                    name={fieldName(rowIndex, column.field)}
                    className={column.align === 'center' ? 'ef center' : 'ef'}
                    placeholder={column.placeholder}
                  />
                )}
              </td>
            ))}
            {onRemoveRow && (
              <td className="row-actions">
                <RemoveRowButton
                  label={`Supprimer la ligne ${rowIndex + 1}`}
                  confirm={!isRowEmpty?.(rowIndex)}
                  onClick={() => onRemoveRow(rowIndex)}
                />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
