import { DataTable } from "../components/DataTable.jsx";
import { FilterBar } from "../components/FilterBar.jsx";
import { Icon } from "../components/Icon.jsx";
import { NodeRows } from "../components/NodeRows.jsx";
import { Stats } from "../components/Stats.jsx";
import { Welcome } from "../components/Welcome.jsx";

export function NodesPage({
  data,
  filteredData,
  error,
  loading,
  query,
  onQueryChange,
  type,
  onTypeChange,
  status,
  onStatusChange,
  onRefresh,
}) {
  return (
    <>
      <Welcome
        icon="fa-building-circle-check"
        title="Node Overview"
        description="View all registered nodes — warehouses, transit hubs, local agencies — and their subscription validity."
      >
        <button className="btn-ghost" onClick={onRefresh}>
          <Icon name="fa-rotate" /> Refresh
        </button>
      </Welcome>
      <Stats
        items={[
          [
            "fa-warehouse",
            "var(--gold)",
            "Warehouses",
            data.filter((node) => node.type === "WAREHOUSE").length,
          ],
          [
            "fa-building",
            "var(--blue)",
            "Transit Hubs",
            data.filter((node) => node.type === "TRANSIT_HUB").length,
          ],
          [
            "fa-truck-fast",
            "var(--green)",
            "Local Agencies",
            data.filter((node) => node.type === "LOCAL_AGENCY").length,
          ],
          [
            "fa-circle-check",
            "var(--green)",
            "Valid Subscriptions",
            data.filter((node) => node.isSubscriptionValid).length,
          ],
          [
            "fa-clock",
            "var(--orange)",
            "Expired Subscriptions",
            data.filter((node) => !node.isSubscriptionValid).length,
          ],
        ]}
      />
      <FilterBar
        query={query}
        onQueryChange={onQueryChange}
        placeholder="Search by name or city…"
      >
        <select
          className="filter-select"
          value={type}
          onChange={(event) => onTypeChange(event.target.value)}
        >
          <option value="">All Types</option>
          <option value="WAREHOUSE">Warehouse</option>
          <option value="TRANSIT_HUB">Transit Hub</option>
          <option value="LOCAL_AGENCY">Local Agency</option>
        </select>
        <select
          className="filter-select"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="">All Status</option>
          <option value="valid">Subscription Valid</option>
          <option value="expired">Subscription Expired</option>
        </select>
      </FilterBar>
      <DataTable
        headers={["Node", "Type", "City", "Active", "Subscription", "Expires"]}
        columns={6}
        loading={loading}
        error={error}
        isEmpty={!filteredData.length}
        emptyMessage="No nodes found."
      >
        <NodeRows nodes={filteredData} />
      </DataTable>
    </>
  );
}
