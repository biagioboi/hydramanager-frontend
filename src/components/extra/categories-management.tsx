import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";

import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type ExtraCategoryApi,
} from "@/lib/extra-api";

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<ExtraCategoryApi[]>([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      setError((err as Error).message || "Errore caricamento categorie");
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
      const created = await createCategory({ name: name.trim() });
      setCategories((prev) => [created, ...prev]);
      setName("");
    } catch (err) {
      setError((err as Error).message || "Errore creazione categoria");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editId || !editName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await updateCategory(editId, { name: editName.trim() });
      setCategories((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditId(null);
      setEditName("");
    } catch (err) {
      setError((err as Error).message || "Errore aggiornamento categoria");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError((err as Error).message || "Errore cancellazione categoria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Categorie extra</h3>
          <p className="text-xs text-default-500">Gestisci le categorie dei prodotti extra.</p>
        </div>
        <Button size="sm" variant="flat" onClick={load} isDisabled={loading}>
          Aggiorna
        </Button>
      </CardHeader>
      <CardBody className="gap-4">
        {error && <div className="text-sm text-danger-600">{error}</div>}

        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Nome categoria" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex items-end">
            <Button color="primary" onClick={handleCreate} isDisabled={loading || !name.trim()}>
              Aggiungi categoria
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {categories.map((category) => {
            const isEditing = editId === category.id;
            return (
              <div key={category.id} className="rounded-md border border-default-200 bg-default-50 p-3">
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <Input label="Nome" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <div className="flex gap-2">
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
                    <div className="text-sm font-semibold">{category.name}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        onClick={() => {
                          setEditId(category.id);
                          setEditName(category.name);
                        }}
                      >
                        Modifica
                      </Button>
                      <Button size="sm" color="danger" variant="flat" onClick={() => handleDelete(category.id)}>
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
