import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-primary">Kyçu</h2>
        <p className="text-gray-500 text-sm mt-1">Hyni në llogarinë tuaj të Peitho</p>
      </div>
      <SignIn
        signUpUrl="/register"
        forceRedirectUrl="/dashboard"
        appearance={{ elements: { rootBox: "mx-auto", card: "shadow-none border-0" } }}
      />
    </div>
  );
}
