import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-primary">Regjistrohu</h2>
        <p className="text-gray-500 text-sm mt-1">Krijoni llogarinë tuaj të Peitho</p>
      </div>
      <SignUp
        signInUrl="/login"
        forceRedirectUrl="/onboarding"
        appearance={{ elements: { rootBox: "mx-auto", card: "shadow-none border-0" } }}
      />
    </div>
  );
}
