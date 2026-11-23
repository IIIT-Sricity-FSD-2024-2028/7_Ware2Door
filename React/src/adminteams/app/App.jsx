import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "../components/Icon.jsx";
import { Layout } from "../components/Layout.jsx";
import { AnalyticsPage } from "../pages/AnalyticsPage.jsx";
import { EscalationsPage } from "../pages/EscalationsPage.jsx";
import { FleetPage } from "../pages/FleetPage.jsx";
import { PartnersPage } from "../pages/PartnersPage.jsx";
import { SubscriptionsPage } from "../pages/SubscriptionsPage.jsx";
import { resetAdminTeams } from "../store/slices/adminTeamsSlice.js";
import { clearAdminToast } from "../store/slices/adminTeamsUiSlice.js";
import AdminModal from "./AdminModal.jsx";

function ToastMessage() {
  const dispatch = useDispatch();
  const toast = useSelector((state) => state.adminTeamsUi.toast);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => dispatch(clearAdminToast()), 3500);
    return () => window.clearTimeout(timeout);
  }, [dispatch, toast]);

  if (!toast) return null;
  return (
    <div className="toast-container">
      <div className={`toast toast-${toast.kind}`}>
        <Icon name="fa-circle-info" />
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

function AppBody() {
  const dispatch = useDispatch();
  const session = useSelector((state) => state.auth.session);
  const isAuthenticated = Boolean(session?.token);
  const section = useSelector((state) => state.adminTeamsUi.section);

  useEffect(() => {
    if (!isAuthenticated || session?.role !== "ADMIN_TEAMS") {
      dispatch(resetAdminTeams());
    }
  }, [dispatch, isAuthenticated, session?.role]);

  if (!isAuthenticated || session?.role !== "ADMIN_TEAMS") return null;

  return (
    <Layout>
      {section === "partners" && <PartnersPage />}
      {section === "subscriptions" && <SubscriptionsPage />}
      {section === "fleet" && <FleetPage />}
      {section === "escalation" && <EscalationsPage />}
      {section === "analytics" && <AnalyticsPage />}
      <AdminModal />
      <ToastMessage />
    </Layout>
  );
}

export function App() {
  return <AppBody />;
}
