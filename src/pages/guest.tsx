import { Button } from "@heroui/button";
import { useEffect, useState } from "react";

interface Booking {
  roomName: string;
  checkIn: string;
  checkOut: string;
}

function formatDateIT(dateStr: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("it-IT", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function GuestPage() {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8080";

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("authToken") || localStorage.getItem("tokenTemporaneo");
        const res = await fetch(`${BASE_URL}/api/bookings/my-booking`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (!res.ok) throw new Error("Errore nel recupero del soggiorno");
        const data = await res.json();
        setBooking({
          roomName: data.roomNumber,
          checkIn: data.checkInDate,
          checkOut: data.checkOutDate
        });
      } catch (err: any) {
        setError(err.message || "Errore generico");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5e9d3]">
      {/* Header/logo */}
      <header className="flex flex-col items-center py-8 bg-white shadow-sm">
        <img
          src="https://hotelhydracilento.it/wp-content/uploads/2026/01/Hydra_club_logo-600x159.png"
          alt="Hydra Club Logo"
          className="h-16 mb-2"
        />
        <h1 className="text-3xl font-bold tracking-wide text-[#1e3a5c] uppercase">Benvenuto all’Hydra Club</h1>
        <p className="text-[#3a6c4f] text-lg mt-2 font-medium">La tua area ospite per vivere il Cilento</p>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="bg-white/90 rounded-2xl shadow-xl p-8 max-w-lg w-full flex flex-col items-center border border-[#e0d6c3]">
          <h2 className="text-xl font-semibold text-[#1e3a5c] mb-2 tracking-wide">Ciao Ospite!</h2>
          <p className="text-gray-700 text-center mb-6">
            Qui puoi consultare le informazioni sul tuo soggiorno, scoprire i servizi dell’Hotel e contattare la reception in ogni momento.<br />
            <span className="block mt-2 text-[#3a6c4f] font-medium">Natura, spazio, libertà.</span>
          </p>
          {/* Info soggiorno */}
          <div className="w-full bg-[#f5e9d3] rounded-lg p-4 mb-6 border border-[#e0d6c3]">
            <div className="text-[#1e3a5c] font-semibold mb-1">Il tuo soggiorno</div>
            {loading ? (
              <div className="text-sm text-gray-700">Caricamento...</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : booking ? (
              <>
                <div className="text-sm text-gray-700">Camera/Bungalow: <span className="font-medium">{booking.roomName}</span></div>
                <div className="text-sm text-gray-700">Check-in: <span className="font-medium">{formatDateIT(booking.checkIn)}</span></div>
                <div className="text-sm text-gray-700">Check-out: <span className="font-medium">{formatDateIT(booking.checkOut)}</span></div>
              </>
            ) : (
              <div className="text-sm text-gray-700">Nessun soggiorno trovato.</div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              as="a"
              href="https://hotelhydracilento.it/esperienza/"
              target="_blank"
              className="flex-1 bg-[#1e3a5c] text-white hover:bg-[#25446e] font-semibold rounded-lg shadow"
            >
              Scopri i servizi
            </Button>
            <Button
              as="a"
              href="mailto:info@hotelhydracilento.it"
              className="flex-1 bg-[#3a6c4f] text-white hover:bg-[#29513a] font-semibold rounded-lg shadow"
            >
              Contatta reception
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-white border-t border-[#e0d6c3] flex flex-col items-center text-xs text-[#1e3a5c]">
        <div className="mb-1">Hydra Club – Hotel Village · Via Dominella, 16 – Casal Velino Marina (SA)</div>
        <div className="mb-1">Tel. <a href="tel:+390632092929" className="underline">+39 06 32 09 29 29</a> · <a href="mailto:info@hotelhydracilento.it" className="underline">info@hotelhydracilento.it</a></div>
        <div className="flex gap-3">
          <a href="https://hotelhydracilento.it/camere-e-bungalow/" target="_blank" className="underline">Camere & Bungalow</a>
          <span>·</span>
          <a href="https://hotelhydracilento.it/esperienza/" target="_blank" className="underline">Esperienza</a>
          <span>·</span>
          <a href="https://hotelhydracilento.it/dove-siamo/" target="_blank" className="underline">Dove Siamo</a>
        </div>
      </footer>
    </div>
  );
}
