import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import Search from "./components/Search";
import TrackedList from "./components/TrackedList";
import ProductDetail from "./components/ProductDetail";

const POLL_MS = 10000;

export default function App() {
  const [tracked, setTracked] = useState(null); // null = still loading
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [waking, setWaking] = useState(false);

  const loadTracked = useCallback(async () => {
    try {
      setTracked(await api.tracked());
      setError("");
    } catch (e) {
      setError(`Could not reach the server: ${e.message}`);
    }
  }, []);

  useEffect(() => {
    loadTracked();
    const timer = setInterval(loadTracked, POLL_MS);
    return () => clearInterval(timer);
  }, [loadTracked]);

  // the free backend sleeps when idle; tell the user instead of showing a blank page
  useEffect(() => {
    if (tracked !== null) {
      setWaking(false);
      return;
    }
    const timer = setTimeout(() => setWaking(true), 5000);
    return () => clearTimeout(timer);
  }, [tracked]);

  // keep a valid product selected
  useEffect(() => {
    if (!tracked) return;
    if (!tracked.some((p) => p.product_id === selectedId)) {
      setSelectedId(tracked.length ? tracked[0].product_id : null);
    }
  }, [tracked, selectedId]);

  const trackedIds = useMemo(() => new Set((tracked || []).map((p) => p.product_id)), [tracked]);
  const selected = tracked ? tracked.find((p) => p.product_id === selectedId) : null;

  async function handleTrack(id) {
    await api.track(id);
    await loadTracked();
    setSelectedId(id);
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1>INE Price Tracker</h1>
        <p className="muted">Search a product, track it, and watch its price and stock change over time.</p>
      </header>

      {waking && (
        <p className="note">The server is on a free plan and goes to sleep when idle. It is waking up now, which can take up to a minute.</p>
      )}
      {error && <p className="error">{error}</p>}

      <div className="layout">
        <div className="left">
          <Search trackedIds={trackedIds} onTrack={handleTrack} />
          <TrackedList tracked={tracked} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        <div className="right">
          {selected ? (
            <ProductDetail
              key={selected.product_id}
              product={selected}
              onChanged={loadTracked}
              onRemoved={(id) => {
                setSelectedId(null);
                setTracked((rows) => (rows ? rows.filter((p) => p.product_id !== id) : rows));
                loadTracked();
              }}
            />
          ) : (
            <section className="card empty">
              <h2>No product selected</h2>
              <p className="muted">Search for a product on the left and press Track. The chart, stock history and scrape log appear here.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
