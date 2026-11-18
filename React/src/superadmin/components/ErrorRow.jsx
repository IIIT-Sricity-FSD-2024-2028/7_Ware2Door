import { Icon } from "./Icon.jsx";

export function ErrorRow({ columns, message }) {
  return (
    <tr>
      <td colSpan={columns} className="empty-msg">
        <Icon name="fa-triangle-exclamation" /> {message}
      </td>
    </tr>
  );
}
