import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json({ limit: "10mb" }));

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const ordersPath = path.join(dataDir, "orders.json");

const COMBOS = {
  "250": { code: "250", nameHe: "קומבו מיני 250", nameRu: "Комбо мини 250", rules: [{ category: "free", count: 3 }, { category: "main", count: 2 }] },
  "380": { code: "380", nameHe: "קומבו 380", nameRu: "Меню 380", rules: [{ category: "free", count: 4 }, { category: "main", count: 2 }, { category: "side", count: 2 }] },
  "450": { code: "450", nameHe: "קומבו 450", nameRu: "Меню 450", rules: [{ category: "free", count: 4 }, { category: "main", count: 2 }, { category: "side", count: 2 }] }
};

const ITEM_CATEGORIES = {
  "Борщ с мясом":"free","Солянка мясная":"free","Салат с крабовыми палочками":"free","Салат Цезарь с курицей":"free",
  "Пюре":"free","Рис припущенный":"free","Картошка с чесноком":"free","Спагетти с соусом песто":"free","Блины с вишнями":"free","Десерт тирамису":"free",
  "Ноги куриные гриль":"main","Котлеты домашние мясные":"main","Мушт на гриле":"main","Язык с овощами под соусом терияки":"main",
  "Салат щетка со свеклой и капустой":"free","Салат с сезонными овощами":"free","Салат с фасолью и языком":"free","Салат итальянский с грибами и пастой":"free",
  "Икра свекольная по шеф рецепту":"free","Борщ горячий с говядиной":"free","Солянка домашняя мясная":"free","Крем суп томатный с кокосовым кремом, базиликом и сухариками":"free",
  "Маковые палочки из творога":"free","Каша пшенная с тыквой":"free","Вареники с картошкой и жареным луком":"free","Пышки с сгущенкой":"free",
  "Ленивые голубцы с говядиной":"main","Рыбные котлеты с зеленью":"main","Котлеты куриные запеченные":"main","Бефстроганов из птицы с грибами":"main",
  "Картофель отварной с укропом":"side","Кус кус с овощами":"side",
  "Салат шуба классическая":"free","Салат оливье с курицей":"free","Трубочки с заварным кремом":"free","Люля кебаб из говядины":"main",
  "Зразы рыбные с яйцом":"main","Телятина в прованских травах":"main","Мукпац с курицей и овощами":"main","Батата запечённая с розмарином":"side","Фасоль зеленая":"side"
};

function readOrders() {
  if (!fs.existsSync(ordersPath)) return [];
  try { return JSON.parse(fs.readFileSync(ordersPath, "utf-8")); } catch { return []; }
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
function normalize(name="") { return String(name).trim().replace(/\s+/g," "); }
function categorizeItem(name) { return ITEM_CATEGORIES[normalize(name)] || "unknown"; }
function validateCombo(comboCode, items) {
  const combo = COMBOS[comboCode];
  if (!combo) return { ok: true, errors: [] };
  const counts = { free: 0, main: 0, side: 0, unknown: 0 };
  for (const item of items) counts[categorizeItem(item.name)] = (counts[categorizeItem(item.name)] || 0) + 1;
  const errors = [];
  for (const rule of combo.rules) {
    const got = counts[rule.category] || 0;
    if (got !== rule.count) errors.push({ category: rule.category, expected: rule.count, got });
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
  return Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name,"ru"));
}

app.get("/api/meta", (_req,res)=>res.json({success:true, combos: COMBOS}));
app.get("/api/next-order-number", (_req,res)=>res.json({success:true, orderNumber: nextOrderNumber()}));

app.post("/api/orders", (req,res)=>{
  try {
    const payload = req.body || {};
    const items = Array.isArray(payload.items) ? payload.items : [];
    const validation = validateCombo(payload.comboCode, items);
    const record = {
      id: Date.now(),
      orderNumber: payload.orderNumber || nextOrderNumber(),
      customerName: payload.customerName || "",
      phone: payload.phone || "",
      orderDate: payload.orderDate || "",
      deliveryDate: payload.deliveryDate || "",
      total: payload.total || "",
      comboCode: payload.comboCode || "",
      items, validation, createdAt: new Date().toISOString()
    };
    const orders = readOrders();
    orders.push(record);
    writeOrders(orders);
    res.json({success:true, record});
  } catch (e) {
    res.status(500).json({success:false, message:"Failed to save order"});
  }
});

app.get("/api/orders", (req,res)=>{
  try {
    const sortBy = req.query.sortBy || "deliveryDate";
    const dir = req.query.dir === "asc" ? "asc" : "desc";
    let orders = readOrders();
    orders.sort((a,b)=>{
      const cmp = String(a[sortBy]||"").localeCompare(String(b[sortBy]||""), "he");
      return dir === "asc" ? cmp : -cmp;
    });
    res.json({success:true, orders});
  } catch {
    res.status(500).json({success:false, message:"Failed to load orders"});
  }
});

app.get("/api/summary", (req,res)=>{
  try {
    const deliveryDate = String(req.query.deliveryDate || "").trim();
    let orders = readOrders();
    if (deliveryDate) orders = orders.filter(o => String(o.deliveryDate || "") === deliveryDate);
    res.json({success:true, ordersCount: orders.length, summary: aggregateItems(orders)});
  } catch {
    res.status(500).json({success:false, message:"Failed to build summary"});
  }
});

app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT}`));
