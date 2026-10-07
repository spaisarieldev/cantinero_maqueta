import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';

export type SortValue = string | number | boolean | null | undefined;

export function sortRows<T>(rows: T[], sort: Sort, value: (row: T, column: string) => SortValue): T[] {
  if (!sort.active || !sort.direction) return rows;
  const dir = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = value(a, sort.active) ?? '';
    const vb = value(b, sort.active) ?? '';
    if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb, 'es') * dir;
    return (va < vb ? -1 : va > vb ? 1 : 0) * dir;
  });
}

export function pageRows<T>(rows: T[], page: Pick<PageEvent, 'pageIndex' | 'pageSize'>): T[] {
  const start = page.pageIndex * page.pageSize;
  return rows.slice(start, start + page.pageSize);
}

/** Igual que el ILIKE %texto% del backend, ignorando tildes. */
export function contiene(texto: string, busqueda: string): boolean {
  const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  return norm(texto).includes(norm(busqueda.trim()));
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
export const DEFAULT_PAGE = { pageIndex: 0, pageSize: 20 };
