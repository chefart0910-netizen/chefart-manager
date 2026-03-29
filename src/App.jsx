import React, { useEffect, useMemo, useState } from "react";

const I18N = {
  he: {
    login: "כניסת מנהל",
    loginBtn: "התחבר",
    title: "ניהול הזמנות Chef Art",
    subtitle: "ניהול תפריטים, בדיקת קומבו, מיון הזמנות וסיכום מנות",
    newOrder: "הזמנה חדשה",
    orders: "רשימת הזמנות",
    summary: "סיכום מנות",
    menus: "ניהול תפריטים",
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
    placeholder: "שורה לכל מנה. מותר לבחור אותה מנה פעמיים",
    menuEditor: "עריכת קומבואים",
    itemEditor: "עריכת מנות וקטגוריות",
    comboCode: "קוד קומבו",
    comboNameHe: "שם קומבו בעברית",
    comboNameRu: "שם קומבו ברוסית",
    allowDuplicates: "מותר כפילויות",
    category: "קטגוריה",
    count: "כמות",
    addRule: "הוסף חוק",
    addCombo: "הוסף קומבו",
    saveMenus: "שמור תפריטים",
    itemName: "שם מנה",
    addItem: "הוסף מנה",
    free: "חופשי",
    main: "עיקרית",
    side: "תוספת",
    ordersCount: "מספר הזמנות",
    itemsCount: "מספר מנות שונות",
    check: "בדיקה",
    qty: "כמות",
    yes: "כן",
    no: "לא",
    remove: "מחק"
  },
  ru: {
    login: "Вход администратора",
    loginBtn: "Войти",
    title: "Управление заказами Chef Art",
    subtitle: "Управление меню, проверка комбо, сортировка заказов и сводка блюд",
    newOrder: "Новый заказ",
    orders: "Список заказов",
    summary: "Сводка блюд",
    menus: "Управление меню",
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
    placeholder: "Одна строка = одно блюдо. Одинаковые блюда можно выбирать повторно",
    menuEditor: "Редактор комбо",
    itemEditor: "Редактор блюд и категорий",
    comboCode: "Код комбо",
    comboNameHe: "Название комбо на иврите",
    comboNameRu: "Название комбо на русском",
    allowDuplicates: "Разрешить повторы",
    category: "Категория",
    count: "Количество",
    addRule: "Добавить правило",
    addCombo: "Добавить комбо",
    saveMenus: "Сохранить меню",
    itemName: "Название блюда",
    addItem: "Добавить блюдо",
    free: "Свободная",
    main: "Основное",
    side: "Гарнир",
    ordersCount: "Количество заказов",
    itemsCount: "Количество разных блюд",
    check: "Проверка",
    qty: "Кол-во",
    yes: "Да",
    no: "Нет",
    remove: "Удалить"
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
  const [menus, setMenus] = useState({ combos: {}, items: [] });
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
    loadInitial();
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;
    loadOrders();
  }, [sortBy, dir]);

  async function loadInitial() {
    try {
      const [metaRes, nextRes] = await Promise.all([
        fetch("/api/meta"),
        fetch("/api/next-order-number")
      ]);
      const metaData = await metaRes.json();
      const nextData = await nextRes.json();

      if (metaData.success) {
        setMenus(metaData.menus || { combos: {}, items: [] });
        const comboKeys = Object.keys(metaData.menus?.combos || {});
        if (comboKeys.length > 0) {
          setForm((prev) => ({ ...prev, comboCode: comboKeys[0] }));
        }
      }

      if (nextData.success) {
        setOrderNumber(nextData.orderNumber || "");
      }

      await loadOrders();
    } catch (error) {
      console.error(error);
      alert("Load error");
    }
  }

  async function loadOrders() {
    try {
      const params = new URLSearchParams({ sortBy, dir });
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadSummary(date) {
    try {
      const params = new URLSearchParams();
      if (date) params.set("deliveryDate", date);
      const res = await fetch(`/api/summary?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSummaryRows(data.summary || []);
        setSummaryOrdersCount(data.ordersCount || 0);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const deliveryDates = useMemo(() => {
    return [...new Set(orders.map((o) => o.deliveryDate).filter(Boolean))].sort();
  }, [orders]);

  const comboCodes = useMemo(() => Object.keys(menus.combos || {}), [menus]);

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  async function saveOrder() {
    try {
      const payload = {
        orderNumber,
        comboCode: form.comboCode,
        customerName: form.customerName,
        phone: form.phone,
        orderDate: form.orderDate,
        deliveryDate: form.deliveryDate,
        total: form.total,
        items: parseItems(form.itemsText)
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!data.success) {
        alert("Error");
        return;
      }

      alert(data.record?.validation?.ok ? t.validationOk : t.validationBad);

      setForm({
        comboCode: comboCodes[0] || "250",
        customerName: "",
        phone: "",
        orderDate: "",
        deliveryDate: "",
        total: "",
        itemsText: ""
      });

      const next = await fetch("/api/next-order-number").then((r) => r.json());
      if (next.success) setOrderNumber(next.orderNumber || "");
      await loadOrders();
      if (summaryDate) await loadSummary(summaryDate);
      setTab("orders");
    } catch (error) {
      console.error(error);
      alert("Save error");
    }
  }

  function updateCombo(code, field, value) {
    setMenus((prev) => ({
      ...prev,
      combos: {
        ...prev.combos,
        [code]: { ...prev.combos[code], [field]: value }
      }
    }));
  }

  function updateRule(code, idx, field, value) {
    setMenus((prev) => {
      const combo = prev.combos[code];
      const rules = [...(combo.rules || [])];
      rules[idx] = {
        ...rules[idx],
        [field]: field === "count" ? Number(value) : value
      };
      return {
        ...prev,
        combos: { ...prev.combos, [code]: { ...combo, rules } }
      };
    });
  }

  function addRule(code) {
    setMenus((prev) => {
      const combo = prev.combos[code];
      return {
        ...prev,
        combos: {
          ...prev.combos,
          [code]: {
            ...combo,
            rules: [...(combo.rules || []), { category: "free", count: 1 }]
          }
        }
      };
    });
  }

  function removeRule(code, idx) {
    setMenus((prev) => {
      const combo = prev.combos[code];
      return {
        ...prev,
        combos: {
          ...prev.combos,
          [code]: {
            ...combo,
            rules: (combo.rules || []).filter((_, i) => i !== idx)
          }
        }
      };
    });
  }

  function addCombo() {
    const code = `new${Date.now()}`;
    setMenus((prev) => ({
      ...prev,
      combos: {
        ...prev.combos,
        [code]: {
          code,
          nameHe: "",
          nameRu: "",
          allowDuplicates: true,
          rules: [{ category: "free", count: 1 }]
        }
      }
    }));
  }

  function removeCombo(code) {
    setMenus((prev) => {
      const nextCombos = { ...prev.combos };
      delete nextCombos[code];
      return { ...prev, combos: nextCombos };
    });
  }

  function updateItem(idx, field, value) {
    setMenus((prev) => {
      const items = [...(prev.items || [])];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  }

  function addItem() {
    setMenus((prev) => ({
      ...prev,
      items: [...(prev.items || []), { name: "", category: "free" }]
    }));
  }

  function removeItem(idx) {
    setMenus((prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== idx)
    }));
  }

  async function saveMenus() {
    try {
      const res = await fetch("/api/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(menus)
      });
      const data = await res.json();
      if (data.success) {
        alert("Saved");
        setMenus(data.menus || menus);
      } else {
        alert("Error");
      }
    } catch (error) {
      console.error(error);
      alert("Save error");
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
              <button
                className="btn-secondary"
                onClick={() => setLang(lang === "he" ? "ru" : "he")}
              >
                {lang === "he" ? "RU" : "HE"}
              </button>

              <button className="btn-primary" onClick={() => setLoggedIn(true)}>
                {t.loginBtn}
              </button>
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
            <p>{t.subtitle}</p>
          </div>

          <div className="actions" style={{ marginTop: 0 }}>
            <div className="chip">ORD: {orderNumber || "..."}</div>
            <button
              className={`tab ${tab === "new" ? "active" : ""}`}
              onClick={() => setTab("new")}
            >
              {t.newOrder}
            </button>
            <button
              className={`tab ${tab === "orders" ? "active" : ""}`}
              onClick={() => setTab("orders")}
            >
              {t.orders}
            </button>
            <button
              className={`tab ${tab === "summary" ? "active" : ""}`}
              onClick={() => setTab("summary")}
            >
              {t.summary}
            </button>
            <button
              className={`tab ${tab === "menus" ? "active" : ""}`}
              onClick={() => setTab("menus")}
            >
              {t.menus}
            </button>
            <button
              className="btn-secondary"
              onClick={() => setLang(lang === "he" ? "ru" : "he")}
            >
              {lang === "he" ? "RU" : "HE"}
            </button>
          </div>
        </div>

        <div className="content">
          {tab === "new" && (
            <div>
              <div className="grid">
                <label className="field">
                  <span>{t.combo}</span>
                  <select className="select" value={form.comboCode} onChange={setField("comboCode")}>
                    {comboCodes.map((code) => (
                      <option key={code} value={code}>
                        {lang === "he" ? menus.combos[code]?.nameHe : menus.combos[code]?.nameRu}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>{t.customerName}</span>
                  <input className="input" value={form.customerName} onChange={setField("customerName")} />
                </label>

                <label className="field">
                  <span>{t.phone}</span>
                  <input className="input" value={form.phone} onChange={setField("phone")} />
                </label>

                <label className="field">
                  <span>{t.orderDate}</span>
                  <input className="input" type="date" value={form.orderDate} onChange={setField("orderDate")} />
                </label>

                <label className="field">
                  <span>{t.deliveryDate}</span>
                  <input className="input" type="date" value={form.deliveryDate} onChange={setField("deliveryDate")} />
                </label>

                <label className="field">
                  <span>{t.total}</span>
                  <input className="input" value={form.total} onChange={setField("total")} />
                </label>

                <label className="field full">
                  <span>{t.items}</span>
                  <textarea
                    className="textarea"
                    value={form.itemsText}
                    onChange={setField("itemsText")}
                    placeholder={t.placeholder}
                  />
                </label>
              </div>

              <div className="actions">
                <button className="btn-primary" onClick={saveOrder}>
                  {t.save}
                </button>
              </div>
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
                      <th>{t.check}</th>
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
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="7" className="note">-</td>
                      </tr>
                    )}
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
                  {deliveryDates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <button className="btn-primary" onClick={() => loadSummary(summaryDate)}>
                  {t.loadSummary}
                </button>
              </div>

              <div className="kpi">
                <div className="box">
                  <div className="note">{t.deliveryDate}</div>
                  <strong>{summaryDate || "-"}</strong>
                </div>

                <div className="box">
                  <div className="note">{t.ordersCount}</div>
                  <strong>{summaryOrdersCount}</strong>
                </div>

                <div className="box">
                  <div className="note">{t.itemsCount}</div>
                  <strong>{summaryRows.length}</strong>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t.items}</th>
                      <th>{t.qty}</th>
                      <th>{t.orders}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.name}</td>
                        <td>{row.quantityTotal}</td>
                        <td>{row.ordersCount}</td>
                      </tr>
                    ))}
                    {summaryRows.length === 0 && (
                      <tr>
                        <td colSpan="3" className="note">-</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "menus" && (
            <div className="two-col">
              <div className="panel">
                <h3>{t.menuEditor}</h3>

                {comboCodes.map((code) => (
                  <div
                    key={code}
                    style={{
                      border: "1px solid #e0e7ef",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 12
                    }}
                  >
                    <div className="grid">
                      <label className="field">
                        <span>{t.comboCode}</span>
                        <input className="input" value={menus.combos[code]?.code || ""} onChange={(e) => updateCombo(code, "code", e.target.value)} />
                      </label>

                      <label className="field">
                        <span>{t.allowDuplicates}</span>
                        <select
                          className="select"
                          value={String(menus.combos[code]?.allowDuplicates)}
                          onChange={(e) => updateCombo(code, "allowDuplicates", e.target.value === "true")}
                        >
                          <option value="true">{t.yes}</option>
                          <option value="false">{t.no}</option>
                        </select>
                      </label>

                      <label className="field">
                        <span>{t.comboNameHe}</span>
                        <input className="input" value={menus.combos[code]?.nameHe || ""} onChange={(e) => updateCombo(code, "nameHe", e.target.value)} />
                      </label>

                      <label className="field">
                        <span>{t.comboNameRu}</span>
                        <input className="input" value={menus.combos[code]?.nameRu || ""} onChange={(e) => updateCombo(code, "nameRu", e.target.value)} />
                      </label>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      {(menus.combos[code]?.rules || []).map((rule, idx) => (
                        <div className="rule-row" key={idx}>
                          <select
                            className="select"
                            value={rule.category}
                            onChange={(e) => updateRule(code, idx, "category", e.target.value)}
                          >
                            <option value="free">{t.free}</option>
                            <option value="main">{t.main}</option>
                            <option value="side">{t.side}</option>
                          </select>

                          <input
                            className="input"
                            type="number"
                            value={rule.count}
                            onChange={(e) => updateRule(code, idx, "count", e.target.value)}
                          />

                          <button className="btn-danger" onClick={() => removeRule(code, idx)}>
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="actions">
                      <button className="btn-secondary" onClick={() => addRule(code)}>
                        {t.addRule}
                      </button>
                      <button className="btn-danger" onClick={() => removeCombo(code)}>
                        {t.remove}
                      </button>
                    </div>
                  </div>
                ))}

                <div className="actions">
                  <button className="btn-secondary" onClick={addCombo}>
                    {t.addCombo}
                  </button>
                </div>
              </div>

              <div className="panel">
                <h3>{t.itemEditor}</h3>

                {(menus.items || []).map((item, idx) => (
                  <div className="item-row" key={idx}>
                    <input
                      className="input"
                      value={item.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                      placeholder={t.itemName}
                    />

                    <select
                      className="select"
                      value={item.category}
                      onChange={(e) => updateItem(idx, "category", e.target.value)}
                    >
                      <option value="free">{t.free}</option>
                      <option value="main">{t.main}</option>
                      <option value="side">{t.side}</option>
                    </select>

                    <button className="btn-danger" onClick={() => removeItem(idx)}>
                      ×
                    </button>
                  </div>
                ))}

                <div className="actions">
                  <button className="btn-secondary" onClick={addItem}>
                    {t.addItem}
                  </button>
                  <button className="btn-primary" onClick={saveMenus}>
                    {t.saveMenus}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
