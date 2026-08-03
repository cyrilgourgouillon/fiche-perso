import RemoveRowButton from './RemoveRowButton.jsx';
import TextField from './TextField.jsx';
import { range } from '../../utils/range.js';

/**
 * Table of sheet fields, one row per list entry.
 *
 * `columns` entries accept:
 *  - `field`       key suffix passed to `fieldName`
 *  - `header`      column caption
 *  - `align`       `'center'` to center the input
 *  - `placeholder` input placeholder
 *  - `render`      escape hatch `(rowIndex) => node` for non-text cells
 *
 * `className` lets the caller drive per-column widths from CSS (see mobile rules).
 * Passing `onRemoveRow` adds a trailing column of remove buttons.
 */
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
          {onRemoveRow && <th className="row-actions" />}
        </tr>
      </thead>
      <tbody>
        {range(rowCount).map((rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column) => (
              <td key={column.field} className={column.cellClassName}>
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
