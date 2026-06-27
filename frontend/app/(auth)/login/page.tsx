"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError("Email ose fjalëkalimi i gabuar. Provoni sërish.");
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Llogaria juaj nuk është konfirmuar. Kontrolloni email-in tuaj.");
        } else {
          setError(authError.message);
        }
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError("Ndodhi një gabim i papritur. Provoni sërish.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary">Kyçu</h2>
        <p className="text-gray-500 text-sm mt-1">
          Hyni në llogarinë tuaj të Peitho
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-5" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="emri@kompania.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
        />

        <Input
          label="Fjalëkalimi"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          className="mt-2"
        >
          Kyçu
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Nuk keni llogari?{" "}
          <Link
            href="/register"
            className="text-primary font-semibold hover:text-primary-700 underline underline-offset-2"
          >
            Regjistrohu
          </Link>
        </p>
      </div>
    </div>
  );
}
