import React from "react";
import LocalAgencyHeader from "./LocalAgencyHeader.jsx";
import LocalAgencySidebar from "./LocalAgencySidebar.jsx";
import LocalAgencyToast from "./LocalAgencyToast.jsx";

export default function LocalAgencyShell({
  children,
  activePage,
  headerTitle,
  onNavigate,
  user,
  initials,
  onSettings,
  toast,
}) {
  return (
    <div className="agency-layout">
      <LocalAgencyToast toast={toast} />
      <LocalAgencySidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="main">
        <LocalAgencyHeader
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
