// Modelos que replican los DTOs del backend (ver decisiones_tecnicas_backend.pdf).

export interface Marca {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Variante {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface FotoProducto {
  id: number;
  url: string;
  principal: boolean;
  orden: number;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  marcaId: number;
  varianteId: number | null;
  /** Siempre por unidad. */
  precio: number;
  /** 1 = se vende por unidad; > 1 = se vende por pack. */
  unidadesPorPack: number;
  /** En unidades, ya neto de reservas. */
  stock: number;
  activo: boolean;
  fotos: FotoProducto[];
}

export type ProductoInput = Omit<Producto, 'id'>;

export const MAX_FOTOS_PRODUCTO = 8;
export const MAX_MB_FOTO = 10;
export const EXTENSIONES_FOTO = ['image/jpeg', 'image/png', 'image/webp'];

export function precioPack(p: Pick<Producto, 'precio' | 'unidadesPorPack'>): number {
  return p.precio * p.unidadesPorPack;
}

export function packsDisponibles(p: Pick<Producto, 'stock' | 'unidadesPorPack'>): number {
  return Math.floor(p.stock / p.unidadesPorPack);
}

export function fotoPrincipal(p: Producto): string | undefined {
  return (p.fotos.find((f) => f.principal) ?? [...p.fotos].sort((a, b) => a.orden - b.orden)[0])?.url;
}

export interface MotivoStock {
  id: number;
  nombre: string;
  esSistema: boolean;
  requierePedidoId: boolean;
  activo: boolean;
}

export interface MovimientoStock {
  id: number;
  productoId: number;
  motivoId: number;
  /** Positivo ingresa, negativo egresa (en unidades). */
  cantidad: number;
  fecha: string;
  pedidoId: number | null;
  observacion: string;
}

export type EstadoPedido = 'Pendiente' | 'Pagado' | 'Cancelado' | 'Reembolsado';

// TODO: confirmar los valores exactos de Pedido.EstadoEnvio en resumen_cantineros.md
export type EstadoEnvio = 'PendienteDeEnvio' | 'EnPreparacion' | 'Despachado' | 'Entregado';

export const ESTADOS_PEDIDO: EstadoPedido[] = ['Pendiente', 'Pagado', 'Cancelado', 'Reembolsado'];

export const ESTADOS_ENVIO: { valor: EstadoEnvio; etiqueta: string; icono: string }[] = [
  { valor: 'PendienteDeEnvio', etiqueta: 'Pendiente de envío', icono: 'schedule' },
  { valor: 'EnPreparacion', etiqueta: 'En preparación', icono: 'inventory_2' },
  { valor: 'Despachado', etiqueta: 'Despachado', icono: 'local_shipping' },
  { valor: 'Entregado', etiqueta: 'Entregado', icono: 'task_alt' },
];

export function etiquetaEnvio(estado: EstadoEnvio): string {
  return ESTADOS_ENVIO.find((e) => e.valor === estado)?.etiqueta ?? estado;
}

export interface Cliente {
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  /** Dirección completa de entrega en un solo campo (calle, número, localidad, provincia, CP). */
  direccion: string;
}

export interface ItemPedido {
  productoId: number;
  nombreProducto: string;
  /** En unidades. */
  cantidad: number;
  /** Snapshot al momento de la compra. */
  precioUnitario: number;
  /** Snapshot al momento de la compra. */
  unidadesPorPack: number;
}

export interface Pago {
  id: number;
  mpOrderId: string;
  mpPaymentId: string;
  /** Order.status de Mercado Pago tal cual. */
  estado: string;
  /** Order.status_detail de Mercado Pago tal cual. */
  mpStatusDetail: string;
  fecha: string;
}

export interface Pedido {
  id: number;
  fecha: string;
  estado: EstadoPedido;
  estadoEnvio: EstadoEnvio;
  cliente: Cliente;
  items: ItemPedido[];
  total: number;
  requiereRevision: boolean;
  pagos: Pago[];
}

export function totalUnidades(p: Pedido): number {
  return p.items.reduce((n, i) => n + i.cantidad, 0);
}

export type Rol = 'Admin' | 'SuperAdmin';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}
