import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "10mb" }));

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const ordersPath = path.join(dataDir, "orders.json");
const menusPath = path.join(dataDir, "menus.json");

const DEFAULT_MENUS = {
  combos: {
    "250": {
      code: "250",
      nameHe: "קומבו מיני 250",
      nameRu: "Комбо мини 250",
      allowDuplicates: true,
      rules: [
        { category: "free", count: 3 },
        { category: "main", count: 2 }
      ]
    },
    "380": {
      code: "380",
      nameHe: "קומבו 380",
      nameRu: "Меню 380",
      allowDuplicates: true,
      rules: [
        { category: "free", count: 4 },
        { category: "main", count: 2 },
        { category: "side", count: 2 }
      ]
    },
    "450": {
      code: "450",
      nameHe: "קומבו 450",
      nameRu: "Меню 450",
      allowDuplicates: true,
      rules: [
        { category: "free", count: 4 },
        { category: "main", count: 2 },
        { category: "side", count: 2 }
      ]
    }
  },
  items: [
    { name: "Борщ с мясом", category: "free" },
    { name: "Солянка мясная", category: "free" },
    { name: "Салат с крабовыми палочками", category: "free" },
    { name: "Салат Цезарь с курицей", category: "free" },
    { name: "Пюре", category: "free" },
    { name: "Рис припущенный", category: "free" },
    { name: "Картошка с чесноком", category: "free" },
    { name: "Спагетти с соусом песто", category: "free" },
    { name: "Блины с вишнями", category: "free" },
    { name: "Десерт тирамису", category: "free" },
    { name: "Ноги куриные гриль", category: "main" },
    { name: "Котлеты домашние мясные", category: "main" },
    { name: "Мушт на гриле", category: "main" },
    { name: "Язык с овощами под соусом терияки", category: "main" },
    { name: "Салат щетка со свеклой и капустой", category: "free" },
    { name: "Салат с сезонными овощами", category: "free" },
    { name: "Салат с фасолью и языком", category: "free" },
    { name: "Салат итальянский с грибами и пастой", category: "free" },
    { name: "Икра свекольная по шеф рецепту", category: "free" },
    { name: "Борщ горячий с говядиной", category: "free" },
    { name: "Солянка домашняя мясная", category: "free" },
    { name: "Крем суп томатный с кокосовым кремом, базиликом и сухариками", category: "free" },
    { name: "Маковые палочки из творога", category: "free" },
    { name: "Каша пшенная с тыквой", category: "free" },
    { name: "Вареники с картошкой и жареным луком", category: "free" },
    { name: "Пышки с сгущенкой", category: "free" },
    { name: "Ленивые голубцы с говядиной", category: "main" },
    { name: "Рыбные котлеты с зеленью", category: "main" },
    { name: "Котлеты куриные запеченные", category: "main" },
    { name: "Бефстроганов из птицы с грибами", category: "main" },
    { name: "Картофель отварной с укропом", category: "side" },
    { name: "Кус кус с овощами", category: "side" },
    { name: "Салат шуба классическая", category: "free" },
    { name: "Салат оливье с курицей", category: "free" },
    { name: "Трубочки с заварным кремом", category: "free" },
    { name: "Люля кебаб из говядины", category: "main" },
    { name: "Зразы рыбные с яйцом", category: "main" },
    { name: "Телятина в прованских травах", category: "main" },
    { name: "Мукпац с курицей и овощами", category: "main" },
    { name: "Батата запечённая с розмарином", category: "side" },
    { name: "Фасоль зеленая", category: "side" }
  ]
};

