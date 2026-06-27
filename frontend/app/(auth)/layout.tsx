import type { Metadata } from "next";
import Image from "next/image";

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
          <Image
            src="/logo.png"
            alt="Peitho"
            width={96}
            height={96}
            className="h-20 w-20 object-contain"
            priority
          />
        </div>
        <p className="text-primary-200 text-sm">Platforma e Tenderëve</p>
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
