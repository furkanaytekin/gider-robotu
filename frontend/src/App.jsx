import { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [expenses, setExpenses] = useState([]);

  const addExpense = () => {
    if (!text.trim()) return;
    setExpenses([
      ...expenses,
      {
        id: Date.now(),
        text,
        date: new Date().toLocaleDateString("tr-TR"),
      },
    ]);
    setText("");
  };

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h1>Gider Robotu 🚀</h1>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="300 market"
        style={{ padding: 12, width: "70%" }}
      />

      <button onClick={addExpense} style={{ padding: 12, marginLeft: 10 }}>
        Kaydet
      </button>

      <h2>Harcamalar</h2>

      {expenses.map((item) => (
        <div key={item.id}>
          {item.date} - {item.text}
        </div>
      ))}
    </div>
  );
}

export default App;