import React from "react";

export default function TransitHubHeader({
  title,
  user,
  initials,
  onSettings,
}) {
  return (
    <div className="header">
      <h2 id="header-title">{title}</h2>
      <div className="header-right">
        <div className="user">
          <div>
            <p className="name" id="top-name">
              {user.name}
            </p>
            <p className="role" id="top-role">
              Transit Hub Manager
            </p>
          </div>
          <div
            className="avatar"
            id="top-avatar"
            title="Go to Settings"
            onClick={onSettings}
          >
            {initials(user.name)}
          </div>
        </div>
      </div>
    </div>
  );
}
