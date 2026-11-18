import { Icon } from "./Icon.jsx";

export function FilterBar({ query, onQueryChange, placeholder, children }) {
  return (
    <div className="filter-row">
      <div className="search-box">
        <Icon name="fa-magnifying-glass" />
        <input
          placeholder={placeholder}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>
      {children}
    </div>
  );
}
