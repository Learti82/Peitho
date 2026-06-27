"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    city: "",
    category: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(field: keyof typeof formData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Fjalëkalimet nuk përputhen.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Fjalëkalimi duhet të ketë të paktën 8 karaktere.");
      return;
    }

    if (!formData.companyName.trim()) {
      setError("Emri i kompanisë është i detyrueshëm.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("Ky email është tashmë i regjistruar. Kyçuni.");
        } else {
          setError(authError.message);
        }
        return;
      }

      if (!authData.user) {
        setError("Ndodhi një gabim gjatë regjistrimit. Provoni sërish.");
        return;
      }

      // 2. Create organization record
      const { error: orgError } = await supabase.from("organizations").insert({
        id: authData.user.id,
        name: formData.companyName.trim(),
        city: formData.city.trim() || null,
        category: formData.category || null,
        contact_email: formData.email.trim(),
      });

      if (orgError) {
        console.error("Organization insert error:", orgError);
        // Don't block — user can update settings later
      }

      // If email confirmation is disabled, redirect immediately
      if (authData.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Ndodhi një gabim i papritur. Provoni sërish.");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-primary">Kontrolloni email-in tuaj</h3>
        <p className="text-gray-600 text-sm">
          Kemi dërguar një link konfirmimi në{" "}
          <strong>{formData.email}</strong>. Klikoni linkun për të aktivizuar llogarinë tuaj.
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 text-primary font-semibold hover:underline"
        >
          Kthehuni te kyçja
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary">Regjistrohu</h2>
        <p className="text-gray-500 text-sm mt-1">
          Krijoni llogarinë tuaj të Peitho
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
          value={formData.companyName}
          onChange={handleChange("companyName")}
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Qyteti"
            type="text"
            placeholder="Prishtinë"
            value={formData.city}
            onChange={handleChange("city")}
          />
          <Select
            label="Kategoria"
            options={CATEGORY_OPTIONS}
            placeholder="Zgjidhni..."
            value={formData.category}
            onChange={handleChange("category")}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="emri@kompania.com"
          value={formData.email}
          onChange={handleChange("email")}
          required
          autoComplete="email"
        />

        <Input
          label="Fjalëkalimi"
          type="password"
          placeholder="Të paktën 8 karaktere"
          value={formData.password}
          onChange={handleChange("password")}
          required
          autoComplete="new-password"
          hint="Minimum 8 karaktere"
        />

        <Input
          label="Konfirmo Fjalëkalimin"
          type="password"
          placeholder="Përsëritni fjalëkalimin"
          value={formData.confirmPassword}
          onChange={handleChange("confirmPassword")}
          required
          autoComplete="new-password"
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          className="mt-2"
        >
          Regjistrohu
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Keni llogari?{" "}
          <Link
            href="/login"
            className="text-primary font-semibold hover:text-primary-700 underline underline-offset-2"
          >
            Kyçu
          </Link>
        </p>
      </div>
    </div>
  );
}
