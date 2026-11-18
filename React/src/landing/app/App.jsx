import React, {
  lazy,
  Suspense,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AuthProvider, useAuth } from "../../auth/AuthContext.jsx";
import LandingPage from "../pages/LandingPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import ForgotPasswordPage from "../pages/ForgotPasswordPage.jsx";
import TrackPage from "../pages/TrackPage.jsx";
import CustomerPage from "../pages/CustomerPage.jsx";
import BotPage from "../pages/BotPage.jsx";
import FaqPage from "../pages/FaqPage.jsx";
import TicketPage from "../pages/TicketPage.jsx";
import adminTeamsStylesUrl from "../../adminteams/styles/dashboard.css?url";
import superAdminStylesUrl from "../../superadmin/styles/dashboard.css?url";
import warehouseStylesUrl from "../../warehouse/styles/warehouse.css?url";
import localAgencyStylesUrl from "../../local-agency/styles/agency.css?url";
import authStylesUrl from "../styles/auth.css?url";
import forgotStylesUrl from "../styles/forgot.css?url";
import trackStylesUrl from "../styles/track.css?url";
import customerStylesUrl from "../styles/customer.css?url";
import botStylesUrl from "../styles/bot.css?url";
import faqStylesUrl from "../styles/faq.css?url";
import ticketStylesUrl from "../styles/ticket.css?url";
import landingStylesUrl from "../styles/landing.css?url";
import routeOverrideStylesUrl from "../styles/route-overrides.css?url";

const WarehouseApp = lazy(() => import("../../warehouse/app/WarehouseApp.jsx"));
const TransitHubApp = lazy(
  () => import("../../transit-hub/app/TransitHubApp.jsx"),
);
const LocalAgencyApp = lazy(
  () => import("../../local-agency/app/LocalAgencyApp.jsx"),
);
const AdminTeamsApp = lazy(() =>
  import("../../adminteams/app/App.jsx").then((module) => ({
    default: module.App,
  })),
);
const SuperAdminApp = lazy(() =>
  import("../../superadmin/app/App.jsx").then((module) => ({
    default: module.App,
  })),
);

const publicStyles = [
  authStylesUrl,
  forgotStylesUrl,
  trackStylesUrl,
  customerStylesUrl,
  botStylesUrl,
  faqStylesUrl,
  ticketStylesUrl,
  landingStylesUrl,
  routeOverrideStylesUrl,
];

function AppBody() {
  const { isAuthenticated, isLoading, role } = useAuth();
  const wasAuthenticated = useRef(isAuthenticated);
  const [page, setPage] = useState(() => {
    if (isAuthenticated) {
      if (role === "WAREHOUSE") return "warehouse";
      if (role === "TRANSIT_HUB") return "transit-hub";
      if (role === "LOCAL_AGENCY") return "local-agency";
      if (role === "ADMIN_TEAMS") return "admin-teams";
      if (role === "SUPER_USER") return "super-admin";
    }
    return "landing";
  });

  function navigate(p) {
    setPage(p);
  }
  useLayoutEffect(() => {
    if (!isLoading && !isAuthenticated && window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
  }, [isAuthenticated, isLoading]);

  useLayoutEffect(() => {
    if (wasAuthenticated.current && !isAuthenticated) {
      setPage("landing");
      if (window.location.pathname !== "/") {
        window.history.replaceState(null, "", "/");
      }
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated]);

  useLayoutEffect(() => {
    const authenticatedRoute = {
      WAREHOUSE: "warehouse",
      TRANSIT_HUB: "transit-hub",
      LOCAL_AGENCY: "local-agency",
      ADMIN_TEAMS: "admin-teams",
      SUPER_USER: "super-admin",
    }[role];
    const route =
      isAuthenticated && authenticatedRoute ? authenticatedRoute : page;
    const authRoute = route === "login" || route === "forgot";
    const routeClass = `${route}-route`;
    document.body.className = `portal-body ${routeClass}${authRoute ? " auth-route" : ""}`;
    document.documentElement.className = `portal-document ${routeClass}${authRoute ? " auth-route" : ""}`;
    return () => {
      document.body.className = "";
      document.documentElement.className = "";
    };
  }, [isAuthenticated, page, role]);

  useLayoutEffect(() => {
    const portalStyles = {
      WAREHOUSE: warehouseStylesUrl,
      LOCAL_AGENCY: localAgencyStylesUrl,
      ADMIN_TEAMS: adminTeamsStylesUrl,
      SUPER_USER: superAdminStylesUrl,
    };
    const activeStyles = isAuthenticated
      ? [portalStyles[role]].filter(Boolean)
      : publicStyles;
    const stylesheets = activeStyles.map((href) => {
      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = href;
      stylesheet.dataset.portalStyle = role || "public";
      document.head.appendChild(stylesheet);
      return stylesheet;
    });
    return () => stylesheets.forEach((stylesheet) => stylesheet.remove());
  }, [isAuthenticated, role]);

  if (isLoading) return null;

  if (isAuthenticated) {
    return (
      <Suspense fallback={null}>
        {role === "WAREHOUSE" && <WarehouseApp navigate={navigate} />}
        {role === "TRANSIT_HUB" && <TransitHubApp navigate={navigate} />}
        {role === "LOCAL_AGENCY" && <LocalAgencyApp navigate={navigate} />}
        {role === "ADMIN_TEAMS" && <AdminTeamsApp />}
        {role === "SUPER_USER" && <SuperAdminApp />}
      </Suspense>
    );
  }

  if (page === "login") return <LoginPage navigate={navigate} />;
  if (page === "forgot") return <ForgotPasswordPage navigate={navigate} />;
  if (page === "track") return <TrackPage navigate={navigate} />;
  if (page === "customer") return <CustomerPage navigate={navigate} />;
  if (page === "bot") return <BotPage navigate={navigate} />;
  if (page === "faq") return <FaqPage navigate={navigate} />;
  if (page === "ticket") return <TicketPage navigate={navigate} />;
  return <LandingPage navigate={navigate} />;
}

export function App() {
  return (
    <AuthProvider>
      <AppBody />
    </AuthProvider>
  );
}
