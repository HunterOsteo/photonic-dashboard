import { supabase } from "./supabase";

export async function scanPatent(input: {
  title: string;
  abstract?: string;
  url: string;
}) {
  const { data, error } = await supabase
    .from("patents")
    .insert([
      {
        id: crypto.randomUUID(),
        title: input.title,
        abstract: input.abstract || "",
        url: input.url,
        read: false,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    return null;
  }

  return data?.[0];
}