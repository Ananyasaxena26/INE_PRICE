import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import Badge from "./Badge";
import ScrapeLog from "./ScrapeLog";
import { PriceChart, StockChart } from "./Charts";
import { dateTime, inr, nextScrape, stockLabel, timeAgo } from "../format";

const POLL_MS = 10000;

function Tile({ label, children }) {
  return (
    <div className="tile">
      <div className="tile-label">{label}</div>
      <div className="tile-value">{children}</div>
    </div>
  );
}

export default function ProductDetail({ product, onChanged, onRemoved }) {
  const id = product.product_id;
  const activeId = useRef(id);
  const [history, setHistory] = useState(null);
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [view, setView] = useState("chart");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [h, l] = await Promise.all([api.history(id), api.logs(id)]);
      if (activeId.current !== id) return; // user already switched to another product
      setHistory(h);
      setLogs(l);
      setError("");
    } catch (e) {
      if (activeId.current === id) setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    activeId.current = id;
    setHistory(null);
    setLogs(null);
    setNote("");
    setError("");
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [id, load]);

  async function scrapeNow() {
    setBusy(true);
    setNote("");
    try {
      await api.scrapeNow(id);
      setNote("Scrape queued. The result appears here in about a minute.");
      onChanged();
    } catch (e) {
      setNote(e.status === 429 ? `Scraped very recently. Try again in ${e.body?.retryAfterSeconds ?? "a few"} seconds.` : e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Stop tracking “${product.name}”? Its history will be deleted.`)) return;
    try {
      await api.untrack(id);
      onRemoved(id);
    } catch (e) {
      setNote(e.message);
    }
  }

  const latest = history && history.length ? history[history.length - 1] : null;
  const price = latest ? latest.price : product.latest_price;

  return (
    <div className="detail">
      <section className="card">
        <div className="detail-head">
          <div>
            <h2 className="detail-title">{product.name}</h2>
            <div className="muted">
              {product.brand} · {product.category} · SKU {product.sku}
            </div>
          </div>
          <div className="actions">
            <button className="btn" onClick={scrapeNow} disabled={busy}>
              Scrape now
            </button>
            <button className="btn btn-danger" onClick={remove}>
              Stop tracking
            </button>
          </div>
        </div>

        {note && <p className="note">{note}</p>}
        {product.last_outcome === "failed" && (
          <p className="warning">
            The latest scrape failed{product.last_error ? `: ${product.last_error}` : "."}{" "}
            {history && history.length
              ? "No bad data was saved; the figures below are from the last successful scrape."
              : "Nothing has been saved for this product yet, because no scrape has succeeded so far."}
          </p>
        )}

        <div className="tiles">
          <Tile label="Current price">
            <span className="big">{inr(price)}</span>
          </Tile>
          <Tile label="MRP">{latest ? inr(latest.mrp) : "—"}</Tile>
          <Tile label="Stock">{stockLabel(latest ? latest.in_stock : product.latest_in_stock, latest ? latest.stock_qty : product.latest_stock_qty)}</Tile>
          <Tile label="Seller">{latest?.seller || "—"}</Tile>
          <Tile label="Delivery">{latest?.delivery || "—"}</Tile>
          <Tile label="Last check">
            <Badge outcome={product.last_outcome} /> <span className="small muted">{timeAgo(product.last_attempt_at)}</span>
          </Tile>
          <Tile label="Next scheduled scrape">{nextScrape(product.last_attempt_at, product.interval_minutes)}</Tile>
          <Tile label="Runs every">{Math.round((product.interval_minutes || 120) / 60 * 10) / 10} h</Tile>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="card">
        <div className="section-head">
          <h3>Price history</h3>
          <div className="toggle">
            <button className={view === "chart" ? "on" : ""} onClick={() => setView("chart")}>
              Chart
            </button>
            <button className={view === "table" ? "on" : ""} onClick={() => setView("table")}>
              Table
            </button>
          </div>
        </div>

        {history === null && <p className="muted">Loading…</p>}
        {history && history.length === 0 && (
          <p className="muted">
            {product.last_outcome === "failed"
              ? "No price recorded yet: the scrape attempts so far failed (see the scrape log below). The next scheduled run will try again."
              : "No price recorded yet. The first scrape is queued and takes about a minute; this page updates by itself."}
          </p>
        )}

        {history && history.length > 0 && view === "chart" && (
          <>
            <PriceChart history={history} />
            <h3 className="sub">Stock</h3>
            <StockChart history={history} />
          </>
        )}

        {history && history.length > 0 && view === "table" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Price</th>
                  <th>MRP</th>
                  <th>Discount label</th>
                  <th>Stock</th>
                  <th>Seller</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((h) => (
                  <tr key={h.id}>
                    <td>{dateTime(h.scraped_at)}</td>
                    <td>{inr(h.price)}</td>
                    <td>{inr(h.mrp)}</td>
                    <td>{h.discount_label || "—"}</td>
                    <td>{stockLabel(h.in_stock, h.stock_qty)}</td>
                    <td>{h.seller || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-head">
          <h3>Scrape log</h3>
          <span className="muted small">Every run is listed, including failures. Click a row to see each attempt.</span>
        </div>
        {logs === null ? <p className="muted">Loading…</p> : <ScrapeLog logs={logs} />}
      </section>
    </div>
  );
}
