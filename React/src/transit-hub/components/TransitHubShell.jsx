import React from "react";
import TransitHubHeader from "./TransitHubHeader.jsx";
import TransitHubSidebar from "./TransitHubSidebar.jsx";
import TransitHubToast from "./TransitHubToast.jsx";

export default function TransitHubShell({
  children,
  activePage,
  inventoryOpen,
  onNavigate,
  onToggleInventory,
  headerTitle,
  user,
  initials,
  onSettings,
  toast,
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <TransitHubToast toast={toast} />
      <TransitHubSidebar
        activePage={activePage}
        inventoryOpen={inventoryOpen}
        onNavigate={onNavigate}
        onToggleInventory={onToggleInventory}
      />
      <div className="main">
        <TransitHubHeader
          title={headerTitle}
          user={user}
          initials={initials}
          onSettings={onSettings}
        />
        {children}
      </div>
    </div>
  );
}
