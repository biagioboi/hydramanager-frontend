import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";

import {
  deleteUser,
  fetchStaff,
  registerStaff,
  type UserResponse,
} from "@/lib/hotel-api";

const ROLE_OPTIONS = [
  { label: "Receptionist", value: "RECEPTIONIST" },
  { label: "Waiter", value: "WAITER" },
  { label: "Repairman", value: "REPAIRMAN" },
  { label: "Barman", value: "BARMAN" },
];

export default function StaffManagement() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [staffList, setStaffList] = useState<UserResponse[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleCreate = async () => {
    setCreateError(null);
    setCreateSuccess(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !role) {
      setCreateError("Compila tutti i campi richiesti.");
      return;
    }

    setLoadingCreate(true);
    try {
      await registerStaff({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim() || undefined,
        email: email.trim(),
        password: password.trim(),
        role: role.toLowerCase(),
      });
      setCreateSuccess("Staff creato correttamente.");
      await loadStaff();
      setFirstName("");
      setLastName("");
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("");
    } catch (err) {
      setCreateError((err as Error).message || "Errore creazione staff");
    } finally {
      setLoadingCreate(false);
    }
  };

  const loadStaff = async () => {
    setLoadingStaff(true);
    setStaffError(null);
    try {
      const list = await fetchStaff();
      setStaffList(list);
    } catch (err) {
      setStaffError((err as Error).message || "Errore caricamento staff");
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteUser(id);
      setStaffList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setStaffError((err as Error).message || "Errore cancellazione utente");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestione staff</h3>
          <p className="text-xs text-default-500">
            Crea e verifica utenti staff: receptionist, waiter, repairman, barman.
          </p>
        </div>
        <Button size="sm" variant="flat" onClick={loadStaff} isDisabled={loadingStaff}>
          Aggiorna
        </Button>
      </CardHeader>
      <CardBody className="gap-6">
        <div className="grid gap-3">
          <div className="text-sm font-semibold">Staff esistente</div>
          {staffError && <div className="text-sm text-danger-500">{staffError}</div>}
          {!staffError && staffList.length === 0 && !loadingStaff && (
            <div className="text-sm text-default-500">Nessuno staff presente.</div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {staffList.map((staff) => (
              <div key={staff.id} className="rounded-md border border-default-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">
                    {staff.firstName} {staff.lastName}
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onClick={() => handleDelete(staff.id)}
                    isDisabled={deletingId === staff.id}
                    aria-label="Elimina staff"
                  >
                    ×
                  </Button>
                </div>
                <div className="text-xs text-default-500">Email: {staff.email || "-"}</div>
                <div className="text-xs text-default-500">Ruolo: {staff.role || "-"}</div>
                <div className="text-xs text-default-500">Username: {staff.username || "-"}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-default-200" />

        <div className="grid gap-3">
          <div className="text-sm font-semibold">Nuovo staff</div>
          {createError && <div className="text-sm text-danger-500">{createError}</div>}
          {createSuccess && <div className="text-sm text-success-500">{createSuccess}</div>}
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Nome" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label="Cognome" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-default-500">Ruolo</span>
              <select
                className="w-full rounded-medium border border-default-200 bg-default-0 px-3 py-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Seleziona ruolo</option>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                color="primary"
                onClick={handleCreate}
                isDisabled={loadingCreate}
              >
                Crea staff
              </Button>
            </div>
          </div>
        </div>

      </CardBody>
    </Card>
  );
}
