const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./expenses.db");

db.run(`
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  raw_text TEXT,
  amount REAL,
  description TEXT,
  category TEXT,
  installment_count INTEGER,
  monthly_amount REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
`);

function parseExpense(text) {
  const amountMatch = text.match(/\d+/);
  const amount = amountMatch ? Number(amountMatch[0]) : 0;

  const installmentMatch = text.match(/(\d+)\s*taksit/i);
  const installment_count = installmentMatch ? Number(installmentMatch[1]) : 1;

  let description = text
    .replace(amount, "")
    .replace(/(\d+)\s*taksit/i, "")
    .trim();

  let category = "Diğer";
  const lower = description.toLowerCase();

  if (lower.includes("sigara") || lower.includes("tütün")) category = "Tütün";
  else if (
    lower.includes("kahve") ||
    lower.includes("yemek") ||
    lower.includes("tost") ||
    lower.includes("burger") ||
    lower.includes("pizza") ||
    lower.includes("çay") ||
    lower.includes("restoran")
  ) category = "Yeme-İçme";
  else if (
    lower.includes("pantolon") ||
    lower.includes("ayakkabı") ||
    lower.includes("mont") ||
    lower.includes("tişört") ||
    lower.includes("elbise") ||
    lower.includes("kazak")
  ) category = "Giyim";
  else if (
    lower.includes("benzin") ||
    lower.includes("mazot") ||
    lower.includes("otopark") ||
    lower.includes("taksi")
  ) category = "Yakıt";
  else if (
    lower.includes("migros") ||
    lower.includes("a101") ||
    lower.includes("bim") ||
    lower.includes("şok") ||
    lower.includes("market") ||
    lower.includes("carrefour")
  ) category = "Market";
  else if (
    lower.includes("elektrik") ||
    lower.includes("su") ||
    lower.includes("doğalgaz") ||
    lower.includes("internet") ||
    lower.includes("telefon")
  ) category = "Fatura";
  else if (
    lower.includes("klima") ||
    lower.includes("buzdolabı") ||
    lower.includes("koltuk") ||
    lower.includes("masa") ||
    lower.includes("sandalye")
  ) category = "Ev";
  else if (
    lower.includes("ilaç") ||
    lower.includes("hastane") ||
    lower.includes("doktor") ||
    lower.includes("eczane")
  ) category = "Sağlık";

  return {
    amount,
    description,
    category,
    installment_count,
    monthly_amount: amount / installment_count,
  };
}

app.post("/expense", (req, res) => {
  const { text } = req.body;
  const parsed = parseExpense(text);
  const today = new Date().toISOString().slice(0, 10);

  db.run(
    `
    INSERT INTO expenses
    (date, raw_text, amount, description, category, installment_count, monthly_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      today,
      text,
      parsed.amount,
      parsed.description,
      parsed.category,
      parsed.installment_count,
      parsed.monthly_amount,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        id: this.lastID,
        date: today,
        raw_text: text,
        ...parsed,
      });
    }
  );
});

app.get("/expenses", (req, res) => {
  db.all("SELECT * FROM expenses ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/summary", (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  db.all(
    `
    SELECT category, SUM(monthly_amount) as total
    FROM expenses
    WHERE substr(date, 1, 7) = ?
    GROUP BY category
    ORDER BY total DESC
    `,
    [currentMonth],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const total = rows.reduce((sum, item) => sum + item.total, 0);

      res.json({
        month: currentMonth,
        total,
        categories: rows,
      });
    }
  );
});

app.get("/monthly-history", (req, res) => {
  db.all(
    `
    SELECT substr(date, 1, 7) as month, SUM(monthly_amount) as total
    FROM expenses
    GROUP BY month
    ORDER BY month DESC
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.get("/monthly-detail/:month", (req, res) => {
  const month = req.params.month;

  db.all(
    `
    SELECT *
    FROM expenses
    WHERE substr(date, 1, 7) = ?
    ORDER BY date DESC, id DESC
    `,
    [month],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const total = rows.reduce((sum, item) => sum + item.monthly_amount, 0);
      const categories = {};

      rows.forEach((item) => {
        if (!categories[item.category]) categories[item.category] = 0;
        categories[item.category] += item.monthly_amount;
      });

      res.json({
        month,
        total,
        categories,
        expenses: rows,
      });
    }
  );
});

app.get("/yearly-history", (req, res) => {
  db.all(
    `
    SELECT substr(date, 1, 4) as year, SUM(monthly_amount) as total, COUNT(*) as count
    FROM expenses
    GROUP BY year
    ORDER BY year DESC
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.get("/daily-history", (req, res) => {
  db.all(
    `
    SELECT date, SUM(monthly_amount) as total, COUNT(*) as count
    FROM expenses
    GROUP BY date
    ORDER BY date DESC
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.get("/installments", (req, res) => {
  db.all(
    `
    SELECT *
    FROM expenses
    WHERE installment_count > 1
    ORDER BY id DESC
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.delete("/expense/:id", (req, res) => {
  db.run("DELETE FROM expenses WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      success: true,
      deletedId: req.params.id,
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`);
});