export type TicketStatusName =
  | 'Pendiente'
  | 'En Progreso'
  | 'Revisión'
  | 'Finalizado'
  | 'Bloqueado';

export type TicketPriorityName =
  | 'Baja'
  | 'Media'
  | 'Alta'
  | 'Urgente';

export interface Ticket {
  id: string;
  grupo_id: string;
  titulo: string;
  descripcion: string | null;
  autor_id: string;
  asignado_id: string | null;
  estado_id: string;
  prioridad_id: string;
  creado_en: string;
  fecha_final: string | null;

  estados?: {
    id: string;
    nombre: TicketStatusName;
    color: string;
  };
  prioridades?: {
    id: string;
    nombre: TicketPriorityName;
    orden: number;
  };
  usuarios?: {
    nombre_completo: string;
  };
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  autor_id: string;
  contenido: string;
  creado_en: string;
  usuarios?: {
    nombre_completo: string;
  };
}

export interface TicketHistoryItem {
  id: string;
  ticket_id: string;
  usuario_id: string | null;
  accion: string;
  detalles: any;
  creado_en: string;
}