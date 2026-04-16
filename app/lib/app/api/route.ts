import { supabase } from "@/app/lib/supabase";

const KEYWORDS = [
  "photonic",
  "optical",
  "photon",
  "waveguide",
  "silicon photonics",
  "optical computing",
];

// mock fetch function (we replace with real API next step)
async function fetchPatents() {
  return [
    {
      id: "test-1",
      title: "Photonic Neural Compute Architecture",
      abstract: "Optical neural network using waveguides",
      url: "https://example.com/patent1",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: "test-2",
      title: "Mechanical gearbox system",
      abstract: "non relevant",
      url: "https://example.com/patent2",
      date: new Date().toISOString().split("T")[0],
    },
  ];
}

function isRelevant(patent: any) {
  const text =
    (patent.title + " " + patent.abstract).toLowerCase();

  return KEYWORDS.some((k) => text.includes(k));
}

export async function GET() {
  const patents = await fetchPatents();

  const relevant = patents.filter(isRelevant);

  for (const p of relevant) {
    await supabase.from("patents").upsert({
      id: p.id,
      title: p.title,
      abstract: p.abstract,
      url: p.url,
      date: p.date,
      source: "cron",
    });
  }

  return Response.json({
    inserted: relevant.length,
    total: patents.length,
  });
}