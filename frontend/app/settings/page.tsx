import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { SettingsClientView } from "./SettingsClientView";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";

  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-background">
      <Navbar userEmail={userEmail} orgName={org?.name} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">Cilësimet</h1>
          <p className="text-gray-500 text-sm mt-1">
            Menaxhoni profilin e kompanisë dhe llogarinë tuaj
          </p>
        </div>
        <SettingsClientView
          user={{ id: userId, email: userEmail }}
          organization={org}
        />
      </main>
    </div>
  );
}
