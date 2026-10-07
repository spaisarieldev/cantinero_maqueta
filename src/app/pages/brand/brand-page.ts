import { Component, computed, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { findBrand } from '../../core/brands';
import { CartService } from '../../core/cart.service';
import { CatalogService } from '../../core/catalog.service';
import { Producto, fotoPrincipal, packsDisponibles, precioPack } from '../../core/models';
import { ImageSlot } from '../../shared/image-slot';
import { CartPanel } from '../../shared/cart-panel';

@Component({
  selector: 'app-brand-page',
  imports: [
    CurrencyPipe,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatBadgeModule,
    MatSidenavModule,
    ImageSlot,
    CartPanel,
  ],
  templateUrl: './brand-page.html',
  styleUrl: './brand-page.scss',
})
export class BrandPage {
  /** Viene del parámetro de ruta `:slug` (withComponentInputBinding). */
  readonly slug = input.required<string>();

  private readonly catalog = inject(CatalogService);
  protected readonly cart = inject(CartService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly brand = computed(() => findBrand(this.slug()));
  protected readonly productos = computed(() => {
    const brand = this.brand();
    return brand ? this.catalog.activosPorMarca(brand.marcaId) : [];
  });

  protected readonly precioPack = precioPack;
  protected readonly packsDisponibles = packsDisponibles;
  protected readonly fotoPrincipal = fotoPrincipal;

  protected addToCart(producto: Producto): void {
    this.cart.add(producto);
    this.snackBar.open(`${producto.nombre} agregado al carrito`, undefined, { duration: 1800 });
  }
}
