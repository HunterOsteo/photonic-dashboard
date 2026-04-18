"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { scanPatent } from "./lib/scanner";

type Item = {
  id: string;
  title: string;
  abstract?: string;
  url?: string;
  date?: string;
};

type TableType = "patents" | "publications" | "people";

export default function Page() {
  const [active, setActive] = useState<TableType>("patents");
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [useMock, setUseMock] = useState(() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("useMock") === "true";
});
const mockData: Item[] = [
  {
    id: "1",
    title: "All-Optical Neural Network for Photonic Computing",
    abstract: "Demonstrates optical inference using waveguide interference patterns.",
    date: "2026-04-16",
    score: 5,
    publisher: "Nature Photonics",
  },
  {
    id: "2",
    title: "Silicon Photonic Tensor Accelerator",
    abstract: "Accelerates matrix multiplication using integrated photonics.",
    date: "2026-04-15",
    score: 4,
    publisher: "arXiv",
  },
  {
    id: "3",
    title: "Optical Memory and Nonlinear Switching",
    abstract: "Explores memristive optical switching in ferroelectric materials.",
    date: "2026-04-14",
    score: 3,
    publisher: "Science",
  },
];
  async function load(table: TableType) {
  setLoading(true);

  if (useMock) {
    setData(mockData);
    setLoading(false);
    return;
  }

  try {
    const { data } = await supabase
      .from(table)
      .select("*")
      .order("date", { ascending: false });

    setData(data || []);
  } catch (err) {
    console.error(err);
    setData([]);
  }

  setLoading(false);
}

  useEffect(() => {
    load(active);
  }, [active]);

  async function scan() {
  if (!input.trim()) return;

  await scanPatent({
    title: input,
    url: input,
    abstract: "",
  });

  setInput("");
  load(active);
}

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      {/* HEADER */}
      <div className="border-b border-gray-800 p-4 flex justify-between">
        <div className="font-semibold">
          Photonic Intelligence Dashboard
        </div>
        <div className="flex items-center gap-4 text-sm">
  <div className="text-gray-400">
    {useMock ? "Mock Mode" : "Live Mode"}
  </div>

  <button
    onClick={() => {
  const newValue = !useMock;
  setUseMock(newValue);
  localStorage.setItem("useMock", String(newValue));
}}
    className="bg-gray-800 px-2 py-1 rounded text-xs hover:bg-gray-700"
  >
    Toggle
  </button>
</div>
      </div>

      {/* NAV TABS */}
      <div className="max-w-5xl mx-auto p-4 flex gap-2">
        {(["patents", "publications", "people"] as TableType[]).map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-3 py-1 rounded-lg text-sm border ${
              active === t
                ? "bg-blue-600 border-blue-500"
                : "border-gray-700 text-gray-400"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* INPUT */}
      <div className="max-w-5xl mx-auto p-4">
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Scan into ${active}...`}
            className="flex-1 bg-transparent outline-none text-sm"
          />

          <button
            onClick={scan}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm"
          >
            Scan
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto p-4">
        {loading && (
          <div className="text-gray-400 text-sm">Loading...</div>
        )}

        <div className="space-y-3">
          {data.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border ${
  (item.score ?? 0) >= 4
    ? "bg-gray-900 border-blue-600"
    : "bg-gray-900 border-gray-800"
}`}
            >
              <div className="font-medium text-lg">
  {item.title}
</div>


              {item.abstract && (
                <div className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {item.abstract}
                </div>
              )}
              <div className="mt-2 flex gap-2 text-xs">
  <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded">
  Score: {item.score ?? "—"}
</span>

  {item.publisher && (
  <span className="bg-gray-800 text-gray-200 px-2 py-1 rounded text-[11px] tracking-wide uppercase">
    {item.publisher}
  </span>
)}
</div>

              <div className="text-xs text-gray-500 mt-2 flex justify-between">
                <span>{item.date}</span>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Open →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}