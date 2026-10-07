import { Injectable, inject } from '@angular/core';
import { CatalogService } from './catalog.service';
import { Cliente, EstadoEnvio, ItemPedido, Pedido } from './models';
import { persistedSignal } from './persisted-signal';

const haceDias = (dias: number, hora = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(hora, 15, 0, 0);
  return d.toISOString();
};

const item = (productoId: number, nombreProducto: string, cantidad: number, precioUnitario: number, unidadesPorPack = 1): ItemPedido => ({
  productoId,
  nombreProducto,
  cantidad,
  precioUnitario,
  unidadesPorPack,
});

const cliente = (nombre: string, dni: string, localidad: string, provincia = 'Entre Ríos', codigoPostal = '3100'): Cliente => ({
  nombre,
  dni,
  email: `${nombre.split(' ')[0].toLowerCase()}@mail.com`,
  telefono: '343 4' + dni.slice(-6),
  direccion: `San Martín ${Number(dni.slice(-3)) + 100}, ${localidad}, ${provincia} (CP ${codigoPostal})`,
});

const pagoAprobado = (id: number, fecha: string) => ({
  id,
  mpOrderId: `ORD01K${id}X7Q9`,
  mpPaymentId: `PAY01K${id}Z3M2`,
  estado: 'processed',
  mpStatusDetail: 'accredited',
  fecha,
});

const pedido = (id: number, fecha: string, c: Cliente, items: ItemPedido[], resto: Partial<Pedido> = {}): Pedido => ({
  id,
  fecha,
  estado: 'Pagado',
  estadoEnvio: 'PendienteDeEnvio',
  cliente: c,
  items,
  total: items.reduce((t, i) => t + i.cantidad * i.precioUnitario, 0),
  requiereRevision: false,
  pagos: [pagoAprobado(id, fecha)],
  ...resto,
});

const SEED: Pedido[] = [
  pedido(1012, haceDias(0, 10), cliente('Lucía Fernández', '33456789', 'Paraná'), [item(1, 'Aperitivo Kumquat', 2, 12500), item(4, 'El Gurí', 6, 3900)]),
  pedido(1011, haceDias(0, 9), cliente('Martín Gómez', '29887123', 'Concordia', 'Entre Ríos', '3200'), [item(7, 'Sangría Bolazo', 4, 4500)]),
  pedido(1010, haceDias(1, 18), cliente('Sofía Benítez', '38123456', 'Gualeguaychú', 'Entre Ríos', '2820'), [item(4, 'El Gurí', 12, 3900), item(3, 'Kumquat sin alcohol', 1, 7800)], { estadoEnvio: 'EnPreparacion' }),
  pedido(1009, haceDias(1, 15), cliente('Diego Ramírez', '31222333', 'Rosario', 'Santa Fe', '2000'), [item(2, 'Kumquat y menta', 3, 13200)], { estadoEnvio: 'EnPreparacion' }),
  pedido(1008, haceDias(2, 11), cliente('Carla Sosa', '35444555', 'Colón', 'Entre Ríos', '3280'), [item(5, 'Entre Rojos', 4, 3900), item(6, 'Mandarina', 2, 3900)], { estadoEnvio: 'Despachado' }),
  pedido(1007, haceDias(3, 20), cliente('Juan Pérez', '27666777', 'Victoria', 'Entre Ríos', '3153'), [item(1, 'Aperitivo Kumquat', 1, 12500)], {
    estado: 'Pendiente',
    pagos: [{ id: 1007, mpOrderId: 'ORD01K1007P1', mpPaymentId: 'PAY01K1007P1', estado: 'processing', mpStatusDetail: 'in_process', fecha: haceDias(3, 20) }],
  }),
  pedido(1006, haceDias(4, 13), cliente('Ana Ruiz', '36789012', 'Paraná'), [item(7, 'Sangría Bolazo', 2, 4500)], {
    estado: 'Cancelado',
    requiereRevision: true,
    pagos: [{ id: 1006, mpOrderId: 'ORD01K1006C1', mpPaymentId: 'PAY01K1006C1', estado: 'processed', mpStatusDetail: 'accredited', fecha: haceDias(4, 13) }],
  }),
  pedido(1005, haceDias(6, 16), cliente('Pablo Acosta', '30111222', 'Ciudad Autónoma de Buenos Aires', 'CABA', '1414'), [item(4, 'El Gurí', 12, 3900), item(7, 'Sangría Bolazo', 6, 4500)], { estadoEnvio: 'Entregado' }),
  pedido(1004, haceDias(8, 12), cliente('Valeria Medina', '34555666', 'Concepción del Uruguay', 'Entre Ríos', '3260'), [item(2, 'Kumquat y menta', 1, 13200)], {
    estado: 'Reembolsado',
    pagos: [{ id: 1004, mpOrderId: 'ORD01K1004R1', mpPaymentId: 'PAY01K1004R1', estado: 'refunded', mpStatusDetail: 'refunded', fecha: haceDias(8, 12) }],
  }),
];

export interface NuevoPedidoItem {
  productoId: number;
  packs: number;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly catalog = inject(CatalogService);
  private readonly pedidos = persistedSignal<Pedido[]>('ce-pedidos-v5', SEED);

  readonly todos = this.pedidos.asReadonly();

  buscar(id: number): Pedido | undefined {
    return this.pedidos().find((p) => p.id === id);
  }

  /**
   * Simula POST /api/v1/pedidos + pago aprobado. El front manda packs;
   * se guardan unidades (packs × unidadesPorPack) con snapshot de precio.
   */
  crear(cliente: Cliente, itemsPedido: NuevoPedidoItem[]): Pedido {
    const id = Math.max(1000, ...this.pedidos().map((p) => p.id)) + 1;
    const fecha = new Date().toISOString();
    const items: ItemPedido[] = itemsPedido.map(({ productoId, packs }) => {
      const prod = this.catalog.buscar(productoId)!;
      return item(prod.id, prod.nombre, packs * prod.unidadesPorPack, prod.precio, prod.unidadesPorPack);
    });
    const nuevo = pedido(id, fecha, cliente, items);
    items.forEach((i) => this.catalog.reservar(i.productoId, i.cantidad, id));
    this.pedidos.update((list) => [nuevo, ...list]);
    return nuevo;
  }

  /** PUT /api/v1/pedidos/{id}/estado-envio */
  setEstadoEnvio(ids: number[], estadoEnvio: EstadoEnvio): void {
    const set = new Set(ids);
    this.pedidos.update((list) => list.map((p) => (set.has(p.id) && p.estado === 'Pagado' ? { ...p, estadoEnvio } : p)));
  }

  /** PUT /api/v1/pedidos/{id}/estado — solo Pagado → Cancelado | Reembolsado. No toca el stock. */
  cerrar(id: number, estado: 'Cancelado' | 'Reembolsado'): void {
    this.pedidos.update((list) => list.map((p) => (p.id === id && p.estado === 'Pagado' ? { ...p, estado } : p)));
  }
}
