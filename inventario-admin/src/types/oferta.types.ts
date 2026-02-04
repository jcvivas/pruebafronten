export type OfertaDto = {
  idProductoProveedorLote: number;
  idProducto: number;
  idProveedor: number;
  numeroLote: string | null;
  precioUnitario: number;
  stockDisponible: number;
  stockReservado: number;
  moneda: string;
  fechaVencimiento: string | null;
  activo: boolean;
  usuarioCreacion: string | null;
  fechaCreacionUtc: string;
  usuarioModificacion: string | null;
  fechaModificacionUtc: string | null;

  codigoProducto: string | null;
  nombreProducto: string | null;
  codigoProveedor: string | null;
  nombreProveedor: string | null;
};

export type OfertaCrearDto = {
  idProducto: number;
  idProveedor: number;
  numeroLote: string | null;
  precioUnitario: number;
  stockDisponible: number;
  stockReservado: number;
  moneda: string | null;
  fechaVencimiento: string | null;
  activo: boolean;
};

export type OfertaActualizarDto = OfertaCrearDto & {
  idProductoProveedorLote: number;
};
