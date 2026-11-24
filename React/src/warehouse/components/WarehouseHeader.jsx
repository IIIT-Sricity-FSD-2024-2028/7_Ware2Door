import React from "react";
import { useSelector } from "react-redux";

export default function WarehouseHeader({ title, initials, onSettings }) {
  const user = useSelector((state) => state.auth.session?.user || {});
  return (
    <div className="header">
      <h2>{title}</h2>
      <div className="user">
        <div>
          <p className="name">{user.name}</p>
          <p className="role">Warehouse Admin</p>
        </div>
        <div
          className="avatar"
          id="top-avatar"
          style={{ cursor: "pointer" }}
          title="Go to Settings"
          onClick={onSettings}
        >
          {initials(user.name)}
        </div>
      </div>
    </div>
  );
}
