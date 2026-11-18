import { Performance } from "../components/Performance.jsx";

export function AnalyticsPage({ data, error, loading, onRefresh }) {
  return (
    <Performance
      data={data}
      error={error}
      loading={loading}
      onRetry={onRefresh}
    />
  );
}
