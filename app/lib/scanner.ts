import { supabase } from "./supabase";

export async function scanPatent(patent: any) {
  const { data, error } = await supabase
    .from("patents")
    .insert([
      {
        id: crypto.randomUUID(), // REQUIRED since id is text
        title: patent.title,
        abstract: patent.abstract,
        date: patent.date, // must be YYYY-MM-DD
        url: patent.url,
        score: 1,
      },
    ])
    .select();

  if (error) {
    console.error("SCAN ERROR FULL:", JSON.stringify(error, null, 2));
    return null;
  }

  return data;
}