"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Organization } from "@/lib/supabase/types";
import { LogOut, Save, Lock, Building2 } from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "", label: "Zgjidhni kategorinë..." },
  { value: "IT_SERVICES", label: "Teknologji Informacioni" },
  { value: "CONSTRUCTION", label: "Ndërtim dhe Infrastrukturë" },
  { value: "CONSULTING", label: "Konsulencë dhe Shërbime" },
  { value: "SUPPLIES", label: "Furnizime dhe Mallra" },
];

interface SettingsClientViewProps {
  user: { id: string; email: string };
  organization: Organization | null;
}

export function SettingsClientView({ user, organization }: SettingsClientViewProps) {
  const router = useRouter();

  // Org form state
  const [orgForm, setOrgForm] = useState({
    name: organization?.name ?? "",
    city: organization?.city ?? "",
    category: organization?.category ?? "",
    business_number: organization?.business_number ?? "",
    tax_number: organization?.tax_number ?? "",
    contact_email: organization?.contact_email ?? "",
    contact_phone: organization?.contact_phone ?? "",
  });
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgMessage, setOrgMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password form state
  const [pwForm, setPwForm] = useState({ newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleOrgChange(field: keyof typeof orgForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setOrgForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleOrgSubmit(e: FormEvent) {
    e.preventDefault();
    setOrgLoading(true);
    setOrgMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("organizations")
        .upsert({
          id: user.id,
          name: orgForm.name.trim(),
          city: orgForm.city.trim() || null,
          category: orgForm.category || null,
          business_number: orgForm.business_number.trim() || null,
          tax_number: orgForm.tax_number.trim() || null,
          contact_email: orgForm.contact_email.trim() || null,
          contact_phone: orgForm.contact_phone.trim() || null,
        });

      if (error) {
        setOrgMessage({ type: "error", text: `Gabim: ${error.message}` });
      } else {
        setOrgMessage({ type: "success", text: "Profili u ruajt me sukses!" });
        router.refresh();
      }
    } catch {
      setOrgMessage({ type: "error", text: "Ndodhi një gabim i papritur." });
    } finally {
      setOrgLoading(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPwMessage(null);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ type: "error", text: "Fjalëkalimet nuk përputhen." });
      return;
    }

    if (pwForm.newPassword.length < 8) {
      setPwMessage({ type: "error", text: "Fjalëkalimi duhet të ketë të paktën 8 karaktere." });
      return;
    }

    setPwLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: pwForm.newPassword,
      });

      if (error) {
        setPwMessage({ type: "error", text: `Gabim: ${error.message}` });
      } else {
        setPwMessage({ type: "success", text: "Fjalëkalimi u ndryshua me sukses!" });
        setPwForm({ newPassword: "", confirmPassword: "" });
      }
    } catch {
      setPwMessage({ type: "error", text: "Ndodhi një gabim i papritur." });
    } finally {
      setPwLoading(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="space-y-6">
      {/* Organization Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Profili i Kompanisë</CardTitle>
          </div>
        </CardHeader>

        {orgMessage && (
          <Alert
            variant={orgMessage.type === "success" ? "success" : "error"}
            className="mb-4"
            onDismiss={() => setOrgMessage(null)}
          >
            {orgMessage.text}
          </Alert>
        )}

        <form onSubmit={handleOrgSubmit} className="space-y-4">
          <Input
            label="Emri i Kompanisë"
            value={orgForm.name}
            onChange={handleOrgChange("name")}
            required
            placeholder="Kompania SH.P.K."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Qyteti"
              value={orgForm.city}
              onChange={handleOrgChange("city")}
              placeholder="Prishtinë"
            />
            <Select
              label="Kategoria"
              options={CATEGORY_OPTIONS}
              value={orgForm.category}
              onChange={handleOrgChange("category")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Numri i Biznesit"
              value={orgForm.business_number}
              onChange={handleOrgChange("business_number")}
              placeholder="70000000"
            />
            <Input
              label="Numri i TVSH-së"
              value={orgForm.tax_number}
              onChange={handleOrgChange("tax_number")}
              placeholder="600000000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email i Kontaktit"
              type="email"
              value={orgForm.contact_email}
              onChange={handleOrgChange("contact_email")}
              placeholder="info@kompania.com"
            />
            <Input
              label="Telefoni"
              type="tel"
              value={orgForm.contact_phone}
              onChange={handleOrgChange("contact_phone")}
              placeholder="+383 44 000 000"
            />
          </div>

          <div className="pt-2">
            <p className="text-xs text-gray-400 mb-3">
              Llogaria: <strong>{user.email}</strong>
            </p>
            <Button type="submit" isLoading={orgLoading}>
              <Save className="h-4 w-4 mr-2" />
              Ruaj Ndryshimet
            </Button>
          </div>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle>Ndrysho Fjalëkalimin</CardTitle>
          </div>
        </CardHeader>

        {pwMessage && (
          <Alert
            variant={pwMessage.type === "success" ? "success" : "error"}
            className="mb-4"
            onDismiss={() => setPwMessage(null)}
          >
            {pwMessage.text}
          </Alert>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Fjalëkalimi i Ri"
            type="password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
            required
            placeholder="Të paktën 8 karaktere"
            autoComplete="new-password"
          />
          <Input
            label="Konfirmo Fjalëkalimin"
            type="password"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            required
            placeholder="Përsëritni fjalëkalimin"
            autoComplete="new-password"
          />
          <Button type="submit" variant="outline" isLoading={pwLoading}>
            <Lock className="h-4 w-4 mr-2" />
            Ndrysho Fjalëkalimin
          </Button>
        </form>
      </Card>

      {/* Logout */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Dil nga llogaria</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Do të ridrejtoheni te faqja e kyçjes
            </p>
          </div>
          <Button variant="destructive" onClick={handleLogout} size="md">
            <LogOut className="h-4 w-4 mr-2" />
            Dil
          </Button>
        </div>
      </Card>
    </div>
  );
}
