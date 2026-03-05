import { useState, useMemo } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { fetchPSFile, uploadPSFile } from "@/lib/system-api";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";

// TODO: Import API functions for PS upload
// import { uploadPSFile, fetchPSStatus } from "@/lib/system-api";

export default function PSManagement() {
  const [fileType, setFileType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [psData, setPSData] = useState<any>(null);
  const [search, setSearch] = useState("");

  const FILE_TYPES = [
    { key: "states", label: "Stati" },
    { key: "municipalities", label: "Comuni" },
    { key: "documents", label: "Documenti di identità" },
    { key: "family-types", label: "Tipologia familiare" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!fileType || !file) {
      setError("Seleziona tipo e file.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await uploadPSFile(fileType, file);
      setSuccess("File caricato con successo.");
      setFile(null);
    } catch (err) {
      setError((err as Error).message || "Errore upload file");
    } finally {
      setLoading(false);
    }
  };

  const handleGet = async () => {
    if (!fileType) {
      setError("Seleziona tipo.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await fetchPSFile(fileType);
      setPSData(data);
      setSuccess("File PS caricato.");
    } catch (err) {
      setError((err as Error).message || "Errore caricamento file PS");
    } finally {
      setLoading(false);
    }
  };

  const psDataMemo = useMemo(() => psData, [psData]);

  const filteredData = useMemo(() => {
    if (!psData) return [];
    let arr = Array.isArray(psData) ? psData : (psData?.data || []);
    if (!search.trim()) return arr.slice(0, 10);
    return arr.filter((row) =>
      Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    ).slice(0, 10);
  }, [psData, search]);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestione PS struttura</h3>
          <p className="text-xs text-default-500">Carica file per stati, comuni, documenti e tipologie familiari.</p>
        </div>
        <Button size="sm" variant="flat" isDisabled={loading}>
          Aggiorna
        </Button>
      </CardHeader>
      <CardBody className="gap-4">
        {error && <div className="text-sm text-danger-600">{error}</div>}
        {success && <div className="text-sm text-success-600">{success}</div>}
        
        <div className="grid gap-3 md:grid-cols-3">
          <Select
            label="Tipo file"
            selectedKeys={fileType ? [fileType] : []}
            onChange={(e) => setFileType(e.target.value)}
          >
            {FILE_TYPES.map((type) => (
              <SelectItem key={type.key}>
                {type.label}
              </SelectItem>
            ))}
          </Select>
          <Input
            type="file"
            label="Seleziona file"
            onChange={handleFileChange}
            accept=".csv,.xlsx,.xls,.json"
          />
          <Button
            color="primary"
            isDisabled={loading || !fileType || !file}
            onClick={handleUpload}
          >
            Carica
          </Button>
          <Button
            color="secondary"
            isDisabled={loading || !fileType}
            onClick={handleGet}
          >
            Visualizza
          </Button>
        </div>
        {psDataMemo && (
          <div className="mt-4">
            <h4 className="text-md font-semibold mb-2">Dati PS:</h4>
            <Input
              label="Cerca"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2 max-w-xs"
            />
            <div className="overflow-x-auto">
              <Table aria-label="Dati PS" removeWrapper className="min-w-full text-xs border border-default-200 rounded">
                <TableHeader>
                  {filteredData[0] &&
                    Object.keys(filteredData[0])
                      .filter((key) =>
                        fileType === "municipalities" ? key !== "provincia" : true
                      )
                      .map((key) => (
                        <TableColumn key={key}>{key}</TableColumn>
                      ))}
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, i) => (
                    <TableRow key={i}>
                      {fileType === "municipalities"
                        ? Object.entries(row)
                            .filter(([key]) => key !== "provincia")
                            .map(([key, val], j) => {
                              if (key === "nome" && row.provincia) {
                                return (
                                  <TableCell key={j}>
                                    {String(val)} {row.provincia ? `(${row.provincia})` : ""}
                                  </TableCell>
                                );
                              }
                              return <TableCell key={j}>{String(val)}</TableCell>;
                            })
                        : Object.values(row).map((val, j) => (
                            <TableCell key={j}>{String(val)}</TableCell>
                          ))}
                    </TableRow>
                  ))}
                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={filteredData[0] ? Object.keys(filteredData[0]).length : 1} className="text-center py-2 text-default-400">
                        Nessun risultato
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
