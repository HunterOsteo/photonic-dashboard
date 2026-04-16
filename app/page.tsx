"use client";

import { useEffect, useState } from "react";
import { login } from "./lib/auth";
import { fetchTable } from "./lib/data";
import { scanPatent } from "./lib/scanner";

/* ---------------- LOGIN ---------------- */

function LoginScreen({ onLogin }: any) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  return (
    <div style={{ padding: 40 }}>
      <h2>Admin Login</h2>

      <input
        placeholder="username"
        value={user}
        onChange={(e) => setUser(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      />

      <input
        placeholder="password"
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      />

      <button
        onClick={() => {
          if (login(user, pass)) {
            onLogin(true);
          } else {
            alert("Invalid login");
          }
        }}
      >
        Login
      </button>
    </div>
  );
}

/* ---------------- MAIN APP ---------------- */

export default function Page() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState("patents");
  const [items, setItems] = useState<any[]>([]);
  const [scanInput, setScanInput] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;

    fetchTable(tab).then(setItems);
  }, [tab, loggedIn]);

  if (!loggedIn) {
    return <LoginScreen onLogin={setLoggedIn} />;
  }

  return (
    <main style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Dashboard</h1>

      {/* NAV */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setTab("patents")}>Patents</button>
        <button onClick={() => setTab("publications")}>Publications</button>
        <button onClick={() => setTab("people")}>People</button>
        <button onClick={() => setLoggedIn(false)}>Logout</button>
      </div>

      {/* SCANNER */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Scan patent URL or title"
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          style={{ marginRight: 10 }}
        />

        <button
          disabled={scanning}
          onClick={async () => {
            if (!scanInput) return;

            setScanning(true);

            try {
              const result = await scanPatent({
                title: scanInput,
                abstract: "Manually scanned entry",
                date: new Date().toISOString().split("T")[0],
                url: scanInput,
              });

              console.log("INSERT RESULT:", result);

              const data = await fetchTable("patents");
              setItems(data);

              setScanInput("");

              alert("Patent inserted");
            } catch (e) {
              console.error(e);
              alert("Insert failed — check console");
            } finally {
              setScanning(false);
            }
          }}
        >
          {scanning ? "Scanning..." : "Scan Patent"}
        </button>
      </div>

      {/* TITLE */}
      <h2>{tab}</h2>

      {/* DATA */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.length === 0 ? (
          <p>No data found</p>
        ) : (
          items.map((item, i) => (
            <pre
              key={i}
              style={{
                border: "1px solid #ccc",
                padding: 10,
                borderRadius: 6,
                background: "#f9f9f9",
              }}
            >
              {JSON.stringify(item, null, 2)}
            </pre>
          ))
        )}
      </div>
    </main>
  );
}