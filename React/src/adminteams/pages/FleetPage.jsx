import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Welcome } from "../components/Welcome.jsx";
import { Stats } from "../components/Stats.jsx";
import { Filter } from "../components/Filter.jsx";
import { Table } from "../components/Table.jsx";
import { formatDate } from "../utils.js";

export function FleetPage({
  data,
  find,
  open,
  act,
  mutate,
  query,
  setQuery,
  load,
}) {
  const [vehicle, setVehicle] = useState("");
  return (
    <>
      <Welcome
        role="admin"
        icon="fa-truck-moving"
        title="Fleet Management"
        description="Register drivers, assign inter-node routes (Warehouse → Hub → Agency), and manage platform subscription billing."
        color="linear-gradient(135deg,#2e1065 0%,#4c1d95 55%,#6d28d9 100%)"
      >
        {act(
          <>
            <Icon name="fa-plus" /> Add Driver
          </>,
          () => open("add-driver"),
          "btn-purple",
        )}
        {act(
          <>
            <Icon name="fa-rotate" /> Refresh
          </>,
          load,
        )}
      </Welcome>
      <Stats
        items={[
          ["fa-user-tie", "var(--purple)", "Total Drivers", data.length],
          [
            "fa-circle-check",
            "var(--green)",
            "Active Subs",
            data.filter(
              (d) =>
                d.subscription?.endDate &&
                new Date(d.subscription.endDate) > new Date(),
            ).length,
          ],
          [
            "fa-route",
            "var(--gold)",
            "WH → Hub",
            data.filter((d) => d.fromNodeType === "WAREHOUSE").length,
          ],
          [
            "fa-route",
            "var(--blue)",
            "Hub → Agency",
            data.filter((d) => d.fromNodeType === "TRANSIT_HUB").length,
          ],
        ]}
      />
      <Filter
        query={query}
        setQuery={setQuery}
        placeholder="Search by name, phone, license…"
        extra={
          <select
            className="filter-select"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
          >
            <option value="">All Vehicles</option>
            <option>Bike</option>
            <option>Van</option>
            <option>Truck</option>
            <option>Auto</option>
          </select>
        }
      />
      <Table
        headers={[
          "DRIVER",
          "PHONE",
          "LICENSE",
          "VEHICLE",
          "ROUTE",
          "MONTHLY FEE",
          "SUBSCRIPTION END",
          "STATUS",
          "ACTIONS",
        ]}
        rows={find(data)
          .filter((d) => !vehicle || d.vehicleType === vehicle)
          .map((d) => [
            <>
              <strong>{d.name}</strong>
              <br />
              <small>{d.id}</small>
            </>,
            d.phone || "—",
            <code>{d.licenseNo || "—"}</code>,
            d.vehicleType || "—",
            <div className="route-display">
              <span className="node-chip">
                {d.fromNodeName || d.fromNodeId || "—"}
              </span>
              <Icon name="fa-arrow-right" />
              <span className="node-chip">
                {d.toNodeName || d.toNodeId || "—"}
              </span>
            </div>,
            `₹${(d.subscription?.monthlyFee || d.subscription?.monthlyRate || 0).toLocaleString()}/mo`,
            formatDate(d.subscription?.endDate),
            <span
              className={`sub-status ${d.subscription?.endDate && new Date(d.subscription.endDate) > new Date() ? "sub-active" : "sub-expired"}`}
            >
              <Icon name="fa-circle-check" />{" "}
              {d.subscription?.endDate &&
              new Date(d.subscription.endDate) > new Date()
                ? "Active"
                : "Expired"}
            </span>,
            <div className="action-btn-group">
              <button
                className="action-btn edit"
                title="Edit"
                onClick={() => open("edit-driver", d)}
              >
                <Icon name="fa-pen" />
              </button>
              <button
                className="action-btn delete"
                title="Delete"
                onClick={() =>
                  confirm("Delete this driver?") &&
                  mutate(
                    `/admin-teams/drivers/${d.id}`,
                    "DELETE",
                    {},
                    "Driver deleted",
                    "fleet",
                  )
                }
              >
                <Icon name="fa-trash" />
              </button>
            </div>,
          ])}
      />
    </>
  );
}
