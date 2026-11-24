import React from "react";
import { useDispatch, useSelector } from "react-redux";
import LocalAgencyHeader from "./LocalAgencyHeader.jsx";
import LocalAgencySidebar from "./LocalAgencySidebar.jsx";
import LocalAgencyToast from "./LocalAgencyToast.jsx";
import { setLocalAgencyPage } from "../store/slices/localAgencyUiSlice.js";

const titles = {
  dashboard: "Dashboard",
  shipments: "Shipments",
  scan: "Scan Operations",
  agents: "Delivery Agents",
  rto: "RTO Management",
  delivery: "Shipment Delivery",
  support: "Support Tickets",
  settings: "Settings",
};

export default function LocalAgencyShell({ children, initials }) {
  const dispatch = useDispatch();
  const activePage = useSelector((state) => state.localAgency.ui.page);
  return (
    <div className="agency-layout">
      <LocalAgencyToast />
      <LocalAgencySidebar activePage={activePage} />
      <div className="main">
        <LocalAgencyHeader
          title={titles[activePage]}
          initials={initials}
          onSettings={() => dispatch(setLocalAgencyPage("settings"))}
        />
        {children}
      </div>
    </div>
  );
}
