import React, { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { useNavigate } from "react-router-dom";

import { login } from "@/lib/auth";

type AuthPanelProps = {
  onAuth?: (data: { token?: string; role?: string }) => void;
};

export const AuthPanel: React.FC<AuthPanelProps> = ({ onAuth }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username || !password) {
      setError("Inserisci username e password.");

      return;
    }

    setLoading(true);
    try {
      const data = await login(username, password);
      const token = data.token;

      if (!token) throw new Error("Token non ricevuto dall'API");

      // persist token and optionally role
      localStorage.setItem("authToken", token);
      if (data.role) localStorage.setItem("role", String(data.role));

      setSuccess("Autenticazione avvenuta con successo.");
      onAuth?.({ token: data.token, role: data.role });

      // small delay to show success, then navigate to dashboard
      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err: any) {
      setError(err?.message || "Autenticazione fallita.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="w-full max-w-md p-6 rounded-lg bg-default-50 border border-default-100 shadow-sm"
      onSubmit={handleSubmit}
    >
      <h3 className="text-lg font-semibold mb-4">Sign in</h3>

      <div className="mb-3">
        <Input
          aria-label="Username"
          classNames={{ input: "text-sm" }}
          labelPlacement="outside"
          placeholder="username"
          type="text"
          value={username}
          onChange={(e: any) => setUsername(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <Input
          aria-label="Password"
          classNames={{ input: "text-sm" }}
          labelPlacement="outside"
          placeholder="••••••••"
          type="password"
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
        />
      </div>

      {error && <div className="text-danger text-sm mb-3">{error}</div>}
      {success && <div className="text-success text-sm mb-3">{success}</div>}

      <div className="flex items-center justify-between gap-3">
        <Button className="flex-1" isDisabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
        <Link color="foreground" href="#" size="sm">
          Forgot?
        </Link>
      </div>
    </form>
  );
};

export default AuthPanel;
