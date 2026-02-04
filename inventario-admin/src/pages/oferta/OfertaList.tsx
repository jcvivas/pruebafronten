import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

import { getProductos } from "@/api/producto.api";
import { getProveedores } from "@/api/proveedor.api";
import { getOfertas, crearOferta, actualizarOferta } from "@/api/oferta.api";

import type { ProductoDto } from "@/types/producto.types";
import type { ProveedorDto } from "@/types/proveedor.types";
import type { OfertaDto } from "@/types/oferta.types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FormState = {
  idProductoProveedorLote: number | null;
  idProducto: number | null;
  idProveedor: number | null;
  numeroLote: string;
  precioUnitario: string; 
  stockDisponible: string;
  stockReservado: string;
  moneda: string;
  fechaVencimiento: string; 
  activo: boolean;
};

const emptyForm: FormState = {
  idProductoProveedorLote: null,
  idProducto: null,
  idProveedor: null,
  numeroLote: "",
  precioUnitario: "0",
  stockDisponible: "0",
  stockReservado: "0",
  moneda: "USD",
  fechaVencimiento: "",
  activo: true
};

export default function OfertaList(): JSX.Element {
  const [rows, setRows] = useState<OfertaDto[]>([]);
  const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [idProducto, setIdProducto] = useState<number | null>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const productosActivos = useMemo(
    () => productos.filter(p => p.activo),
    [productos]
  );

  const proveedoresActivos = useMemo(
    () => proveedores.filter(p => p.activo),
    [proveedores]
  );

  const productosMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of productos) m.set(p.idProducto, p.nombre ?? p.codigo ?? `#${p.idProducto}`);
    return m;
  }, [productos]);

  const proveedoresMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const pr of proveedores) m.set(pr.idProveedor, pr.nombre ?? pr.codigo ?? `#${pr.idProveedor}`);
    return m;
  }, [proveedores]);

  const loadBase = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const [prods, provs] = await Promise.all([
        getProductos(),      // tu endpoint busca, sin texto trae todo
        getProveedores()     // asumiendo que tienes esto igual que categorías/productos
      ]);

      setProductos(prods);
      setProveedores(provs);

      // si no hay producto seleccionado, elige el primero activo para que no quede vacía
      const first = prods.find(p => p.activo)?.idProducto ?? null;
      setIdProducto(prev => (prev ?? first));
    } catch {
      setError("No se pudieron cargar productos/proveedores.");
    } finally {
      setLoading(false);
    }
  };

  const loadRows = async (pid: number): Promise<void> => {
    setError(null);
    setBusy(true);
    try {
      const data = await getOfertas(pid);
      setRows(data);
    } catch {
      setError("No se pudieron cargar las ofertas.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void loadBase();
  }, []);

  useEffect(() => {
    if (idProducto) void loadRows(idProducto);
  }, [idProducto]);

  const openCreate = (): void => {
    setForm({
      ...emptyForm,
      idProducto: idProducto,
      idProveedor: null
    });
    setOpen(true);
  };

  const openEdit = (r: OfertaDto): void => {
    setForm({
      idProductoProveedorLote: r.idProductoProveedorLote,
      idProducto: r.idProducto,
      idProveedor: r.idProveedor,
      numeroLote: r.numeroLote ?? "",
      precioUnitario: String(r.precioUnitario ?? 0),
      stockDisponible: String(r.stockDisponible ?? 0),
      stockReservado: String(r.stockReservado ?? 0),
      moneda: r.moneda ?? "USD",
      fechaVencimiento: r.fechaVencimiento ? r.fechaVencimiento.slice(0, 10) : "",
      activo: r.activo
    });
    setOpen(true);
  };

  const onSave = async (): Promise<void> => {
    setError(null);

    if (!form.idProducto) {
      setError("Selecciona un producto.");
      return;
    }
    if (!form.idProveedor) {
      setError("Selecciona un proveedor.");
      return;
    }

    const precio = Number(form.precioUnitario);
    const disp = Number(form.stockDisponible);
    const resv = Number(form.stockReservado);

    if (Number.isNaN(precio) || precio < 0) {
      setError("Precio unitario inválido.");
      return;
    }
    if (Number.isNaN(disp) || disp < 0 || Number.isNaN(resv) || resv < 0) {
      setError("Stock inválido.");
      return;
    }

    const payload = {
      idProducto: form.idProducto,
      idProveedor: form.idProveedor,
      numeroLote: form.numeroLote.trim() || null,
      precioUnitario: precio,
      stockDisponible: disp,
      stockReservado: resv,
      moneda: form.moneda.trim() || "USD",
      fechaVencimiento: form.fechaVencimiento ? form.fechaVencimiento : null,
      activo: form.activo
    };

    setBusy(true);
    try {
      if (form.idProductoProveedorLote === null) {
        await crearOferta(payload);
      } else {
        await actualizarOferta({ idProductoProveedorLote: form.idProductoProveedorLote, ...payload });
      }
      setOpen(false);
      await loadRows(form.idProducto);
    } catch {
      setError("No se pudo guardar la oferta.");
    } finally {
      setBusy(false);
    }
  };

  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
            Cargando...
          </TableCell>
        </TableRow>
      );
    }

    if (!idProducto) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
            Selecciona un producto para ver ofertas
          </TableCell>
        </TableRow>
      );
    }

    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
            No hay ofertas para este producto
          </TableCell>
        </TableRow>
      );
    }

    return rows.map(r => (
      <TableRow key={r.idProductoProveedorLote}>
        <TableCell className="font-mono text-xs">{r.idProductoProveedorLote}</TableCell>
        <TableCell>{r.nombreProveedor ?? (r.idProveedor ? (proveedoresMap.get(r.idProveedor) ?? `#${r.idProveedor}`) : "-")}</TableCell>
        <TableCell>{r.numeroLote ?? "-"}</TableCell>
        <TableCell className="text-right">{r.precioUnitario}</TableCell>
        <TableCell className="text-right">{r.stockDisponible}</TableCell>
        <TableCell className="text-right">{r.stockReservado}</TableCell>
        <TableCell>{r.fechaVencimiento ? r.fechaVencimiento.slice(0, 10) : "-"}</TableCell>
        <TableCell className="text-right space-x-2">
          <Button variant="outline" size="sm" onClick={() => openEdit(r)} disabled={busy}>
            Editar
          </Button>
        </TableCell>
      </TableRow>
    ));
  }, [busy, idProducto, loading, proveedoresMap, rows]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ofertas (Producto / Proveedor / Lote)</CardTitle>

          <div className="flex items-center gap-2">
            <Select
              value={idProducto ? String(idProducto) : "0"}
              onValueChange={v => setIdProducto(v === "0" ? null : Number(v))}
            >
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Seleccione producto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Seleccione producto</SelectItem>
                {productosActivos.map(p => (
                  <SelectItem key={p.idProducto} value={String(p.idProducto)}>
                    {(p.codigo ? `${p.codigo} - ` : "") + (p.nombre ?? `#${p.idProducto}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate} disabled={!idProducto || busy}>
                  Nuevo
                </Button>
              </DialogTrigger>

              <DialogContent className="bg-white text-slate-900 border border-slate-200 shadow-2xl">
                <DialogHeader>
                  <DialogTitle>{form.idProductoProveedorLote === null ? "Nueva oferta" : "Editar oferta"}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Producto</Label>
                    <Select
                      value={form.idProducto ? String(form.idProducto) : "0"}
                      onValueChange={v => setForm(s => ({ ...s, idProducto: v === "0" ? null : Number(v) }))}
                      disabled
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione producto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Seleccione producto</SelectItem>
                        {productosActivos.map(p => (
                          <SelectItem key={p.idProducto} value={String(p.idProducto)}>
                            {(p.codigo ? `${p.codigo} - ` : "") + (p.nombre ?? `#${p.idProducto}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Proveedor *</Label>
                    <Select
                      value={form.idProveedor ? String(form.idProveedor) : "0"}
                      onValueChange={v => setForm(s => ({ ...s, idProveedor: v === "0" ? null : Number(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Seleccione proveedor</SelectItem>
                        {proveedoresActivos.map(pr => (
                          <SelectItem key={pr.idProveedor} value={String(pr.idProveedor)}>
                            {(pr.codigo ? `${pr.codigo} - ` : "") + (pr.nombre ?? `#${pr.idProveedor}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="numeroLote">Número de lote</Label>
                      <Input id="numeroLote" value={form.numeroLote} onChange={e => setForm(s => ({ ...s, numeroLote: e.target.value }))} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="moneda">Moneda</Label>
                      <Input id="moneda" value={form.moneda} onChange={e => setForm(s => ({ ...s, moneda: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="precio">Precio unitario</Label>
                      <Input id="precio" value={form.precioUnitario} onChange={e => setForm(s => ({ ...s, precioUnitario: e.target.value }))} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="disp">Stock disponible</Label>
                      <Input id="disp" value={form.stockDisponible} onChange={e => setForm(s => ({ ...s, stockDisponible: e.target.value }))} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resv">Stock reservado</Label>
                      <Input id="resv" value={form.stockReservado} onChange={e => setForm(s => ({ ...s, stockReservado: e.target.value }))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="venc">Fecha vencimiento</Label>
                    <Input
                      id="venc"
                      type="date"
                      value={form.fechaVencimiento}
                      onChange={e => setForm(s => ({ ...s, fechaVencimiento: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div className="text-sm font-medium">Activo</div>
                    </div>
                    <Switch checked={form.activo} onCheckedChange={checked => setForm(s => ({ ...s, activo: checked }))} />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                    Cancelar
                  </Button>
                  <Button onClick={() => void onSave()} disabled={busy}>
                    {busy ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mb-3 text-sm text-slate-600">
            Producto:{" "}
            <span className="font-medium">
              {idProducto ? (productosMap.get(idProducto) ?? `#${idProducto}`) : "-"}
            </span>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px]">ID</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="w-[160px]">Lote</TableHead>
                  <TableHead className="w-[120px] text-right">Precio</TableHead>
                  <TableHead className="w-[140px] text-right">Disponible</TableHead>
                  <TableHead className="w-[140px] text-right">Reservado</TableHead>
                  <TableHead className="w-[140px]">Vence</TableHead>
                  <TableHead className="w-[140px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{tableBody}</TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
