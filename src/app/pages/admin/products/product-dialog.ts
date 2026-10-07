import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CatalogService } from '../../../core/catalog.service';
import { EXTENSIONES_FOTO, FotoProducto, MAX_FOTOS_PRODUCTO, MAX_MB_FOTO, Producto } from '../../../core/models';
import { ImageSlot } from '../../../shared/image-slot';

@Component({
  selector: 'app-product-dialog',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    ImageSlot,
  ],
  templateUrl: './product-dialog.html',
  styleUrl: './product-dialog.scss',
})
export class ProductDialog {
  protected readonly producto = inject<Producto | null>(MAT_DIALOG_DATA);
  protected readonly catalog = inject(CatalogService);
  private readonly ref = inject(MatDialogRef<ProductDialog, boolean>);

  protected readonly esAlta = this.producto === null;
  protected readonly maxFotos = MAX_FOTOS_PRODUCTO;
  protected readonly aceptadas = EXTENSIONES_FOTO.join(',');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: [this.producto?.nombre ?? '', [Validators.required, Validators.maxLength(120)]],
    descripcion: [this.producto?.descripcion ?? '', Validators.maxLength(500)],
    marcaId: [this.producto?.marcaId ?? (null as unknown as number), Validators.required],
    varianteId: [this.producto?.varianteId ?? null],
    precio: [this.producto?.precio ?? (null as unknown as number), [Validators.required, Validators.min(0)]],
    unidadesPorPack: [this.producto?.unidadesPorPack ?? 1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    activo: [this.producto?.activo ?? true],
  });

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly precioPack = computed(() => (this.valores().precio ?? 0) * (this.valores().unidadesPorPack ?? 1));

  protected readonly fotos = signal<FotoProducto[]>(
    [...(this.producto?.fotos ?? [])].sort((a, b) => a.orden - b.orden),
  );
  protected readonly errorFoto = signal('');

  protected agregarFotos(input: HTMLInputElement): void {
    this.errorFoto.set('');
    const archivos = Array.from(input.files ?? []);
    input.value = '';
    for (const archivo of archivos) {
      if (this.fotos().length >= MAX_FOTOS_PRODUCTO) {
        this.errorFoto.set(`Máximo ${MAX_FOTOS_PRODUCTO} fotos por producto.`);
        break;
      }
      if (!EXTENSIONES_FOTO.includes(archivo.type)) {
        this.errorFoto.set(`${archivo.name}: solo se aceptan .jpg, .png o .webp.`);
        continue;
      }
      if (archivo.size > MAX_MB_FOTO * 1024 * 1024) {
        this.errorFoto.set(`${archivo.name}: supera los ${MAX_MB_FOTO} MB.`);
        continue;
      }
      // TODO: subir con POST /api/v1/productos/{id}/fotos (multipart, un archivo por request)
      const id = Date.now() + Math.random();
      this.fotos.update((list) => [...list, { id, url: URL.createObjectURL(archivo), principal: false, orden: list.length }]);
    }
  }

  /** La principal se marca a mano; se desmarca la anterior. */
  protected marcarPrincipal(id: number): void {
    this.fotos.update((list) => list.map((f) => ({ ...f, principal: f.id === id })));
  }

  protected mover(index: number, delta: number): void {
    this.fotos.update((list) => {
      const copia = [...list];
      const [foto] = copia.splice(index, 1);
      copia.splice(index + delta, 0, foto);
      return copia.map((f, orden) => ({ ...f, orden }));
    });
  }

  /** Si se borra la principal, el producto queda sin principal. */
  protected quitar(id: number): void {
    this.fotos.update((list) => list.filter((f) => f.id !== id).map((f, orden) => ({ ...f, orden })));
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { stock, ...datos } = this.form.getRawValue();
    const valores = {
      ...datos,
      precio: Number(datos.precio),
      unidadesPorPack: Number(datos.unidadesPorPack),
      fotos: this.fotos(),
    };
    if (this.producto) {
      this.catalog.actualizar(this.producto.id, valores);
    } else {
      this.catalog.crear({ ...valores, stock: Number(stock) });
    }
    this.ref.close(true);
  }
}
