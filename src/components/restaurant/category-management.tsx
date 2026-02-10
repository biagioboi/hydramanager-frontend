import React, { useState, useEffect } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";

import {
  fetchCategories,
  createCategory,
  deleteCategory,
} from "@/lib/restaurant-api";

export default function CategoryManagement() {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [pendingName, setPendingName] = useState("");

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setError("Errore caricamento categorie"));
  }, []);

  const filtered = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenAdd = () => {
    setPendingName(search.trim());
    onOpen();
  };

  const handleConfirmAdd = async () => {
    if (!pendingName) return;
    setLoading(true);
    setError(null);
    try {
      const newCat = await createCategory(pendingName);

      setCategories([...categories, newCat]);
      setSearch("");
      onOpenChange();
    } catch (e) {
      setError("Errore creazione categoria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Gestione Categorie Piatti</h2>

      <Card>
        <CardHeader className="flex flex-col items-start px-4 py-2">
          <h3 className="text-lg font-semibold">Cerca o Aggiungi Categoria</h3>
        </CardHeader>
        <CardBody className="gap-3">
          <div className="flex gap-3 items-end">
            <Input
              className="flex-1"
              placeholder="Cerca o aggiungi categoria"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search.trim() && (
              <Button
                color="primary"
                isDisabled={loading}
                onClick={handleOpenAdd}
              >
                Aggiungi "{search}"
              </Button>
            )}
          </div>
          {search && (
            <div className="text-sm text-default-500">
              {filtered.length} categoria(e) trovata(e)
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex flex-col items-start px-4 py-2">
          <h3 className="text-lg font-semibold">Elenco Categorie</h3>
        </CardHeader>
        <CardBody>
          {categories.length === 0 ? (
            <p className="text-center text-default-500 py-4">
              Nessuna categoria disponibile
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filtered.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-default-200"
                >
                  <span>{cat.name}</span>
                  <Button
                    isIconOnly
                    color="danger"
                    size="sm"
                    variant="light"
                    onClick={async () => {
                      try {
                        await deleteCategory(cat.id);
                        setCategories(
                          categories.filter((c) => c.id !== cat.id),
                        );
                      } catch (err) {
                        setError(
                          (err as Error)?.message ||
                            "Errore cancellazione categoria",
                        );
                      }
                    }}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Conferma creazione categoria
          </ModalHeader>
          <ModalBody>
            <div>
              Vuoi creare la categoria <strong>{pendingName}</strong>?
            </div>
            {error && <div className="text-danger text-sm mt-2">{error}</div>}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onOpenChange}>
              Annulla
            </Button>
            <Button
              color="primary"
              isLoading={loading}
              onPress={handleConfirmAdd}
            >
              Crea
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
