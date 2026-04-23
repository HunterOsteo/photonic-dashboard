"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

type Item = {
  id: string;
  title: string;
  abstract?: string;
  url?: string;
  date?: string;
  score?: number;
  publisher?: string;
};

type TableType = "patents" | "publications" | "people";

export default function Page() {
  const [active, setActive] = useState<TableType>("patents");
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<any>(null);

  const [useMock, setUseMock] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("useMock") === "true";
  });

  // ---------------------------
  // LOAD DATA FROM SUPABASE
  // ---------------------------
  async function load(table: TableType) {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.error("Supabase load error:", error);
        setData([]);
        return;
      }

      setData(data || []);
    } catch (err) {
      console.error(err);
      setData([]);
    }

    setLoading(false);
  }

  // initial + tab switch reload
  useEffect(() => {
    load(active);
  }, [active]);

  // ---------------------------
  // RUN SCAN
  // ---------------------------
 async function scan() {
  setLoading(true);

  try {
    // 1. run backend ingestion
    const res = await fetch("/api/cron");
    const json = await res.json();

    setScanStatus(json.result);

    // 2. ALWAYS re-fetch from Supabase (source of truth)
    const { data, error } = await supabase
      .from("publications")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      setData([]);
      return;
    }

    setData(data || []);
  } catch (err) {
    console.error(err);
  }

  setLoading(false);
}

  // ---------------------------
  // UI
  // ---------------------------
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
              const v = !useMock;
              setUseMock(v);
              localStorage.setItem("useMock", String(v));
            }}
            className="bg-gray-800 px-2 py-1 rounded text-xs hover:bg-gray-700"
          >
            Toggle
          </button>
        </div>
      </div>

      {/* TABS */}
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

      {/* SCAN BAR */}
      <div className="max-w-5xl mx-auto p-4">
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex justify-between items-center">
          
          <button
            onClick={scan}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm"
          >
            Run Scan
          </button>

          {scanStatus && (
            <div className="text-xs text-gray-300 flex gap-4">
              <span>Fetched: {scanStatus.fetched}</span>
              <span>Kept: {scanStatus.kept}</span>
              <span>Inserted: {scanStatus.inserted}</span>
            </div>
          )}
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
              className="p-4 rounded-xl border bg-gray-900 border-gray-800"
            >
              <div className="font-medium text-lg">
                {item.title}
              </div>

              {item.abstract && (
                <div className="text-sm text-gray-400 mt-2">
                  {item.abstract}
                </div>
              )}

              <div className="text-xs text-gray-500 mt-2 flex justify-between">
                <span>{item.date}</span>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    className="text-blue-400"
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