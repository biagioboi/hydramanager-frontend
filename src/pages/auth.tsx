import AuthPanel from "@/components/auth/auth-panel";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-default-0">
      <AuthPanel onAuth={(creds) => console.log("auth", creds)} />
    </div>
  );
}
