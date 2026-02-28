import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompanyForm } from "./CompanyForm";
import { saveCompany } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: company } = await supabase
    .from("companies")
    .select("name, cif, address, phone, whatsapp_number")
    .eq("user_id", user!.id)
    .single();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Ajustes de empresa</h1>

      <Card>
        <CardHeader>
          <CardTitle>Perfil de empresa</CardTitle>
          <CardDescription>
            Esta información aparecerá en todas las etiquetas generadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyForm
            saveCompany={saveCompany}
            defaultValues={company ?? undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
