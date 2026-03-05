import AuthPanel from "@/components/auth/auth-panel";
import { Logo } from "@/components/ui/icons";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-default-0">
      <div className="w-full px-4 flex flex-col items-center gap-6">
        <img src="/hydraclub-logo.png" alt="HydraClub Logo" className="w-32 h-32 object-contain mb-2" />
        <Logo />
        <AuthPanel />
      </div>
    </div>
  );
}
