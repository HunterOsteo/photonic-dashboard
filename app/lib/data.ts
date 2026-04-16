import { supabase } from "./supabase";

export async function fetchTable(table: string) {
  const { data, error } = await supabase
    .from(table)
    .select("*");

  if (error) {
    console.error(`Error fetching ${table}:`, error);
    return [];
  }

  return data ?? [];
}