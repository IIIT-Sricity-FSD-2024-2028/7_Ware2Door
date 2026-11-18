import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Layout } from "../components/Layout.jsx";
import { apiRequest } from "../api/client.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { AnalyticsPage } from "../pages/AnalyticsPage.jsx";
import { EscalationsPage } from "../pages/EscalationsPage.jsx";
import { FleetPage } from "../pages/FleetPage.jsx";
import { PartnersPage } from "../pages/PartnersPage.jsx";
import { SubscriptionsPage } from "../pages/SubscriptionsPage.jsx";
import AdminModal from "./AdminModal.jsx";
import { isExpired } from "../utils.js";
import {
  validateEmail,
  validatePhone,
  validatePositiveNumber,
  validateRequiredText,
} from "../../utils/inputValidation.js";

const VEHICLE_TYPES = ["Bike", "Van", "Truck", "Auto"];
const SUBSCRIPTION_TIERS = ["Starter", "Growth", "Business", "Enterprise"];
const NODE_TYPES = ["WareHouse", "TransitHub", "LocalAgency"];
const blank = {
  name: "",
  email: "",
  password: "",
  phone: "",
  type: "",
  city: "",
  address: "",
  lat: "",
  lng: "",
  startDate: new Date().toISOString().slice(0, 10),
  monthlyRate: "",
  monthlyFee: "",
  endDate: "",
  licenseNo: "",
  vehicleType: "",
  tier: "Starter",
  contactName: "",
  contactPhone: "",
  fromNodeId: "",
  fromNodeType: "",
  toNodeId: "",
  toNodeType: "",
  escalationStatus: "Pending",
  escalationAssignedTo: "",
  resolutionNote: "",
};
const list = (value, key) =>
  Array.isArray(value) ? value : value?.[key] || value?.data || [];
