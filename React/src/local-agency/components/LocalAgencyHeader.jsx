import React from "react";

export default function LocalAgencyHeader({
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
            <p className="name">{user.name}</p>
            <p className="role">Local Delivery Agency</p>
          </div>
          <div
            className="avatar agency-avatar-button"
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
