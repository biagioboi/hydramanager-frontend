import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";

import {
  createProduct,
  createStoreProduct,
  deleteProduct,
  deleteStoreProduct,
  fetchCategories,
  fetchProducts,
  fetchStoreProducts,
  fetchStores,
  updateProduct,
  updateStoreProduct,
  type ExtraCategoryApi,
  type ExtraProductApi,
  type StoreApi,
  type StoreProductApi,
} from "@/lib/extra-api";

export default function ProductsManagement() {
  const [products, setProducts] = useState<ExtraProductApi[]>([]);
  const [stores, setStores] = useState<StoreApi[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProductApi[]>([]);
  const [categories, setCategories] = useState<ExtraCategoryApi[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [assignQty, setAssignQty] = useState("1");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStockQuantity, setEditStockQuantity] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, s, c] = await Promise.all([
        fetchProducts(),
        fetchStores(),
        fetchCategories(),
      ]);
      setProducts(p);
      setStores(s);
      setCategories(c);
    } catch (err) {
      setError((err as Error).message || "Errore caricamento prodotti");
    } finally {
      setLoading(false);
    }
  };

  const loadStoreProducts = async (storeId?: string) => {
    if (!storeId) {
      setStoreProducts([]);
      return;
    }
    try {
      const list = await fetchStoreProducts(storeId);
      setStoreProducts(list);
    } catch (err) {
      setError((err as Error).message || "Errore caricamento prodotti shop");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadStoreProducts(selectedStoreId);
  }, [selectedStoreId]);

  const handleCreate = async () => {
    if (!name.trim() || !price.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createProduct({
        name: name.trim(),
        price: Number(price),
        stockQuantity: Number(stockQuantity || 0),
        categoryId: categoryId ? Number(categoryId) : undefined,
      });
      setProducts((prev) => [created, ...prev]);
      setName("");
      setPrice("");
      setStockQuantity("0");
      setCategoryId("");
    } catch (err) {
      setError((err as Error).message || "Errore creazione prodotto");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editId || !editName.trim() || !editPrice.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await updateProduct(editId, {
        name: editName.trim(),
        price: Number(editPrice),
        stockQuantity: Number(editStockQuantity || 0),
        categoryId: editCategoryId ? Number(editCategoryId) : undefined,
      });
      setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditId(null);
      setEditName("");
      setEditPrice("");
      setEditStockQuantity("");
      setEditCategoryId("");
    } catch (err) {
      setError((err as Error).message || "Errore aggiornamento prodotto");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError((err as Error).message || "Errore cancellazione prodotto");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedStoreId || !selectedProductId) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createStoreProduct({
        storeId: Number(selectedStoreId),
        productId: Number(selectedProductId),
        quantity: Number(assignQty || 0),
      });
      setStoreProducts((prev) => [created, ...prev]);
      setSelectedProductId("");
      setAssignQty("1");
    } catch (err) {
      setError((err as Error).message || "Errore associazione prodotto");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (id: number, quantity: number) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateStoreProduct(id, { quantity });
      setStoreProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError((err as Error).message || "Errore aggiornamento quantità");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssociation = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteStoreProduct(id);
      setStoreProducts((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError((err as Error).message || "Errore rimozione prodotto shop");
    } finally {
      setLoading(false);
    }
  };

  const productsById = useMemo(
    () => new Map(products.map((p) => [String(p.id), p])),
    [products],
  );

  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [String(c.id), c])),
    [categories],
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Prodotti extra</h3>
            <p className="text-xs text-default-500">Gestisci i prodotti extra.</p>
          </div>
          <Button size="sm" variant="flat" onClick={load} isDisabled={loading}>
            Aggiorna
          </Button>
        </CardHeader>
        <CardBody className="gap-4">
          {error && <div className="text-sm text-danger-600">{error}</div>}

          <div className="grid gap-3 md:grid-cols-4">
            <Input label="Nome prodotto" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Prezzo" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            <Input
              label="Stock"
              type="number"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
            />
            <Select
              label="Categoria"
              selectedKeys={categoryId ? [categoryId] : []}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((category) => (
                <SelectItem key={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </Select>
            <div className="flex items-end">
              <Button color="primary" onClick={handleCreate} isDisabled={loading || !name.trim() || !price.trim()}>
                Aggiungi prodotto
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {products.map((product) => {
              const isEditing = editId === product.id;
              const categoryName =
                product.categoryName ||
                (product.categoryId
                  ? categoriesById.get(String(product.categoryId))?.name
                  : undefined);

              return (
                <div key={product.id} className="rounded-md border border-default-200 bg-default-50 p-3">
                  {isEditing ? (
                    <div className="grid gap-2 md:grid-cols-4">
                      <Input label="Nome" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      <Input label="Prezzo" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                      <Input
                        label="Stock"
                        type="number"
                        value={editStockQuantity}
                        onChange={(e) => setEditStockQuantity(e.target.value)}
                      />
                      <Select
                        label="Categoria"
                        selectedKeys={editCategoryId ? [editCategoryId] : []}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                      >
                        {categories.map((category) => (
                          <SelectItem key={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </Select>
                      <div className="flex items-end gap-2 md:col-span-3">
                        <Button size="sm" color="primary" onClick={handleSave} isDisabled={loading}>
                          Salva
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          onClick={() => {
                            setEditId(null);
                            setEditName("");
                            setEditPrice("");
                            setEditStockQuantity("");
                            setEditCategoryId("");
                          }}
                        >
                          Annulla
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">{product.name}</div>
                        <div className="text-xs text-default-500">
                          € {product.price} · Stock {product.stockQuantity}
                          {categoryName ? ` · ${categoryName}` : ""}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onClick={() => {
                            setEditId(product.id);
                            setEditName(product.name);
                            setEditPrice(String(product.price));
                            setEditStockQuantity(String(product.stockQuantity ?? 0));
                            setEditCategoryId(
                              product.categoryId ? String(product.categoryId) : "",
                            );
                          }}
                        >
                          Modifica
                        </Button>
                        <Button size="sm" color="danger" variant="flat" onClick={() => handleDelete(product.id)}>
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

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Associa prodotti agli shop</h3>
            <p className="text-xs text-default-500">Assegna prodotti e quantità agli shop.</p>
          </div>
        </CardHeader>
        <CardBody className="gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Select
              label="Shop"
              selectedKeys={selectedStoreId ? [selectedStoreId] : []}
              onChange={(e) => setSelectedStoreId(e.target.value)}
            >
              {stores.map((store) => (
                <SelectItem key={String(store.id)}>
                  {store.name}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Prodotto"
              selectedKeys={selectedProductId ? [selectedProductId] : []}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {products.map((product) => (
                <SelectItem key={String(product.id)}>
                  {product.name}
                </SelectItem>
              ))}
            </Select>
            <Input label="Quantità" type="number" value={assignQty} onChange={(e) => setAssignQty(e.target.value)} />
            <div className="flex items-end">
              <Button color="primary" onClick={handleAssign} isDisabled={loading || !selectedStoreId || !selectedProductId}>
                Associa
              </Button>
            </div>
          </div>

          {selectedStoreId && (
            <div className="grid gap-3 md:grid-cols-2">
              {storeProducts.map((item) => {
                const product = productsById.get(String(item.productId));
                return (
                  <div key={item.id} className="rounded-md border border-default-200 bg-default-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">{item.productName || product?.name}</div>
                        <div className="text-xs text-default-500">Quantità: {item.quantity}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          className="w-24"
                          type="number"
                          label="Qtà"
                          labelPlacement="outside"
                          value={String(item.quantity)}
                          onChange={(e) => {
                            const next = Number(e.target.value || 0);
                            setStoreProducts((prev) =>
                              prev.map((p) => (p.id === item.id ? { ...p, quantity: next } : p))
                            );
                          }}
                        />
                        <Button
                          size="sm"
                          variant="flat"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity)}
                        >
                          Salva
                        </Button>
                        <Button size="sm" color="danger" variant="flat" onClick={() => handleRemoveAssociation(item.id)}>
                          Rimuovi
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
