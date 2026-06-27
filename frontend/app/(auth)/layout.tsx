import type { Metadata } from "next";
import { FileText } from "lucide-react";

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
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
          <FileText className="h-7 w-7 text-gold" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gold tracking-wide">Peitho</h1>
          <p className="text-primary-200 text-sm mt-0.5">
            Platforma e Tenderëve
          </p>
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
