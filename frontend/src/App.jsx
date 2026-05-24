import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

  const SUPABASE_URL = "https://jqdsdvkoqebrykejjlka.supabase.co"
  const SUPABASE_KEY = "sb_publishable_U7yw_R8E2z1XGy48YU7bNQ_gtMDliTq"

  const supabase =
  createClient(SUPABASE_URL, SUPABASE_KEY);

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
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [tab, setTab] = useState("ana");
  const [darkMode, setDarkMode] = useState(false);
  const [time, setTime] = useState(new Date());

  const [text, setText] = useState("");
  const [expenses, setExpenses] = useState([]);
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
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) verileriGetir();
  }, [session]);

  useEffect(() => {
    localStorage.setItem("gider_robotu_limits", JSON.stringify(limits));
  }, [limits]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  async function girisYap() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
  }

  async function cikisYap() {
    await supabase.auth.signOut();
    setSession(null);
  }

  function kategoriBul(input) {
    const x = input.toLowerCase();

    if (x.includes("market") || x.includes("migros") || x.includes("a101") || x.includes("bim")) return "Market";
    if (x.includes("sigara") || x.includes("tütün")) return "Tütün";
    if (x.includes("pantolon") || x.includes("ayakkabı") || x.includes("giyim") || x.includes("mont")) return "Giyim";
    if (x.includes("benzin") || x.includes("mazot") || x.includes("yakıt")) return "Yakıt";
    if (x.includes("yemek") || x.includes("kahve") || x.includes("burger") || x.includes("restoran")) return "Yeme-İçme";
    if (x.includes("elektrik") || x.includes("su") || x.includes("internet") || x.includes("doğalgaz")) return "Fatura";
    if (x.includes("eczane") || x.includes("ilaç") || x.includes("hastane")) return "Sağlık";
    if (x.includes("ev") || x.includes("koltuk") || x.includes("mutfak")) return "Ev";

    return "Diğer";
  }

  function harcamaCoz(input) {
    const tutar = Number(input.match(/\d+/)?.[0] || 0);
    const taksitMatch = input.match(/(\d+)\s*taksit/i);
    const taksit = taksitMatch ? Number(taksitMatch[1]) : 1;
    const kategori = kategoriBul(input);
    const aylik_tutar = Math.round(tutar / taksit);

    return {
      aciklama: input,
      tutar,
      kategori,
      taksit,
      aylik_tutar,
      kullanici: session?.user?.email || "",
    };
  }

  async function verileriGetir() {
    const { data, error } = await supabase
      .from("harcamalar")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Veri çekme hatası: " + error.message);
      return;
    }

    setExpenses(data || []);
  }

  async function harcamaEkle() {
    if (!text.trim()) return;

    const kayit = harcamaCoz(text);

    const { error } = await supabase.from("harcamalar").insert([kayit]);

    if (error) {
      alert("Kayıt hatası: " + error.message);
      return;
    }

    setText("");
    verileriGetir();
  }

  async function harcamaSil(id) {
    const { error } = await supabase.from("harcamalar").delete().eq("id", id);

    if (error) {
      alert("Silme hatası: " + error.message);
      return;
    }

    verileriGetir();
  }

  const today = new Date().toDateString();

  const filteredExpenses = expenses.filter((x) =>
    String(x.aciklama || "").toLowerCase().includes(search.toLowerCase()) ||
    String(x.kategori || "").toLowerCase().includes(search.toLowerCase()) ||
    String(x.kullanici || "").toLowerCase().includes(search.toLowerCase())
  );

  const total = expenses.reduce((s, x) => s + Number(x.aylik_tutar || x.tutar || 0), 0);

  const todayTotal = expenses
    .filter((x) => new Date(x.created_at).toDateString() === today)
    .reduce((s, x) => s + Number(x.aylik_tutar || x.tutar || 0), 0);

  const yearlyTotal = expenses.reduce((s, x) => s + Number(x.tutar || 0), 0);

  const categoryTotals = useMemo(() => {
    const obj = {};
    expenses.forEach((x) => {
      const cat = x.kategori || "Diğer";
      obj[cat] = (obj[cat] || 0) + Number(x.aylik_tutar || x.tutar || 0);
    });
    return obj;
  }, [expenses]);

  const monthTotals = useMemo(() => {
    const obj = {};
    expenses.forEach((x) => {
      const month = new Date(x.created_at).toLocaleDateString("tr-TR", {
        month: "long",
        year: "numeric",
      });
      obj[month] = (obj[month] || 0) + Number(x.aylik_tutar || x.tutar || 0);
    });
    return obj;
  }, [expenses]);

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const overLimits = Object.entries(categoryTotals).filter(([cat, val]) => val > limits[cat]);

  const aiComment = () => {
    if (!expenses.length) return "Henüz yorum yapacak veri yok. Harcama ekleyince analiz başlayacak.";
    if (overLimits.length) return `${overLimits[0][0]} limiti aşılmış. Bu kategori kontrol edilirse bütçe rahatlar.`;
    if (topCategory) return `Bu ay en yüksek harcama ${topCategory[0]} kategorisinde. Yaklaşık ${Math.round(topCategory[1] * 0.2)} TL azaltma hedefi mantıklı.`;
    return "Harcamalar dengeli görünüyor.";
  };

  const bg = darkMode
    ? "linear-gradient(135deg,#020617,#111827,#1e1b4b)"
    : "linear-gradient(135deg,#bfdbfe,#e9d5ff,#fde68a)";

  const textColor = darkMode ? "#f8fafc" : "#0f172a";
  const cardBg = darkMode ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.85)";

  const card = {
    background: cardBg,
    color: textColor,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,0.14)",
  };

  const btn = {
    border: "none",
    borderRadius: 16,
    padding: 13,
    fontWeight: "bold",
    cursor: "pointer",
  };

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: bg, fontFamily: "Arial" }}>
        <div style={{ ...card, width: 330 }}>
          <h1 style={{ textAlign: "center" }}>Giriş Yap</h1>

          <input
            placeholder="Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 13, marginBottom: 10, borderRadius: 12, boxSizing: "border-box" }}
          />

          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && girisYap()}
            style={{ width: "100%", padding: 13, marginBottom: 10, borderRadius: 12, boxSizing: "border-box" }}
          />

          <button onClick={girisYap} style={{ ...btn, width: "100%", background: "#2563eb", color: "white" }}>
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: bg, color: textColor, fontFamily: "Arial", padding: 16, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 460, margin: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div
  style={{
    fontSize: 70,
    marginBottom: 10
  }}
