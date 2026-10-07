import { Injectable, computed, inject } from '@angular/core';
import { CatalogService } from './catalog.service';
import { Producto, packsDisponibles, precioPack } from './models';
import { persistedSignal } from './persisted-signal';

interface CartEntry {
  productoId: number;
  packs: number;
}

export interface CartLine {
  producto: Producto;
  packs: number;
  subtotal: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly catalog = inject(CatalogService);
  private readonly entries = persistedSignal<CartEntry[]>('ce-carrito', []);

  /** Las líneas usan el producto actual; si se dio de baja, sale del carrito. */
  readonly lines = computed<CartLine[]>(() =>
    this.entries().flatMap(({ productoId, packs }) => {
      const producto = this.catalog.buscar(productoId);
      if (!producto?.activo) return [];
      return [{ producto, packs, subtotal: packs * precioPack(producto) }];
    }),
  );
  readonly count = computed(() => this.lines().reduce((n, l) => n + l.packs, 0));
  readonly total = computed(() => this.lines().reduce((t, l) => t + l.subtotal, 0));

  packsEnCarrito(productoId: number): number {
    return this.entries().find((e) => e.productoId === productoId)?.packs ?? 0;
  }

  puedeAgregar(producto: Producto): boolean {
    return this.packsEnCarrito(producto.id) < packsDisponibles(producto);
  }

  add(producto: Producto): void {
    if (!this.puedeAgregar(producto)) return;
    this.setPacks(producto.id, this.packsEnCarrito(producto.id) + 1);
  }

  increment(producto: Producto): void {
    this.add(producto);
  }

  decrement(producto: Producto): void {
    this.setPacks(producto.id, this.packsEnCarrito(producto.id) - 1);
  }

  clear(): void {
    this.entries.set([]);
  }

  private setPacks(productoId: number, packs: number): void {
    this.entries.update((list) => {
      const rest = list.filter((e) => e.productoId !== productoId);
      return packs > 0 ? [...rest, { productoId, packs }] : rest;
    });
  }
}
