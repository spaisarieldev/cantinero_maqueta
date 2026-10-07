import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CatalogService } from '../../../core/catalog.service';
import { Producto, fotoPrincipal, packsDisponibles, precioPack } from '../../../core/models';
import { DEFAULT_PAGE, PAGE_SIZE_OPTIONS, contiene, pageRows, sortRows } from '../../../core/table-utils';
import { ImageSlot } from '../../../shared/image-slot';
import { ProductDialog } from './product-dialog';
import { StockDialog } from './stock-dialog';

type FiltroActivo = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-products-admin',
  imports: [
    CurrencyPipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    ImageSlot,
  ],
  templateUrl: './products-admin.html',
  styleUrl: './products-admin.scss',
})
export class ProductsAdmin {
  protected readonly catalog = inject(CatalogService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly columnas = [
    'foto',
    'nombre',
    'marca',
    'variante',
    'precio',
    'unidadesPorPack',
    'precioPack',
    'stock',
    'packs',
    'activo',
    'acciones',
  ];
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  protected readonly buscar = signal('');
  protected readonly marcaId = signal<number | null>(null);
  protected readonly varianteId = signal<number | null>(null);
  protected readonly activo = signal<FiltroActivo>('todos');
  protected readonly sort = signal<Sort>({ active: 'nombre', direction: 'asc' });
  protected readonly page = signal(DEFAULT_PAGE);

  protected readonly filtrados = computed(() => {
    const texto = this.buscar();
    const marca = this.marcaId();
    const variante = this.varianteId();
    const activo = this.activo();
    const rows = this.catalog.todos().filter(
      (p) =>
        (!texto || contiene(p.nombre, texto)) &&
        (marca === null || p.marcaId === marca) &&
        (variante === null || p.varianteId === variante) &&
        (activo === 'todos' || p.activo === (activo === 'activos')),
    );
    return sortRows(rows, this.sort(), (p, col) => this.valorOrden(p, col));
  });

  protected readonly filas = computed(() => pageRows(this.filtrados(), this.page()));

  protected readonly resumen = computed(() => {
    const todos = this.catalog.todos();
    return {
      activos: todos.filter((p) => p.activo).length,
      sinStock: todos.filter((p) => p.activo && packsDisponibles(p) === 0).length,
      stockBajo: todos.filter((p) => p.activo && packsDisponibles(p) > 0 && packsDisponibles(p) <= 5).length,
    };
  });

  protected readonly precioPack = precioPack;
  protected readonly packsDisponibles = packsDisponibles;
  protected readonly fotoPrincipal = fotoPrincipal;

  protected filtrar(cambio: () => void): void {
    cambio();
    this.page.update((p) => ({ ...p, pageIndex: 0 }));
  }

  protected cambiarPagina(e: PageEvent): void {
    this.page.set({ pageIndex: e.pageIndex, pageSize: e.pageSize });
  }

  protected nuevo(): void {
    this.dialog
      .open(ProductDialog, { data: null, width: '720px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe((ok) => ok && this.snackBar.open('Producto creado', undefined, { duration: 2000 }));
  }

  protected editar(producto: Producto): void {
    this.dialog
      .open(ProductDialog, { data: producto, width: '720px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe((ok) => ok && this.snackBar.open('Cambios guardados', undefined, { duration: 2000 }));
  }

  protected ajustarStock(producto: Producto): void {
    this.dialog.open(StockDialog, { data: producto, width: '520px', maxWidth: '95vw' });
  }

  /** No hay borrado físico: dar de baja solo impide usarlo en pedidos nuevos. */
  protected setActivo(producto: Producto, activo: boolean): void {
    this.catalog.setActivo(producto.id, activo);
    this.snackBar
      .open(activo ? `${producto.nombre} reactivado` : `${producto.nombre} dado de baja`, 'Deshacer', { duration: 4000 })
      .onAction()
      .subscribe(() => this.catalog.setActivo(producto.id, !activo));
  }

  private valorOrden(p: Producto, col: string) {
    switch (col) {
      case 'marca':
        return this.catalog.marcaNombre(p.marcaId);
      case 'variante':
        return this.catalog.varianteNombre(p.varianteId);
      case 'precioPack':
        return precioPack(p);
      case 'packs':
        return packsDisponibles(p);
      default:
        return p[col as keyof Producto] as string | number | boolean;
    }
  }
}