>
  🤖
</div>
          <p
  style={{
    fontSize: 20,
    fontWeight: "bold",
    color: "#2563eb",
    marginTop: 10,
    marginBottom: 15
  }}
>
  💙 Ortak Hesap
</p>
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
              <h2 style={{ fontSize: 34, margin: 0 }}>{time.toLocaleTimeString("tr-TR")}</h2>
              <p>{time.toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>

            <button onClick={() => setDarkMode(!darkMode)} style={{ ...btn, width: "100%", marginBottom: 14, background: darkMode ? "#facc15" : "#020617", color: darkMode ? "black" : "white" }}>
              {darkMode ? "☀️ Gündüz Modu" : "🌙 Gece Modu"}
            </button>

            <button onClick={cikisYap} style={{ ...btn, width: "100%", marginBottom: 14, background: "#dc2626", color: "white" }}>
              Çıkış Yap
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={card}><b>💳 Bugün</b><h2>{todayTotal} TL</h2></div>
              <div style={card}><b>📈 Toplam</b><h2>{total} TL</h2></div>
            </div>

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && harcamaEkle()}
              placeholder="300 market / 1500 pantolon 3 taksit"
              style={{ width: "100%", padding: 16, borderRadius: 18, border: "none", boxSizing: "border-box", fontSize: 16, marginBottom: 10 }}
            />

            <button onClick={harcamaEkle} style={{ ...btn, width: "100%", background: "linear-gradient(90deg,#2563eb,#9333ea)", color: "white", fontSize: 17 }}>
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
                    <b>{icons[x.kategori] || "📦"} {x.aciklama}</b>
                    <div style={{ opacity: 0.7, fontSize: 13 }}>
                      {new Date(x.created_at).toLocaleDateString("tr-TR")} - {x.kullanici}
                    </div>
                  </div>
                  <b>{x.tutar} TL</b>
                </div>

                <p>{x.kategori} | {x.taksit || 1} taksit | Aylık: {x.aylik_tutar || x.tutar} TL</p>

                <button onClick={() => harcamaSil(x.id)} style={{ ...btn, background: "#dc2626", color: "white", width: "100%" }}>
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
                    style={{ width: "100%", padding: 10, marginTop: 8, borderRadius: 12, border: "none", boxSizing: "border-box" }}
                  />

                  <div style={{ height: 16, background: "#e5e7eb", borderRadius: 20, marginTop: 8, overflow: "hidden" }}>
                    <div style={{ width: `${percent}%`, height: "100%", background: used > limit ? "#dc2626" : colors[cat], borderRadius: 20 }} />
                  </div>
                </div>
              );
            })}

            <button onClick={() => setLimits(defaultLimits)} style={{ ...btn, width: "100%", background: "#64748b", color: "white" }}>
              Limitleri Sıfırla
            </button>
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