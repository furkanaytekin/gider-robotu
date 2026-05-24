import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("home");

  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [monthlyHistory, setMonthlyHistory] = useState([]);
  const [dailyHistory, setDailyHistory] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [selectedMonthDetail, setSelectedMonthDetail] = useState(null);
  const [yearlyHistory, setYearlyHistory] = useState([]);

  const categoryIcons = {
    Tütün: "🚬",
    Market: "🛒",
    Giyim: "👕",
    Yakıt: "⛽",
    Fatura: "💡",
    "Yeme-İçme": "🍔",
    Sağlık: "🏥",
    Ev: "🏠",
    Diğer: "📦",
  };

  const categoryColors = {
    Tütün: "#dc2626",
    Market: "#16a34a",
    Giyim: "#9333ea",
    Yakıt: "#ea580c",
    Fatura: "#2563eb",
    "Yeme-İçme": "#db2777",
    Sağlık: "#059669",
    Ev: "#7c3aed",
    Diğer: "#374151",
  };

  const [limits, setLimits] = useState({
    Market: 10000,
    Tütün: 3000,
    Giyim: 5000,
    "Yeme-İçme": 6000,
    Yakıt: 7000,
    Fatura: 8000,
    Ev: 5000,
    Sağlık: 4000,
    Diğer: 3000,
  });

  function parseExpense(input) {
    const amountMatch = input.match(/\d+/);
    const amount = amountMatch ? Number(amountMatch[0]) : 0;

    const installmentMatch = input.match(/(\d+)\s*taksit/i);
    const installment_count = installmentMatch ? Number(installmentMatch[1]) : 1;

    let description = input
      .replace(amount, "")
      .replace(/(\d+)\s*taksit/i, "")
      .trim();

    let category = "Diğer";
    const lower = input.toLowerCase();

    if (lower.includes("sigara") || lower.includes("tütün")) category = "Tütün";
    else if (
      lower.includes("market") ||
      lower.includes("migros") ||
      lower.includes("a101") ||
      lower.includes("bim") ||
      lower.includes("şok")
    )
      category = "Market";
    else if (
      lower.includes("pantolon") ||
      lower.includes("ayakkabı") ||
      lower.includes("mont") ||
      lower.includes("tişört") ||
      lower.includes("elbise")
    )
      category = "Giyim";
    else if (
      lower.includes("benzin") ||
      lower.includes("mazot") ||
      lower.includes("yakıt") ||
      lower.includes("otopark")
    )
      category = "Yakıt";
    else if (
      lower.includes("elektrik") ||
      lower.includes("su") ||
      lower.includes("doğalgaz") ||
      lower.includes("internet") ||
      lower.includes("telefon")
    )
      category = "Fatura";
    else if (
      lower.includes("yemek") ||
      lower.includes("kahve") ||
      lower.includes("tost") ||
      lower.includes("burger") ||
      lower.includes("pizza")
    )
      category = "Yeme-İçme";
    else if (
      lower.includes("eczane") ||
      lower.includes("ilaç") ||
      lower.includes("doktor") ||
      lower.includes("hastane")
    )
      category = "Sağlık";
    else if (
      lower.includes("ev") ||
      lower.includes("koltuk") ||
      lower.includes("masa") ||
      lower.includes("klima")
    )
      category = "Ev";

    return {
      amount,
      description: description || input,
      category,
      installment_count,
      monthly_amount: amount / installment_count,
    };
  }

  const loadData = async () => {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .order("id", { ascending: false });

    const expensesData = data || [];
    setExpenses(expensesData);

    const categoryMap = {};
    let total = 0;

    expensesData.forEach((item) => {
      const monthly = Number(item.monthly_amount);
      total += monthly;

      if (!categoryMap[item.category]) categoryMap[item.category] = 0;
      categoryMap[item.category] += monthly;
    });

    const categories = Object.keys(categoryMap)
      .map((key) => ({
        category: key,
        total: categoryMap[key],
      }))
      .sort((a, b) => b.total - a.total);

    setSummary({ total, categories });

    const monthMap = {};
    const dayMap = {};
    const yearMap = {};

    expensesData.forEach((item) => {
      const month = item.date?.slice(0, 7);
      const year = item.date?.slice(0, 4);
      const monthly = Number(item.monthly_amount);

      if (month) {
        if (!monthMap[month]) monthMap[month] = 0;
        monthMap[month] += monthly;
      }

      if (year) {
        if (!yearMap[year]) yearMap[year] = { total: 0, count: 0 };
        yearMap[year].total += monthly;
        yearMap[year].count += 1;
      }

      if (item.date) {
        if (!dayMap[item.date]) dayMap[item.date] = { total: 0, count: 0 };
        dayMap[item.date].total += monthly;
        dayMap[item.date].count += 1;
      }
    });

    setMonthlyHistory(
      Object.keys(monthMap)
        .map((key) => ({ month: key, total: monthMap[key] }))
        .sort((a, b) => b.month.localeCompare(a.month))
    );

    setYearlyHistory(
      Object.keys(yearMap)
        .map((key) => ({
          year: key,
          total: yearMap[key].total,
          count: yearMap[key].count,
        }))
        .sort((a, b) => b.year.localeCompare(a.year))
    );

    setDailyHistory(
      Object.keys(dayMap)
        .map((key) => ({
          date: key,
          total: dayMap[key].total,
          count: dayMap[key].count,
        }))
        .sort((a, b) => b.date.localeCompare(a.date))
    );

    setInstallments(expensesData.filter((item) => item.installment_count > 1));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const addExpense = async () => {
    if (!text.trim()) return;

    const parsed = parseExpense(text);

    await supabase.from("expenses").insert([
      {
        date: new Date().toISOString().slice(0, 10),
        raw_text: text,
        amount: parsed.amount,
        description: parsed.description,
        category: parsed.category,
        installment_count: parsed.installment_count,
        monthly_amount: parsed.monthly_amount,
      },
    ]);

    setText("");
    loadData();
  };

  const deleteExpense = async (id) => {
    await supabase.from("expenses").delete().eq("id", id);
    loadData();
  };

  const openMonthDetail = (month) => {
    const monthExpenses = expenses.filter((item) => item.date?.slice(0, 7) === month);

    const categories = {};
    let total = 0;

    monthExpenses.forEach((item) => {
      const monthly = Number(item.monthly_amount);
      total += monthly;

      if (!categories[item.category]) categories[item.category] = 0;
      categories[item.category] += monthly;
    });

    setSelectedMonthDetail({
      month,
      total,
      categories,
      expenses: monthExpenses,
    });
  };

  const filteredExpenses = expenses.filter((item) => {
    const query = search.toLowerCase();

    const matchesSearch =
      item.raw_text?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.date?.toLowerCase().includes(query);

    const matchesDate = dateFilter ? item.date === dateFilter : true;
    const matchesCategory = categoryFilter ? item.category === categoryFilter : true;

    return matchesSearch && matchesDate && matchesCategory;
  });

  const today = new Date().toISOString().slice(0, 10);
  const topCategory = summary?.categories?.[0];

  const todayTotal = expenses
    .filter((item) => item.date === today)
    .reduce((sum, item) => sum + Number(item.monthly_amount), 0);

  const totalExpenseCount = expenses.length;
  const savingTarget = topCategory ? Math.round(topCategory.total * 0.2) : 0;

  const overLimitCategories =
    summary?.categories?.filter((item) => {
      const limit = limits[item.category];
      return limit && item.total > limit;
    }) || [];

  const getLocalComment = () => {
    if (!topCategory) return "Henüz yorum için yeterli veri yok.";

    if (topCategory.category === "Tütün")
      return "Tütün gideri yüksek. Bu kalemi azaltmak bütçeye hızlı etki eder.";
    if (topCategory.category === "Yeme-İçme")
      return "Yeme-İçme gideri yüksek. Dışarı yemek, kahve ve küçük harcamalar kontrol edilmeli.";
    if (topCategory.category === "Giyim")
      return "Giyim harcaması yüksek. Önümüzdeki ay alışveriş limiti koymak mantıklı olur.";
    if (topCategory.category === "Market")
      return "Market gideri yüksek. Haftalık market limiti belirlemek faydalı olur.";

    return topCategory.category + " gideri bu ay en yüksek kalem. Önümüzdeki ay bu kategori için limit koymak iyi olur.";
  };

  const pageBg = darkMode
    ? "linear-gradient(180deg,#020617 0%,#111827 100%)"
    : "linear-gradient(135deg,#bfdbfe 0%,#e9d5ff 50%,#fde68a 100%)";

  const cardBg = darkMode ? "rgba(31,41,55,0.88)" : "rgba(255,255,255,0.78)";
  const textColor = darkMode ? "white" : "#0f172a";

  const glassCard = {
    background: cardBg,
    backdropFilter: "blur(14px)",
    border: darkMode
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid rgba(255,255,255,0.65)",
    borderRadius: 22,
    padding: 18,
    boxShadow: darkMode
      ? "0 8px 30px rgba(0,0,0,0.35)"
      : "0 8px 30px rgba(0,0,0,0.12)",
  };

  const tabButton = (key, label) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{
        flex: 1,
        padding: 10,
        border: "none",
        borderRadius: 14,
        background:
          activeTab === key
            ? "linear-gradient(90deg,#2563eb,#9333ea)"
            : "rgba(255,255,255,0.35)",
        color: activeTab === key ? "white" : textColor,
        fontWeight: "bold",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 430,
        margin: "0 auto",
        fontFamily: "Arial",
        backgroundImage: pageBg,
        color: textColor,
        minHeight: "100vh",
        padding: 14,
        boxSizing: "border-box",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 46 }}>🤖</div>
        <p style={{ marginTop: 8, opacity: 0.75 }}>
          Akıllı harcama takip ve analiz sistemi
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {tabButton("home", "Ana")}
        {tabButton("reports", "Rapor")}
        {tabButton("limits", "Limit")}
        {tabButton("ai", "AI")}
      </div>

      {activeTab === "home" && (
        <>
          <div style={glassCard}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, fontWeight: "bold" }}>
                {currentTime.toLocaleTimeString("tr-TR")}
              </div>
              <div style={{ marginTop: 8, opacity: 0.75 }}>
                {currentTime.toLocaleDateString("tr-TR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              width: "100%",
              padding: 16,
              marginTop: 16,
              background: darkMode ? "#facc15" : "linear-gradient(90deg,#020617,#0f172a)",
              color: darkMode ? "black" : "white",
              border: "none",
              borderRadius: 20,
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            {darkMode ? "☀️ Gündüz Modu" : "🌙 Gece Modu"}
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
            <div style={{ ...glassCard, color: "#0f172a" }}>
              <div style={{ fontSize: 28 }}>💳</div>
              <b>Bugün</b>
              <h2 style={{ color: "#2563eb" }}>{todayTotal.toFixed(0)} TL</h2>
            </div>

            <div style={{ ...glassCard, color: "#0f172a" }}>
              <div style={{ fontSize: 28 }}>📈</div>
              <b>İşlem</b>
              <h2 style={{ color: "#16a34a" }}>{totalExpenseCount}</h2>
            </div>
          </div>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addExpense()}
            placeholder="1500 pantolon 3 taksit"
            style={{
              width: "100%",
              padding: 18,
              fontSize: 18,
              boxSizing: "border-box",
              marginTop: 20,
              borderRadius: 18,
              border: "none",
              outline: "none",
              background: "rgba(255,255,255,0.75)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
            }}
          />

          <button
            onClick={addExpense}
            style={{
              width: "100%",
              padding: 18,
              marginTop: 15,
              background: "linear-gradient(90deg,#2563eb,#9333ea)",
              color: "white",
              border: "none",
              borderRadius: 20,
              fontSize: 22,
              fontWeight: "bold",
              boxShadow: "0 8px 30px rgba(59,130,246,0.35)",
            }}
          >
            💾 Harcamayı Kaydet
          </button>

          <h2 style={{ marginTop: 28 }}>Son Harcamalar</h2>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara: sigara, market, giyim..."
            style={{ width: "100%", padding: 12, fontSize: 16, boxSizing: "border-box", marginBottom: 12, borderRadius: 12, border: "none" }}
          />

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: "100%", padding: 12, fontSize: 16, boxSizing: "border-box", marginBottom: 12, borderRadius: 12, border: "none" }}
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: "100%", padding: 12, fontSize: 16, boxSizing: "border-box", marginBottom: 12, borderRadius: 12, border: "none" }}
          >
            <option value="">Tüm Kategoriler</option>
            {Object.keys(categoryIcons).map((key) => (
              <option key={key} value={key}>
                {categoryIcons[key]} {key}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearch("");
              setDateFilter("");
              setCategoryFilter("");
            }}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 15,
              background: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: 12,
            }}
          >
            Filtreleri Temizle
          </button>

          {filteredExpenses.map((item) => (
            <div key={item.id} style={{ ...glassCard, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <b>{item.description}</b>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>{item.date}</div>
                </div>
                <div style={{ fontWeight: "bold" }}>{item.amount} TL</div>
              </div>

              <div style={{ marginTop: 10, fontSize: 14 }}>
                {categoryIcons[item.category]} {item.category} | {item.installment_count} taksit | Aylık: {Number(item.monthly_amount).toFixed(0)} TL
              </div>

              <button
                onClick={() => deleteExpense(item.id)}
                style={{
                  marginTop: 12,
                  width: "100%",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "10px",
                  borderRadius: 10,
                }}
              >
                Sil
              </button>
            </div>
          ))}
        </>
      )}

      {activeTab === "reports" && (
        <>
          {summary && (
            <div style={glassCard}>
              <h2>Aylık Rapor</h2>
              <h3>Toplam: {summary.total.toFixed(0)} TL</h3>

              {topCategory && (
                <p>
                  En yüksek: <b>{categoryIcons[topCategory.category]} {topCategory.category}</b> -{" "}
                  <b>{topCategory.total.toFixed(0)} TL</b>
                </p>
              )}

              <p>Önerilen tasarruf hedefi: <b>{savingTarget} TL</b></p>

              <h3>Kategori Kartları</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {summary.categories.map((item) => (
                  <div
                    key={item.category}
                    style={{
                      background: categoryColors[item.category] || "#111827",
                      color: "white",
                      padding: 14,
                      borderRadius: 16,
                    }}
                  >
                    <div style={{ fontSize: 24 }}>{categoryIcons[item.category]}</div>
                    <b>{item.category}</b>
                    <div style={{ fontSize: 20, marginTop: 5 }}>{item.total.toFixed(0)} TL</div>
                    <div style={{ fontSize: 13 }}>{expenses.filter((x) => x.category === item.category).length} işlem</div>
                  </div>
                ))}
              </div>

              <h3>Kategori Grafiği</h3>

              {summary.categories.map((item) => {
                const percent = summary.total > 0 ? (item.total / summary.total) * 100 : 0;

                return (
                  <div key={item.category} style={{ marginBottom: 12 }}>
                    <b>{categoryIcons[item.category]} {item.category} - %{Math.round(percent)}</b>
                    <div style={{ height: 18, background: "#ddd", marginTop: 5, borderRadius: 10, overflow: "hidden" }}>
                      <div
                        style={{
                          width: percent + "%",
                          height: "100%",
                          background: categoryColors[item.category] || "#111827",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ ...glassCard, marginTop: 20 }}>
            <h2>📅 Aylık Geçmiş</h2>

            {monthlyHistory.map((item) => (
              <button
                key={item.month}
                onClick={() => openMonthDetail(item.month)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  padding: 14,
                  marginBottom: 10,
                  border: "none",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.7)",
                  color: "#111827",
                  fontSize: 16,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                <span>📁 {item.month}</span>
                <span>{item.total.toFixed(0)} TL</span>
              </button>
            ))}

            {selectedMonthDetail && (
              <div
                style={{
                  marginTop: 15,
                  padding: 16,
                  background: "rgba(255,255,255,0.8)",
                  borderRadius: 18,
                  color: "black",
                }}
              >
                <h3>📊 {selectedMonthDetail.month} Detayı</h3>
                <h2>{selectedMonthDetail.total.toFixed(0)} TL</h2>

                <h4>Kategori Dağılımı</h4>

                {Object.keys(selectedMonthDetail.categories).map((key) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: 8,
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    <span>
                      {categoryIcons[key]} {key}
                    </span>

                    <b>{selectedMonthDetail.categories[key].toFixed(0)} TL</b>
                  </div>
                ))}

                <h4 style={{ marginTop: 18 }}>Harcamalar</h4>

                {selectedMonthDetail.expenses.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 10,
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    <b>{item.description}</b> - {item.amount} TL
                    <br />
                    <small>
                      {item.date} | {categoryIcons[item.category]} {item.category} | {item.installment_count} taksit
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ ...glassCard, marginTop: 20 }}>
            <h2>🗓️ Yıllık Geçmiş</h2>

            {yearlyHistory.map((item) => (
              <div
                key={item.year}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: 12,
                  borderBottom: "1px solid #ddd",
                }}
              >
                <b>📆 {item.year}</b>
                <span>
                  {item.total.toFixed(0)} TL / {item.count} işlem
                </span>
              </div>
            ))}
          </div>

          <div style={{ ...glassCard, marginTop: 20 }}>
            <h2>Günlük Geçmiş</h2>
            {dailyHistory.slice(0, 10).map((item) => (
              <div key={item.date} style={{ display: "flex", justifyContent: "space-between", padding: 8 }}>
                <b>{item.date}</b>
                <span>{item.total.toFixed(0)} TL / {item.count}</span>
              </div>
            ))}
          </div>

          <div style={{ ...glassCard, marginTop: 20 }}>
            <h2>Taksitli Harcamalar</h2>
            {installments.length === 0 && <p>Taksitli harcama yok.</p>}
            {installments.map((item) => (
              <div key={item.id} style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                <b>{item.description}</b> - {item.amount} TL
                <br />
                <small>{item.installment_count} taksit | Aylık: {Number(item.monthly_amount).toFixed(0)} TL</small>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "limits" && (
        <>
          <div style={glassCard}>
            <h2>Kategori Limitleri</h2>

            {Object.keys(limits).map((key) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label>{categoryIcons[key]} {key}</label>
                <input
                  type="number"
                  value={limits[key]}
                  onChange={(e) => setLimits({ ...limits, [key]: Number(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: 12,
                    marginTop: 5,
                    boxSizing: "border-box",
                    borderRadius: 12,
                    border: "none",
                  }}
                />
              </div>
            ))}
          </div>

          {overLimitCategories.length > 0 && (
            <div style={{ marginTop: 20, padding: 18, background: "#fee2e2", color: "black", borderRadius: 18 }}>
              <h2>Bütçe Uyarısı</h2>
              {overLimitCategories.map((item) => (
                <p key={item.category}>
                  <b>{item.category}</b> aşıldı: <b>{item.total.toFixed(0)} TL</b> / Limit: <b>{limits[item.category]} TL</b>
                </p>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "ai" && (
        <div style={{ padding: 18, background: "#fff7ed", color: "black", borderRadius: 22 }}>
          <h2>🤖 Yerel AI Yorumu</h2>
          <p>{getLocalComment()}</p>

          {topCategory && (
            <p>
              Bu ay öncelikli kontrol edilmesi gereken alan: <b>{topCategory.category}</b>.
              İlk hedef olarak bu kategoride yaklaşık <b>{savingTarget} TL</b> azaltma denenebilir.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;