import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrdersService } from '../../../core/orders.service';
import {
  ESTADOS_ENVIO,
  ESTADOS_PEDIDO,
  EstadoEnvio,
  EstadoPedido,
  Pedido,
  etiquetaEnvio,
  totalUnidades,
} from '../../../core/models';
import { DEFAULT_PAGE, PAGE_SIZE_OPTIONS, contiene, pageRows, sortRows } from '../../../core/table-utils';
import { CLASE_ENVIO, CLASE_ESTADO } from './order-pills';
import { OrderDialog } from './order-dialog';

@Component({
  selector: 'app-orders-admin',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatMenuModule,
    MatDatepickerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './orders-admin.html',
  styleUrl: './orders-admin.scss',
})
export class OrdersAdmin {
  private readonly orders = inject(OrdersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly columnas = [
    'select',
    'id',
    'fecha',
    'cliente',
    'destino',
    'items',
    'total',
    'estado',
    'estadoEnvio',
    'acciones',
  ];
  protected readonly estadosPedido = ESTADOS_PEDIDO;
  protected readonly estadosEnvio = ESTADOS_ENVIO;
  protected readonly claseEstado = CLASE_ESTADO;
  protected readonly claseEnvio = CLASE_ENVIO;
  protected readonly etiquetaEnvio = etiquetaEnvio;
  protected readonly totalUnidades = totalUnidades;
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  protected readonly buscar = signal('');
  protected readonly estado = signal<EstadoPedido | null>(null);
  protected readonly estadoEnvio = signal<EstadoEnvio | null>(null);
  protected readonly desde = signal<Date | null>(null);
  protected readonly hasta = signal<Date | null>(null);
  protected readonly requiereRevision = signal(false);
  protected readonly sort = signal<Sort>({ active: 'fecha', direction: 'desc' });
  protected readonly page = signal(DEFAULT_PAGE);
  protected readonly seleccion = signal<ReadonlySet<number>>(new Set());

  /** Tarjetas de resumen: pedidos pagados según su etapa de envío. */
  protected readonly resumen = computed(() => {
    const pagados = this.orders.todos().filter((p) => p.estado === 'Pagado');
    return {
      envios: ESTADOS_ENVIO.map((e) => ({ ...e, cantidad: pagados.filter((p) => p.estadoEnvio === e.valor).length })),
      revision: this.orders.todos().filter((p) => p.requiereRevision).length,
      pendientesPago: this.orders.todos().filter((p) => p.estado === 'Pendiente').length,
    };
  });

  protected readonly filtrados = computed(() => {
    const texto = this.buscar();
    const estado = this.estado();
    const envio = this.estadoEnvio();
    const desde = this.desde();
    const hasta = this.hasta();
    const revision = this.requiereRevision();
    const finHasta = hasta ? new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate(), 23, 59, 59, 999) : null;

    const rows = this.orders.todos().filter((p) => {
      const fecha = new Date(p.fecha);
      return (
        (!texto || contiene(p.cliente.nombre, texto) || p.cliente.dni.includes(texto.trim()) || String(p.id).includes(texto.trim())) &&
        (estado === null || p.estado === estado) &&
        (envio === null || p.estadoEnvio === envio) &&
        (!desde || fecha >= desde) &&
        (!finHasta || fecha <= finHasta) &&
        (!revision || p.requiereRevision)
      );
    });
    return sortRows(rows, this.sort(), (p, col) => this.valorOrden(p, col));
  });

  protected readonly filas = computed(() => pageRows(this.filtrados(), this.page()));

  protected readonly seleccionados = computed(() => this.orders.todos().filter((p) => this.seleccion().has(p.id)));
  protected readonly todosSeleccionados = computed(
    () => this.filas().length > 0 && this.filas().every((p) => this.seleccion().has(p.id)),
  );
  protected readonly algunoSeleccionado = computed(() => this.filas().some((p) => this.seleccion().has(p.id)));

  protected readonly hayFiltros = computed(
    () =>
      !!this.buscar() ||
      this.estado() !== null ||
      this.estadoEnvio() !== null ||
      !!this.desde() ||
      !!this.hasta() ||
      this.requiereRevision(),
  );

