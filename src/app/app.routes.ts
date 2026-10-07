import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'Cantinero Entrerriano',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'marca/:slug',
    title: 'Cantinero Entrerriano',
    loadComponent: () => import('./pages/brand/brand-page').then((m) => m.BrandPage),
  },
  {
    path: 'login',
    title: 'Ingresar · Cantinero Entrerriano',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/admin/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'ventas' },
      {
        path: 'productos',
        title: 'Productos · Panel',
        loadComponent: () => import('./pages/admin/products/products-admin').then((m) => m.ProductsAdmin),
      },
      {
        path: 'ventas',
        title: 'Ventas y envíos · Panel',
        loadComponent: () => import('./pages/admin/orders/orders-admin').then((m) => m.OrdersAdmin),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
