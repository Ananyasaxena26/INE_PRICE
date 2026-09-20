import { useEffect, useState } from "react";
import { api } from "../api";

export default function Search({ trackedIds, onTrack }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // null = nothing searched yet
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  // search 350 ms after the user stops typing
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 && !/^\d+$/.test(q)) {
      setResults(null);
      setMessage("");
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setMessage("");
      try {
        const rows = await api.search(q);
        if (!cancelled) setResults(rows);
      } catch (e) {
        if (!cancelled) {
          setResults([]);
          setMessage(e.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  async function track(id) {
    setBusyId(id);
    setMessage("");
    try {
      await onTrack(id);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="card">
      <h2>Find a product</h2>
      <input
        className="input"
        type="search"
        placeholder="Type part of a name, e.g. “AR glasses” or “headphones”"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <p className="muted">Searching…</p>}
      {message && <p className="error">{message}</p>}
      {results && !loading && results.length === 0 && !message && <p className="muted">No products match “{query}”.</p>}

      {results && results.length > 0 && (
        <ul className="results">
          {results.map((p) => {
            const tracked = trackedIds.has(p.id);
            return (
              <li key={p.id}>
                <div>
                  <div className="result-name">{p.name}</div>
                  <div className="muted small">
                    {p.brand} · {p.category} · {p.sku}
                  </div>
                </div>
                <button
                  className={tracked ? "btn btn-ghost" : "btn"}
                  disabled={tracked || busyId === p.id}
                  onClick={() => track(p.id)}
                >
                  {tracked ? "Tracking" : busyId === p.id ? "Adding…" : "Track"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
