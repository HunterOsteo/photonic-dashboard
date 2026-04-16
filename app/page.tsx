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

  async function load(table: TableType) {
    setLoading(true);

    const { data } = await supabase
      .from(table)
      .select("*")
      .order("date", { ascending: false });

    setData(data || []);
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
        <div className="text-gray-400 text-sm">
          Supabase Connected
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
              className="bg-gray-900 border border-gray-800 p-4 rounded-xl"
            >
              <div className="font-medium">{item.title}</div>

              {item.abstract && (
                <div className="text-sm text-gray-400 mt-1">
                  {item.abstract}
                </div>
              )}

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