"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveCompany(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const name = String(formData.get("name") ?? "").trim();
  const cif = String(formData.get("cif") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const whatsapp_number = String(formData.get("whatsapp_number") ?? "").trim() || null;

  if (!name || !cif) return { error: "Nombre y CIF son obligatorios" };

  // Validate Spanish CIF format: one letter + 7 digits + one alphanumeric check char
  if (!/^[A-Z]\d{7}[0-9A-J]$/.test(cif)) {
    return { error: "El CIF no tiene un formato válido (ej: A12345678)" };
  }

  // Validate WhatsApp number in E.164 format if provided
  if (whatsapp_number && !/^\+[1-9]\d{7,14}$/.test(whatsapp_number)) {
    return { error: "El número de WhatsApp debe estar en formato E.164 (ej: +34612345678)" };
  }

  // Check if company already exists for this user
  const { data: existing } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("companies")
      .update({ name, cif, address, phone, whatsapp_number })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("companies").insert({
      user_id: user.id,
      name,
      cif,
      address,
      phone,
      whatsapp_number,
    });

    if (error) return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { success: true };
}
