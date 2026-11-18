import logo from "../assets/logo.png";
import { Icon } from "./Icon.jsx";

const sections = [
  ["partners", "fa-handshake", "Third Party"],
  ["subscriptions", "fa-building-circle-check", "Node Partners"],
  ["fleet", "fa-truck-moving", "Fleet Management"],
  ["analytics", "fa-chart-bar", "Node Analytics"],
  ["escalation", "fa-triangle-exclamation", "Escalation Desk"],
];

export function Layout({ section, setSection, children, onLogout, session }) {
  const title = sections.find((item) => item[0] === section)?.[2] || "";
  return (
    <div className="portal">
      <div className="sidebar">
        <div className="logo-section">
          <img src={logo} alt="Ware2Door" />
          <div className="at-role-chip">
            <Icon name="fa-users-gear" /> ADMIN TEAMS
          </div>
        </div>
        <ul className="menu">
          {sections.map(([id, icon, label]) => (
            <li
              key={id}
              className={`menu-item${section === id ? " active" : ""}`}
              onClick={() => setSection(id)}
            >
              <div className="icon-box">
                <Icon name={icon} />
              </div>
              <span>{label}</span>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            <Icon name="fa-right-from-bracket" /> Logout
          </button>
        </div>
      </div>
      <div className="main">
        <div className="header">
          <div className="header-left">
            <h2>{title}</h2>
            <span className="at-authority-chip">
              <Icon name="fa-users-gear" /> Admin Teams
            </span>
          </div>
          <div className="user">
            <div className="user-info">
              <p className="name">
                {session?.user?.name || "Operations Admin"}
              </p>
              <p className="role-label">
                <span className="online-dot" />
                &nbsp; Online
              </p>
            </div>
            <div className="avatar">AT</div>
          </div>
        </div>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
