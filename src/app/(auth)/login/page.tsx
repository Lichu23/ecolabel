import { signIn, signUp } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">EcoLabel</CardTitle>
          <CardDescription>
            Compliance de etiquetado ambiental para PYMEs españolas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm signIn={signIn} signUp={signUp} />
        </CardContent>
      </Card>
    </main>
  );
}
