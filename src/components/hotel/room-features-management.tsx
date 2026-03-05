import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";

import {
  createRoomFeature,
  deleteRoomFeature,
  fetchRoomFeatures,
  fetchRooms,
  updateRoom,
  updateRoomFeature,
  type RoomApi,
  type RoomFeatureApi,
} from "@/lib/hotel-api";

export default function RoomFeaturesManagement() {
  const [features, setFeatures] = useState<RoomFeatureApi[]>([]);
  const [rooms, setRooms] = useState<RoomApi[]>([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [featureList, roomList] = await Promise.all([
        fetchRoomFeatures(),
        fetchRooms(),
      ]);
      setFeatures(featureList);
      setRooms(roomList);
    } catch (err) {
      setError((err as Error).message || "Errore caricamento servizi camera");
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
      const created = await createRoomFeature({ name: name.trim() });
      setFeatures((prev) => [created, ...prev]);
      setName("");
    } catch (err) {
      setError((err as Error).message || "Errore creazione servizio camera");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editId || !editName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await updateRoomFeature(editId, { name: editName.trim() });
      setFeatures((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditId(null);
      setEditName("");
    } catch (err) {
      setError((err as Error).message || "Errore aggiornamento servizio camera");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteRoomFeature(id);
      setFeatures((prev) => prev.filter((item) => item.id !== id));
      setRooms((prev) =>
        prev.map((room) => ({
          ...room,
          features: (room.features ?? []).filter((feature) => feature.id !== id),
        }))
      );
    } catch (err) {
      setError((err as Error).message || "Errore cancellazione servizio camera");
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (room: RoomApi, featureId: number) => {
    const currentIds = (room.features ?? []).map((feature) => feature.id);
    const nextIds = currentIds.includes(featureId)
      ? currentIds.filter((id) => id !== featureId)
      : [...currentIds, featureId];

    setLoading(true);
    setError(null);
    try {
      const updated = await updateRoom(room.id, {
        roomNumber: room.roomNumber,
        capacity: room.capacity,
        roomType: room.roomType,
        description: room.description ?? null,
        featureIds: nextIds,
      });
      setRooms((prev) => prev.map((room) => (room.id === updated.id ? updated : room)));
    } catch (err) {
      setError((err as Error).message || "Errore aggiornamento servizi camera");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Servizi camere</h3>
            <p className="text-xs text-default-500">Gestisci le feature disponibili per le camere.</p>
          </div>
          <Button size="sm" variant="flat" onClick={load} isDisabled={loading}>
            Aggiorna
          </Button>
        </CardHeader>
        <CardBody className="gap-4">
          {error && <div className="text-sm text-danger-600">{error}</div>}

          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Nuovo servizio" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex items-end">
              <Button color="primary" onClick={handleCreate} isDisabled={loading || !name.trim()}>
                Aggiungi
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {features.map((feature) => {
              const isEditing = editId === feature.id;
              return (
                <div key={feature.id} className="rounded-md border border-default-200 bg-default-50 p-3">
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
                      <div className="text-sm font-semibold">{feature.name}</div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onClick={() => {
                            setEditId(feature.id);
                            setEditName(feature.name);
                          }}
                        >
                          Modifica
                        </Button>
                        <Button size="sm" color="danger" variant="flat" onClick={() => handleDelete(feature.id)}>
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
            <h3 className="text-lg font-semibold">Servizi per camera</h3>
            <p className="text-xs text-default-500">Abilita o disabilita i servizi sotto ogni camera.</p>
          </div>
        </CardHeader>
        <CardBody className="gap-4">
          {features.length === 0 && (
            <div className="text-xs text-default-500">Nessuna feature disponibile</div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {rooms.map((room) => (
              <div key={room.id} className="rounded-md border border-default-200 bg-default-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Camera {room.roomNumber}</div>
                    <div className="text-xs text-default-500">
                      Tipo {room.roomType} · Capienza {room.capacity}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {features.map((feature) => {
                    const isActive = (room.features ?? []).some((item) => item.id === feature.id);
                    return (
                      <Button
                        key={`${room.id}-${feature.id}`}
                        size="sm"
                        variant={isActive ? "solid" : "flat"}
                        color={isActive ? "primary" : "default"}
                        onClick={() => toggleFeature(room, feature.id)}
                        isDisabled={loading}
                      >
                        {feature.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
