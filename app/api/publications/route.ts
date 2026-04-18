import { supabase } from "@/app/lib/supabase";

/**
 * QCLS-focused relevance system
 * Strong = core photonic computing relevance
 * Weak = supporting photonics concepts
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
  "waveguide",
  "photonic crystal",
  "nonlinear optics",
  "silicon photonics",
  "optical switching",
  "optical modulator",
  "optical cavity",
  "nanophotonics",
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

export async function GET() {
  const url =
    "http://export.arxiv.org/api/query?search_query=all:photonic%20OR%20optical%20computing&start=0&max_results=50";

  const res = await fetch(url);
  const text = await res.text();

  const entries = text.split("<entry>").slice(1);

  // STEP 1: extract papers
  const papers = entries.map(extractEntry);

  // STEP 2: score + filter
  const scored = papers
    .map((p) => {
      const score = scorePaper(p.title + " " + p.abstract);
      return { ...p, score };
    })
    .filter((p) => p.score >= 3);

  // STEP 3: deduplicate against DB
  const { data: existing } = await supabase
    .from("publications")
    .select("id");

  const existingSet = new Set(existing?.map((x) => x.id));

  const newPapers = scored.filter((p) => !existingSet.has(p.id));

  // STEP 4: insert
  if (newPapers.length > 0) {
    const { error } = await supabase
      .from("publications")
      .insert(newPapers);

    if (error) {
      return Response.json({ error }, { status: 500 });
    }
  }

  return Response.json({
    fetched: papers.length,
    kept: scored.length,
    inserted: newPapers.length,
  });
}