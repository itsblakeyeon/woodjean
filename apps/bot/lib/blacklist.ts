import { supabase } from "./supabase";

export async function isPhoneBlacklisted(phone: string): Promise<boolean> {
  const { data, error } = await supabase()
    .from("blacklist")
    .select("phone")
    .eq("phone", phone)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
