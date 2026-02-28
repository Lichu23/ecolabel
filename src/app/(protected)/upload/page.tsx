import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UploadClient } from "./UploadClient";

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("user_id", user!.id)
    .single();

  if (!company) {
    return (
      <div className="max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Configura tu empresa primero</CardTitle>
            <CardDescription>
              Necesitas un perfil de empresa para poder analizar envases.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/settings">Ir a Ajustes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <UploadClient companyName={company.name} />;
}