function ensureMenus() {
  if (!fs.existsSync(menusPath)) {
    fs.writeFileSync(menusPath, JSON.stringify(DEFAULT_MENUS, null, 2), "utf-8");
  }
}
function readMenus() {
  ensureMenus();
  try {
    return JSON.parse(fs.readFileSync(menusPath, "utf-8"));
  } catch {
    return DEFAULT_MENUS;
  }
}
function writeMenus(menus) {
  fs.writeFileSync(menusPath, JSON.stringify(menus, null, 2), "utf-8");
}
function readOrders() {
  if (!fs.existsSync(ordersPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(ordersPath, "utf-8"));
  } catch {
    return [];
  }
}
function writeOrders(orders) {
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2), "utf-8");
}
function nextOrderNumber() {
  const orders = readOrders();
  const maxNum = orders.reduce((max, o) => {
    const n = Number(String(o.orderNumber || "").replace("ORD-", ""));
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 1000);
  return `ORD-${maxNum + 1}`;
}
function normalize(name = "") {
  return String(name).trim().replace(/\s+/g, " ");
}
function categorizeItem(name, menus) {
  const hit = (menus.items || []).find((x) => normalize(x.name) === normalize(name));
  return hit ? hit.category : "unknown";
}
function validateCombo(comboCode, items, menus) {
  const combo = menus.combos?.[comboCode];
  if (!combo) return { ok: true, errors: [] };

  const counts = { free: 0, main: 0, side: 0, unknown: 0 };
  for (const item of items) {
    const cat = categorizeItem(item.name, menus);
    counts[cat] = (counts[cat] || 0) + 1;
  }

  const errors = [];
  for (const rule of combo.rules || []) {
    const got = counts[rule.category] || 0;
    if (got !== Number(rule.count || 0)) {
      errors.push({ category: rule.category, expected: Number(rule.count || 0), got });
    }
  }

  return { ok: errors.length === 0, errors, counts };
}
function aggregateItems(orders) {
  const map = new Map();
  for (const order of orders) {
    for (const item of Array.isArray(order.items) ? order.items : []) {
      const key = normalize(item.name).toLowerCase();
      if (!key) continue;
      const existing = map.get(key) || { name: item.name, quantityTotal: 0, ordersCount: 0 };
      existing.quantityTotal += Number(item.quantity || 0) || 0;
      existing.ordersCount += 1;
      map.set(key, existing);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

app.get("/api/meta", (_req, res) => res.json({ success: true, menus: readMenus() }));

app.post("/api/meta", (req, res) => {
  try {
    const payload = req.body || {};
    writeMenus(payload);
    res.json({ success: true, menus: payload });
  } catch {
    res.status(500).json({ success: false, message: "Failed to save menus" });
  }
});

app.get("/api/next-order-number", (_req, res) => {
  res.json({ success: true, orderNumber: nextOrderNumber() });
});

app.post("/api/orders", (req, res) => {
  try {
    const payload = req.body || {};
    const items = Array.isArray(payload.items) ? payload.items : [];
    const menus = readMenus();
    const validation = validateCombo(payload.comboCode, items, menus);

    const record = {
      id: Date.now(),
      orderNumber: payload.orderNumber || nextOrderNumber(),
      customerName: payload.customerName || "",
      phone: payload.phone || "",
      orderDate: payload.orderDate || "",
      deliveryDate: payload.deliveryDate || "",
      total: payload.total || "",
      comboCode: payload.comboCode || "",
      items,
      validation,
      createdAt: new Date().toISOString()
    };

    const orders = readOrders();
    orders.push(record);
    writeOrders(orders);

    res.json({ success: true, record });
  } catch {
    res.status(500).json({ success: false, message: "Failed to save order" });
  }
});

app.get("/api/orders", (req, res) => {
  try {
    const sortBy = req.query.sortBy || "deliveryDate";
    const dir = req.query.dir === "asc" ? "asc" : "desc";
    let orders = readOrders();

    orders.sort((a, b) => {
      const cmp = String(a[sortBy] || "").localeCompare(String(b[sortBy] || ""), "he");
      return dir === "asc" ? cmp : -cmp;
    });

    res.json({ success: true, orders });
  } catch {
    res.status(500).json({ success: false, message: "Failed to load orders" });
  }
});

app.get("/api/summary", (req, res) => {
  try {
    const deliveryDate = String(req.query.deliveryDate || "").trim();
    let orders = readOrders();

    if (deliveryDate) {
      orders = orders.filter((o) => String(o.deliveryDate || "") === deliveryDate);
    }

    res.json({
      success: true,
      ordersCount: orders.length,
      summary: aggregateItems(orders)
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to build summary" });
  }
});

const distPath = path.join(__dirname, "dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
