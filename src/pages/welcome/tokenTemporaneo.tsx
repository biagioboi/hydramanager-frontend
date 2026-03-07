import { Button } from "@heroui/button";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function WelcomePage() {
  const { tokenTemporaneo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (tokenTemporaneo) {
      localStorage.setItem("tokenTemporaneo", tokenTemporaneo);
    }
  }, [tokenTemporaneo]);

  const handleAccess = async () => {
    if (!tokenTemporaneo) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/temporary-access/${tokenTemporaneo}`);
      if (!res.ok) throw new Error("Errore autenticazione");
      const data = await res.json();
      if (!data.token) throw new Error("Token non ricevuto");
      localStorage.setItem("authToken", data.token);
      navigate("/guest");
    } catch (err: any) {
      setError(err.message || "Errore generico");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5e9d3]">
      {/* Header/logo */}
      <header className="flex flex-col items-center py-8 bg-white shadow-sm">
        <img
          src="https://hotelhydracilento.it/wp-content/uploads/2026/01/Hydra_club_logo-600x159.png"
          alt="Hydra Club Logo"
          className="h-16 mb-2"
        />
        <h1 className="text-3xl font-bold tracking-wide text-[#1e3a5c] uppercase">Benvenuto!</h1>
        <p className="text-[#3a6c4f] text-lg mt-2 font-medium">
          Accedi all’area ospite Hydra Club
        </p>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="bg-white/90 rounded-2xl shadow-xl p-8 max-w-lg w-full flex flex-col items-center border border-[#e0d6c3]">
          <h2 className="text-xl font-semibold text-[#1e3a5c] mb-2 tracking-wide">
            Consenso al trattamento dati
          </h2>
          <p className="text-gray-700 text-center mb-6">
            Per accedere ai servizi, ti chiediamo di accettare il trattamento dei dati personali secondo la nostra privacy policy.
          </p>
          <label className="flex items-center mb-6">
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="mr-2 accent-blue-600"
            />
            <span className="text-sm text-gray-700">
              Acconsento al trattamento dei dati personali
            </span>
          </label>
          <Button
            className="bg-[#1e3a5c] text-white hover:bg-[#25446e] font-semibold rounded-lg shadow w-full"
            disabled={!consent || loading}
            onClick={handleAccess}
          >
            {loading ? "Accesso in corso..." : "Accedi"}
          </Button>
          {error && <div className="mt-4 text-red-600 text-sm">{error}</div>}
        </div>
      </main>

      <footer className="w-full py-6 bg-white border-t border-[#e0d6c3] flex flex-col items-center text-xs text-[#1e3a5c]">
        <div className="mb-1">Hydra Club – Hotel Village · Via Dominella, 16 – Casal Velino Marina (SA)</div>
        <div className="mb-1">
          Tel.{" "}
          <a href="tel:+390632092929" className="underline">
            +39 06 32 09 29 29
          </a>{" "}
          ·{" "}
          <a href="mailto:info@hotelhydracilento.it" className="underline">
            info@hotelhydracilento.it
          </a>
        </div>
        <div className="flex gap-3">
          <a
            href="https://hotelhydracilento.it/camere-e-bungalow/"
            target="_blank"
            className="underline"
          >
            Camere & Bungalow
          </a>
          <span>·</span>
          <a
            href="https://hotelhydracilento.it/esperienza/"
            target="_blank"
            className="underline"
          >
            Esperienza
          </a>
          <span>·</span>
          <a
            href="https://hotelhydracilento.it/dove-siamo/"
            target="_blank"
            className="underline"
          >
            Dove Siamo
          </a>
        </div>
      </footer>
    </div>
  );
}
