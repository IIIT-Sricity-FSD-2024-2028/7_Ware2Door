import { ErrorRow } from "./ErrorRow.jsx";
import { Icon } from "./Icon.jsx";

export function DataTable({
  headers,
  columns,
  loading,
  error,
  isEmpty,
  emptyMessage,
  children,
}) {
  return (
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns} className="empty-msg">
                <Icon name="fa-spinner fa-spin" /> Loading…
              </td>
            </tr>
          ) : error ? (
            <ErrorRow columns={columns} message={error} />
          ) : isEmpty ? (
            <tr>
              <td colSpan={columns} className="empty-msg">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
