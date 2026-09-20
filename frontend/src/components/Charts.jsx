import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { inr } from "../format";

const shortTime = (t) =>
  new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const toPoints = (history) =>
  history.map((h) => ({
    t: new Date(h.scraped_at).getTime(),
    price: h.price,
    mrp: h.mrp,
    stock: h.stock_qty
  }));

export function PriceChart({ history }) {
  const data = toPoints(history);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={shortTime} fontSize={12} />
        <YAxis domain={["auto", "auto"]} tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`} width={72} fontSize={12} />
        <Tooltip labelFormatter={shortTime} formatter={(v, name) => [inr(v), name]} />
        <Legend />
        <Line type="monotone" dataKey="price" name="Price" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
        <Line type="monotone" dataKey="mrp" name="MRP" stroke="#9ca3af" strokeDasharray="5 4" dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StockChart({ history }) {
  const data = toPoints(history).filter((p) => p.stock != null);
  if (!data.length) return <p className="muted">No stock quantity recorded yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={shortTime} fontSize={12} />
        <YAxis allowDecimals={false} width={72} fontSize={12} />
        <Tooltip labelFormatter={shortTime} formatter={(v) => [v, "Units in stock"]} />
        <Line type="stepAfter" dataKey="stock" name="Units in stock" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
