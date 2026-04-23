import { supabase } from "@/app/lib/supabase";

/**
 * This is the actual ingestion worker.
 * It fetches + scores + inserts papers.
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

  return {
    id: id || crypto.randomUUID(),
    title: title || "No title",
    abstract: abstract || "",
    url: id || "",
    date: new Date().toISOString().split("T")[0],
    publisher: "arxiv",
  };
}

export async function runArxivWorker() {
  const url =
  "http://export.arxiv.org/api/query?search_query=all:photonic&start=0&max_results=70&sortBy=submittedDate&sortOrder=descending";
  const res = await fetch(url);
  const text = await res.text();

  const entries = [...text.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(
  (m) => m[1]
);

const papers = entries.map(extractEntry);

  const scored = papers
    .map((p) => ({
      ...p,
      score: scorePaper(p.title + " " + p.abstract),
    }))
    .filter((p) => p.score >= 3);

  const { data: existing } = await supabase
    .from("publications")
    .select("id");

  const existingSet = new Set(existing?.map((x) => x.id));

  const newPapers = scored.filter((p) => !existingSet.has(p.id));

  if (newPapers.length > 0) {
    await supabase.from("publications").insert(newPapers);
  }

  return {
    fetched: papers.length,
    kept: scored.length,
    inserted: newPapers.length,
  };
}