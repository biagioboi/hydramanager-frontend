import React, { useState, useEffect } from "react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // Carica la password salvata se presente
  useEffect(() => {
    const saved = localStorage.getItem("hydra_remember_password");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.username) setUsername(parsed.username);
        if (parsed?.password) setPassword(parsed.password);
        setRememberPassword(true);
      } catch {}
    }
  }, []);

  const resolveRedirect = (role?: string) => {
    const normalized = (role || "").toString().trim().toLowerCase();
    switch (normalized) {
      case "receptionist":
        return "/receptionist";
      case "waiter":
        return "/waiter";
      case "maitre":
        return "/maitre";
      case "barman":
        return "/barman";
      case "repairman":
        return "/repairman";
      case "admin":
      default:
        return "/dashboard";
    }
  };

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
      // Ricorda la password se richiesto
      if (rememberPassword) {
        localStorage.setItem(
          "hydra_remember_password",
          JSON.stringify({ username, password })
        );
      } else {
        localStorage.removeItem("hydra_remember_password");
      }

      setSuccess("Autenticazione avvenuta con successo.");
      onAuth?.({ token: data.token, role: data.role });

      // small delay to show success, then navigate by role
      const nextPath = resolveRedirect(data.role);
      setTimeout(() => navigate(nextPath), 600);
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
      <h3 className="text-lg font-semibold mb-4">Accedi</h3>

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
        <div className="relative">
          <Input
            aria-label="Password"
            classNames={{ input: "text-sm pr-10" }}
            labelPlacement="outside"
            placeholder="••••••••"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-default-500 hover:text-default-800 focus:outline-none"
            tabIndex={-1}
            aria-label={showPassword ? "Nascondi password" : "Mostra password"}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.36 2.64A9.77 9.77 0 0021 12c-1.5-2.5-4.5-6-9-6-1.61 0-3.09.37-4.41 1.01M3.64 7.36A9.77 9.77 0 003 12c1.5 2.5 4.5 6 9 6 1.61 0 3.09-.37 4.41-1.01" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.36 2.64A9.77 9.77 0 0021 12c-1.5-2.5-4.5-6-9-6s-7.5 3.5-9 6c1.5 2.5 4.5 6 9 6s7.5-3.5 9-6z" />
              </svg>
            )}
          </button>
        </div>
        <label className="flex items-center gap-2 mt-2 text-xs select-none">
          <input
            type="checkbox"
            checked={rememberPassword}
            onChange={e => setRememberPassword(e.target.checked)}
            className="accent-primary-500"
          />
          Ricorda password
        </label>
      </div>

      {error && <div className="text-danger text-sm mb-3">{error}</div>}
      {success && <div className="text-success text-sm mb-3">{success}</div>}

      <div className="flex items-center justify-between gap-3">
        <Button className="flex-1" isDisabled={loading} type="submit">
          {loading ? "Accesso in corso..." : "Accedi"}
        </Button>
        <Link color="foreground" href="#" size="sm">
          Password dimenticata?
        </Link>
      </div>
    </form>
  );
};

export default AuthPanel;
