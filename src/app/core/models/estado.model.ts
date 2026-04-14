export interface EstadoSchema {
  id: string;
  nombre: string;
  color?: string | null;
}

export interface PrioridadSchema {
  id: string;
  nombre: string;
  orden: number;
}