import Badge from "./Badge";
import { inr, stockLabel, timeAgo } from "../format";

export default function TrackedList({ tracked, selectedId, onSelect }) {
  return (
    <section className="card">
      <h2>Tracked products {tracked ? <span className="count">{tracked.length}</span> : null}</h2>

      {tracked === null && <p className="muted">Loading…</p>}
      {tracked && tracked.length === 0 && <p className="muted">Nothing tracked yet. Search above and press Track.</p>}

      {tracked && tracked.length > 0 && (
        <ul className="tracked">
          {tracked.map((p) => (
            <li
              key={p.product_id}
              className={p.product_id === selectedId ? "selected" : ""}
              onClick={() => onSelect(p.product_id)}
            >
              <div className="tracked-top">
                <span className="tracked-name">{p.name}</span>
                <span className="tracked-price">{inr(p.latest_price)}</span>
              </div>
              <div className="tracked-bottom muted small">
                <span>{stockLabel(p.latest_in_stock, p.latest_stock_qty)}</span>
                <span className="tracked-last">
                  <Badge outcome={p.last_outcome} /> {p.last_attempt_at ? timeAgo(p.last_attempt_at) : "waiting for first scrape"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
