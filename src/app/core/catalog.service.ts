import { Injectable, computed } from '@angular/core';
import { Marca, MotivoStock, MovimientoStock, Producto, ProductoInput, Variante } from './models';
import { persistedSignal } from './persisted-signal';

// Datos de prueba hasta conectar la API (/api/v1/panel/productos, /marcas, /variantes, /motivos-stock).
const MARCAS: Marca[] = [
  { id: 1, nombre: 'Kumquat', activo: true },
  { id: 2, nombre: 'Enlatados', activo: true },
  { id: 3, nombre: 'Bolazo', activo: true },
];

const VARIANTES: Variante[] = [
  { id: 1, nombre: 'Clásico', activo: true },
  { id: 2, nombre: 'Menta', activo: true },
  { id: 3, nombre: 'Sin alcohol', activo: true },
  { id: 4, nombre: 'Frutos rojos', activo: true },
];

const MOTIVOS: MotivoStock[] = [
  { id: 1, nombre: 'IngresoDeStock', esSistema: true, requierePedidoId: false, activo: true },
  { id: 2, nombre: 'ReservaWeb', esSistema: true, requierePedidoId: true, activo: true },
  { id: 3, nombre: 'LiberacionReserva', esSistema: true, requierePedidoId: true, activo: true },
  { id: 4, nombre: 'Producción', esSistema: false, requierePedidoId: false, activo: true },
  { id: 5, nombre: 'Rotura / merma', esSistema: false, requierePedidoId: false, activo: true },
  { id: 6, nombre: 'Ajuste de inventario', esSistema: false, requierePedidoId: false, activo: true },
];

const foto = (id: number, archivo: string) => [
  { id, url: `images/products/${archivo}${archivo.includes('.') ? '' : '.jpg'}`, principal: true, orden: 0 },
];

const PRODUCTOS: Producto[] = [
  { id: 1, nombre: 'Aperitivo Kumquat', descripcion: 'Aperitivo de kumquat del Litoral argentino', marcaId: 1, varianteId: 1, precio: 12500, unidadesPorPack: 1, stock: 40, activo: true, fotos: foto(1, 'kq-aperitivo.png') },
  { id: 2, nombre: 'Kumquat y menta', descripcion: 'Fresco, herbal y cítrico', marcaId: 1, varianteId: 2, precio: 13200, unidadesPorPack: 1, stock: 25, activo: true, fotos: foto(2, 'kq-menta') },
  { id: 3, nombre: 'Kumquat sin alcohol', descripcion: 'Todo el sabor, cero alcohol', marcaId: 1, varianteId: 3, precio: 7800, unidadesPorPack: 1, stock: 60, activo: true, fotos: foto(3, 'kq-sin-alcohol') },
  { id: 8, nombre: 'Vaso Kumquat', descripcion: 'Vaso amarillo con el logo de Aperitivo Kumquat', marcaId: 1, varianteId: null, precio: 9000, unidadesPorPack: 1, stock: 30, activo: true, fotos: foto(8, 'kq-vaso.png') },
  { id: 4, nombre: 'El Gurí', descripcion: 'Cóctel enlatado con miel nativa · lata 473 ml', marcaId: 2, varianteId: null, precio: 3900, unidadesPorPack: 1, stock: 72, activo: true, fotos: foto(4, 'en-guri.png') },
  { id: 5, nombre: 'Entre Rojos', descripcion: 'Cóctel enlatado de frutos rojos · lata 473 ml', marcaId: 2, varianteId: null, precio: 3900, unidadesPorPack: 1, stock: 60, activo: true, fotos: foto(5, 'en-entre-rojos.png') },
  { id: 6, nombre: 'Mandarina', descripcion: 'Cóctel enlatado de mandarina con Aperitivo Kumquat · lata 473 ml', marcaId: 2, varianteId: null, precio: 3900, unidadesPorPack: 1, stock: 60, activo: true, fotos: foto(6, 'en-mandarina.png') },
  { id: 7, nombre: 'Sangría Bolazo', descripcion: 'Sangría con vinos e ingredientes entrerrianos, en lata', marcaId: 3, varianteId: null, precio: 4500, unidadesPorPack: 1, stock: 48, activo: true, fotos: foto(7, 'bz-sangria.png') },
];

@Injectable({ providedIn: 'root' })
export class CatalogService {
  readonly marcas = MARCAS;
  readonly variantes = VARIANTES;
  readonly motivos = MOTIVOS;
  /** Motivos que el admin puede elegir en un ajuste manual. */
  readonly motivosManuales = MOTIVOS.filter((m) => !m.esSistema && m.activo);

  private readonly productos = persistedSignal<Producto[]>('ce-productos-v6', PRODUCTOS);
  private readonly movimientos = persistedSignal<MovimientoStock[]>('ce-movimientos', []);

  readonly todos = this.productos.asReadonly();
  readonly historialStock = this.movimientos.asReadonly();
  private readonly porId = computed(() => new Map(this.productos().map((p) => [p.id, p])));

  marcaNombre(id: number): string {
    return MARCAS.find((m) => m.id === id)?.nombre ?? '—';
  }

  varianteNombre(id: number | null): string {
    return VARIANTES.find((v) => v.id === id)?.nombre ?? '—';
  }

  motivoNombre(id: number): string {
    return MOTIVOS.find((m) => m.id === id)?.nombre ?? '—';
  }

  buscar(id: number): Producto | undefined {
    return this.porId().get(id);
  }

  activosPorMarca(marcaId: number): Producto[] {
    return this.productos().filter((p) => p.marcaId === marcaId && p.activo);
  }

  /** El alta registra siempre un IngresoDeStock, aunque el stock inicial sea 0. */
  crear(input: ProductoInput): Producto {
    const id = Math.max(0, ...this.productos().map((p) => p.id)) + 1;
    const producto: Producto = { ...input, id };
    this.productos.update((list) => [...list, producto]);
    this.registrarMovimiento(id, 1, input.stock, null, 'Alta de producto');
    return producto;
  }

  /** El stock no se edita acá: se cambia con movimientos. */
  actualizar(id: number, cambios: Partial<Omit<ProductoInput, 'stock'>>): void {
    this.productos.update((list) => list.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
  }

  setActivo(id: number, activo: boolean): void {
    this.actualizar(id, { activo });
  }

  ajustarStock(productoId: number, motivoId: number, cantidad: number, observacion: string): void {
    this.moverStock(productoId, cantidad);
    this.registrarMovimiento(productoId, motivoId, cantidad, null, observacion);
  }

  reservar(productoId: number, unidades: number, pedidoId: number): void {
    this.moverStock(productoId, -unidades);
    this.registrarMovimiento(productoId, 2, -unidades, pedidoId, '');
  }

  private moverStock(productoId: number, cantidad: number): void {
    this.productos.update((list) =>
      list.map((p) => (p.id === productoId ? { ...p, stock: Math.max(0, p.stock + cantidad) } : p)),
    );
  }

  private registrarMovimiento(productoId: number, motivoId: number, cantidad: number, pedidoId: number | null, observacion: string): void {
    this.movimientos.update((list) => [
      ...list,
      { id: list.length + 1, productoId, motivoId, cantidad, pedidoId, observacion, fecha: new Date().toISOString() },
    ]);
  }
}
