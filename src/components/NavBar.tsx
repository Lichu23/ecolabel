import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";

export async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-10 border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="text-base font-bold text-green-700"
          >
            EcoLabel
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link
              href="/dashboard"
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/upload"
              className="hover:text-foreground transition-colors"
            >
              Nueva análisis
            </Link>
            <Link
              href="/settings"
              className="hover:text-foreground transition-colors"
            >
              Ajustes
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{user?.email}</span>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit">
              Salir
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
