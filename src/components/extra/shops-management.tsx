import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";

import {
  createStore,
  deleteStore,
  fetchStores,
  updateStore,
  type StoreApi,
} from "@/lib/extra-api";

export default function ShopsManagement() {
  const [stores, setStores] = useState<StoreApi[]>([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchStores();
      setStores(list);
    } catch (err) {
      setError((err as Error).message || "Errore caricamento shop");
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
      const created = await createStore({ name: name.trim() });
      setStores((prev) => [created, ...prev]);
      setName("");
    } catch (err) {
      setError((err as Error).message || "Errore creazione shop");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editId || !editName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await updateStore(editId, { name: editName.trim() });
      setStores((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditId(null);
      setEditName("");
    } catch (err) {
      setError((err as Error).message || "Errore aggiornamento shop");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteStore(id);
      setStores((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError((err as Error).message || "Errore cancellazione shop");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Shop extra</h3>
          <p className="text-xs text-default-500">Gestisci gli shop extra.</p>
        </div>
        <Button size="sm" variant="flat" onClick={load} isDisabled={loading}>
          Aggiorna
        </Button>
      </CardHeader>
      <CardBody className="gap-4">
        {error && <div className="text-sm text-danger-600">{error}</div>}

        <div className="grid gap-3 md:grid-cols-3">
          <Input label="Nome shop" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex items-end">
            <Button color="primary" onClick={handleCreate} isDisabled={loading || !name.trim()}>
              Aggiungi shop
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {stores.map((store) => {
            const isEditing = editId === store.id;
            return (
              <div key={store.id} className="rounded-md border border-default-200 bg-default-50 p-3">
                {isEditing ? (
                  <div className="grid gap-2 md:grid-cols-3">
                    <Input label="Nome" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <div className="flex items-end gap-2 md:col-span-2">
                      <Button size="sm" color="primary" onClick={handleSave} isDisabled={loading}>
                        Salva
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        onClick={() => {
                          setEditId(null);
                          setEditName("");
                        }}
                      >
                        Annulla
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{store.name}</div>
                      <div className="text-xs text-default-500">ID {store.id}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        onClick={() => {
                          setEditId(store.id);
                          setEditName(store.name);
                        }}
                      >
                        Modifica
                      </Button>
                      <Button size="sm" color="danger" variant="flat" onClick={() => handleDelete(store.id)}>
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
