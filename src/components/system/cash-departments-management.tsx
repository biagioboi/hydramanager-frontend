import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";

import {
  createCashDepartment,
  deleteCashDepartment,
  fetchCashDepartments,
  updateCashDepartment,
  type CashDepartmentApi,
} from "@/lib/hotel-api";

export default function CashDepartmentsManagement() {
  const [departments, setDepartments] = useState<CashDepartmentApi[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchCashDepartments();
      setDepartments(list);
    } catch (err) {
      setError((err as Error).message || "Errore caricamento reparti");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createCashDepartment({
        name: name.trim(),
        code: code.trim(),
      });
      setDepartments((prev) => [created, ...prev]);
      setName("");
      setCode("");
    } catch (err) {
      setError((err as Error).message || "Errore creazione reparto");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editId || !editName.trim() || !editCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await updateCashDepartment(editId, {
        name: editName.trim(),
        code: editCode.trim(),
      });
      setDepartments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditId(null);
      setEditName("");
      setEditCode("");
    } catch (err) {
      setError((err as Error).message || "Errore aggiornamento reparto");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteCashDepartment(id);
      setDepartments((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError((err as Error).message || "Errore cancellazione reparto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Reparti cassa</h3>
          <p className="text-xs text-default-500">Gestisci i reparti della cassa.</p>
        </div>
        <Button size="sm" variant="flat" onClick={load} isDisabled={loading}>
          Aggiorna
        </Button>
      </CardHeader>
      <CardBody className="gap-4">
        {error && <div className="text-sm text-danger-500">{error}</div>}

        <div className="grid gap-3 md:grid-cols-3">
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Codice" value={code} onChange={(e) => setCode(e.target.value)} />
          <div className="flex items-end">
            <Button color="primary" onClick={handleCreate} isDisabled={loading || !name.trim() || !code.trim()}>
              Aggiungi reparto
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          {departments.map((dept) => {
            const isEditing = editId === dept.id;
            return (
              <div key={dept.id} className="rounded-md border border-default-200 p-3">
                {isEditing ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    <Input label="Nome" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <Input label="Codice" value={editCode} onChange={(e) => setEditCode(e.target.value)} />
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
                      <div className="text-sm font-semibold">{dept.name}</div>
                      <div className="text-xs text-default-500">Codice: {dept.code}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        onClick={() => {
                          setEditId(dept.id);
                          setEditName(dept.name);
                          setEditCode(dept.code);
                        }}
                      >
                        Modifica
                      </Button>
                      <Button size="sm" color="danger" variant="flat" onClick={() => handleDelete(dept.id)}>
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
