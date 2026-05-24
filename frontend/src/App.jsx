import { useEffect, useMemo, useState } from "react";

const defaultLimits = {
  Market: 10000,
  Tütün: 3000,
  Giyim: 5000,
  Yakıt: 7000,
  "Yeme-İçme": 6000,
  Fatura: 8000,
  Sağlık: 4000,
  Ev: 5000,
  Diğer: 3000,
};

function App() {
  const [text, setText] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [tab, setTab] = useState("ana");
  const [darkMode, setDarkMode] = useState(false);
  const [time, setTime] = useState(new Date());
  const [search, setSearch] = useState("");

  const [limits, setLimits] = useState(() => {
    const saved = localStorage.getItem("gider_robotu_limits");
    return saved ? JSON.parse(saved) : defaultLimits;
  });

  const icons = {
    Market: "🛒",
    Tütün: "🚬",
    Giyim: "👕",
    Yakıt: "⛽",
    "Yeme-İçme": "🍔",
    Fatura: "💡",
    Sağlık: "🏥",
    Ev: "🏠",
    Diğer: "📦",
  };

  const colors = {
    Market: "#22c55e",
    Tütün: "#ef4444",
    Giyim: "#a855f7",
    Yakıt: "#f97316",
    "Yeme-İçme": "#ec4899",
    Fatura: "#3b82f6",
    Sağlık: "#14b8a6",
    Ev: "#6366f1",
    Diğer: "#64748b",
  };

  useEffect(() => {
    const saved = localStorage.getItem("gider_robotu_expenses");
    if (saved) setExpenses(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("gider_robotu_expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("gider_robotu_limits", JSON.stringify(limits));
  }, [limits]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const parseExpense = (input) => {
    const amount = Number(input.match(/\d+/)?.[0] || 0);
    const installmentMatch = input.match(/(\d+)\s*taksit/i);
    const installment = installmentMatch ? Number(installmentMatch[1]) : 1;
    const lower = input.toLowerCase();

    let category = "Diğer";
    if (lower.includes("market") || lower.includes("migros") || lower.includes("a101") || lower.includes("bim")) category = "Market";
    else if (lower.includes("sigara") || lower.includes("tütün")) category = "Tütün";
    else if (lower.includes("pantolon") || lower.includes("ayakkabı") || lower.includes("giyim") || lower.includes("mont")) category = "Giyim";
    else if (lower.includes("benzin") || lower.includes("mazot") || lower.includes("yakıt")) category = "Yakıt";
    else if (lower.includes("yemek") || lower.includes("kahve") || lower.includes("burger") || lower.includes("restoran")) category = "Yeme-İçme";
    else if (lower.includes("elektrik") || lower.includes("su") || lower.includes("internet") || lower.includes("doğalgaz")) category = "Fatura";
    else if (lower.includes("eczane") || lower.includes("ilaç") || lower.includes("hastane")) category = "Sağlık";
    else if (lower.includes("ev") || lower.includes("koltuk") || lower.includes("mutfak")) category = "Ev";

    return {
      id: Date.now(),
      raw: input,
      description: input.replace(/\d+/g, "").replace(/taksit/gi, "").trim() || input,
      amount,
      monthlyAmount: Math.round(amount / installment),
      installment,
      category,
      date: new Date().toISOString().slice(0, 10),
      dateText: new Date().toLocaleDateString("tr-TR"),
      month: new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" }),
      year: new Date().getFullYear(),
    };
  };

  const addExpense = () => {
    if (!text.trim()) return;
    setExpenses([parseExpense(text), ...expenses]);
    setText("");
  };

  const today = new Date().toISOString().slice(0, 10);

  const filteredExpenses = expenses.filter((x) =>
    x.raw.toLowerCase().includes(search.toLowerCase()) ||
    x.category.toLowerCase().includes(search.toLowerCase()) ||
    x.dateText.toLowerCase().includes(search.toLowerCase())
  );

  const total = expenses.reduce((s, x) => s + x.monthlyAmount, 0);
  const todayTotal = expenses.filter((x) => x.date === today).reduce((s, x) => s + x.monthlyAmount, 0);
  const yearlyTotal = expenses.reduce((s, x) => s + x.amount, 0);

  const categoryTotals = useMemo(() => {
    const obj = {};
    expenses.forEach((x) => {
      obj[x.category] = (obj[x.category] || 0) + x.monthlyAmount;
    });
    return obj;
  }, [expenses]);

  const monthTotals = useMemo(() => {
    const obj = {};
    expenses.forEach((x) => {
      obj[x.month] = (obj[x.month] || 0) + x.monthlyAmount;
    });
    return obj;
  }, [expenses]);

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const overLimits = Object.entries(categoryTotals).filter(([cat, val]) => val > limits[cat]);

  const aiComment = () => {
    if (!expenses.length) return "Henüz yorum yapacak veri yok. Birkaç harcama eklediğinde analiz başlayacak.";
    if (overLimits.length) return `${overLimits[0][0]} limiti aşılmış. Bu kategori kontrol edilirse bütçeye hızlı etki eder.`;
    if (topCategory) return `Bu ay en yüksek harcama ${topCategory[0]} kategorisinde. Yaklaşık ${Math.round(topCategory[1] * 0.2)} TL azaltma hedefi mantıklı olur.`;
    return "Harcamalar dengeli görünüyor.";
  };

  const bg = darkMode
    ? "linear-gradient(135deg,#020617,#111827,#1e1b4b)"
    : "linear-gradient(135deg,#bfdbfe,#e9d5ff,#fde68a)";

  const textColor = darkMode ? "#f8fafc" : "#0f172a";
  const cardBg = darkMode ? "rgba(15,23,42,0.82)" : "rgba(255,255,255,0.82)";

  const card = {
    background: cardBg,
    color: textColor,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,0.14)",
    backdropFilter: "blur(14px)",
    border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.65)",
  };

  const btn = {
    border: "none",
    borderRadius: 16,
    padding: 13,
    fontWeight: "bold",
    cursor: "pointer",
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, color: textColor, fontFamily: "Arial", padding: 16, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 460, margin: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 70, marginBottom: 10 }}>🤖</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
          {[
            ["ana", "ANA"],
            ["rapor", "RAPOR"],
            ["limit", "LİMİT"],
            ["ai", "AI"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                ...btn,
                background: tab === key ? "linear-gradient(90deg,#2563eb,#7c3aed)" : cardBg,
                color: tab === key ? "white" : textColor,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "ana" && (
          <>
            <div style={{ ...card, textAlign: "center" }}>
              <h2 style={{ fontSize: 38, margin: 0 }}>{time.toLocaleTimeString("tr-TR")}</h2>
              <p>{time.toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>

            <button onClick={() => setDarkMode(!darkMode)}
              style={{ ...btn, width: "100%", marginBottom: 14, background: darkMode ? "#facc15" : "#020617", color: darkMode ? "black" : "white" }}>
              {darkMode ? "☀️ Gündüz Modu" : "🌙 Gece Modu"}
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={card}><b>💳 Bugün</b><h2>{todayTotal} TL</h2></div>
              <div style={card}><b>📈 Toplam</b><h2>{total} TL</h2></div>
            </div>

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExpense()}
              placeholder="300 market / 1500 pantolon 3 taksit"
              style={{ width: "100%", padding: 16, borderRadius: 18, border: "none", boxSizing: "border-box", fontSize: 16, marginBottom: 10 }}
            />

            <button onClick={addExpense}
              style={{ ...btn, width: "100%", background: "linear-gradient(90deg,#2563eb,#9333ea)", color: "white", fontSize: 17 }}>
              💾 Harcamayı Kaydet
            </button>

            <h2>Son Harcamalar</h2>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ara: market, sigara, giyim..."
              style={{ width: "100%", padding: 13, borderRadius: 14, border: "none", boxSizing: "border-box", marginBottom: 12 }}
            />

            {filteredExpenses.map((x) => (
              <div key={x.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <b>{icons[x.category]} {x.description}</b>
                    <div style={{ opacity: 0.7, fontSize: 13 }}>{x.dateText}</div>
                  </div>
                  <b>{x.amount} TL</b>
                </div>
                <p>{x.category} | {x.installment} taksit | Aylık: {x.monthlyAmount} TL</p>
                <button onClick={() => setExpenses(expenses.filter((e) => e.id !== x.id))}
                  style={{ ...btn, background: "#dc2626", color: "white", width: "100%" }}>
                  Sil
                </button>
              </div>
            ))}
          </>
        )}

        {tab === "rapor" && (
          <>
            <div style={card}>
              <h2>📊 Genel Rapor</h2>
              <h3>Aylık Toplam: {total} TL</h3>
              <h3>Yıllık Toplam: {yearlyTotal} TL</h3>
              <p>İşlem Sayısı: {expenses.length}</p>
            </div>

            <div style={card}>
              <h2>Kategori Grafiği</h2>
              {Object.entries(categoryTotals).map(([cat, val]) => {
                const percent = total ? Math.round((val / total) * 100) : 0;
                return (
                  <div key={cat} style={{ marginBottom: 14 }}>
                    <b>{icons[cat]} {cat} - {val} TL - %{percent}</b>
                    <div style={{ height: 16, background: "#e5e7eb", borderRadius: 20, marginTop: 6, overflow: "hidden" }}>
                      <div style={{ width: `${percent}%`, height: "100%", background: colors[cat], borderRadius: 20 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={card}>
              <h2>Aylık Geçmiş</h2>
              {Object.entries(monthTotals).map(([month, val]) => (
                <p key={month}><b>{month}</b>: {val} TL</p>
              ))}
            </div>
          </>
        )}

        {tab === "limit" && (
          <div style={card}>
            <h2>⚠️ Kategori Limitleri</h2>

            {Object.entries(limits).map(([cat, limit]) => {
              const used = categoryTotals[cat] || 0;
              const percent = Math.min(100, Math.round((used / limit) * 100));

              return (
                <div key={cat} style={{ marginBottom: 18 }}>
                  <b>{icons[cat]} {cat}: {used} / {limit} TL</b>

                  <input
                    type="number"
                    value={limits[cat]}
                    onChange={(e) => setLimits({ ...limits, [cat]: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: 10,
                      marginTop: 8,
                      borderRadius: 12,
                      border: "none",
                      boxSizing: "border-box",
                    }}
                  />

                  <div style={{ height: 16, background: "#e5e7eb", borderRadius: 20, marginTop: 8, overflow: "hidden" }}>
                    <div style={{ width: `${percent}%`, height: "100%", background: used > limit ? "#dc2626" : colors[cat], borderRadius: 20 }} />
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => setLimits(defaultLimits)}
              style={{ ...btn, width: "100%", background: "#64748b", color: "white", marginTop: 10 }}
            >
              Limitleri Sıfırla
            </button>

            {overLimits.length > 0 && (
              <div style={{ background: "#fee2e2", color: "#7f1d1d", padding: 14, borderRadius: 16, marginTop: 14 }}>
                <b>Limit Aşıldı!</b>
                {overLimits.map(([cat, val]) => (
                  <p key={cat}>{cat}: {val} TL / Limit: {limits[cat]} TL</p>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "ai" && (
          <div style={card}>
            <h2>🤖 AI Finans Yorumu</h2>
            <p>{aiComment()}</p>
            <hr />
            <p>Toplam harcama: <b>{total} TL</b></p>
            <p>En yüksek kategori: <b>{topCategory?.[0] || "Yok"}</b></p>
            <p>Önerilen tasarruf hedefi: <b>{topCategory ? Math.round(topCategory[1] * 0.2) : 0} TL</b></p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;