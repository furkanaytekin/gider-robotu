import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";


  const SUPABASE_URL = "https://jqdsdvkoqebrykejjlka.supabase.co"
  const SUPABASE_KEY = "sb_publishable_U7yw_R8E2z1XGy48YU7bNQ_gtMDliTq"

  const supabase =
  createClient(SUPABASE_URL, SUPABASE_KEY);


export default function App() {
  const [session, setSession] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [harcamalar, setHarcamalar] = useState([]);
  const [aciklama, setAciklama] = useState("");
  const [tutar, setTutar] = useState("");

  const [gunlukLimit, setGunlukLimit] = useState(
    Number(localStorage.getItem("gunlukLimit")) || 0
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (session) {
      verileriGetir();
    }
  }, [session]);

  async function girisYap() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
  }

  async function verileriGetir() {
    const { data } = await supabase
      .from("harcamalar")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setHarcamalar(data);
    }
  }

  async function harcamaEkle() {
    if (!aciklama || !tutar) return;

    await supabase.from("harcamalar").insert([
      {
        aciklama,
        tutar: Number(tutar),
      },
    ]);

    setAciklama("");
    setTutar("");

    verileriGetir();
  }

  const toplam = harcamalar.reduce(
    (a, b) => a + Number(b.tutar),
    0
  );

  const bugun = harcamalar
    .filter((x) => {
      const tarih = new Date(x.created_at).toDateString();
      return tarih === new Date().toDateString();
    })
    .reduce((a, b) => a + Number(b.tutar), 0);

  if (!session) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#eef4ff",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            background: "white",
            padding: 30,
            borderRadius: 20,
            width: 320,
          }}
        >
          <h1 style={{ textAlign: "center" }}>Giriş Yap</h1>

          <input
            placeholder="Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 10,
            }}
          />

          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 10,
            }}
          />

          <button
            onClick={girisYap}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 15,
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 10,
            }}
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef4ff",
        padding: 20,
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          maxWidth: 500,
          margin: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <input
            placeholder="Açıklama"
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ccc",
            }}
          />

          <input
            placeholder="Tutar"
            type="number"
            value={tutar}
            onChange={(e) => setTutar(e.target.value)}
            style={{
              width: 120,
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ccc",
            }}
          />
        </div>

        <button
          onClick={harcamaEkle}
          style={{
            width: "100%",
            padding: 14,
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
          }}
        >
          Harcamayı Kaydet
        </button>

        <div
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 20,
              borderRadius: 16,
              textAlign: "center",
            }}
          >
            <h3>Bugün</h3>
            <h2>{bugun} TL</h2>
          </div>

          <div
            style={{
              background: "white",
              padding: 20,
              borderRadius: 16,
              textAlign: "center",
            }}
          >
            <h3>Toplam</h3>
            <h2>{toplam} TL</h2>
          </div>
        </div>

        <div
          style={{
            background: "white",
            marginTop: 20,
            padding: 20,
            borderRadius: 16,
          }}
        >
          <h3>Günlük Limit</h3>

          <input
            type="number"
            value={gunlukLimit}
            onChange={(e) => {
              setGunlukLimit(e.target.value);
              localStorage.setItem(
                "gunlukLimit",
                e.target.value
              );
            }}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 10,
            }}
          />

          <h2
            style={{
              color: bugun > gunlukLimit ? "red" : "green",
            }}
          >
            Kalan: {gunlukLimit - bugun} TL
          </h2>
        </div>

        <div
          style={{
            background: "white",
            marginTop: 20,
            padding: 20,
            borderRadius: 16,
          }}
        >
          <h3>Son Harcamalar</h3>

          {harcamalar.map((h) => (
            <div
              key={h.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 10,
                borderBottom: "1px solid #eee",
                paddingBottom: 8,
              }}
            >
              <span>{h.aciklama}</span>
              <strong>{h.tutar} TL</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}