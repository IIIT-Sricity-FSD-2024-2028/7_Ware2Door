import { useEffect, useMemo, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import { Icon } from "./Icon.jsx";
import { Welcome } from "./Welcome.jsx";

const tabs = [
  ["WH", "warehouses", "fa-warehouse", "Warehouses", "Warehouse"],
  ["HUB", "hubs", "fa-building", "Transit Hubs", "Transit Hub"],
  ["AG", "agencies", "fa-truck-fast", "Local Agencies", "Local Agency"],
];

const metrics = {
  WH: [
    ["inventory", "Inventory", "#14b8a6"],
    ["pending", "Pending Orders", "#f59e0b"],
    ["rto", "RTO", "#ef4444"],
  ],
  HUB: [
    ["inScanned", "In-Scanned", "#3b82f6"],
    ["outScanned", "Out-Scanned", "#22c55e"],
    ["capacity", "Capacity", "#64748b"],
  ],
  AG: [
    ["deliveredToday", "Delivered Today", "#22c55e"],
    ["rtoRaised", "RTO Raised", "#ef4444"],
    ["agents", "Active Agents", "#3b82f6"],
  ],
};

const cards = {
  WH: [
    ["#f0fdfa", "#99f6e4"],
    ["#fffbeb", "#fde68a"],
    ["#fff1f2", "#fecdd3"],
  ],
  HUB: [
    ["#eff6ff", "#bfdbfe"],
    ["#f0fdf4", "#bbf7d0"],
    ["#f8fafc", "#e2e8f0"],
  ],
  AG: [
    ["#f0fdf4", "#bbf7d0"],
    ["#fff1f2", "#fecdd3"],
    ["#eff6ff", "#bfdbfe"],
  ],
};

const number = (value) => Number(value || 0).toLocaleString();

export function Performance({ data, loading, error, onRetry }) {
  const [tab, setTab] = useState("WH");
  const [index, setIndex] = useState(0);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const current = tabs.find((item) => item[0] === tab);
  const entities = data?.[current[1]] || [];
  const entity = entities[index];
  const definitions = metrics[tab];
  const values = useMemo(
    () => definitions.map(([key]) => Number(entity?.[key] || 0)),
    [definitions, entity],
  );

  useEffect(() => setIndex(0), [tab, data]);

  useEffect(() => {
    if (!entity || !canvasRef.current) return undefined;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: definitions.map(([, label]) => label),
        datasets: [
          {
            label: tab === "HUB" ? "Packages" : "Count",
            data: values,
            backgroundColor: `${definitions[0][2]}33`,
            borderColor: definitions.map(([, , color]) => color),
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 900,
          easing: "easeOutQuart",
          delay: (context) =>
            context.type === "data" && context.mode === "default"
              ? context.dataIndex * 220
              : 0,
        },
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "#f1f5f9" },
            ticks: { font: { family: "Poppins", size: 12 } },
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: "Poppins", size: 12 } },
          },
        },
      },
    });
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [entity, definitions, tab, values]);

  return (
    <>
      <Welcome
        role="super"
        icon="fa-chart-bar"
        title="Node Performance Analytics"
        description="Monitor live key metrics for Warehouses, Transit Hubs, and Local Agencies — inventory, scan counts, delivery rates, and capacity usage."
        color="linear-gradient(135deg,#0c2340 0%,#1e3a5f 55%,#2563eb 100%)"
      >
        <button className="btn-primary" onClick={onRetry}>
          <Icon name="fa-rotate" /> Refresh Data
        </button>
      </Welcome>
      <div className="perf-tabs">
        {tabs.map(([id, , icon, label]) => (
          <button
            key={id}
            className={`perf-tab${tab === id ? " active-tab" : ""}`}
            onClick={() => setTab(id)}
          >
            <Icon name={icon} /> {label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="table-card">
          <p className="empty-msg">
            <Icon name="fa-spinner fa-spin" /> Loading…
          </p>
        </div>
      ) : error ? (
        <div className="table-card">
          <p className="empty-msg">
            <Icon name="fa-triangle-exclamation" /> {error}
          </p>
        </div>
      ) : !entities.length ? (
        <div className="table-card">
          <p className="empty-msg">No performance data found.</p>
        </div>
      ) : (
        <>
          <div className="perf-selector">
            <label>Select {current[4]}:</label>
            <select
              value={index}
              onChange={(event) => setIndex(Number(event.target.value))}
            >
              {entities.map((item, itemIndex) => (
                <option
                  value={itemIndex}
                  key={item.id || `${item.name}-${itemIndex}`}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="table-card perf-card">
            <div className="perf-metric-cards">
              {definitions.map(([key, label, color], metricIndex) => (
                <div
                  key={key}
                  className="perf-metric"
                  style={{
                    background: cards[tab][metricIndex][0],
                    borderColor: cards[tab][metricIndex][1],
                  }}
                >
                  <div style={{ color }}>{label.toUpperCase()}</div>
                  <strong>
                    {key === "capacity"
                      ? `${entity[key] || 0}%`
                      : number(entity[key])}
                  </strong>
                </div>
              ))}
            </div>
            <div className="perf-chart">
              <canvas ref={canvasRef} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
