import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { fetchCardByHash, fetchCardTransactions, rechargeCard, deleteCard } from "@/lib/hotel-api";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CardModal({ isOpen, onOpenChange }: Props) {
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setCard(null);
    setTransactions([]);
    try {
      const c = await fetchCardByHash(hash);
      setCard(c || null);
      if (c) {
        const tx = await fetchCardTransactions(c.id);
        setTransactions(tx || []);
      }
    } catch (err: any) {
      setError(err?.message || "Errore durante la ricerca della card");
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!card) return;
    const value = Number(amount);
    if (!value || isNaN(value)) {
      setError("Importo non valido");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await rechargeCard(card.id, { amount: value });
      const tx = await fetchCardTransactions(card.id);
      setTransactions(tx || []);
      setAmount("");
    } catch (err: any) {
      setError(err?.message || "Errore durante la ricarica");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!card) return;
    setLoading(true);
    setError(null);
    try {
      await deleteCard(card.id);
      setCard(null);
      setTransactions([]);
      setHash("");
    } catch (err: any) {
      setError(err?.message || "Errore durante la cancellazione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" size="2xl">
      <ModalContent className="w-[95vw] max-w-[900px]">
        <ModalHeader>
          Card — Ricerca per hash
          <div className="text-xs text-default-500">Cerca transazioni, ricarica o cancella la card</div>
        </ModalHeader>
        <ModalBody className="gap-4">
          {error && <div className="text-sm text-danger-600">{error}</div>}
          <div className="flex gap-3">
            <Input label="Hash card" value={hash} onChange={(e) => setHash((e.target as HTMLInputElement).value)} />
            <div className="flex items-end">
              <Button color="primary" onClick={handleSearch} isDisabled={loading || !hash}>Cerca</Button>
            </div>
          </div>

          {card && (
            <div>
              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{`Card #${card.id}`}</div>
                    <div className="text-xs text-default-500">Saldo: € {Number(card.balance ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="flat" color="danger" onClick={handleDelete} isDisabled={loading}>Cancella</Button>
                  </div>
                </div>
              </Card>

              <div className="mt-3 grid gap-2">
                <div className="flex gap-2">
                  <Input label="Importo ricarica" value={amount} onChange={(e) => setAmount((e.target as HTMLInputElement).value)} />
                  <div className="flex items-end">
                    <Button color="primary" onClick={handleRecharge} isDisabled={loading || !amount}>Ricarica</Button>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold">Transazioni</div>
                  <div className="mt-2 overflow-auto max-h-60 rounded-md border border-default-200 bg-white">
                    {transactions.length === 0 && <div className="p-3 text-xs text-default-500">Nessuna transazione</div>}
                    {transactions.map((t) => (
                      <div key={t.id} className="p-3 border-b last:border-b-0">
                        <div className="flex justify-between">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{t.type}</div>
                            <div className="text-xs text-default-500">{t.description}</div>
                          </div>
                          <div className={`font-semibold ${t.amount < 0 ? 'text-danger-700' : 'text-emerald-700'}`}>€ {Number(t.amount).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onClick={() => onOpenChange(false)}>Chiudi</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
