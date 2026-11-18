import { Icon } from "./Icon.jsx";

export function Welcome({ title, icon, description, children, color }) {
  return (
    <div
      className="welcome-banner"
      style={color ? { background: color } : undefined}
    >
      <div>
        <p className="welcome-label">Super User Portal</p>
        <h2 className="welcome-heading">
          <Icon name={icon} /> {title}
        </h2>
        <p className="welcome-sub">{description}</p>
        <div className="welcome-actions">{children}</div>
      </div>
      <div className="welcome-icon-wrap">
        <Icon name={icon} />
      </div>
    </div>
  );
}
