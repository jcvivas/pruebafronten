import api from "@/api/axios";
import type { OfertaDto, OfertaCrearDto, OfertaActualizarDto } from "@/types/oferta.types";

export const getOfertas = async (idProducto: number): Promise<OfertaDto[]> => {
  const res = await api.get<OfertaDto[]>("/admin/productos-proveedor-lote", {
    params: { idProducto }
  });
  return res.data;
};

export const getOfertaById = async (idProductoProveedorLote: number): Promise<OfertaDto> => {
  const res = await api.get<OfertaDto>(`/admin/productos-proveedor-lote/${idProductoProveedorLote}`);
  return res.data;
};

export const crearOferta = async (data: OfertaCrearDto): Promise<void> => {
  await api.post("/admin/productos-proveedor-lote", data);
};

export const actualizarOferta = async (data: OfertaActualizarDto): Promise<void> => {
  await api.put("/admin/productos-proveedor-lote", data);
};

