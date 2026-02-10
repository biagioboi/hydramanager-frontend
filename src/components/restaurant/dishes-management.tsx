import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

import {
  fetchDishes,
  createDish,
  deleteDish,
  fetchCategories,
} from "@/lib/restaurant-api";

export const DishesManagement = () => {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [dishes, setDishes] = useState<any[]>([]);
  const [dishSearchQuery, setDishSearchQuery] = useState("");
  const [addingDish, setAddingDish] = useState({
    category: "",
    ingredients: "",
    nameEn: "",
  });
  const {
    isOpen: isDishModalOpen,
    onOpen: onDishModalOpen,
    onOpenChange: onDishModalOpenChange,
  } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDishes(), fetchCategories()])
      .then(([d, c]) => {
        setDishes(d || []);
        setCategories(c || []);
      })
      .catch((e) => setError((e as Error).message || "Errore caricamento"))
      .finally(() => setLoading(false));
  }, []);

  // Filter dishes by search query
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) =>
      dish.name.toLowerCase().includes(dishSearchQuery.toLowerCase()),
    );
  }, [dishes, dishSearchQuery]);

  // Dish management
  const handleAddNewDish = () => {
    setAddingDish({ category: "", ingredients: "", nameEn: "" });
    onDishModalOpen();
  };

  const handleConfirmAddDish = async () => {
    if (!dishSearchQuery.trim() || !addingDish.category) return;
    setLoading(true);
    setError(null);
    try {
      const cat =
        categories.find((c) => c.name === addingDish.category) || null;
      const payload = {
        name: dishSearchQuery.trim(),
        nameEn: addingDish.nameEn.trim() || dishSearchQuery.trim(),
        categoryId: cat ? cat.id : undefined,
        ingredients: addingDish.ingredients
          ? addingDish.ingredients
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      };
      const created = await createDish(payload);

      setDishes((prev) => [...(prev || []), created]);
      setDishSearchQuery("");
      setAddingDish({ category: "", ingredients: "" });
      onDishModalOpenChange();
    } catch (e) {
      setError((e as Error).message || "Errore creazione piatto");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDish = async (id: number) => {
    setError(null);
    try {
      await deleteDish(id);
      setDishes((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setError((e as Error).message || "Errore cancellazione piatto");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Gestione Piatti</h2>
      {/* Piatti Section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-semibold">Gestione Piatti</h3>

        <Card>
          <CardHeader className="flex flex-col items-start px-4 py-2">
            <h4 className="text-lg font-semibold">Cerca o Aggiungi Piatto</h4>
          </CardHeader>
          <CardBody className="gap-3">
            <div className="flex gap-3 items-end">
              <Input
                className="flex-1"
                label="Nome Piatto"
                placeholder="Scrivi per cercare o aggiungere..."
                value={dishSearchQuery}
                onChange={(e) => setDishSearchQuery(e.target.value)}
              />
              {dishSearchQuery.trim() && (
                <Button color="primary" onClick={handleAddNewDish}>
                  Aggiungi "{dishSearchQuery}"
                </Button>
              )}
            </div>
            {dishSearchQuery && filteredDishes.length > 0 && (
              <div className="text-sm text-default-500">
                {filteredDishes.length} piatto(i) trovato(i)
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-col items-start px-4 py-2">
            <h4 className="text-lg font-semibold">
              Elenco Piatti
              {dishSearchQuery && ` (filtrato: ${filteredDishes.length})`}
            </h4>
          </CardHeader>
          <CardBody>
            {(dishSearchQuery ? filteredDishes : dishes).length === 0 ? (
              <p className="text-center text-default-500 py-4">
                Nessun piatto trovato
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableColumn>Nome</TableColumn>
                  <TableColumn>Categoria</TableColumn>
                  <TableColumn>Ingredienti</TableColumn>
                  <TableColumn>Azioni</TableColumn>
                </TableHeader>
                <TableBody>
                  {(dishSearchQuery ? filteredDishes : dishes).map((dish) => (
                    <TableRow key={dish.id}>
                      <TableCell>{dish.name}</TableCell>
                      <TableCell>
                        {dish.categoryName || dish.category}
                      </TableCell>
                      <TableCell>
                        {Array.isArray(dish.ingredients)
                          ? dish.ingredients.join(", ")
                          : dish.ingredients}
                      </TableCell>
                      <TableCell>
                        <Button
                          color="danger"
                          size="sm"
                          variant="flat"
                          onClick={() => handleDeleteDish(dish.id)}
                        >
                          Elimina
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modal Aggiunta Piatto */}
      <Modal isOpen={isDishModalOpen} onOpenChange={onDishModalOpenChange}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Aggiungi Piatto:{" "}
            <span className="text-primary">{dishSearchQuery}</span>
          </ModalHeader>
          <ModalBody className="gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    color={
                      addingDish.category === cat.name ? "primary" : "default"
                    }
                    variant={
                      addingDish.category === cat.name ? "solid" : "flat"
                    }
                    onClick={() =>
                      setAddingDish({ ...addingDish, category: cat.name })
                    }
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
            <Input
              label="Nome (EN)"
              placeholder="English name"
              value={addingDish.nameEn}
              onChange={(e) =>
                setAddingDish({ ...addingDish, nameEn: e.target.value })
              }
            />
            <Input
              label="Ingredienti"
              placeholder="Separati da virgola (opzionale)"
              value={addingDish.ingredients}
              onChange={(e) =>
                setAddingDish({ ...addingDish, ingredients: e.target.value })
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={onDishModalOpenChange}
            >
              Annulla
            </Button>
            <Button
              color="primary"
              isDisabled={!addingDish.category}
              onPress={handleConfirmAddDish}
            >
              Aggiungi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DishesManagement;
