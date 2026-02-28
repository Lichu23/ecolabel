"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Soft-archives a label. Sets is_archived = true.
 * RLS ensures the label belongs to the authenticated user's company.
 */
export async function archiveLabel(
  labelId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("labels")
    .update({ is_archived: true })
    .eq("id", labelId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return {};
}
