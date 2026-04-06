import React, { useEffect, useState } from "react";

export default function App() {
  const [orderNumber, setOrderNumber] = useState("");
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    orderDate: "",
    deliveryDate: "",
    total: "",
    itemsText: ""
  });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [pingRes, numRes, ordersRes] = await Promise.all([
        fetch("/api/ping"),
        fetch("/api/next-order-number"),
        fetch("/api/orders")
      ]);

      const ping = await pingRes.json();
      const num = await numRes.json();
      const ord = await ordersRes.json();

      if (!ping.success) throw new Error("Ping failed");
      if (num.success) setOrderNumber(num.orderNumber || "");
      if (ord.success) setOrders(ord.orders || []);
    } catch (e) {
      alert("Load error");
      console.error(e);
    }
  }

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveOrder() {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, ...form })
      });
      const data = await res.json();
      if (!data.success) throw new Error("Save failed");

      alert("הזמנה נשמרה");
      setForm({
        customerName: "",
        phone: "",
        orderDate: "",
        deliveryDate: "",
        total: "",
        itemsText: ""
      });
      loadAll();
    } catch (e) {
      alert("Save error");
      console.error(e);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="hero">
          <div>
            <h1>Chef Art</h1>
            <p>גרסת reset נקייה ויציבה ל-Railway</p>
          </div>
          <div className="badge">ORD: {orderNumber || "..."}</div>
        </div>

        <div className="section">
          <h2>הזמנה חדשה</h2>
          <div className="grid">
            <label>
              <span>שם לקוח</span>
              <input value={form.customerName} onChange={(e) => setField("customerName", e.target.value)} />
            </label>
            <label>
              <span>טלפון</span>
              <input value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
            </label>
            <label>
              <span>תאריך הזמנה</span>
              <input type="date" value={form.orderDate} onChange={(e) => setField("orderDate", e.target.value)} />
            </label>
            <label>
              <span>תאריך אספקה</span>
              <input type="date" value={form.deliveryDate} onChange={(e) => setField("deliveryDate", e.target.value)} />
            </label>
            <label>
              <span>סכום</span>
              <input value={form.total} onChange={(e) => setField("total", e.target.value)} />
            </label>
            <label className="full">
              <span>פריטי הזמנה</span>
              <textarea value={form.itemsText} onChange={(e) => setField("itemsText", e.target.value)} />
            </label>
          </div>
          <button className="primary" onClick={saveOrder}>שמור הזמנה</button>
        </div>

        <div className="section">
          <h2>רשימת הזמנות</h2>
          <table>
            <thead>
              <tr>
                <th>ORD</th>
                <th>לקוח</th>
                <th>טלפון</th>
                <th>תאריך הזמנה</th>
                <th>תאריך אספקה</th>
                <th>סכום</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.orderNumber}</td>
                  <td>{o.customerName}</td>
                  <td>{o.phone}</td>
                  <td>{o.orderDate}</td>
                  <td>{o.deliveryDate}</td>
                  <td>{o.total}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="6">אין הזמנות</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
