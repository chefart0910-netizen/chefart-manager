import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "10mb" }));

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const ordersPath = path.join(dataDir, "orders.json");

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

app.get("/api/ping", (_req, res) => {
  res.json({ success: true });
});

app.get("/api/next-order-number", (_req, res) => {
  res.json({ success: true, orderNumber: nextOrderNumber() });
});

app.get("/api/orders", (_req, res) => {
  res.json({ success: true, orders: readOrders() });
});

app.post("/api/orders", (req, res) => {
  try {
    const payload = req.body || {};
    const orders = readOrders();

    const record = {
      id: Date.now(),
      orderNumber: payload.orderNumber || nextOrderNumber(),
      customerName: payload.customerName || "",
      phone: payload.phone || "",
      orderDate: payload.orderDate || "",
      deliveryDate: payload.deliveryDate || "",
      total: payload.total || "",
      itemsText: payload.itemsText || "",
      createdAt: new Date().toISOString()
    };

    orders.push(record);
    writeOrders(orders);

    res.json({ success: true, record });
  } catch {
    res.status(500).json({ success: false, message: "save failed" });
  }
});

const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