function AppBody() {
  const { isAuthenticated, session } = useAuth();
  if (!isAuthenticated || session?.role !== "ADMIN_TEAMS") return null;
  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { logout, session } = useAuth();
  const [section, setSection] = useState("partners"),
    [nodes, setNodes] = useState([]),
    [drivers, setDrivers] = useState([]);
  const [escalations, setEscalations] = useState([]),
    [partners, setPartners] = useState([]),
    [performance, setPerformance] = useState({
      warehouses: [],
      hubs: [],
      agencies: [],
    }),
    [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [type, setType] = useState(""),
    [status, setStatus] = useState(""),
    [modal, setModal] = useState(null),
    [selected, setSelected] = useState(null);
  const [form, setForm] = useState(blank),
    [toast, setToast] = useState(null),
    [docs, setDocs] = useState([]);
  const notify = (message, kind = "success") => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 3500);
  };
  const load = useCallback(
    async (which = section) => {
      setLoading(true);
      setError("");
      try {
        if (which === "subscriptions")
          setNodes(list(await apiRequest("/admin-teams/nodes"), "nodes"));
        if (which === "fleet") {
          const [driverData, nodeData] = await Promise.all([
            apiRequest("/admin-teams/drivers"),
            apiRequest("/admin-teams/nodes"),
          ]);
          setDrivers(list(driverData, "drivers"));
          setNodes(list(nodeData, "nodes"));
        }
        if (which === "escalation")
          setEscalations(
            list(await apiRequest("/admin-teams/escalations"), "escalations"),
          );
        if (which === "partners")
          setPartners(
            list(await apiRequest("/admin-teams/partners"), "partners"),
          );
        if (which === "analytics")
          setPerformance(await apiRequest("/admin-teams/node-performance"));
      } catch (e) {
        setError(e.message);
        notify(e.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [section],
  );
  useEffect(() => {
    setQuery("");
    load();
  }, [load, section]);
  const open = (kind, item = null) => {
    setSelected(item);
    setDocs([]);
    setForm(
      item
        ? { ...blank, ...item, ...(item.subscription || {}) }
        : {
            ...blank,
            endDate: new Date(Date.now() + 30 * 86400000)
              .toISOString()
              .slice(0, 10),
          },
    );
    setModal(kind);
  };
  const close = () => {
    setModal(null);
    setSelected(null);
  };
  const change = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const mutate = async (path, method, body, message, refresh = section) => {
    try {
      const result = await apiRequest(path, {
        method,
        body: JSON.stringify(body),
      });
      if (result?.error || result?.success === false)
        throw new Error(result.error || result.message || "Request failed");
      notify(message);
      close();
      load(refresh);
    } catch (e) {
      notify(e.message, "error");
    }
  };
  const uploadDocs = async (nodeId, files) => {
    if (!files.length) return;
    const body = new FormData();
    files.forEach((file) => body.append("files", file));
    try {
      await apiRequest(`/admin-teams/nodes/${nodeId}/legal-docs`, {
        method: "POST",
        body,
      });
      notify("Legal documents uploaded");
      close();
      load("subscriptions");
    } catch (e) {
      notify(e.message, "error");
    }
  };
  const submit = (e) => {
    e.preventDefault();
    const rejectInvalid = (error) => {
      if (!error) return false;
      notify(error, "error");
      return true;
    };
    const validDateRange = (startDate, endDate) =>
      Boolean(startDate && endDate && new Date(startDate) <= new Date(endDate));
    if (modal === "add-node") {
      const validationError =
        (!NODE_TYPES.includes(form.type) ? "Select a valid node type." : "") ||
        validateRequiredText(form.name, "Node name", { max: 100 }) ||
        validateEmail(form.email) ||
        validateRequiredText(form.password, "Password", { min: 1, max: 128 }) ||
        validatePhone(form.phone) ||
        validateRequiredText(form.city, "City", { max: 100 }) ||
        validateRequiredText(form.address, "Address", { max: 300 }) ||
        (!String(form.monthlyRate || "").trim()
          ? "Monthly rate is required."
          : "") ||
        validatePositiveNumber(form.monthlyRate, "Monthly rate", {
          min: 0,
          max: 100000000,
        }) ||
        (form.lat &&
        (!Number.isFinite(Number(form.lat)) ||
          Number(form.lat) < -90 ||
          Number(form.lat) > 90)
          ? "Latitude must be between -90 and 90."
          : "") ||
        (form.lng &&
        (!Number.isFinite(Number(form.lng)) ||
          Number(form.lng) < -180 ||
          Number(form.lng) > 180)
          ? "Longitude must be between -180 and 180."
          : "") ||
        (!validDateRange(form.startDate, form.endDate)
          ? "Subscription end date must be on or after the start date."
          : "");
      if (rejectInvalid(validationError)) return;
      const createNode = async () => {
        try {
          const result = await apiRequest("/admin-teams/nodes", {
            method: "POST",
            body: JSON.stringify({
              role: form.type,
              name: form.name,
              email: form.email,
              password: form.password,
              phone: form.phone,
              city: form.city,
              address: form.address,
              lat: form.lat || null,
              lng: form.lng || null,
              subscription: {
                tier: "Starter",
                monthlyRate: Number(form.monthlyRate || 0),
                startDate: form.startDate,
                endDate: form.endDate,
              },
            }),
          });
          if (e.addNodeFiles?.length && result.node?.id) {
            const body = new FormData();
            e.addNodeFiles.forEach((file) => body.append("files", file));
            await apiRequest(
              `/admin-teams/nodes/${result.node.id}/legal-docs`,
              { method: "POST", body },
            );
          }
          notify("Node created successfully");
          close();
          load("subscriptions");
        } catch (error) {
          notify(error.message, "error");
        }
      };
      return createNode();
    }
    if (modal === "extend") {
      const validationError =
        !form.endDate ||
        (selected?.endDate && new Date(form.endDate) <= new Date(selected.endDate))
          ? "Choose an end date later than the current subscription end date."
          : validatePositiveNumber(form.monthlyRate, "Monthly rate", {
              min: 0,
              max: 100000000,
            });
      if (rejectInvalid(validationError)) return;
      return mutate(
        `/admin-teams/nodes/${selected.id}/subscription`,
        "PUT",
        { endDate: form.endDate, monthlyRate: Number(form.monthlyRate || 0) },
        "Subscription updated",
        "subscriptions",
      );
    }
    if (modal === "add-driver" || modal === "edit-driver") {
      let validationError =
        validateRequiredText(form.name, "Driver name", { max: 100 }) ||
        validatePhone(form.phone) ||
        validateRequiredText(form.licenseNo, "License number", {
          min: 4,
          max: 30,
        }) ||
        (modal === "add-driver" && !String(form.monthlyFee || "").trim()
          ? "Monthly fee is required."
          : "") ||
        validatePositiveNumber(form.monthlyFee || 0, "Monthly fee", {
          min: 0,
          max: 100000000,
        });
      if (
        !validationError &&
        !/^[A-Z0-9][A-Z0-9 -]*$/i.test(form.licenseNo.trim())
      ) {
        validationError =
          "License number may contain only letters, numbers, spaces, and hyphens.";
      }
      if (!validationError && !VEHICLE_TYPES.includes(form.vehicleType)) {
        validationError = "Select a valid vehicle type.";
      }
      if (
        !validationError &&
        !validDateRange(form.startDate || selected?.startDate, form.endDate)
      ) {
        validationError = "Enter a valid subscription date range.";
      }
      if (
        !validationError &&
        modal === "add-driver" &&
        (!nodes.some((node) => node.id === form.fromNodeId) ||
          !nodes.some((node) => node.id === form.toNodeId))
      ) {
        validationError = "Select valid origin and destination nodes.";
      }
      if (rejectInvalid(validationError)) return;
    }
    if (modal === "add-driver")
      return mutate(
        "/admin-teams/drivers",
        "POST",
        {
          name: form.name,
          phone: form.phone,
          licenseNo: form.licenseNo,
          vehicleType: form.vehicleType,
          fromNodeId: form.fromNodeId,
          fromNodeType: form.fromNodeType,
          toNodeId: form.toNodeId,
          toNodeType: form.toNodeType,
          startDate: form.startDate,
          endDate: form.endDate,
          monthlyFee: Number(form.monthlyFee || 0),
        },
        "Driver registered",
        "fleet",
      );
    if (modal === "edit-driver")
      return mutate(
        `/admin-teams/drivers/${selected.id}`,
        "PUT",
        {
          name: form.name,
          phone: form.phone,
          licenseNo: form.licenseNo,
          vehicleType: form.vehicleType,
          monthlyFee: Number(form.monthlyFee || 0),
          endDate: form.endDate,
        },
        "Driver updated",
        "fleet",
      );
    if (modal === "escalation")
      return mutate(
        `/admin-teams/escalations/${selected.ticketId || selected.id}`,
        "PUT",
        {
          escalationStatus: form.escalationStatus,
          escalationAssignedTo: form.escalationAssignedTo,
          resolutionNote: form.resolutionNote,
        },
        "Escalation updated",
        "escalation",
      );
    if (modal === "partner") {
      const validationError =
        validateRequiredText(form.name, "Partner name", { max: 100 }) ||
        validateEmail(form.email) ||
        (form.contactPhone ? validatePhone(form.contactPhone) : "") ||
        (form.contactName
          ? validateRequiredText(form.contactName, "Contact name", { max: 100 })
          : "") ||
        (form.address
          ? validateRequiredText(form.address, "Address", { max: 300 })
          : "") ||
        (!SUBSCRIPTION_TIERS.includes(form.tier)
          ? "Select a valid subscription tier."
          : "");
      if (rejectInvalid(validationError)) return;
      return (async () => {
        try {
          const result = await apiRequest("/admin-teams/partners", {
            method: "POST",
            body: JSON.stringify({
              name: form.name,
              email: form.email,
              address: form.address,
              contactName: form.contactName,
              contactPhone: form.contactPhone,
              tier: form.tier,
            }),
          });
          if (result?.error || result?.success === false)
            throw new Error(result.error || result.message || "Request failed");
          notify("Partner added successfully.");
          setForm(blank);
          await load("partners");
          if (result.partner?.apiKey) {
            setSelected(result.partner);
            setModal("api-key");
          } else {
            close();
          }
        } catch (error) {
          notify(error.message, "error");
        }
      })();
    }
    if (modal === "tier")
      return mutate(
        `/admin-teams/partners/${selected.id}/tier`,
        "PUT",
        { tier: form.tier },
        "Tier updated",
      );
  };
  const find = (values) =>
    values.filter(
      (x) =>
        !query || JSON.stringify(x).toLowerCase().includes(query.toLowerCase()),
    );
  const act = (label, fn, cls = "btn-ghost") => (
    <button className={cls} onClick={fn}>
      {label}
    </button>
  );
  const nodeFilter = useMemo(
    () =>
      nodes.filter((n) => {
        const endDate = n.subscription?.endDate || n.subscriptionEndDate;
        const matchesQuery =
          !query ||
          `${n.name} ${n.city} ${n.email}`
            .toLowerCase()
            .includes(query.toLowerCase());
        const matchesType = !type || (n.type || n._type) === type;
        const matchesStatus =
          status === "active"
            ? n.isActive !== false && !isExpired(endDate)
            : status === "inactive"
              ? n.isActive === false
              : status === "expired"
                ? isExpired(endDate)
                : true;
        return matchesQuery && matchesType && matchesStatus;
      }),
    [nodes, query, type, status],
  );
  return (
    <Layout
      section={section}
      setSection={setSection}
      onLogout={logout}
      session={session}
    >
      {section === "partners" && (
        <PartnersPage
          data={partners}
          find={find}
          open={open}
          act={act}
          mutate={mutate}
          query={query}
          setQuery={setQuery}
        />
      )}
      {section === "subscriptions" && (
        <SubscriptionsPage
          nodes={nodes}
          nodeFilter={nodeFilter}
          query={query}
          setQuery={setQuery}
          type={type}
          setType={setType}
          status={status}
          setStatus={setStatus}
          open={open}
          act={act}
          load={load}
        />
      )}
      {section === "fleet" && (
        <FleetPage
          data={drivers}
          find={find}
          open={open}
          act={act}
          mutate={mutate}
          query={query}
          setQuery={setQuery}
          load={load}
        />
      )}
      {section === "escalation" && (
        <EscalationsPage
          data={escalations}
          find={find}
          open={open}
          act={act}
          mutate={mutate}
          query={query}
          setQuery={setQuery}
          load={load}
        />
      )}
      {section === "analytics" && (
        <AnalyticsPage
          data={performance}
          loading={loading}
          error={error}
          onRetry={() => load("analytics")}
        />
      )}
      <AdminModal
        kind={modal}
        selected={selected}
        close={close}
        value={form}
        nodes={nodes}
        change={change}
        submit={submit}
        open={open}
        mutate={mutate}
        uploadDocs={uploadDocs}
      />
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.kind}`}>
            <Icon name="fa-circle-info" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </Layout>
  );
}

export function App() {
  return <AppBody />;
}
