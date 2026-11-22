import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Layout } from "../components/Layout.jsx";
import { AnalyticsPage } from "../pages/AnalyticsPage.jsx";
import { EscalationsPage } from "../pages/EscalationsPage.jsx";
import { NodesPage } from "../pages/NodesPage.jsx";
import { ThirdPartyPartnersPage } from "../pages/ThirdPartyPartnersPage.jsx";
import { resetSuperAdminData } from "../store/slices/superAdminSlice.js";
import { resetSuperAdminUi } from "../store/slices/superAdminUiSlice.js";

function AppBody() {
  const dispatch = useDispatch();
  const session = useSelector((state) => state.auth.session);
  const isAuthenticated = Boolean(session?.token);
  const section = useSelector((state) => state.superAdminUi.section);

  useEffect(() => {
    if (!isAuthenticated || session?.role !== "SUPER_USER") {
      dispatch(resetSuperAdminData());
      dispatch(resetSuperAdminUi());
    }
  }, [dispatch, isAuthenticated, session?.role]);

  if (!isAuthenticated || session?.role !== "SUPER_USER") return null;

  return (
    <Layout>
      {section === "nodes" && <NodesPage />}
      {section === "analytics" && <AnalyticsPage />}
      {section === "escalations" && <EscalationsPage />}
      {section === "partners" && <ThirdPartyPartnersPage />}
    </Layout>
  );
}

export function App() {
  return <AppBody />;
}
