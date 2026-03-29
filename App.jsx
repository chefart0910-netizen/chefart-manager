import React, { useEffect, useMemo, useState } from "react";

const I18N = {
  he: {
    login: "כניסת מנהל",
    loginBtn: "התחבר",
    title: "ניהול הזמנות Chef Art",
    newOrder: "הזמנה חדשה",
    orders: "רשימת הזמנות",
    summary: "סיכום מנות",
    combo: "קומבו",
    customerName: "שם לקוח",
    phone: "טלפון",
    orderDate: "תאריך הזמנה",
    deliveryDate: "תאריך אספקה",
    total: "סכום סופי",
    items: "פריטי הזמנה",
    save: "שמור הזמנה",
    sortDelivery: "מיון לפי תאריך אספקה",
    sortOrder: "מיון לפי תאריך הזמנה",
    sortCustomer: "מיון לפי שם לקוח",
    sortTotal: "מיון לפי סכום",
    newest: "מהחדש לישן",
    oldest: "מהישן לחדש",
    loadSummary: "טען סיכום",
    chooseDate: "בחר תאריך אספקה",
    validationOk: "הזמנה תואמת לקומבו",
    validationBad: "יש חריגה מחוקי הקומבו",
    placeholder: "שורה לכל מנה, מותר לבחור אותה מנה פעמיים"
  },
  ru: {
    login: "Вход администратора",
    loginBtn: "Войти",
    title: "Управление заказами Chef Art",
    newOrder: "Новый заказ",
    orders: "Список заказов",
    summary: "Сводка блюд",
    combo: "Комбо",
    customerName: "Имя клиента",
    phone: "Телефон",
    orderDate: "Дата заказа",
    deliveryDate: "Дата доставки",
    total: "Итоговая сумма",
    items: "Позиции заказа",
    save: "Сохранить заказ",
    sortDelivery: "Сортировка по дате доставки",
    sortOrder: "Сортировка по дате заказа",
    sortCustomer: "Сортировка по имени клиента",
    sortTotal: "Сортировка по сумме",
    newest: "Сначала новые",
    oldest: "Сначала старые",
    loadSummary: "Загрузить сводку",
    chooseDate: "Выберите дату доставки",
    validationOk: "Заказ соответствует правилам комбо",
    validationBad: "Есть отклонение от правил комбо",
    placeholder: "Одна строка = одно блюдо, одинаковые блюда можно выбирать повторно"
  }
};

