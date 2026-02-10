import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";

import {
  createPaymentMethod,
  deletePaymentMethod,
  fetchPaymentMethods,
  updatePaymentMethod,
  type PaymentMethodApi,
} from "@/lib/hotel-api";

export default function PaymentMethodsManagement() {
  const [methods, setMethods] = useState<PaymentMethodApi[]>([]);
  const [name, setName] = useState("");
  const [cashRegisterCode, setCashRegisterCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchPaymentMethods();
      setMethods(list);
    } catch (err) {
      setError((err as Error).message || "Errore caricamento metodi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createPaymentMethod({
        name: name.trim(),
        cashRegisterCode: cashRegisterCode.trim() || null,
      });
      setMethods((prev) => [created, ...prev]);
      setName("");
      setCashRegisterCode("");
    } catch (err) {
      setError((err as Error).message || "Errore creazione metodo");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editId || !editName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await updatePaymentMethod(editId, {
        name: editName.trim(),
        cashRegisterCode: editCode.trim() || null,
      });
      setMethods((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditId(null);
      setEditName("");
      setEditCode("");
    } catch (err) {
      setError((err as Error).message || "Errore aggiornamento metodo");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deletePaymentMethod(id);
      setMethods((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError((err as Error).message || "Errore cancellazione metodo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Metodi di pagamento</h3>
          <p className="text-xs text-default-500">Gestisci i metodi disponibili in cassa.</p>
        </div>
        <Button size="sm" variant="flat" onClick={load} isDisabled={loading}>
          Aggiorna
        </Button>
      </CardHeader>
      <CardBody className="gap-4">
        {error && <div className="text-sm text-danger-500">{error}</div>}

        <div className="grid gap-3 md:grid-cols-3">
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Codice registratore"
            value={cashRegisterCode}
            onChange={(e) => setCashRegisterCode(e.target.value)}
          />
          <div className="flex items-end">
            <Button color="primary" onClick={handleCreate} isDisabled={loading || !name.trim()}>
              Aggiungi metodo
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          {methods.map((method) => {
            const isEditing = editId === method.id;
            return (
              <div key={method.id} className="rounded-md border border-default-200 p-3">
                {isEditing ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    <Input label="Nome" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <Input
                      label="Codice registratore"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                    />
                    <div className="flex items-end gap-2">
                      <Button size="sm" color="primary" onClick={handleSave} isDisabled={loading}>
                        Salva
                      </Button>
                      <Button size="sm" variant="flat" onClick={() => setEditId(null)}>
                        Annulla
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{method.name}</div>
                      <div className="text-xs text-default-500">
                        Codice: {method.cashRegisterCode || "-"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        onClick={() => {
                          setEditId(method.id);
                          setEditName(method.name);
                          setEditCode(method.cashRegisterCode ?? "");
                        }}
                      >
                        Modifica
                      </Button>
                      <Button size="sm" color="danger" variant="flat" onClick={() => handleDelete(method.id)}>
                        Elimina
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
