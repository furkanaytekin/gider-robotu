import { useEffect, useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [tab, setTab] = useState("ana");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const saved = localStorage.getItem("expenses");
    if (saved) setExpenses(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const parseCategory = (txt) => {
    const x = txt.toLowerCase();
    if (x.includes("market")) return "Market";
    if (x.includes("sigara") || x.includes("tütün")) return "Tütün";
    if (x.includes("pantolon") || x.includes("ayakkabı") || x.includes("giyim")) return "Giyim";
    if (x.includes("yakıt") || x.includes("benzin") || x.includes("mazot")) return "Yakıt";
    if (x.includes("yemek") || x.includes("kahve")) return "Yeme-İçme";
    return "Diğer";
  };

  const addExpense = () => {
    if (!text.trim()) return;

    const amount = Number(text.match(/\d+/)?.[0] || 0);
    const category = parseCategory(text);

    const item = {
      id: Date.now(),
      text,
      amount,
      category,
      date: new Date().toLocaleDateString("tr-TR"),
      month: new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" }),
    };

    setExpenses([item, ...expenses]);
    setText("");
  };

  const total = expenses.reduce((s, x) => s + x.amount, 0);
  const today = new Date().toLocaleDateString("tr-TR");
  const todayTotal = expenses.filter(x => x.date === today).reduce((s, x) => s + x.amount, 0);

  const byCategory = expenses.reduce((acc, x) => {
    acc[x.category] = (acc[x.category] || 0) + x.amount;
    return acc;
  }, {});

  const byMonth = expenses.reduce((acc, x) => {
    acc[x.month] = (acc[x.month] || 0) + x.amount;
    return acc;
  }, {});

  const box = {
    background: "rgba(255,255,255,0.85)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#bfdbfe,#e9d5ff,#fde68a)",
      fontFamily: "Arial",
      padding: 16,
      boxSizing: "border-box"
    }}>
      <div style={{ maxWidth: 430, margin: "auto" }}>
        <h1 style={{ textAlign: "center" }}>🤖 Gider Robotu</h1>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["ana", "rapor", "limit", "ai"].map(x => (
            <button key={x} onClick={() => setTab(x)} style={{
              flex: 1,
              padding: 12,
              border: "none",
              borderRadius: 14,
              background: tab === x ? "#2563eb" : "white",
              color: tab === x ? "white" : "#111827",
              fontWeight: "bold"
            }}>
              {x.toUpperCase()}
            </button>
          ))}
        </div>

        {tab === "ana" && (
          <>
            <div style={{ ...box, textAlign: "center" }}>
              <h2>{time.toLocaleTimeString("tr-TR")}</h2>
              <p>{time.toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={box}><b>Bugün</b><h2>{todayTotal} TL</h2></div>
              <div style={box}><b>Toplam</b><h2>{total} TL</h2></div>
            </div>

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="300 market / 1500 pantolon"
              style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", boxSizing: "border-box" }}
            />

            <button onClick={addExpense} style={{
              width: "100%", padding: 15, marginTop: 10, border: "none",
              borderRadius: 14, background: "#2563eb", color: "white", fontWeight: "bold"
            }}>
              💾 Harcamayı Kaydet
            </button>

            <h2>Son Harcamalar</h2>
            {expenses.map(x => (
              <div key={x.id} style={box}>
                <b>{x.text}</b>
                <p>{x.date} - {x.category} - {x.amount} TL</p>
                <button onClick={() => setExpenses(expenses.filter(e => e.id !== x.id))}
                  style={{ background: "#dc2626", color: "white", border: "none", padding: 8, borderRadius: 10 }}>
                  Sil
                </button>
              </div>
            ))}
          </>
        )}

        {tab === "rapor" && (
          <div style={box}>
            <h2>📊 Raporlar</h2>
            <h3>Toplam Harcama: {total} TL</h3>

            <h3>Kategoriler</h3>
            {Object.entries(byCategory).map(([k, v]) => (
              <p key={k}><b>{k}</b>: {v} TL</p>
            ))}

            <h3>Aylık Geçmiş</h3>
            {Object.entries(byMonth).map(([k, v]) => (
              <p key={k}><b>{k}</b>: {v} TL</p>
            ))}
          </div>
        )}

        {tab === "limit" && (
          <div style={box}>
            <h2>⚠️ Limitler</h2>
            <p>Şimdilik manuel takip.</p>
            <p>Toplam harcama: <b>{total} TL</b></p>
          </div>
        )}

        {tab === "ai" && (
          <div style={box}>
            <h2>🤖 AI Yorumu</h2>
            <p>
              En çok harcama yaptığın kategori:
              <b> {Object.entries(byCategory).sort((a,b)=>b[1]-a[1])[0]?.[0] || "Henüz veri yok"}</b>
            </p>
            <p>Bu kategoriyi azaltırsan bütçeye en hızlı etkiyi yaparsın.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;