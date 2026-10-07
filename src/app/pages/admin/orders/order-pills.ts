import { EstadoEnvio, EstadoPedido } from '../../../core/models';

// Indexables con string porque las filas de mat-table llegan sin tipo al template.
export const CLASE_ESTADO: Record<EstadoPedido, string> & Record<string, string> = {
  Pendiente: 'warn',
  Pagado: 'ok',
  Cancelado: 'danger',
  Reembolsado: 'violet',
};

export const CLASE_ENVIO: Record<EstadoEnvio, string> & Record<string, string> = {
  PendienteDeEnvio: 'warn',
  EnPreparacion: 'info',
  Despachado: 'violet',
  Entregado: 'ok',
};
