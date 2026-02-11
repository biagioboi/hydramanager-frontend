import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";

import {
  createAgency,
  deleteAgency,
  createRoom,
  fetchAgencies,
  deleteRoom,
  updateAgency,
  fetchRooms,
  updateRoom,
  type RoomApi,
  type AgencyApi,
} from "@/lib/hotel-api";

type RoomType = {
  id: string;
  name: string;
};

type Room = {
  id: number;
  roomNumber: string;
  capacity: number;
  roomType: string;
  description?: string | null;
};

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

type HotelView = "list" | "create" | "edit" | "delete" | "agencies";

export default function HotelManagement({ view = "list" }: { view?: HotelView }) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([
    { id: "type-1", name: "Singola" },
    { id: "type-2", name: "Doppia" },
    { id: "type-3", name: "Tripla" },
    { id: "type-4", name: "Quadrupla" },
  ]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [agencies, setAgencies] = useState<AgencyApi[]>([]);
  const [agencyName, setAgencyName] = useState("");
  const [agencyEditId, setAgencyEditId] = useState<number | null>(null);
  const [agencyEditName, setAgencyEditName] = useState("");
  const [agencyLoading, setAgencyLoading] = useState(false);
  const [agencyError, setAgencyError] = useState<string | null>(null);
  const [agencyView, setAgencyView] = useState<HotelView>("list");

  const [typeName, setTypeName] = useState("");

  const [roomNumber, setRoomNumber] = useState("");
  const [roomCapacity, setRoomCapacity] = useState("2");
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? "");
  const [roomDescription, setRoomDescription] = useState("");

  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editRoomCapacity, setEditRoomCapacity] = useState("2");
  const [editRoomTypeId, setEditRoomTypeId] = useState("");
  const [editRoomDescription, setEditRoomDescription] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoomCreate, setShowRoomCreate] = useState(false);

  const roomTypeMap = useMemo(
    () => new Map(roomTypes.map((type) => [type.id, type])),
    [roomTypes]
  );

  const getTypeNameById = (id: string) => roomTypeMap.get(id)?.name ?? "";

  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRooms();
        setRooms(data);
      } catch (err) {
        setError((err as Error).message || "Errore caricamento camere");
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  useEffect(() => {
    const loadAgencies = async () => {
      setAgencyLoading(true);
      setAgencyError(null);
      try {
        const data = await fetchAgencies();
        setAgencies(data);
      } catch (err) {
        setAgencyError((err as Error).message || "Errore caricamento agenzie");
      } finally {
        setAgencyLoading(false);
      }
    };

    loadAgencies();
  }, []);

  const handleAddType = () => {
    const trimmed = typeName.trim();
    if (!trimmed) return;
    const exists = roomTypes.some(
      (type) => type.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      setError("Tipologia già presente");
      return;
    }
    const newType: RoomType = {
      id: createId("type"),
      name: trimmed,
    };
    setRoomTypes((prev) => [...prev, newType]);
    setTypeName("");
    setError(null);
    if (!roomTypeId) setRoomTypeId(newType.id);
  };

  const handleAddRoom = () => {
    if (!roomNumber.trim() || !roomTypeId) return;
    const capacity = Math.max(1, Number(roomCapacity || 1));
    const roomType = getTypeNameById(roomTypeId);
    if (!roomType) return;
    setLoading(true);
    setError(null);
    createRoom({
      roomNumber: roomNumber.trim(),
      capacity,
      roomType,
      description: roomDescription.trim() || null,
    })
      .then((created) => {
        setRooms((prev) => [...prev, created]);
        setRoomNumber("");
        setRoomCapacity("2");
        setRoomDescription("");
      })
      .catch((err) => {
        setError((err as Error).message || "Errore creazione camera");
      })
      .finally(() => setLoading(false));
  };

  const handleDeleteType = (typeId: string) => {
    setRoomTypes((prev) => prev.filter((type) => type.id !== typeId));
    if (roomTypeId === typeId) {
      setRoomTypeId(roomTypes.find((type) => type.id !== typeId)?.id ?? "");
    }
  };

  const handleDeleteRoom = (roomId: number) => {
    setLoading(true);
    setError(null);
    deleteRoom(roomId)
      .then(() => {
        setRooms((prev) => prev.filter((room) => room.id !== roomId));
      })
      .catch((err) => {
        setError((err as Error).message || "Errore cancellazione camera");
      })
      .finally(() => setLoading(false));
  };

  const startEditingRoom = (room: Room) => {
    setEditingRoomId(String(room.id));
    setEditRoomNumber(room.roomNumber);
    setEditRoomCapacity(String(room.capacity));
    const type = roomTypes.find((item) => item.name === room.roomType);
    if (type) {
      setEditRoomTypeId(type.id);
    } else {
      const newType = { id: createId("type"), name: room.roomType };
      setRoomTypes((prev) => [...prev, newType]);
      setEditRoomTypeId(newType.id);
    }
    setEditRoomDescription(room.description ?? "");
    setEditModalOpen(true);
  };

  const cancelEditingRoom = () => {
    setEditingRoomId(null);
    setEditRoomNumber("");
    setEditRoomCapacity("2");
    setEditRoomTypeId("");
    setEditRoomDescription("");
    setEditModalOpen(false);
  };

  const saveEditingRoom = () => {
    if (!editingRoomId || !editRoomTypeId || !editRoomNumber.trim()) return;
    const capacity = Math.max(1, Number(editRoomCapacity || 1));
    const roomType = getTypeNameById(editRoomTypeId);
    if (!roomType) return;
    setLoading(true);
    setError(null);
    updateRoom(editingRoomId, {
      roomNumber: editRoomNumber.trim(),
      capacity,
      roomType,
      description: editRoomDescription.trim() || null,
    })
      .then((updated) => {
        setRooms((prev) =>
          prev.map((room) =>
            room.id === updated.id
              ? { ...updated }
              : room
          )
        );
        cancelEditingRoom();
      })
      .catch((err) => {
        setError((err as Error).message || "Errore aggiornamento camera");
      })
      .finally(() => setLoading(false));
  };

  const handleCreateAgency = async () => {
    if (!agencyName.trim()) return;
    setAgencyLoading(true);
    setAgencyError(null);
    try {
      const created = await createAgency({ agencyName: agencyName.trim() });
      setAgencies((prev) => [created, ...prev]);
      setAgencyName("");
    } catch (err) {
      setAgencyError((err as Error).message || "Errore creazione agenzia");
    } finally {
      setAgencyLoading(false);
    }
  };

  const handleEditAgency = (agency: AgencyApi) => {
    setAgencyEditId(agency.id);
    setAgencyEditName(agency.agencyName);
  };

  const handleSaveAgency = async () => {
    if (!agencyEditId || !agencyEditName.trim()) return;
    setAgencyLoading(true);
    setAgencyError(null);
    try {
      const updated = await updateAgency(agencyEditId, {
        agencyName: agencyEditName.trim(),
      });
      setAgencies((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setAgencyEditId(null);
      setAgencyEditName("");
    } catch (err) {
      setAgencyError((err as Error).message || "Errore aggiornamento agenzia");
    } finally {
      setAgencyLoading(false);
    }
  };

  const handleDeleteAgency = async (id: number) => {
    setAgencyLoading(true);
    setAgencyError(null);
    try {
      await deleteAgency(id);
      setAgencies((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setAgencyError((err as Error).message || "Errore cancellazione agenzia");
    } finally {
      setAgencyLoading(false);
    }
  };

  const showCreate = view === "create" || showRoomCreate;
  const showEdit = view !== "agencies";
  const showDelete = view === "delete";
  const showList = view !== "create";
  const showRooms = view !== "agencies";

  const showAgencyCreate = agencyView === "create";
  const showAgencyEdit = agencyView === "edit";
  const showAgencyDelete = agencyView === "delete";
  const showAgencyList = agencyView !== "create";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Hotel</h2>
        <p className="text-default-500">Gestione camere e tipologie.</p>
      </div>

      {showRooms && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Gestione camere</h3>
              <p className="text-sm text-default-500">Tipologie e camere nello stesso pannello.</p>
            </div>
          </CardHeader>
          <CardBody className="gap-4">
            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-3 text-sm font-semibold">Tipologie camera</div>
              <Input
                label="Nome tipologia"
                placeholder="Es. Deluxe"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
              />
              <div className="flex items-end">
                <Button color="primary" onClick={handleAddType}>
                  Aggiungi tipologia
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {roomTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-start justify-between rounded-md border border-default-200 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-semibold">{type.name}</div>
                    <div className="text-xs text-default-500">Tipologia camera</div>
                  </div>
                  <Button size="sm" color="danger" variant="flat" onClick={() => handleDeleteType(type.id)}>
                    Elimina
                  </Button>
                </div>
              ))}
            </div>

            <Divider />

            <div className="grid gap-3 md:grid-cols-4">
              <div className="md:col-span-4 flex items-center justify-between">
                <div className="text-sm font-semibold">Camere</div>
                <Button
                  size="sm"
                  variant="flat"
                  onClick={() => setShowRoomCreate((prev) => !prev)}
                >
                  {showCreate ? "Nascondi" : "Aggiungi"}
                </Button>
              </div>
              {showCreate && (
                <>
                  <Input
                    label="Numero"
                    placeholder="Es. 205"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                  />
                  <Input
                    label="Capienza"
                    type="number"
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(e.target.value)}
                  />
                  <Select
                    label="Tipologia"
                    selectedKeys={roomTypeId ? [roomTypeId] : []}
                    onChange={(e) => setRoomTypeId(e.target.value)}
                  >
                    {roomTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </Select>
                  <Input
                    label="Descrizione"
                    placeholder="Piccola descrizione"
                    value={roomDescription}
                    onChange={(e) => setRoomDescription(e.target.value)}
                  />
                  <Button className="md:col-span-4" color="primary" onClick={handleAddRoom} isLoading={loading}>
                    Aggiungi camera
                  </Button>
                </>
              )}
            </div>

            {showList && <Divider />}

            {showList && (
              <div className="grid gap-3 md:grid-cols-6">
                {rooms.map((room) => {
                  const type = roomTypes.find((item) => item.name === room.roomType);
                  return (
                    <div
                      key={room.id}
                      className="rounded-md border border-default-200 bg-default-50 p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold">{room.roomNumber}</div>
                          <div className="text-xs text-default-500">
                            <div>{room.capacity} pax</div>
                            <div>{type?.name || room.roomType || "Tipo non definito"}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {showEdit && (
                            <Button
                              size="sm"
                              isIconOnly
                              color="default"
                              variant="flat"
                              onClick={() => startEditingRoom(room)}
                            >
                              ✎
                            </Button>
                          )}
                          <Button
                            size="sm"
                            isIconOnly
                            color="danger"
                            variant="flat"
                            onClick={() => handleDeleteRoom(room.id)}
                          >
                            ✕
                          </Button>
                        </div>
                      </div>

                      {room.description && (
                        <div className="mt-2 text-xs text-default-500">
                          {room.description}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Modal isOpen={editModalOpen} onOpenChange={cancelEditingRoom}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Modifica camera</ModalHeader>
          <ModalBody className="gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Numero"
                value={editRoomNumber}
                onChange={(e) => setEditRoomNumber(e.target.value)}
              />
              <Input
                label="Capienza"
                type="number"
                value={editRoomCapacity}
                onChange={(e) => setEditRoomCapacity(e.target.value)}
              />
              <Select
                label="Tipologia"
                selectedKeys={editRoomTypeId ? [editRoomTypeId] : []}
                onChange={(e) => setEditRoomTypeId(e.target.value)}
              >
                {roomTypes.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </Select>
              <Input
                label="Descrizione"
                value={editRoomDescription}
                onChange={(e) => setEditRoomDescription(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="flat" onClick={cancelEditingRoom}>
              Annulla
            </Button>
            <Button color="primary" onClick={saveEditingRoom}>
              Salva
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {view === "agencies" && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Agenzie</h3>
              <p className="text-sm text-default-500">Gestisci le agenzie convenzionate.</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={agencyView === "list" ? "solid" : "flat"}
                onClick={() => setAgencyView("list")}
              >
                Lista
              </Button>
              <Button
                size="sm"
                variant={agencyView === "create" ? "solid" : "flat"}
                onClick={() => setAgencyView("create")}
              >
                Inserimento
              </Button>
              <Button
                size="sm"
                variant={agencyView === "edit" ? "solid" : "flat"}
                onClick={() => setAgencyView("edit")}
              >
                Modifica
              </Button>
              <Button
                size="sm"
                variant={agencyView === "delete" ? "solid" : "flat"}
                onClick={() => setAgencyView("delete")}
              >
                Eliminazione
              </Button>
            </div>
          </CardHeader>
          <CardBody className="gap-4">
            {agencyError && <div className="text-sm text-red-600">{agencyError}</div>}
            {showAgencyCreate && (
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  label="Nome agenzia"
                  placeholder="Es. Agenzia Centro"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                />
                <div className="flex items-end">
                  <Button
                    color="primary"
                    onClick={handleCreateAgency}
                    isLoading={agencyLoading}
                  >
                    Aggiungi agenzia
                  </Button>
                </div>
              </div>
            )}

            {showAgencyList && <Divider />}

            {showAgencyList && (
              <div className="grid gap-3 md:grid-cols-2">
                {agencies.map((agency) => {
                  const isEditing = agencyEditId === agency.id;
                  return (
                    <div
                      key={agency.id}
                      className="rounded-md border border-default-200 bg-default-50 p-3"
                    >
                      {showAgencyEdit && isEditing ? (
                        <div className="grid gap-2 md:grid-cols-3">
                          <Input
                            label="Nome"
                            value={agencyEditName}
                            onChange={(e) => setAgencyEditName(e.target.value)}
                          />
                          <div className="flex items-end gap-2 md:col-span-2">
                            <Button
                              size="sm"
                              color="primary"
                              onClick={handleSaveAgency}
                              isLoading={agencyLoading}
                            >
                              Salva
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              onClick={() => {
                                setAgencyEditId(null);
                                setAgencyEditName("");
                              }}
                            >
                              Annulla
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold">{agency.agencyName}</div>
                            <div className="text-xs text-default-500">ID {agency.id}</div>
                          </div>
                          {(showAgencyEdit || showAgencyDelete) && (
                            <div className="flex gap-2">
                              {showAgencyEdit && (
                                <Button
                                  size="sm"
                                  variant="flat"
                                  onClick={() => handleEditAgency(agency)}
                                >
                                  Modifica
                                </Button>
                              )}
                              {showAgencyDelete && (
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="flat"
                                  onClick={() => handleDeleteAgency(agency.id)}
                                >
                                  Elimina
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
