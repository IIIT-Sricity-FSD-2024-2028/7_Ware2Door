import React from "react";
import { useDispatch, useSelector } from "react-redux";
import TransitHubHeader from "./TransitHubHeader.jsx";
import TransitHubSidebar from "./TransitHubSidebar.jsx";
import TransitHubToast from "./TransitHubToast.jsx";
import { setTransitHubPage } from "../store/slices/transitHubUiSlice.js";

const titles = {
  dashboard: "Dashboard",
  "hub-inv": "Hub Inventory",
  reports: "Reports",
  scan: "Scan Operations",
  settings: "Settings",
};

export default function TransitHubShell({ children, initials }) {
  const dispatch = useDispatch();
  const activePage = useSelector((state) => state.transitHub.ui.page);
  const inventoryOpen = useSelector(
    (state) => state.transitHub.ui.inventoryOpen,
  );
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <TransitHubToast />
      <TransitHubSidebar
        activePage={activePage}
        inventoryOpen={inventoryOpen}
      />
      <div className="main">
        <TransitHubHeader
          title={titles[activePage]}
          initials={initials}
          onSettings={() => dispatch(setTransitHubPage("settings"))}
        />
        {children}
      </div>
    </div>
  );
}
