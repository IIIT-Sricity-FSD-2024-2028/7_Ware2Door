import { Icon } from "./Icon.jsx";

export function Stats({ items }) {
  return (
    <div className="stat-row">
      {items.map(([icon, color, label, value]) => (
        <div className="quick-stat" key={label}>
          <i className={`fa-solid ${icon}`} style={{ color }} />
          <div>
            <p className="qs-label">{label}</p>
            <p className="qs-val">{value ?? "—"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
