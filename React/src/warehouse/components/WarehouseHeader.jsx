import React from "react";

export default function WarehouseHeader({ title, user, initials, onSettings }) {
  const userName = user?.name || "";

  return (
    <div className="header">
      <h2>{title}</h2>
      <div className="user">
        <div>
          <p className="name">{userName}</p>
          <p className="role">Warehouse Admin</p>
        </div>
        <div
          className="avatar"
          id="top-avatar"
          style={{ cursor: "pointer" }}
          title="Go to Settings"
          onClick={onSettings}
        >
          {initials(userName)}
        </div>
      </div>
    </div>
  );
}