  protected filtrar(cambio: () => void): void {
    cambio();
    this.page.update((p) => ({ ...p, pageIndex: 0 }));
  }

  protected filtrarPorEnvio(envio: EstadoEnvio): void {
    const yaActivo = this.estado() === 'Pagado' && this.estadoEnvio() === envio;
    this.filtrar(() => {
      this.estado.set(yaActivo ? null : 'Pagado');
      this.estadoEnvio.set(yaActivo ? null : envio);
    });
  }

  protected filtrarPagoPendiente(): void {
    const yaActivo = this.estado() === 'Pendiente';
    this.filtrar(() => {
      this.estado.set(yaActivo ? null : 'Pendiente');
      this.estadoEnvio.set(null);
    });
  }

  protected detalleItems(p: Pedido): string {
    return p.items.map((i) => `${i.cantidad}x ${i.nombreProducto}`).join(', ');
  }

  protected limpiarFiltros(): void {
    this.filtrar(() => {
      this.buscar.set('');
      this.estado.set(null);
      this.estadoEnvio.set(null);
      this.desde.set(null);
      this.hasta.set(null);
      this.requiereRevision.set(false);
    });
  }

  protected cambiarPagina(e: PageEvent): void {
    this.page.set({ pageIndex: e.pageIndex, pageSize: e.pageSize });
  }

  protected toggle(id: number): void {
    this.seleccion.update((s) => {
      const nuevo = new Set(s);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  protected toggleTodos(): void {
    const ids = this.filas().map((p) => p.id);
    const marcar = !this.todosSeleccionados();
    this.seleccion.update((s) => {
      const nuevo = new Set(s);
      ids.forEach((id) => (marcar ? nuevo.add(id) : nuevo.delete(id)));
      return nuevo;
    });
  }

  protected limpiarSeleccion(): void {
    this.seleccion.set(new Set());
  }

  /** El estado de envío solo se cambia en pedidos pagados. */
  protected cambiarEnvio(pedidos: Pedido[], estadoEnvio: EstadoEnvio): void {
    const pagados = pedidos.filter((p) => p.estado === 'Pagado');
    const omitidos = pedidos.length - pagados.length;
    this.orders.setEstadoEnvio(
      pagados.map((p) => p.id),
      estadoEnvio,
    );
    const msg = `${pagados.length} pedido(s) → ${etiquetaEnvio(estadoEnvio)}` + (omitidos ? ` · ${omitidos} omitido(s) por no estar pagados` : '');
    this.snackBar.open(msg, undefined, { duration: 3500 });
  }

  protected verDetalle(pedido: Pedido): void {
    this.dialog.open(OrderDialog, { data: pedido.id, width: '760px', maxWidth: '95vw' });
  }

  /** Hoja de despacho en CSV (abre en Excel) con los pedidos seleccionados o, si no hay, los filtrados. */
  protected exportarDespacho(): void {
    const pedidos = this.seleccionados().length ? this.seleccionados() : this.filtrados();
    const encabezado = ['Pedido', 'Fecha', 'Cliente', 'DNI', 'Teléfono', 'Email', 'Dirección', 'Productos', 'Unidades', 'Total', 'Estado', 'Estado envío'];
    const filas = pedidos.map((p) => [
      p.id,
      new Date(p.fecha).toLocaleString('es-AR'),
      p.cliente.nombre,
      p.cliente.dni,
      p.cliente.telefono,
      p.cliente.email,
      p.cliente.direccion,
      p.items.map((i) => `${i.cantidad}x ${i.nombreProducto}`).join(' | '),
      totalUnidades(p),
      p.total,
      p.estado,
      etiquetaEnvio(p.estadoEnvio),
    ]);
    const csv = [encabezado, ...filas]
      .map((fila) => fila.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `despacho-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private valorOrden(p: Pedido, col: string) {
    switch (col) {
      case 'fecha':
        return p.fecha;
      case 'cliente':
        return p.cliente.nombre;
      case 'destino':
        return p.cliente.direccion;
      case 'items':
        return totalUnidades(p);
      default:
        return p[col as keyof Pedido] as string | number;
    }
  }
}
