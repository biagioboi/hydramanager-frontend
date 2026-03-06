import React, { useState } from "react";
import { Button } from "@heroui/button";
import { fetchWithAuth } from "@/lib/auth";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8080";

export function TransactionChip({ tx, selectedCardId, selectedBooking, fetchCardTransactions, setCardTransactions, fetchBarCards, setBarCards, showToast }) {
  const isDeposit = tx.transactionType === "DEPOSIT";
  const isPurchase = tx.transactionType === "BUY";
  const isCancelled = tx.cancelled;
  const chipColor = isDeposit ? "bg-emerald-100 text-emerald-800 border-emerald-200" : isCancelled ? "bg-grey-50 text-grey-800 border-grey-200" : "bg-amber-100 text-amber-800 border-amber-200";
  const chipLabel = isDeposit
    ? `+€ ${Number(tx.amount ?? 0).toFixed(2)} - Accredito`
    : isCancelled
    ? `-€ ${Number(tx.amount ?? 0).toFixed(2)} - Annullato`
    : `-€ ${Number(tx.amount ?? 0).toFixed(2)}${tx.description ? ` - ${tx.description}` : ''}`;

  const [details, setDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleShowDetails = async () => {
    setShowDetails(true);
    if (!details && tx.cartId && isPurchase) {
      setLoadingDetails(true);
      try {
        const res = await fetchWithAuth(`${BASE_URL}/api/extra/carts/${tx.cartId}/items`);
        const data = await res.json();
        setDetails(data);
      } catch (err) {
        setDetails({ error: "Errore caricamento dettagli" });
      } finally {
        setLoadingDetails(false);
      }
    }
  };
  const handleHideDetails = () => setShowDetails(false);

  return (
    <div
      className={`relative flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium cursor-pointer transition ${chipColor}`}
      tabIndex={0}
      onMouseEnter={isPurchase ? handleShowDetails : undefined}
      onFocus={isPurchase ? handleShowDetails : undefined}
      onMouseLeave={isPurchase ? handleHideDetails : undefined}
      onBlur={isPurchase ? handleHideDetails : undefined}
    >
      <span>{chipLabel}</span>
      <span className="ml-1 text-[10px] text-default-400">
        {tx.createdAt ? `${new Date(tx.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })} ${new Date(tx.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` : ''}
      </span>
      {!isDeposit && showDetails && !isCancelled && (
        <div className="fixed z-[9999] bg-white z-40 mt-2 w-max min-w-[220px] max-w-[340px] bg-white border border-default-200 shadow-xl rounded-lg p-4 text-xs text-default-700 whitespace-pre-line">
          <div className="font-semibold mb-1">Dettagli movimento</div>
          {loadingDetails ? (
            <div className="text-default-400">Caricamento dettagli...</div>
          ) : details && !details.error ? (
            <>
              <div><span className="font-medium">Data:</span> {tx.createdAt ? `${new Date(tx.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })} ${new Date(tx.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` : '-'}</div>
              <div><span className="font-medium">Importo:</span> € {Number(tx.amount ?? 0).toFixed(2)}</div>
              {details && (
                <div className="mt-1">
                  <span className="font-medium">Contenuto carrello:</span>
                  <ul className="list-disc ml-4 mt-1">
                    {(details || []).map((item: any, idx: number) => (
                      <li key={idx}>{item.quantity} x {item.productName}  - € {Number(item.unitPrice * item.quantity).toFixed(2)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : details && details.error ? (
            <div className="text-danger-600">{details.error}</div>
          ) : null}
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="flat" color="danger" onClick={async () => {
              if (!selectedCardId) return;
              try {
                const res = await fetchWithAuth(`${BASE_URL}/api/bar/cards/${selectedCardId}/transactions/${tx.id}/cancel`, { method: "POST" });
                // refresh
                const txs = await fetchCardTransactions(selectedCardId);
                setCardTransactions(txs || []);
                const cards = await fetchBarCards(selectedBooking!.id);
                setBarCards(cards || []);
                if (res.ok) {
                    showToast("Movimento cancellato", "success", 2000);
                } else {
                  const errorText = await res.text();
                  showToast(errorText, "error", 3000);
                }
              } catch (err) {
                showToast((err as Error).message || "Errore cancellazione movimento", "error", 3000);
              }
            }}>Cancella</Button>
          </div>
        </div>
      )}
    </div>
  );
}
