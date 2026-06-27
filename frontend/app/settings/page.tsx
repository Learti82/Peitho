import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { SettingsClientView } from "./SettingsClientView";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <Navbar userEmail={user.email} orgName={org?.name} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">Cilësimet</h1>
          <p className="text-gray-500 text-sm mt-1">
            Menaxhoni profilin e kompanisë dhe llogarinë tuaj
          </p>
        </div>
        <SettingsClientView
          user={{ id: user.id, email: user.email ?? "" }}
          organization={org}
        />
      </main>
    </div>
  );
}
