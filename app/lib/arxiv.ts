export async function fetchArxiv(query = "photonic OR optical computing") {
  const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
    query
  )}&start=0&max_results=10`;

  const res = await fetch(url);
  const text = await res.text();

  // VERY simple parsing (good enough for MVP)
  const entries = text.split("<entry>").slice(1);

  return entries.map((e) => {
    const title = e.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim();
    const summary = e.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim();
    const id = e.match(/<id>(.*?)<\/id>/)?.[1];

    return {
      id: id || crypto.randomUUID(),
      title: title || "No title",
      abstract: summary || "",
      url: id,
      date: new Date().toISOString().split("T")[0],
      source: "arxiv",
    };
  });
}