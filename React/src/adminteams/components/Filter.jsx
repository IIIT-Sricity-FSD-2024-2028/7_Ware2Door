import { Icon } from "./Icon.jsx";

export function Filter({ query, setQuery, placeholder, extra }) {
  return (
    <div className="filter-row">
      <div className="search-box">
        <Icon name="fa-magnifying-glass" />
        <input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {extra}
    </div>
  );
}
