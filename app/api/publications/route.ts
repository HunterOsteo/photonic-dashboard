import { supabase } from "@/app/lib/supabase";

const KEYWORDS = [
  "photonic",
  "optical computing",
  "optical transistor",
  "all-optical",
  "waveguide",
  "silicon photonics",
  "optical neural",
  "nonlinear optics",
];

function isRelevant(paper: any) {
  const text = (paper.title + " " + paper.abstract).toLowerCase();
  return KEYWORDS.some((k) => text.includes(k));
}

export async function GET() {
  const url =
    "http://export.arxiv.org/api/query?search_query=all:photonic%20OR%20optical%20computing&start=0&max_results=30";

  const res = await fetch(url);
  const text = await res.text();

  const entries = text.split("<entry>").slice(1);

  const papers = entries
    .map((e) => {
      const title = e.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim();
      const abstract = e.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim();
      const id = e.match(/<id>(.*?)<\/id>/)?.[1];

      return {
        id: id || crypto.randomUUID(),
        title: title || "No title",
        abstract: abstract || "",
        url: id,
        date: new Date().toISOString().split("T")[0],
        publisher: "arxiv",
      };
    })
    .filter(isRelevant);

  const { error } = await supabase
    .from("publications")
    .upsert(papers, { onConflict: "id" });

  if (error) {
    return Response.json({ error }, { status: 500 });
  }

  return Response.json({
    inserted: papers.length,
  });
}