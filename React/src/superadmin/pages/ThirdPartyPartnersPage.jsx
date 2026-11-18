import { DataTable } from "../components/DataTable.jsx";
import { FilterBar } from "../components/FilterBar.jsx";
import { Icon } from "../components/Icon.jsx";
import { Stats } from "../components/Stats.jsx";
import { Welcome } from "../components/Welcome.jsx";

export function ThirdPartyPartnersPage({
  data,
  filteredData,
  error,
  loading,
  query,
  onQueryChange,
  status,
  onStatusChange,
  onRefresh,
}) {
  return (
    <>
      <Welcome
        icon="fa-handshake"
        title="Third Party API Usage"
        description="Monitor external partners and their monthly API call usage against their tier limits."
      >
        <button className="btn-ghost" onClick={onRefresh}>
          <Icon name="fa-rotate" /> Refresh
        </button>
      </Welcome>
      <Stats
        items={[
          ["fa-users", "var(--purple)", "Total Partners", data.length],
          [
            "fa-circle-check",
            "var(--green)",
            "Active",
            data.filter((partner) => partner.isActive).length,
          ],
          [
            "fa-triangle-exclamation",
            "var(--red)",
            "Near/Over Limit",
            data.filter(
              (partner) =>
                partner.limit > 0 &&
                partner.currentMonthUsage / partner.limit >= 0.8,
            ).length,
          ],
        ]}
      />
      <FilterBar
        query={query}
        onQueryChange={onQueryChange}
        placeholder="Search partner name…"
      >
        <select
          className="filter-select"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FilterBar>
      <DataTable
        headers={[
          "Partner",
          "Tier",
          "Status",
          "Usage This Month",
          "Within Limit",
        ]}
        columns={5}
        loading={loading}
        error={error}
        isEmpty={!filteredData.length}
        emptyMessage="No partners found."
      >
        {filteredData.map((partner) => {
          const percentage =
            partner.limit > 0
              ? Math.min(
                  100,
                  Math.round((partner.currentMonthUsage / partner.limit) * 100),
                )
              : 0;

          return (
            <tr key={partner.id || partner.name}>
              <td>
                <strong>{partner.name}</strong>
              </td>
              <td>{partner.tier}</td>
              <td>
                <span
                  className={`sub-status ${partner.isActive ? "sub-active" : "sub-expired"}`}
                >
                  <Icon
                    name={
                      partner.isActive ? "fa-circle-check" : "fa-circle-pause"
                    }
                  />{" "}
                  {partner.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td>
                {Number(partner.currentMonthUsage || 0).toLocaleString()} /{" "}
                {Number(partner.limit || 0).toLocaleString()} ({percentage}%)
              </td>
              <td>
                <span
                  className={`sub-status ${partner.withinLimit ? "sub-active" : "sub-expired"}`}
                >
                  {partner.withinLimit ? "Within Limit" : "Exceeded"}
                </span>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </>
  );
}
