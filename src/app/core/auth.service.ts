import { Injectable, computed } from '@angular/core';
import { Usuario } from './models';
import { persistedSignal } from './persisted-signal';

// Usuarios de prueba hasta conectar POST /api/v1/auth/login (JWT + refresh token en cookie httpOnly).
const USUARIOS_DEMO: (Usuario & { password: string })[] = [
  { id: 1, nombre: 'SuperAdmin', email: 'superadmin@cantinero.com', rol: 'SuperAdmin', password: 'demo1234' },
  { id: 2, nombre: 'Admin', email: 'admin@cantinero.com', rol: 'Admin', password: 'demo1234' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sesion = persistedSignal<Usuario | null>('ce-sesion', null);

  readonly usuario = this.sesion.asReadonly();
  readonly logueado = computed(() => this.sesion() !== null);

  login(email: string, password: string): boolean {
    const encontrado = USUARIOS_DEMO.find((u) => u.email === email.trim().toLowerCase() && u.password === password);
    if (!encontrado) return false;
    const { password: _, ...usuario } = encontrado;
    this.sesion.set(usuario);
    return true;
  }

  logout(): void {
    this.sesion.set(null);
  }
}
