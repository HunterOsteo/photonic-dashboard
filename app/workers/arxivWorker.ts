import { supabase } from "@/app/lib/supabase";

/**
 * ArXiv ingestion worker
 * - fetches papers
 * - scores relevance
 * - deduplicates safely
 * - inserts into Supabase
 */

const STRONG_KEYWORDS = [
  "optical transistor",
  "all-optical logic",
  "photonic computing",
  "optical computing",
  "photonic logic",
  "optical neural network",
  "photonic circuit",
  "all-optical switch",
];

const WEAK_KEYWORDS = [
  "metamaterial",
  "nanophotonics",
  "silicon photonics",
  "photonics",
  "optomechanics",
  "waveguide",
  "resonator",
  "photonic crystal",
];

function scorePaper(text: string) {
  const t = text.toLowerCase();
  let score = 0;

  for (const k of STRONG_KEYWORDS) {
    if (t.includes(k)) score += 3;
  }

  for (const k of WEAK_KEYWORDS) {
    if (t.includes(k)) score += 1;
  }

  return score;
}

function extractEntry(entry: string) {
  const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim();
  const abstract = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim();
  const id = entry.match(/<id>(.*?)<\/id>/)?.[1];

  const normalizedId =
    id?.split("/").pop()?.toLowerCase() || crypto.randomUUID();

  return {
    id: normalizedId,
    title: title || "No title",
    abstract: abstract || "",
    url: id || "",
    date: new Date().toISOString().split("T")[0],
    publisher: "arxiv",
  };
}

export async function runArxivWorker() {
  try {
    const url =
      "http://export.arxiv.org/api/query?search_query=all:photonic&start=0&max_results=70&sortBy=submittedDate&sortOrder=descending";

    const res = await fetch(url);
    const text = await res.text();

    const entries = [
      ...text.matchAll(/<entry>([\s\S]*?)<\/entry>/g),
    ].map((m) => m[1]);

    const papers = entries.map(extractEntry);

    const scored = papers
      .map((p) => ({
        ...p,
        score: scorePaper(p.title + " " + p.abstract),
      }))
      .filter((p) => p.score >= 3);

    // ----------------------------
    // FETCH EXISTING FROM SUPABASE
    // ----------------------------
    const { data: existing, error: fetchError } = await supabase
      .from("publications")
      .select("title");

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError);
      return {
        fetched: papers.length,
        kept: scored.length,
        inserted: 0,
        error: "fetch_failed",
      };
    }

    // ----------------------------
    // SAFE DEDUP (TITLE ONLY)
    // ----------------------------
    const existingSet = new Set(
      (existing || []).map((x) => x.title.toLowerCase())
    );

    const newPapers = scored.filter(
      (p) => !existingSet.has(p.title.toLowerCase())
    );

    // ----------------------------
    // INSERT
    // ----------------------------
    let inserted = 0;

    if (newPapers.length > 0) {
      const { error } = await supabase
        .from("publications")
        .insert(newPapers);

      if (error) {
        console.error("Supabase insert error:", error);
        return {
          fetched: papers.length,
          kept: scored.length,
          inserted: 0,
          error: "insert_failed",
        };
      }

      inserted = newPapers.length;
    }

    return {
      fetched: papers.length,
      kept: scored.length,
      inserted,
    };
  } catch (err) {
    console.error("Worker crash:", err);

    return {
      fetched: 0,
      kept: 0,
      inserted: 0,
      error: "worker_crash",
    };
  }
}