function parseItems(itemsText) {
  return String(itemsText || "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((line) => ({ name: line, quantity: 1 }));
}

export default function App() {
  const [lang, setLang] = useState("he");
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState("new");
  const [meta, setMeta] = useState({ combos: {} });
  const [orderNumber, setOrderNumber] = useState("");
  const [orders, setOrders] = useState([]);
  const [summaryDate, setSummaryDate] = useState("");
  const [summaryRows, setSummaryRows] = useState([]);
  const [summaryOrdersCount, setSummaryOrdersCount] = useState(0);
  const [sortBy, setSortBy] = useState("deliveryDate");
  const [dir, setDir] = useState("desc");
  const [form, setForm] = useState({
    comboCode: "250",
    customerName: "",
    phone: "",
    orderDate: "",
    deliveryDate: "",
    total: "",
    itemsText: ""
  });

  const t = I18N[lang];

  useEffect(() => {
    if (!loggedIn) return;
    Promise.all([
      fetch("/api/meta").then(r => r.json()),
      fetch("/api/next-order-number").then(r => r.json()),
      loadOrders()
    ]).then(([metaData, orderData]) => {
      if (metaData.success) setMeta(metaData);
      if (orderData.success) setOrderNumber(orderData.orderNumber);
    });
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;
    loadOrders();
  }, [sortBy, dir]);

  async function loadOrders() {
    const params = new URLSearchParams({ sortBy, dir });
    const res = await fetch(`/api/orders?${params.toString()}`);
    const data = await res.json();
    if (data.success) setOrders(data.orders);
  }

  async function loadSummary(date) {
    const params = new URLSearchParams();
    if (date) params.set("deliveryDate", date);
    const res = await fetch(`/api/summary?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      setSummaryRows(data.summary);
      setSummaryOrdersCount(data.ordersCount);
    }
  }

  const deliveryDates = useMemo(() => [...new Set(orders.map(o => o.deliveryDate).filter(Boolean))].sort(), [orders]);
  const setField = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  async function saveOrder() {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber,
        comboCode: form.comboCode,
        customerName: form.customerName,
        phone: form.phone,
        orderDate: form.orderDate,
        deliveryDate: form.deliveryDate,
        total: form.total,
        items: parseItems(form.itemsText)
      })
    });
    const data = await res.json();
    if (data.success) {
      alert(data.record.validation.ok ? t.validationOk : t.validationBad);
      setForm({ comboCode: "250", customerName: "", phone: "", orderDate: "", deliveryDate: "", total: "", itemsText: "" });
      const next = await fetch("/api/next-order-number").then(r => r.json());
      if (next.success) setOrderNumber(next.orderNumber);
      loadOrders();
      if (summaryDate) loadSummary(summaryDate);
      setTab("orders");
    } else {
      alert("Error");
    }
  }

  if (!loggedIn) {
    return (
      <div className="app">
        <div className="login-box">
          <div className="hero">
            <div>
              <h1>Chef Art</h1>
              <p>{t.login}</p>
            </div>
            <div className="chip">HE / RU</div>
          </div>
          <div className="login-content">
            <div className="actions">
              <button className="btn-secondary" onClick={() => setLang(lang === "he" ? "ru" : "he")}>{lang === "he" ? "RU" : "HE"}</button>
              <button className="btn-primary" onClick={() => setLoggedIn(true)}>{t.loginBtn}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="card">
        <div className="hero">
          <div>
            <h1>{t.title}</h1>
            <p>ORD: {orderNumber || "..."}</p>
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            <button className={`tab ${tab === "new" ? "active" : ""}`} onClick={() => setTab("new")}>{t.newOrder}</button>
            <button className={`tab ${tab === "orders" ? "active" : ""}`} onClick={() => setTab("orders")}>{t.orders}</button>
            <button className={`tab ${tab === "summary" ? "active" : ""}`} onClick={() => setTab("summary")}>{t.summary}</button>
            <button className="btn-secondary" onClick={() => setLang(lang === "he" ? "ru" : "he")}>{lang === "he" ? "RU" : "HE"}</button>
          </div>
        </div>

        <div className="content">
          {tab === "new" && (
            <div>
              <div className="grid">
                <label className="field">
                  <span>{t.combo}</span>
                  <select className="select" value={form.comboCode} onChange={setField("comboCode")}>
                    {Object.values(meta.combos || {}).map((combo) => (
                      <option key={combo.code} value={combo.code}>{lang === "he" ? combo.nameHe : combo.nameRu}</option>
                    ))}
                  </select>
                </label>
                <label className="field"><span>{t.customerName}</span><input className="input" value={form.customerName} onChange={setField("customerName")} /></label>
                <label className="field"><span>{t.phone}</span><input className="input" value={form.phone} onChange={setField("phone")} /></label>
                <label className="field"><span>{t.orderDate}</span><input className="input" type="date" value={form.orderDate} onChange={setField("orderDate")} /></label>
                <label className="field"><span>{t.deliveryDate}</span><input className="input" type="date" value={form.deliveryDate} onChange={setField("deliveryDate")} /></label>
                <label className="field"><span>{t.total}</span><input className="input" value={form.total} onChange={setField("total")} /></label>
                <label className="field full">
                  <span>{t.items}</span>
                  <textarea className="textarea" value={form.itemsText} onChange={setField("itemsText")} placeholder={t.placeholder} />
                </label>
              </div>
              <div className="actions"><button className="btn-primary" onClick={saveOrder}>{t.save}</button></div>
            </div>
          )}

          {tab === "orders" && (
            <div>
              <div className="actions">
                <select className="select" style={{ maxWidth: 250 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="deliveryDate">{t.sortDelivery}</option>
                  <option value="orderDate">{t.sortOrder}</option>
                  <option value="customerName">{t.sortCustomer}</option>
                  <option value="total">{t.sortTotal}</option>
                </select>
                <select className="select" style={{ maxWidth: 220 }} value={dir} onChange={(e) => setDir(e.target.value)}>
                  <option value="desc">{t.newest}</option>
                  <option value="asc">{t.oldest}</option>
                </select>
              </div>
              <div className="table-wrap" style={{ marginTop: 16 }}>
                <table>
                  <thead>
                    <tr>
                      <th>ORD</th>
                      <th>{t.combo}</th>
                      <th>{t.customerName}</th>
                      <th>{t.orderDate}</th>
                      <th>{t.deliveryDate}</th>
                      <th>{t.total}</th>
                      <th>Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.orderNumber}</td>
                        <td>{o.comboCode}</td>
                        <td>{o.customerName}</td>
                        <td>{o.orderDate}</td>
                        <td>{o.deliveryDate}</td>
                        <td>{o.total}</td>
                        <td>{o.validation?.ok ? "✔" : "⚠"}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan="7" className="note">-</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "summary" && (
            <div>
              <div className="actions">
                <select className="select" style={{ maxWidth: 260 }} value={summaryDate} onChange={(e) => setSummaryDate(e.target.value)}>
                  <option value="">{t.chooseDate}</option>
                  {deliveryDates.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <button className="btn-primary" onClick={() => loadSummary(summaryDate)}>{t.loadSummary}</button>
              </div>
              <div className="kpi">
                <div className="box"><div className="note">{t.deliveryDate}</div><strong>{summaryDate || "-"}</strong></div>
                <div className="box"><div className="note">Orders</div><strong>{summaryOrdersCount}</strong></div>
                <div className="box"><div className="note">Items</div><strong>{summaryRows.length}</strong></div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>{t.items}</th><th>Qty</th><th>Orders</th></tr>
                  </thead>
                  <tbody>
                    {summaryRows.map((row, idx) => (
                      <tr key={idx}><td>{row.name}</td><td>{row.quantityTotal}</td><td>{row.ordersCount}</td></tr>
                    ))}
                    {summaryRows.length === 0 && <tr><td colSpan="3" className="note">-</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
