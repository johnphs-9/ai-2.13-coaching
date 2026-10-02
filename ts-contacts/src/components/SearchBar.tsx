// src/components/SearchBar.tsx
export function SearchBar({ query, onQueryChange }) {
  return (
    <input
      className="search-input"
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      placeholder="Search contacts..."
    />
  );
}
