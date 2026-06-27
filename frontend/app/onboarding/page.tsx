"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useSupabaseClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const CATEGORY_OPTIONS = [
  { value: "IT_SERVICES", label: "Teknologji Informacioni" },
  { value: "CONSTRUCTION", label: "Ndërtim dhe Infrastrukturë" },
  { value: "CONSULTING", label: "Konsulencë dhe Shërbime" },
  { value: "SUPPLIES", label: "Furnizime dhe Mallra" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const supabase = useSupabaseClient();

  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If the org already exists, skip onboarding
  useEffect(() => {
    if (!isLoaded || !user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      if (data) {
        router.replace("/dashboard");
      } else {
        setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isLoaded, user, supabase, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!companyName.trim()) {
      setError("Emri i kompanisë është i detyrueshëm.");
      return;
    }
    if (!user) return;

    setIsLoading(true);
    try {
      const { error: orgError } = await supabase.from("organizations").insert({
        id: user.id,
        name: companyName.trim(),
        city: city.trim() || null,
        category: category || null,
        contact_email: user.primaryEmailAddress?.emailAddress ?? null,
      });

      if (orgError) {
        setError("Nuk u ruajt profili: " + orgError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Ndodhi një gabim i papritur. Provoni sërish.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary to-primary-700 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex items-center justify-center bg-white rounded-2xl p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Peitho" className="h-16 w-16 object-contain" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gold tracking-wide">Peitho</h1>
          <p className="text-primary-200 text-sm mt-0.5">Platforma e Tenderëve</p>
        </div>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {checking ? (
          <p className="text-center text-gray-500 py-8">Duke u ngarkuar...</p>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-primary">Mirë se vini!</h2>
              <p className="text-gray-500 text-sm mt-1">
                Plotësoni profilin e kompanisë suaj për të vazhduar
              </p>
            </div>

            {error && (
              <Alert variant="error" className="mb-5" onDismiss={() => setError(null)}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Emri i Kompanisë"
                type="text"
                placeholder="Kompania SH.P.K."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                autoFocus
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Qyteti"
                  type="text"
                  placeholder="Prishtinë"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <Select
                  label="Kategoria"
                  options={CATEGORY_OPTIONS}
                  placeholder="Zgjidhni..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <Button type="submit" fullWidth size="lg" isLoading={isLoading} className="mt-2">
                Vazhdo
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
