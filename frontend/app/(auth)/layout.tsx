import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kyçu",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary to-primary-700 flex flex-col items-center justify-center p-4">
      {/* Logo */}
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

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-6 text-primary-300 text-xs text-center">
        © {new Date().getFullYear()} Peitho. Të gjitha të drejtat e rezervuara.
      </p>
    </div>
  );
}
